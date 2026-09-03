/**
 * Remove demo data seeded by seed-demo-data.ts.
 * Only targets rows with identifiable patterns (demo emails, demo course slugs).
 *
 * Usage:  pnpm exec tsx scripts/clear-demo-data.ts
 *
 * Requires DATABASE_URL in .env
 */
import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql, inArray, eq } from 'drizzle-orm';
import {
  users,
  studentProfiles,
  courses,
  liveCourses,
  liveCourseBatches,
  enrollments,
  liveEnrollments,
  orders,
  payments,
  livePayments,
} from '../src/db/schema';

const DEMO_EMAILS = Array.from({ length: 20 }, (_, i) => `demo.student.${i + 1}@skillkoro.com`);

const DEMO_COURSE_SLUGS = [
  'complete-web-dev',
  'react-nextjs-masterclass',
  'python-data-science',
  'uiux-design-fundamentals',
];

const DEMO_LIVE_SLUGS = [
  'fullstack-bootcamp-live',
  'django-rest-advanced',
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL missing'); process.exit(1); }

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool);

  console.log('🧹 Clearing demo data…\n');

  // 1. Find demo student IDs
  const demoStudents = await db
    .select({ id: users.id })
    .from(users)
    .where(inArray(users.email, DEMO_EMAILS));
  const demoStudentIds = demoStudents.map((r) => r.id);

  if (demoStudentIds.length === 0) {
    console.log('  ℹ️  No demo students found — nothing to clean.');
    await pool.end();
    return;
  }
  console.log(`  👥 Found ${demoStudentIds.length} demo students (IDs: ${demoStudentIds.join(', ')})`);

  // 2. Find demo course IDs (recorded)
  const demoCourses = await db
    .select({ id: courses.id })
    .from(courses)
    .where(inArray(courses.slug, DEMO_COURSE_SLUGS));
  const demoCourseIds = demoCourses.map((r) => r.id);
  console.log(`  📚 Found ${demoCourseIds.length} demo recorded courses`);

  // 3. Find demo live course IDs
  const demoLiveCourses = await db
    .select({ id: liveCourses.id })
    .from(liveCourses)
    .where(inArray(liveCourses.slug, DEMO_LIVE_SLUGS));
  const demoLiveCourseIds = demoLiveCourses.map((r) => r.id);
  console.log(`  🎥 Found ${demoLiveCourseIds.length} demo live courses`);

  // 4. Find demo live course batch IDs
  let demoBatchIds: number[] = [];
  if (demoLiveCourseIds.length > 0) {
    const batches = await db
      .select({ id: liveCourseBatches.id })
      .from(liveCourseBatches)
      .where(inArray(liveCourseBatches.liveCourseId, demoLiveCourseIds));
    demoBatchIds = batches.map((r) => r.id);
    console.log(`  📦 Found ${demoBatchIds.length} demo batches`);
  }

  // 5. Delete in reverse dependency order
  if (demoStudentIds.length > 0) {
    // Live payments
    const livePayRes = await db.execute(sql`DELETE FROM live_payments WHERE user_id IN (${sql.join(demoStudentIds.map((id) => sql`${id}`), sql`, `)})`);
    console.log(`  🗑️  Deleted live payments for demo students`);

    // Live enrollments
    const liveEnrollRes = await db.execute(sql`DELETE FROM live_enrollments WHERE user_id IN (${sql.join(demoStudentIds.map((id) => sql`${id}`), sql`, `)})`);
    console.log(`  🗑️  Deleted live enrollments for demo students`);

    // Payments
    await db.execute(sql`DELETE FROM payments WHERE user_id IN (${sql.join(demoStudentIds.map((id) => sql`${id}`), sql`, `)})`);
    console.log(`  🗑️  Deleted payments for demo students`);

    // Orders
    await db.execute(sql`DELETE FROM orders WHERE user_id IN (${sql.join(demoStudentIds.map((id) => sql`${id}`), sql`, `)})`);
    console.log(`  🗑️  Deleted orders for demo students`);

    // Enrollments
    await db.execute(sql`DELETE FROM enrollments WHERE user_id IN (${sql.join(demoStudentIds.map((id) => sql`${id}`), sql`, `)})`);
    console.log(`  🗑️  Deleted enrollments for demo students`);

    // Student profiles
    await db.execute(sql`DELETE FROM student_profiles WHERE user_id IN (${sql.join(demoStudentIds.map((id) => sql`${id}`), sql`, `)})`);
    console.log(`  🗑️  Deleted student profiles`);

    // Demo students
    await db.execute(sql`DELETE FROM users WHERE id IN (${sql.join(demoStudentIds.map((id) => sql`${id}`), sql`, `)})`);
    console.log(`  🗑️  Deleted ${demoStudentIds.length} demo students`);
  }

  // 6. Delete demo live course batches
  if (demoBatchIds.length > 0) {
    await db.execute(sql`DELETE FROM live_course_batches WHERE id IN (${sql.join(demoBatchIds.map((id) => sql`${id}`), sql`, `)})`);
    console.log(`  🗑️  Deleted ${demoBatchIds.length} demo batches`);
  }

  // 7. Delete demo live courses
  if (demoLiveCourseIds.length > 0) {
    await db.execute(sql`DELETE FROM live_courses WHERE id IN (${sql.join(demoLiveCourseIds.map((id) => sql`${id}`), sql`, `)})`);
    console.log(`  🗑️  Deleted ${demoLiveCourseIds.length} demo live courses`);
  }

  // 8. Delete demo recorded courses
  if (demoCourseIds.length > 0) {
    await db.execute(sql`DELETE FROM courses WHERE id IN (${sql.join(demoCourseIds.map((id) => sql`${id}`), sql`, `)})`);
    console.log(`  🗑️  Deleted ${demoCourseIds.length} demo recorded courses`);
  }

  // 9. Delete demo category (only if it's the 'development' one we created)
  await db.execute(sql`DELETE FROM categories WHERE slug = 'development' AND name = 'Development'`);
  console.log(`  🗑️  Deleted demo category`);

  // Summary
  const [{ count: totalUsers }] = await db.select({ count: sql<number>`count(*)::int` }).from(users).where(sql`${users.role} = 'STUDENT'`);
  const [{ count: totalCourses }] = await db.select({ count: sql<number>`count(*)::int` }).from(courses);
  const [{ count: totalLive }] = await db.select({ count: sql<number>`count(*)::int` }).from(liveCourses);
  const [{ count: totalEnrolls }] = await db.select({ count: sql<number>`count(*)::int` }).from(enrollments);
  const [{ count: totalLiveEnrolls }] = await db.select({ count: sql<number>`count(*)::int` }).from(liveEnrollments);

  console.log('\n📊 Remaining database totals:');
  console.log(`   Students:       ${totalUsers}`);
  console.log(`   Recorded:       ${totalCourses} courses / ${totalEnrolls} enrollments`);
  console.log(`   Live:           ${totalLive} courses / ${totalLiveEnrolls} enrollments`);

  console.log('\n✅ Demo data cleared!');
  await pool.end();
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
