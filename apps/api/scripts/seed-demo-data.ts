/**
 * Seed demo data for local development:
 *   tsx scripts/seed-demo-data.ts
 *
 * Creates (idempotent — safe to re-run):
 *   • 4 recorded courses + 2 live courses with batches
 *   • 20 demo students with profiles
 *   • Enrollments (recorded + live) spread across students
 *   • Orders + payments for each enrollment
 *
 * Requires DATABASE_URL in .env
 */
import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as bcrypt from 'bcrypt';
import {
  users,
  studentProfiles,
  categories,
  courses,
  liveCourses,
  liveCourseBatches,
  enrollments,
  liveEnrollments,
  orders,
  payments,
  livePayments,
} from '../src/db/schema';
import { sql } from 'drizzle-orm';

// ─── Data ──────────────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Tanvir', 'Sadia', 'Eftakhar', 'Nusrat', 'Rahim', 'Farhana', 'Ayman', 'Shakib',
  'Mehedi', 'Tasnim', 'Tamim', 'Afia', 'Mahmudul', 'Nabila', 'Fahim', 'Sumi',
  'Rafiq', 'Anika', 'Zubair', 'Mitu',
];
const LAST_NAMES = [
  'Ahmed', 'Rahman', 'Islam', 'Alam', 'Hossain', 'Chowdhury', 'Khan', 'Hasan',
  'Akter', 'Ali', 'Sultana', 'Jahan', 'Siddique', 'Bhuiyan', 'Uddin', 'Mia',
  'Mahmud', 'Karim', 'Haque', 'Biswas',
];
const PROFESSIONS = [
  'University Student', 'High School Student', 'Software Developer',
  'Graphic Designer', 'Digital Marketer', 'Freelancer', 'Job Seeker',
  'Content Creator', 'Entrepreneur', 'UI/UX Trainee',
];
const PREFIXES = ['017', '018', '019', '016', '015', '013', '014'];

