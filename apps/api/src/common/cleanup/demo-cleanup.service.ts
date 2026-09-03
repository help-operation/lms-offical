import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';

const DEMO_EMAIL_PATTERN = 'demo.student.%@skillkoro.com';

@Injectable()
export class DemoDataCleanupService implements OnModuleInit {
  private readonly logger = new Logger(DemoDataCleanupService.name);

  constructor(@Inject(DB_TOKEN) private readonly db: DB) {}

  async onModuleInit() {
    if (process.env.NODE_ENV !== 'production') return;

    this.logger.log('Running demo data cleanup (production mode)…');

    try {
      const demoStudents = await this.db.execute<{ id: number }>(
        sql`SELECT id FROM users WHERE email LIKE ${DEMO_EMAIL_PATTERN} AND role = 'STUDENT'`,
      );
      const ids = demoStudents.rows.map((r) => r.id);

      if (ids.length === 0) {
        this.logger.log('No demo students found — cleanup not needed.');
        return;
      }

      this.logger.log(`Found ${ids.length} demo students — removing…`);

      const idList = sql`(${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`;

      await this.db.execute(sql`DELETE FROM live_payments WHERE user_id IN ${idList}`);
      await this.db.execute(sql`DELETE FROM live_enrollments WHERE user_id IN ${idList}`);
      await this.db.execute(sql`DELETE FROM payments WHERE user_id IN ${idList}`);
      await this.db.execute(sql`DELETE FROM orders WHERE user_id IN ${idList}`);
      await this.db.execute(sql`DELETE FROM enrollments WHERE user_id IN ${idList}`);
      await this.db.execute(sql`DELETE FROM activity_logs WHERE user_id IN ${idList}`);
      await this.db.execute(sql`DELETE FROM student_profiles WHERE user_id IN ${idList}`);
      await this.db.execute(sql`DELETE FROM users WHERE id IN ${idList}`);

      this.logger.log(`Demo data cleanup complete — ${ids.length} students removed.`);
    } catch (err) {
      this.logger.error('Demo data cleanup failed', err as Error);
    }
  }
}
