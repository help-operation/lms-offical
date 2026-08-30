import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as bcrypt from 'bcrypt';
import {
  users,
  studentProfiles,
  enrollments,
  courses,
  liveEnrollments,
  liveCourses,
  liveCourseBatches,
} from '../src/db/schema';

const FIRST_NAMES = [
  'Tanvir', 'Sadia', 'Eftakhar', 'Nusrat', 'Rahim', 'Farhana', 'Ayman', 'Shakib',
  'Mehedi', 'Tasnim', 'Tamim', 'Afia', 'Mahmudul', 'Nabila', 'Fahim', 'Sumi',
  'Rafiq', 'Anika', 'Zubair', 'Mitu', 'Sabbir', 'Ritu', 'Hasan', 'Priya',
  'Shovon', 'Mim', 'Nayeem', 'Tanjina', 'Imran', 'Lopa', 'Kawsar', 'Dipa',
  'Arif', 'Lamia', 'Ashraful', 'Mou', 'Saiful', 'Jannat', 'Mustafiz', 'Sabrina',
  'Sojib', 'Tania', 'Bappi', 'Rumana', 'Robi', 'Shirin', 'Alamin', 'Farzana'
];

const LAST_NAMES = [
  'Ahmed', 'Rahman', 'Islam', 'Alam', 'Hossain', 'Chowdhury', 'Khan', 'Hasan',
  'Akter', 'Ali', 'Sultana', 'Jahan', 'Siddique', 'Bhuiyan', 'Uddin', 'Mia',
  'Mahmud', 'Karim', 'Haque', 'Biswas', 'Das', 'Roy', 'Sarkar', 'Begum'
];

const PROFESSIONS = [
  'University Student', 'High School Student', 'Software Developer',
  'Graphic Designer', 'Digital Marketer', 'Freelancer', 'Job Seeker',
  'Content Creator', 'Entrepreneur', 'UI/UX Trainee', 'Data Analyst'
];

const OPERATOR_PREFIXES = ['017', '018', '019', '016', '015', '013', '014'];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(startMonthsAgo: number, endMonthsAgo: number): Date {
  const now = Date.now();
  const start = now - startMonthsAgo * 30 * 24 * 60 * 60 * 1000;
  const end = now - endMonthsAgo * 30 * 24 * 60 * 60 * 1000;
  return new Date(start + Math.random() * (end - start));
}

function generatePhone(index: number): string {
  const prefix = OPERATOR_PREFIXES[index % OPERATOR_PREFIXES.length];
  const suffix = String(1000000 + (index * 7919) % 8999999);
  return `${prefix}${suffix.slice(0, 8)}`;
}

async function main() {
  console.log('🌱 Seeding 500 demo students into database...');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is missing.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  const passwordHash = await bcrypt.hash('Student@1234', 10);

  // Fetch available courses and live courses for enrollments
  const [availableCourses, availableLiveCourses] = await Promise.all([
    db.select({ id: courses.id, title: courses.title }).from(courses),
    db.select({ id: liveCourses.id, title: liveCourses.title }).from(liveCourses),
  ]);

  const liveBatches = availableLiveCourses.length > 0
    ? await db.select({ id: liveCourseBatches.id, liveCourseId: liveCourseBatches.liveCourseId, batchName: liveCourseBatches.batchName })
        .from(liveCourseBatches)
    : [];

  console.log(`Found ${availableCourses.length} recorded courses, ${availableLiveCourses.length} live courses.`);

  const batchSize = 50;
  let seededCount = 0;

  for (let i = 1; i <= 500; i++) {
    const fn = randomElement(FIRST_NAMES);
    const ln = randomElement(LAST_NAMES);
    const email = `demo.student.${i}@skillkoro.com`;
    const phone = generatePhone(i);
    const status = Math.random() < 0.92 ? 'active' : 'suspended';
    const createdAt = randomDate(12, 0);
    const lastLoginAt = Math.random() < 0.8 ? randomDate(3, 0) : null;

    try {
      const [insertedUser] = await db
        .insert(users)
        .values({
          firstName: fn,
          lastName: ln,
          email,
          phone,
          password: passwordHash,
          role: 'STUDENT',
          status,
          createdAt,
          lastLoginAt,
        })
        .onConflictDoNothing()
        .returning({ id: users.id });

      if (insertedUser) {
        seededCount++;

        // Add profile
        if (Math.random() < 0.75) {
          await db.insert(studentProfiles).values({
            userId: insertedUser.id,
            profession: randomElement(PROFESSIONS),
            bio: `Hello! I am ${fn} ${ln}, excited to learn new skills.`,
          }).onConflictDoNothing();
        }

        // Randomly enroll in a recorded course
        if (availableCourses.length > 0 && Math.random() < 0.65) {
          const course = randomElement(availableCourses);
          const enrollStatus = Math.random() < 0.8 ? 'active' : Math.random() < 0.9 ? 'completed' : 'suspended';
          await db.insert(enrollments).values({
            userId: insertedUser.id,
            courseId: course.id,
            status: enrollStatus,
            enrolledAt: randomDate(6, 0),
          }).onConflictDoNothing();
        }

        // Randomly enroll in a live course
        if (availableLiveCourses.length > 0 && Math.random() < 0.4) {
          const liveCourse = randomElement(availableLiveCourses);
          const matchingBatches = liveBatches.filter(b => b.liveCourseId === liveCourse.id);
          const batch = matchingBatches.length > 0 ? randomElement(matchingBatches) : null;
          const enrollStatus = Math.random() < 0.85 ? 'active' : 'completed';

          await db.insert(liveEnrollments).values({
            userId: insertedUser.id,
            name: `${fn} ${ln}`,
            email: email,
            phone: phone,
            amount: '0.00',
            liveCourseId: liveCourse.id,
            batchId: batch?.id ?? null,
            status: enrollStatus,
            paidAt: randomDate(5, 0),
          }).onConflictDoNothing();
        }
      }
    } catch (err) {
      console.error(`Error inserting student #${i}:`, err);
    }

    if (i % batchSize === 0) {
      console.log(`Processed ${i}/500 students... (${seededCount} inserted)`);
    }
  }

  console.log(`🎉 Seeding complete! Successfully added ${seededCount} demo students.`);
  await pool.end();
}

main().catch((err) => {
  console.error('Fatal error seeding students:', err);
  process.exit(1);
});