const COURSE_DATA = [
  { title: 'Complete Web Development Course', slug: 'complete-web-dev', price: '2500', level: 'beginner' as const, totalLessons: 48, totalDuration: 7200 },
  { title: 'React & Next.js Masterclass', slug: 'react-nextjs-masterclass', price: '1999', level: 'intermediate' as const, totalLessons: 36, totalDuration: 5400 },
  { title: 'Python for Data Science', slug: 'python-data-science', price: '1799', level: 'beginner' as const, totalLessons: 42, totalDuration: 6300 },
  { title: 'UI/UX Design Fundamentals', slug: 'uiux-design-fundamentals', price: '1499', level: 'beginner' as const, totalLessons: 30, totalDuration: 4500 },
];
const LIVE_COURSE_DATA = [
  { title: 'Full-Stack Live Bootcamp', slug: 'fullstack-bootcamp-live', price: '4999', courseType: 'live' as const },
  { title: 'Advanced Django REST Framework', slug: 'django-rest-advanced', price: '3499', courseType: 'live' as const },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(monthsAgo: number, monthsAgoEnd: number): Date {
  const now = Date.now();
  const start = now - monthsAgo * 30 * 86_400_000;
  const end = now - monthsAgoEnd * 30 * 86_400_000;
  return new Date(start + Math.random() * (end - start));
}

function genPhone(i: number): string {
  const prefix = PREFIXES[i % PREFIXES.length];
  const suffix = String(1000000 + ((i + 1) * 7919) % 8999999).slice(0, 8);
  return `${prefix}${suffix}`;
}

function invoiceNum(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `INV-${ts}-${rand}`;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL missing'); process.exit(1); }

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);
  const pw = await bcrypt.hash('Student@1234', 10);

  console.log('🌱 Seeding demo data…\n');

  // ── 1. Category ────────────────────────────────────────────────────────────
  const [cat] = await db.insert(categories).values({
    name: 'Development',
    slug: 'development',
    description: 'Software development courses',
  }).onConflictDoNothing().returning({ id: categories.id });

  // Get existing category if conflict happened
  const existingCat = cat ?? (await db.select({ id: categories.id }).from(categories).limit(1))[0];
  const categoryId = existingCat?.id;

  // ── 2. Recorded courses ───────────────────────────────────────────────────
  const insertedCourses: { id: number }[] = [];
  for (const c of COURSE_DATA) {
    const [row] = await db.insert(courses).values({
      instructorId: 1, // assume admin user id=1
      categoryId: categoryId ?? null,
      title: c.title,
      slug: c.slug,
      price: c.price,
      level: c.level,
      totalLessons: c.totalLessons,
      totalDuration: c.totalDuration,
      status: 'published',
      isFeatured: Math.random() > 0.5,
      shortDescription: `Learn ${c.title} from scratch with hands-on projects.`,
      description: `A comprehensive course covering all aspects of ${c.title}.`,
    }).onConflictDoNothing().returning({ id: courses.id });

    // If conflict, fetch existing
    if (row) {
      insertedCourses.push(row);
    } else {
      const [existing] = await db.select({ id: courses.id }).from(courses).where(sql`${courses.slug} = ${c.slug}`).limit(1);
      if (existing) insertedCourses.push(existing);
    }
  }
  console.log(`  ✅ ${insertedCourses.length} recorded courses`);

  // ── 3. Live courses + batches ─────────────────────────────────────────────
  const insertedLiveCourses: { id: number }[] = [];
  for (const lc of LIVE_COURSE_DATA) {
    const [row] = await db.insert(liveCourses).values({
      title: lc.title,
      slug: lc.slug,
      price: lc.price,
      courseType: lc.courseType,
      status: 'published',
      totalValue: '8000',
      totalLiveClasses: '24',
      totalModules: '8',
    }).onConflictDoNothing().returning({ id: liveCourses.id });

    const liveId = row?.id ?? (await db.select({ id: liveCourses.id }).from(liveCourses).where(sql`${liveCourses.slug} = ${lc.slug}`).limit(1))[0]?.id;
    if (!liveId) continue;

    insertedLiveCourses.push({ id: liveId });

    // Batches for each live course
    for (const batchNum of [1, 2]) {
      await db.insert(liveCourseBatches).values({
        liveCourseId: liveId,
        batchName: `Batch ${batchNum}`,
        status: batchNum === 1 ? 'active' : 'upcoming',
        startDate: `2026-0${batchNum + 1}-01`,
        endDate: `2026-0${batchNum + 5}-30`,
        schedule: 'Sat-Wed 8:00 PM - 10:00 PM',
        maxSeats: 50,
        seatsFilled: batchNum === 1 ? Math.floor(Math.random() * 30) + 10 : 0,
      }).onConflictDoNothing();
    }
  }
  console.log(`  ✅ ${insertedLiveCourses.length} live courses with batches`);

  // ── 4. Students ───────────────────────────────────────────────────────────
  const insertedStudents: { id: number; firstName: string; lastName: string; phone: string | null; email: string | null }[] = [];

  for (let i = 0; i < 20; i++) {
    const fn = FIRST_NAMES[i];
    const ln = LAST_NAMES[i];
    const email = `demo.student.${i + 1}@skillkoro.com`;
    const phone = genPhone(i);
    const status = Math.random() < 0.85 ? 'active' : (Math.random() < 0.5 ? 'suspended' : 'active');
    const createdAt = randomDate(12, 0);
    const lastLoginAt = Math.random() < 0.8 ? randomDate(3, 0) : null;

    const [u] = await db.insert(users).values({
      firstName: fn,
      lastName: ln,
      email,
      phone,
      password: pw,
      role: 'STUDENT',
      status,
      createdAt,
      lastLoginAt,
    }).onConflictDoNothing().returning({ id: users.id });

    if (u) {
      insertedStudents.push({ id: u.id, firstName: fn, lastName: ln, phone, email });

      // Profile (70% chance)
      if (Math.random() < 0.7) {
        await db.insert(studentProfiles).values({
          userId: u.id,
          profession: pick(PROFESSIONS),
          bio: `Hello! I am ${fn} ${ln}, excited to learn new skills.`,
        }).onConflictDoNothing();
      }
    } else {
      // Already exists — fetch it
      const [existing] = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, phone: users.phone, email: users.email })
        .from(users).where(sql`${users.email} = ${email}`).limit(1);
      if (existing) insertedStudents.push(existing);
    }
  }
  console.log(`  ✅ ${insertedStudents.length} students`);

  // ── 5. Enrollments + Orders + Payments ────────────────────────────────────
  let enrollCount = 0;
  let orderCount = 0;

  for (const student of insertedStudents) {
    // Each student gets 1–3 recorded course enrollments
    const numRecorded = Math.floor(Math.random() * 3) + 1;
    const shuffledCourses = [...insertedCourses].sort(() => Math.random() - 0.5).slice(0, numRecorded);

    for (const course of shuffledCourses) {
      const enrollStatus = Math.random() < 0.7 ? 'active' : Math.random() < 0.8 ? 'completed' : 'suspended';
      const enrolledAt = randomDate(8, 1);

      const [enroll] = await db.insert(enrollments).values({
        userId: student.id,
        courseId: course.id,
        status: enrollStatus,
        enrolledAt,
        completedAt: enrollStatus === 'completed' ? randomDate(1, 0) : null,
      }).onConflictDoNothing().returning({ id: enrollments.id });

      if (enroll) {
        enrollCount++;

        // Order + payment for this enrollment
        const [order] = await db.insert(orders).values({
          userId: student.id,
          totalAmount: '2500',
          discountAmount: '0.00',
          finalAmount: '2500',
          status: 'paid',
          createdAt: enrolledAt,
        }).onConflictDoNothing().returning({ id: orders.id });

        if (order) {
          orderCount++;
          await db.insert(payments).values({
            orderId: order.id,
            userId: student.id,
            amount: '2500',
            method: pick(['bkash', 'nagad', 'paystation'] as const),
            status: 'completed',
            payerPhone: student.phone,
            paidAt: enrolledAt,
            displayInvoiceNumber: invoiceNum(),
          }).onConflictDoNothing();
        }
      }
    }

    // 40% chance of live course enrollment
    if (insertedLiveCourses.length > 0 && Math.random() < 0.4) {
      const lc = pick(insertedLiveCourses);
      const batches = await db.select({ id: liveCourseBatches.id })
        .from(liveCourseBatches)
        .where(sql`${liveCourseBatches.liveCourseId} = ${lc.id}`)
        .limit(2);
      const batch = batches.length > 0 ? pick(batches) : null;

      const enrollStatus = Math.random() < 0.8 ? 'active' : 'completed';
      const paidAt = randomDate(6, 1);

      const [le] = await db.insert(liveEnrollments).values({
        liveCourseId: lc.id,
        batchId: batch?.id ?? null,
        userId: student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email ?? '',
        phone: student.phone ?? '',
        amount: '4999',
        status: enrollStatus,
        paidAt,
      }).onConflictDoNothing().returning({ id: liveEnrollments.id });

      if (le) {
        enrollCount++;
        await db.insert(livePayments).values({
          liveEnrollmentId: le.id,
          userId: student.id,
          amount: '4999',
          method: pick(['bkash', 'nagad', 'paystation'] as const),
          status: 'completed',
          payerPhone: student.phone,
          paidAt,
          displayInvoiceNumber: invoiceNum(),
        }).onConflictDoNothing();
      }
    }
  }

  console.log(`  ✅ ${enrollCount} enrollments`);
  console.log(`  ✅ ${orderCount} orders with payments`);

  // ── Summary ────────────────────────────────────────────────────────────────
  const [{ count: totalUsers }] = await db.select({ count: sql<number>`count(*)::int` }).from(users).where(sql`${users.role} = 'STUDENT'`);
  const [{ count: totalCourses }] = await db.select({ count: sql<number>`count(*)::int` }).from(courses);
  const [{ count: totalLive }] = await db.select({ count: sql<number>`count(*)::int` }).from(liveCourses);
  const [{ count: totalEnrolls }] = await db.select({ count: sql<number>`count(*)::int` }).from(enrollments);
  const [{ count: totalLiveEnrolls }] = await db.select({ count: sql<number>`count(*)::int` }).from(liveEnrollments);

  console.log('\n📊 Database totals:');
  console.log(`   Students:       ${totalUsers}`);
  console.log(`   Recorded:       ${totalCourses} courses / ${totalEnrolls} enrollments`);
  console.log(`   Live:           ${totalLive} courses / ${totalLiveEnrolls} enrollments`);

  console.log('\n✅ Seed complete!');
  await pool.end();
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
