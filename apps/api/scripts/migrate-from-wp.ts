/**
 * One-shot migration: WordPress/WooCommerce → new LMS
 *
 * What it does:
 *  1. Parses skillkor1_db.sql (in the repo root) — no MySQL needed
 *  2. Extracts wp_users, wp_wc_orders, wp_wc_order_addresses, wp_woocommerce_order_items
 *  3. Skips test/dummy products; merges BOTH keyboard products into the single
 *     recorded "21 Days Keyboard Typing Magic Course" (the Bangla course is retired)
 *  4. Stores WP password hashes verbatim (incl. the "$wp$" marker) — the API's
 *     verifyPassword replicates WordPress's HMAC-SHA384 + bcrypt check
 *  5. Inserts: users → orders → order_items → payments → enrollments
 *
 * ── BEFORE YOU RUN ────────────────────────────────────────────────────────────
 *  a) Fill in COURSE_ID_MAP below with the IDs of your courses in the new system
 *  b) Run from repo root:
 *       pnpm --filter api tsx scripts/migrate-from-wp.ts
 *     or if tsx is not installed:
 *       pnpm --filter api add -D tsx
 *       pnpm --filter api tsx scripts/migrate-from-wp.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { and, eq } from 'drizzle-orm';
import * as schema from '../src/db/schema';

// Load .env from apps/api/.env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

// ── CONFIGURE THIS ────────────────────────────────────────────────────────────
//
// Map old WooCommerce product name → new system RECORDED COURSE ID (`courses` table).
// Both keyboard products funnel into the one recorded "21 Days" course: the legacy
// "Bangla Keyboard Typing Magic Course" is retired, so anyone who bought it is
// enrolled into "21 Days Keyboard Typing Magic Course" instead.
//
const COURSE_ID_MAP: Record<string, number> = {
  '21 Days Keyboard Typing Magic Course': 1, // recorded courses.id
  'Bangla Keyboard Typing Magic Course': 1,  // retired → merged into the 21 Days course
};

// Products to skip (test data)
const SKIP_PRODUCTS = new Set([
  'Dummy Downloadable Product',
  'Dummy Product',
  'Dummy Product Variation',
]);

// ── SQL Parser helpers ────────────────────────────────────────────────────────
//
// Line-by-line approach: phpMyAdmin dumps put each data row on its own line.
// String values with semicolons/parentheses inside don't break this because
// we only use the line boundaries, not the content, to find row edges.

function extractInsertRows(content: string, tableName: string): string[][] {
  const allRows: string[][] = [];
  const lines = content.split('\n');
  let inValues = false;
  const insertPrefix = `INSERT INTO \`${tableName}\``;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Detect start of INSERT for this table
    if (line.includes(insertPrefix) && line.includes('VALUES')) {
      inValues = true;
      // VALUES is always at the end of the header line with no data after it
      // in phpMyAdmin dumps, so nothing to parse on this line itself.
      continue;
    }

    if (!inValues) continue;

    // Skip blank lines and SQL comments
    if (!line || line.startsWith('--') || line.startsWith('/*!')) {
      inValues = false;
      continue;
    }

    // Each data line looks like: "(v1, v2, ...),\r" or "(v1, v2, ...);\r"
    const trimmed = line.trimStart();
    if (!trimmed.startsWith('(')) { inValues = false; continue; }

    const isLast = trimmed.endsWith(';');
    // Strip trailing , or ;
    const rowStr = trimmed.replace(/[,;]\r?$/, '').replace(/[,;]$/, '');

    // rowStr is now "(v1, v2, ...)" — strip outer parens
    if (rowStr.startsWith('(') && rowStr.endsWith(')')) {
      allRows.push(parseRow(rowStr.slice(1, -1)));
    }

    if (isLast) inValues = false;
  }

  return allRows;
}

function parseRow(rowStr: string): string[] {
  const values: string[] = [];
  let i = 0;
  while (i < rowStr.length) {
    if (rowStr[i] === ' ' || rowStr[i] === ',') { i++; continue; }
    if (rowStr[i] === "'") {
      // quoted string
      let val = '';
      i++; // skip opening quote
      while (i < rowStr.length) {
        if (rowStr[i] === '\\') { val += rowStr[i + 1]; i += 2; continue; }
        if (rowStr[i] === "'") { i++; break; }
        val += rowStr[i++];
      }
      values.push(val);
    } else {
      // unquoted (number or NULL)
      let val = '';
      while (i < rowStr.length && rowStr[i] !== ',') { val += rowStr[i++]; }
      const trimmed = val.trim();
      // SQL NULL → JS null (stored as empty string sentinel so array stays string[])
      values.push(trimmed.toUpperCase() === 'NULL' ? '' : trimmed);
    }
  }
  return values;
}

// ── Parse helpers ─────────────────────────────────────────────────────────────

interface WpUser {
  id: number;
  email: string;
  password: string;
  displayName: string;
}

interface WcOrder {
  id: number;
  status: string;
  totalAmount: number;
  customerId: number;
  billingEmail: string;
  paymentMethod: string;
  createdAt: Date;
}

interface WcAddress {
  orderId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface WcOrderItem {
  orderItemId: number;
  orderId: number;
  productName: string;
}

function parseWpUsers(content: string): Map<number, WpUser> {
  const map = new Map<number, WpUser>();
  const rows = extractInsertRows(content, 'wp_users');
  // Columns: ID, user_login, user_pass, user_nicename, user_email, user_url,
  //          user_registered, user_activation_key, user_status, display_name
  for (const row of rows) {
    const id = parseInt(row[0]);
    // Store the hash verbatim — including the WordPress 6.8+ "$wp$" prefix.
    // That prefix marks the HMAC-SHA384 pre-hash scheme; the API's verifyPassword
    // needs it to know to apply the pre-hash. (Stripping it silently broke logins.)
    const password = row[2];
    map.set(id, {
      id,
      email: row[4],
      password,
      displayName: row[9],
    });
  }
  return map;
}

function parseWcOrders(content: string): Map<number, WcOrder> {
  const map = new Map<number, WcOrder>();
  const rows = extractInsertRows(content, 'wp_wc_orders');
  // Columns: id, status, currency, type, tax_amount, total_amount, customer_id,
  //          billing_email, date_created_gmt, date_updated_gmt, parent_order_id,
  //          payment_method, payment_method_title, transaction_id, ip_address,
  //          user_agent, customer_note
  for (const row of rows) {
    const id = parseInt(row[0]);
    map.set(id, {
      id,
      status: row[1],
      totalAmount: parseFloat(row[5]),
      customerId: parseInt(row[6]) || 0,
      billingEmail: row[7],
      paymentMethod: row[11],
      createdAt: new Date(row[8] + ' UTC'),
    });
  }
  return map;
}

function parseWcAddresses(content: string): Map<number, WcAddress> {
  const map = new Map<number, WcAddress>();
  const rows = extractInsertRows(content, 'wp_wc_order_addresses');
  // Columns: id, order_id, address_type, first_name, last_name, company,
  //          address_1, address_2, city, state, postcode, country, email, phone
  for (const row of rows) {
    if (row[2] !== 'billing') continue;
    const orderId = parseInt(row[1]);
    if (!map.has(orderId)) {
      map.set(orderId, {
        orderId,
        firstName: row[3] || '',
        lastName: row[4] || '',
        email: row[12] || '',
        phone: row[13] || '',
      });
    }
  }
  return map;
}

function parseWcOrderItems(content: string): Map<number, WcOrderItem[]> {
  const map = new Map<number, WcOrderItem[]>();
  const rows = extractInsertRows(content, 'wp_woocommerce_order_items');
  // Columns: order_item_id, order_item_name, order_item_type, order_id
  for (const row of rows) {
    if (row[2] !== 'line_item') continue;
    const orderId = parseInt(row[3]);
    const item: WcOrderItem = {
      orderItemId: parseInt(row[0]),
      orderId,
      productName: row[1],
    };
    if (!map.has(orderId)) map.set(orderId, []);
    map.get(orderId)!.push(item);
  }
  return map;
}

// ── Payment method mapping ────────────────────────────────────────────────────

function mapPaymentMethod(wcMethod: string): schema.Payment['method'] {
  const m = wcMethod.toLowerCase();
  if (m.includes('bkash')) return 'bkash';
  if (m.includes('nagad')) return 'nagad';
  if (m.includes('rocket')) return 'rocket';
  if (m.includes('upay')) return 'upay';
  if (m.includes('card') || m.includes('stripe') || m.includes('paypal')) return 'card';
  return 'bkash'; // fallback
}

// ── Split display name into first/last ────────────────────────────────────────

function splitName(displayName: string): { firstName: string; lastName: string } {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Validate course map
  for (const [name, id] of Object.entries(COURSE_ID_MAP)) {
    if (id === 0) {
      console.error(`\n❌ COURSE_ID_MAP is missing a real ID for: "${name}"`);
      console.error('   Please open this script and fill in the correct course IDs from your new admin panel.\n');
      process.exit(1);
    }
  }

  const sqlPath = path.resolve(__dirname, '../../../skillkor1_db.sql');
  console.log(`Reading: ${sqlPath}`);
  const content = fs.readFileSync(sqlPath, 'utf-8');
  console.log('Parsing SQL...');

  const wpUsers = parseWpUsers(content);
  const wcOrders = parseWcOrders(content);
  const wcAddresses = parseWcAddresses(content);
  const wcOrderItems = parseWcOrderItems(content);

  console.log(`Found: ${wpUsers.size} WP users, ${wcOrders.size} WC orders`);

  // Build email → new user ID map
  const emailToNewUserId = new Map<string, number>();

  // ── Step 1: Collect all unique user emails from completed orders ─────────────
  const completedOrders: WcOrder[] = [];
  for (const order of wcOrders.values()) {
    if (order.status !== 'wc-completed') continue;
    const items = wcOrderItems.get(order.id) ?? [];
    const hasRealCourse = items.some(
      (i) => COURSE_ID_MAP[i.productName] !== undefined && !SKIP_PRODUCTS.has(i.productName),
    );
    if (!hasRealCourse) continue;
    completedOrders.push(order);
  }

  console.log(`Completed orders with real courses: ${completedOrders.length}`);

  // Collect unique emails we need to ensure exist in new system
  const emailsNeeded = new Set<string>();
  for (const order of completedOrders) {
    const addr = wcAddresses.get(order.id);
    const email = addr?.email || order.billingEmail;
    if (email) emailsNeeded.add(email.toLowerCase().trim());
  }

  // ── Step 2: Create / lookup users ────────────────────────────────────────────
  console.log(`\nEnsuring ${emailsNeeded.size} user accounts...`);
  let usersCreated = 0;

  for (const email of emailsNeeded) {
    // Check if already in new DB
    const [existing] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existing) {
      emailToNewUserId.set(email, existing.id);
      // Match native ensureStudentRole: promote any pre-existing guest to student.
      await db
        .update(schema.users)
        .set({ role: 'STUDENT' })
        .where(and(eq(schema.users.id, existing.id), eq(schema.users.role, 'GUEST')));
      continue;
    }

    // Find billing info: prefer wp_users match, then billing address
    let firstName = '';
    let lastName = '';
    let password: string | null = null;
    let phone: string | null = null;

    // Find wp_user with matching email
    for (const u of wpUsers.values()) {
      if (u.email.toLowerCase() === email) {
        const { firstName: fn, lastName: ln } = splitName(u.displayName || u.email);
        firstName = fn;
        lastName = ln;
        password = u.password;
        break;
      }
    }

    // Fill name/phone from billing address if not set
    for (const order of completedOrders) {
      const addr = wcAddresses.get(order.id);
      if (!addr) continue;
      const addrEmail = (addr.email || order.billingEmail).toLowerCase().trim();
      if (addrEmail !== email) continue;

      if (!firstName && addr.firstName) {
        const nameParts = addr.firstName.trim().split(/\s+/);
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || addr.lastName || '';
      }
      if (!phone && addr.phone) phone = addr.phone.trim() || null;
      break;
    }

    if (!firstName) firstName = email.split('@')[0];
    if (!lastName) lastName = '';

    const [newUser] = await db
      .insert(schema.users)
      .values({
        email,
        firstName,
        lastName,
        password, // null if no WP account (guest)
        phone: (phone && phone.trim()) ? phone.trim() : null,
        role: 'STUDENT',
        status: 'active',
      })
      .returning({ id: schema.users.id });

    emailToNewUserId.set(email, newUser.id);
    usersCreated++;
    console.log(`  Created user: ${email} (${firstName} ${lastName})`);
  }

  console.log(`Users created: ${usersCreated}, already existed: ${emailsNeeded.size - usersCreated}`);

  // ── Step 3: Create orders + enrollments ──────────────────────────────────────
  console.log('\nMigrating orders...');
  let ordersCreated = 0;
  let enrollmentsCreated = 0;

  for (const wcOrder of completedOrders) {
    const addr = wcAddresses.get(wcOrder.id);
    const email = ((addr?.email || wcOrder.billingEmail) ?? '').toLowerCase().trim();
    const userId = emailToNewUserId.get(email);

    if (!userId) {
      console.warn(`  SKIP order ${wcOrder.id}: no user found for email "${email}"`);
      continue;
    }

    const items = (wcOrderItems.get(wcOrder.id) ?? []).filter(
      (i) => COURSE_ID_MAP[i.productName] !== undefined && !SKIP_PRODUCTS.has(i.productName),
    );

    if (items.length === 0) continue;

    // Create order
    const [newOrder] = await db
      .insert(schema.orders)
      .values({
        userId,
        totalAmount: wcOrder.totalAmount.toFixed(2),
        discountAmount: '0.00',
        finalAmount: wcOrder.totalAmount.toFixed(2),
        status: 'paid',
        createdAt: wcOrder.createdAt,
        updatedAt: wcOrder.createdAt,
      })
      .returning({ id: schema.orders.id });

    // Distinct recorded-course IDs on this order. Both keyboard products map to
    // the same course, so a buyer of both collapses to a single course here.
    const courseIds = [...new Set(items.map((i) => COURSE_ID_MAP[i.productName]!))];

    // Create order items — one row per distinct recorded course. This is what
    // instructor revenue and the order/payment detail pages read (native parity).
    await db.insert(schema.orderItems).values(
      courseIds.map((courseId) => ({
        orderId: newOrder.id,
        courseId,
        price: wcOrder.totalAmount.toFixed(2),
      })),
    );

    // Create payment record
    await db.insert(schema.payments).values({
      orderId: newOrder.id,
      userId,
      amount: wcOrder.totalAmount.toFixed(2),
      method: mapPaymentMethod(wcOrder.paymentMethod),
      status: 'completed',
      paidAt: wcOrder.createdAt,
      createdAt: wcOrder.createdAt,
    });

    // Create recorded-course enrollments (dedup per user+course — a user who
    // bought both products across separate orders ends up enrolled once).
    for (const courseId of courseIds) {
      const [existing] = await db
        .select({ id: schema.enrollments.id })
        .from(schema.enrollments)
        .where(
          and(
            eq(schema.enrollments.userId, userId),
            eq(schema.enrollments.courseId, courseId),
          ),
        )
        .limit(1);

      if (!existing) {
        await db.insert(schema.enrollments).values({
          userId,
          courseId,
          orderId: newOrder.id,
          status: 'active',
          enrolledAt: wcOrder.createdAt,
        });
        enrollmentsCreated++;
      }
    }

    ordersCreated++;
    console.log(`  Order ${wcOrder.id} → new order ${newOrder.id} for user ${email}`);
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`   Users created:      ${usersCreated}`);
  console.log(`   Orders created:     ${ordersCreated}`);
  console.log(`   Enrollments:        ${enrollmentsCreated}`);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
