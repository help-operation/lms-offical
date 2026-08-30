import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { invoiceNumberCounters } from 'src/db/schema';

@Injectable()
export class InvoiceNumberService {
  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  /**
   * Generates the next human-facing invoice number for the current year, e.g.
   * `SKINV-2025-0001`. Race-safe under concurrent payments via a single
   * upsert-and-increment statement (no interactive transaction needed).
   */
  async generate(): Promise<string> {
    const year = new Date().getFullYear();
    const [row] = await this.db
      .insert(invoiceNumberCounters)
      .values({ year, count: 1 })
      .onConflictDoUpdate({
        target: invoiceNumberCounters.year,
        set: { count: sql`${invoiceNumberCounters.count} + 1` },
      })
      .returning({ count: invoiceNumberCounters.count });

    return `SKINV-${year}-${String(row!.count).padStart(4, '0')}`;
  }
}
