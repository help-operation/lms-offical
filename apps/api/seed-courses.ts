/**
 * Seed demo categories and 2 courses for development.
 * Run: npx tsx seed-courses.ts
 */
import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as bcrypt from "bcrypt";
import { categories, courses, adminUsers } from "./src/db/schema";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const db = drizzle(pool);

  console.log("Seeding categories...");

  const catData = [
    { name: "Web Development", slug: "web-development", description: "Learn to build modern websites and web applications", icon: "code", isActive: true },
    { name: "Digital Marketing", slug: "digital-marketing", description: "Master online marketing strategies and tools", icon: "megaphone", isActive: true },
    { name: "Graphic Design", slug: "graphic-design", description: "Create stunning visuals and brand identities", icon: "palette", isActive: true },
    { name: "Data Science", slug: "data-science", description: "Analyze data and build machine learning models", icon: "chart-bar", isActive: true },
  ];

  const insertedCats = await db
    .insert(categories)
    .values(catData)
    .onConflictDoNothing()
    .returning({ id: categories.id, name: categories.name });

  // Get all categories (in case some already existed)
  const allCats = await db.select({ id: categories.id, name: categories.name }).from(categories);
  const catMap = new Map(allCats.map((c) => [c.name, c.id]));

  console.log(`  ✓ ${allCats.length} categories ready`);

  // Ensure a demo instructor exists
  const instructorEmail = "instructor@skillkoro.com";
  const instHash = await bcrypt.hash("Instructor@1234", 10);
  const [instructor] = await db
    .insert(adminUsers)
    .values({
      firstName: "Rahul",
      lastName: "Ahmed",
      email: instructorEmail,
      password: instHash,
      role: "INSTRUCTOR",
      status: "active",
    })
    .onConflictDoNothing()
    .returning({ id: adminUsers.id });

  let instructorId = instructor?.id;
  if (!instructorId) {
    const existing = await db.select({ id: adminUsers.id }).from(adminUsers).where(
      // @ts-ignore
      undefined
    );
    // Fallback: just get the instructor
    const rows = await pool.query(`SELECT id FROM admin_users WHERE email = $1`, [instructorEmail]);
    instructorId = rows.rows[0]?.id;
  }
  console.log(`  ✓ Instructor ready (id: ${instructorId})`);

  console.log("Seeding courses...");

  const coursesData = [
    {
      instructorId: instructorId!,
      categoryId: catMap.get("Web Development"),
      title: "Complete Web Development Bootcamp 2024",
      slug: "complete-web-development-bootcamp-2024",
      shortDescription: "Master HTML, CSS, JavaScript, React, Node.js and more to become a full-stack web developer",
      description: "This comprehensive course covers everything you need to know to become a full-stack web developer. Starting from the basics of HTML and CSS, you'll progress through JavaScript, React, Node.js, databases, and deployment. Over 40+ hours of content with hands-on projects.",
      price: "49.99",
      discountPrice: "19.99",
      level: "beginner_to_advanced" as const,
      language: "English",
      status: "published" as const,
      isFeatured: true,
      isUnlisted: false,
      totalLessons: 42,
      totalDuration: 144000,
      totalStudents: 1250,
      rating: "4.80",
      ratingCount: 340,
      template: "1",
      learningOutcomes: "Build 16 web development projects for your portfolio\nLearn the latest technologies including HTML5, CSS3, JavaScript, React, Node.js\nPrepare for coding interviews with mastery of algorithms and data structures\nLearn professional developer best practices",
      requirements: "No programming experience needed - I'll teach you everything you need to know\nA computer with access to the internet",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-06-20"),
    },
    {
      instructorId: instructorId!,
      categoryId: catMap.get("Digital Marketing"),
      title: "Digital Marketing Masterclass: AI-Powered Strategies",
      slug: "digital-marketing-masterclass-ai-strategies",
      shortDescription: "Learn SEO, social media marketing, email campaigns, and AI tools to grow any business online",
      description: "Unlock the power of digital marketing with cutting-edge AI tools. This masterclass covers SEO, Google Ads, Facebook Ads, Instagram marketing, email automation, content strategy, and analytics. You'll learn how to use ChatGPT and other AI tools to supercharge your marketing efforts.",
      price: "39.99",
      discountPrice: "14.99",
      level: "intermediate" as const,
      language: "English",
      status: "published" as const,
      isFeatured: false,
      isUnlisted: false,
      totalLessons: 28,
      totalDuration: 90000,
      totalStudents: 870,
      rating: "4.60",
      ratingCount: 210,
      template: "1",
      learningOutcomes: "Master SEO fundamentals and advanced techniques\nCreate and optimize Google Ads & Facebook Ads campaigns\nBuild automated email marketing funnels\nUse AI tools like ChatGPT for content creation and strategy\nAnalyze marketing data with Google Analytics 4",
      requirements: "Basic understanding of social media platforms\nWillingness to experiment with new marketing strategies",
      createdAt: new Date("2024-03-10"),
      updatedAt: new Date("2024-07-15"),
    },
  ];

  const inserted = await db
    .insert(courses)
    .values(coursesData)
    .onConflictDoNothing()
    .returning({ id: courses.id, title: courses.title });

  if (inserted.length > 0) {
    console.log(`  ✓ ${inserted.length} courses created`);
    for (const c of inserted) {
      console.log(`    - [${c.id}] ${c.title}`);
    }
  } else {
    console.log("  ℹ️  Courses already exist, skipping.");
  }

  await pool.end();
  console.log("\n✅ Seed complete!");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
