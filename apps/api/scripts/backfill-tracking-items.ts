import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { trackingItems, trackingSettings } from "../src/db/schema";
import { TRACKING_ITEM_DEFAULTS, type TrackingItemDefault } from "../src/tracking-settings/tracking-item-defaults";

/**
 * One-time backfill from the legacy `tracking_settings` fixed columns into
 * the `tracking_items` registry. Defaults to dry-run (logs planned inserts
 * only); pass --write to actually insert. Safe to re-run — existing keys
 * are skipped, never overwritten, so it never clobbers admin edits made
 * directly against the registry after a first run.
 *
 * Usage:
 *   pnpm --filter api exec tsx scripts/backfill-tracking-items.ts          # dry run
 *   pnpm --filter api exec tsx scripts/backfill-tracking-items.ts --write  # apply
 */

/** Legacy-column overrides, keyed by registry key. Only `gtm`/`ga4`/`fb_pixel`/`clarity`/`gads`
 *  and the pre-existing `event_*` keys have a legacy source; everything else keeps its default. */
function legacyOverridesFor(key: string, l: typeof trackingSettings.$inferSelect | undefined): Partial<Pick<TrackingItemDefault, "enabled" | "config">> {
  if (!l) return {};
  switch (key) {
    case "gtm": return l.gtmId ? { enabled: true, config: { id: l.gtmId } } : {};
    case "ga4": return l.ga4Id ? { enabled: true, config: { id: l.ga4Id } } : {};
    case "fb_pixel":
      return l.fbPixelId
        ? { enabled: true, config: { id: l.fbPixelId, ...(l.fbCapiAccessToken ? { capiAccessToken: l.fbCapiAccessToken } : {}), ...(l.fbCapiTestEventCode ? { capiTestEventCode: l.fbCapiTestEventCode } : {}) } }
        : {};
    case "clarity": return l.clarityId ? { enabled: true, config: { id: l.clarityId } } : {};
    case "gads": return l.gadsId ? { enabled: true, config: { id: l.gadsId } } : {};
    case "event_page_view": return { enabled: l.eventPageView };
    case "event_view_item": return { enabled: l.eventViewItem };
    case "event_view_item_list": return { enabled: l.eventViewItemList };
    case "event_select_item": return { enabled: l.eventSelectItem };
    case "event_add_to_cart": return { enabled: l.eventAddToCart };
    case "event_remove_from_cart": return { enabled: l.eventRemoveFromCart };
    case "event_begin_checkout": return { enabled: l.eventBeginCheckout };
    case "event_purchase": return { enabled: l.eventPurchase };
    case "event_sign_up": return { enabled: l.eventSignUp };
    case "event_login": return { enabled: l.eventLogin };
    default: return {};
  }
}

function buildSeed(legacy: typeof trackingSettings.$inferSelect | undefined): TrackingItemDefault[] {
  return TRACKING_ITEM_DEFAULTS.map((row) => ({ ...row, ...legacyOverridesFor(row.key, legacy) }));
}

async function main() {
  const write = process.argv.includes("--write");
  const url = process.env.DATABASE_URL!;
  const wantsSsl = new URL(url).searchParams.get("sslmode") === "require";
  const pool = new Pool({ connectionString: url, ssl: wantsSsl ? { rejectUnauthorized: false } : false });
  const db = drizzle(pool);

  const [legacy] = await db.select().from(trackingSettings).limit(1);
  const existing = await db.select({ key: trackingItems.key }).from(trackingItems);
  const existingKeys = new Set(existing.map((r) => r.key));

  const seed = buildSeed(legacy).filter((row) => !existingKeys.has(row.key));

  if (seed.length === 0) {
    console.log("Nothing to backfill — every registry key already exists.");
    await pool.end();
    return;
  }

  console.log(`${write ? "Writing" : "[DRY RUN] Would write"} ${seed.length} tracking_items row(s):`);
  for (const row of seed) {
    console.log(`  ${row.key.padEnd(28)} enabled=${String(row.enabled).padEnd(5)} category=${row.category}${Object.keys(row.config).length ? `  config=${JSON.stringify(row.config)}` : ""}`);
  }

  if (write) {
    await db.insert(trackingItems).values(seed);
    console.log("✓ Backfill complete.");
  } else {
    console.log("\nRe-run with --write to apply.");
  }

  await pool.end();
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
