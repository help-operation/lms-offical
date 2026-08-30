import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { eq, and, asc, inArray } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { pageSections } from 'src/db/schema';
import { RevalidationService } from 'src/common/revalidation/revalidation.service';
import { pageSectionsTag } from 'src/common/revalidation/cache-tags';

// ─── Default sections per page ───────────────────────────────────────────────

type SeedSection = {
  slug: string;
  label: string;
  type: string;
  order: number;
  content: Record<string, unknown>;
};

// ── Home ────────────────────────────────────────────────────────────────────
// Base content for the default home page template.
const HOME_SECTIONS: SeedSection[] = [
  {
    slug: 'hero',
    label: 'Hero Section',
    type: 'hero',
    order: 0,
    content: {
      badge: 'Learn skills, live',
      title: 'Smart learning, now in the palm of your hand',
      subtitle:
        "Build the skills your career needs. Learn international-standard courses from home, office, or anywhere — at your own pace.",
      primary_cta: "Let's get started",
      primary_cta_link: '/courses',
      secondary_cta: 'Watch us',
      secondary_cta_link: '/about',
      popular_tags: ['Web Development', 'UI/UX Design', 'Data Science', 'Marketing'],
      hero_image:
        'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=480&h=480&fit=crop&crop=face',
      student_count: '100K',
      rating: '4.9',
      review_count: '200+',
    },
  },
  {
    slug: 'top_courses',
    label: 'Top Courses Carousel',
    type: 'top_courses',
    order: 1,
    content: {
      title_prefix: 'Our',
      title_highlight: 'Top Courses',
      title_suffix: 'All',
      see_all_label: 'See all',
      see_all_link: '/courses',
    },
  },
  {
    slug: 'upcoming_batches',
    label: 'Upcoming Batches',
    type: 'upcoming_batches',
    order: 2,
    content: {
      title_prefix: '',
      title_highlight: 'Upcoming',
      title_suffix: 'Batches All',
      see_all_label: 'See all',
      see_all_link: '/courses',
      batches: [
        { id: 1, title: 'Canva Mastery Bootcamp (Live Course)', image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=360&fit=crop', batch: '12th Batch', lessons: 0, hours: 0, students: 0, reviews: 0, price: 2399, oldPrice: 2399 },
        { id: 2, title: 'AI Filmmaking Boot-Camp (Live Course)', image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&h=360&fit=crop', batch: '1st Batch', lessons: 0, hours: 0, students: 0, reviews: 0, price: 2399, oldPrice: 2399 },
        { id: 3, title: 'Facebook-Youtube Monitizing Bootcamp (Live Course)', image: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=600&h=360&fit=crop', batch: '11th Batch', lessons: 0, hours: 0, students: 0, reviews: 0, price: 2399, oldPrice: 2399 },
        { id: 4, title: 'AI Content Creation with Capcut - Live Course', image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&h=360&fit=crop', batch: '21th Batch', lessons: 0, hours: 0, students: 0, reviews: 0, price: 2000, oldPrice: 2000 },
        { id: 5, title: 'Lovable AI Vibe Coding Mastermind (Non-Code)', image: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=600&h=360&fit=crop', batch: '1st Batch', lessons: 0, hours: 0, students: 0, reviews: 0, price: 7999, oldPrice: 7999 },
        { id: 6, title: 'Full Stack Web Development (Live Course)', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=360&fit=crop', batch: '5th Batch', lessons: 0, hours: 0, students: 0, reviews: 0, price: 4999, oldPrice: 4999 },
      ],
    },
  },
  {
    slug: 'all_courses',
    label: 'All Courses Grid',
    type: 'all_courses',
    order: 3,
    content: {
      title_prefix: 'All',
      title_highlight: 'Courses',
      title_suffix: '',
      see_all_label: 'See all',
      see_all_link: '/courses',
      rows: 2,
      sort_order: 'newest',
    },
  },
  {
    slug: 'recorded_courses',
    label: 'Recorded Courses Carousel',
    type: 'recorded_courses',
    order: 4,
    content: {
      title_prefix: '',
      title_highlight: 'Recorded',
      title_suffix: 'Courses All',
      see_all_label: 'See all',
      see_all_link: '/courses',
    },
  },
  {
    slug: 'our_courses',
    label: 'Our Courses (Tabs)',
    type: 'our_courses',
    order: 4,
    content: {
      eyebrow: '',
      title: '',
      subtitle: '',
    },
  },
  {
    slug: 'flexible_learning',
    label: 'Why Choose Us',
    type: 'flexible_learning',
    order: 5,
    content: {
      eyebrow: 'Why Choose Us',
      title: "The country's best fastest skill development platform",
      subtitle:
        'Build your future through real-world projects, expert instructors, and up-to-date courses.',
      image:
        'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=900&h=700&fit=crop',
      stats: [
        { value: '2+', label: 'Instructors' },
        { value: '4212+', label: 'Learners' },
        { value: '17%', label: 'Course completion rate' },
        { value: '4+', label: 'Total courses' },
      ],
    },
  },
  {
    slug: 'course_facilities',
    label: 'Course Facilities Marquee',
    type: 'course_facilities',
    order: 6,
    content: {
      watermark: 'Course Facilities',
      items: [
        'Review Class',
        'Weekly Live Support Class',
        'Job Placement',
        'Class Record',
        'Community Group',
        'One 2 One Support',
        'Certificate',
        'Internship',
        'Freelancing Class',
        'Course Material',
      ],
    },
  },
  {
    slug: 'testimonials',
    label: 'Testimonials',
    type: 'testimonials',
    order: 7,
    content: {
      eyebrow: 'Testimonials',
      title: "SkillKoro through professionals' eyes",
      subtitle:
        'Join thousands of successful learners who have transformed their careers with us.',
      items: [
        {
          name: 'Shamim Parvez Himel',
          role: 'Tech Content Creator, AFR Technology',
          image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=face',
          rating: 5,
          amount: '',
          text: 'When it comes to building technology-driven skills, this is a brilliant initiative. A platform like this is a beacon of hope for the young people of our country.',
        },
        {
          name: 'Jessica Martinez',
          role: 'Frontend Developer, Google',
          image: 'https://images.unsplash.com/photo-1494790108755-2616b332906c?w=160&h=160&fit=crop&crop=face',
          rating: 5,
          amount: '',
          text: 'The courses transformed my career. World-class content that is always up-to-date and genuinely practical for real jobs.',
        },
        {
          name: 'David Kim',
          role: 'UX Designer, Apple',
          image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=face',
          rating: 5,
          amount: '',
          text: 'The masterclass was incredibly thorough. Within 3 months I built a portfolio strong enough to get hired. Best investment I have ever made.',
        },
      ],
    },
  },
  {
    slug: 'get_started_steps',
    label: 'Get Started Steps',
    type: 'get_started_steps',
    order: 8,
    content: {
      image:
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=900&h=800&fit=crop',
      steps: [
        { title: 'Create an account', icon: 'pencil' },
        { title: 'Select your preferred course', icon: 'list' },
        { title: 'Enroll in the course', icon: 'play' },
        { title: 'Open your course dashboard', icon: 'dashboard' },
      ],
    },
  },
  {
    slug: 'featured_in',
    label: 'Featured In',
    type: 'featured_in',
    order: 9,
    content: {
      title_prefix: 'WE',
      title_highlight: 'FEATURED',
      title_suffix: 'IN',
      outlets: [
        'Dhaka Tribune',
        'Suchipotro',
        'dhaka.digit',
        'Swadesh Bangla',
        'The Daily Campus',
        'MIRROR NEWS',
        'Somoy Journal',
        'News Express',
      ],
    },
  },
  {
    slug: 'partners',
    label: 'Our Partners',
    type: 'partners',
    order: 10,
    content: {
      title: 'Our Partners',
      brands: [
        'bdjobs.com',
        'FOODi',
        'FURNITO',
        'GRAHO Academy',
        'MotoFix',
        "Rider's Option",
        'RedData',
        'ShahjiPark',
      ],
    },
  },
  {
    slug: 'student_reviews',
    label: 'Student Reviews',
    type: 'student_reviews',
    order: 11,
    content: {
      title: "Our students' feedback",
      subtitle:
        'The positive experiences and opinions students have gained while advancing their careers and personal growth through our courses.',
      see_all_label: 'See all',
      see_all_link: '/courses',
      reviews: [
        { id: 1, name: 'HM Rifat Hossain', batch: 'FC2501', rating: 5, text: "It was a nice learning journey with SkillKoro. Our mentor's way of teaching is much better than many others." },
        { id: 2, name: 'Md. Mahfuzul Islam', batch: 'FC2501', rating: 5, text: 'It was a nice learning journey with SkillKoro. Our mentor is a brilliant mentor and touched every step.' },
        { id: 3, name: 'Tania Akter', batch: 'FC2412', rating: 5, text: 'The course content was practical and up to date. Support from the community group was excellent.' },
        { id: 4, name: 'Sajid Rahman', batch: 'FC2410', rating: 5, text: 'Highly recommended for anyone serious about freelancing. The job placement guidance genuinely helped me start earning.' },
        { id: 5, name: 'Nusrat Jahan', batch: 'FC2409', rating: 5, text: 'Great mentors and well structured lessons. The recorded classes made it easy to revisit topics whenever I needed.' },
      ],
    },
  },
  {
    slug: 'cta',
    label: 'Call to Action',
    type: 'cta',
    order: 12,
    content: {
      title: 'Admissions Open',
      subtitle:
        "Don't delay the decision to build your career. Join us, start your skill development journey, and enroll in the best courses.",
      primary_cta: 'Visit the community',
      primary_cta_link: '/community',
      secondary_cta: 'Browse courses',
      secondary_cta_link: '/courses',
    },
  },
  {
    slug: 'success_stories',
    label: 'Success Stories',
    type: 'success_stories',
    order: 13,
    content: {
      title_prefix: 'Success',
      title_highlight: 'Stories',
      subtitle: 'Take a look at the success stories of our students.',
      see_more_label: 'See more',
      see_more_link: '/courses',
      filters: [
        { key: 'all', label: 'All' },
        { key: 'capcut', label: 'Video Editing (CapCut)' },
        { key: 'video', label: 'Video Editing' },
        { key: 'excel', label: 'Excel' },
        { key: 'callcenter', label: 'Call Center' },
      ],
      stories: [
        { id: 1, name: 'Sahed Mohammad', batch: 'CCC 2505', category: 'capcut', image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=600&h=360&fit=crop' },
        { id: 2, name: 'Sanjida Islam', batch: 'CCC 2504', category: 'video', image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=360&fit=crop' },
        { id: 3, name: 'Asraful Hoque', batch: 'CCC 2503', category: 'capcut', image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&h=360&fit=crop' },
        { id: 4, name: 'Rumana Akter', batch: 'EXL 2502', category: 'excel', image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&h=360&fit=crop' },
        { id: 5, name: 'Tanvir Ahmed', batch: 'CC 2501', category: 'callcenter', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=360&fit=crop' },
        { id: 6, name: 'Farhana Yasmin', batch: 'CCC 2502', category: 'video', image: 'https://images.unsplash.com/photo-1494790108755-2616b332906c?w=600&h=360&fit=crop' },
      ],
    },
  },
  {
    slug: 'certificate',
    label: 'Certificate Showcase',
    type: 'certificate',
    order: 14,
    content: {
      title: 'Let the goal be to become skilled',
      subtitle:
        'Learn easily, wherever you are — the treasure of knowledge is now in the palm of your hand.',
      features: [
        { title: 'Recognition of your skills', desc: 'The certificate earned after completing a course is recognition of your acquired knowledge and skills, which plays an important role in your career.' },
        { title: 'Valuable in the workplace', desc: 'This certificate helps you move forward in your workplace and establishes you as a professional.' },
        { title: 'A symbol of trust', desc: 'It is a symbol of trust that ensures the quality of your skills and training, and keeps you motivated.' },
        { title: 'Helps career development', desc: 'This certificate helps open new horizons in your career, preparing you for new opportunities and challenges.' },
      ],
    },
  },
  {
    slug: 'payment_method',
    label: 'Payment Methods',
    type: 'payment_method',
    order: 15,
    content: {
      title: 'Payment Method',
      subtitle: 'Pay hassle-free and securely.',
      methods: [
        { name: 'SSLCOMMERZ', color: 'sky', action: 'Card' },
        { name: 'bKash', color: 'pink', action: '01973-173371' },
        { name: 'Rocket', color: 'purple', action: '01973-173371' },
        { name: 'নগদ', color: 'orange', action: '01973-173371' },
      ],
    },
  },
  {
    slug: 'join_instructor',
    label: 'Join as Instructor',
    type: 'join_instructor',
    order: 16,
    content: {
      title: 'Join as an instructor',
      subtitle: 'Open up a unique new chapter in your own career.',
      cta_label: 'Join now',
      cta_link: '/contact',
      image:
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&h=600&fit=crop',
    },
  },
  {
    slug: 'community',
    label: 'Community Section',
    type: 'community',
    order: 17,
    content: {
      title: 'Join the largest learning community',
      subtitle:
        'With direct guidance from experienced instructors and round-the-clock skill assurance, our project-based skill development and career-focused community brings everything a market or freelancing platform demands — professionals all in one place.',
      members_label: 'Our learners now',
      members_count: '22 thousand+',
      avatars: [
        'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=80&h=80&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1494790108755-2616b332906c?w=80&h=80&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face',
      ],
    },
  },
];

// Green "ESkills"-style template — fully custom section set matching the
// admin-supplied design mockup (hero → feature cards → categories → CTA
// banner → new courses collage → best-selling courses → instructors →
// student stories → articles → FAQ → newsletter).
const HOME_V4_SECTIONS: SeedSection[] = [
  {
    slug: 'hero_v2',
    label: 'Hero Section (Green Template)',
    type: 'hero_v2',
    order: 0,
    content: {
      title_line1: 'Grow your skills,',
      title_line2: 'Build your future.',
      subtitle:
        'We collaborate to ensure every student achieves academic, social, and emotional success by working together and providing comprehensive support.',
      primary_cta: 'Get Started',
      primary_cta_link: '/courses',
      secondary_cta: 'Watch video',
      secondary_cta_link: '/about',
      hero_image:
        'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=640&h=760&fit=crop',
      stat_top_value: '23K',
      stat_top_label: 'Free Courses',
      stat_bottom_value: '1023K',
      stat_bottom_label: 'Active Students',
      instructors_count: '270+',
      instructors_label: 'Instructors',
      search_placeholder: 'Courses name ..',
      category_placeholder: 'All Categories',
      search_link: '/courses',
    },
  },
  {
    slug: 'feature_cards',
    label: 'Feature Cards',
    type: 'feature_cards_v2',
    order: 1,
    content: {
      items: [
        { icon: 'instructor', title: 'Expert Instructor', desc: 'Expert Instructor knowledgeable, experienced, and provides quality education and guidance.', link: '/about' },
        { icon: 'support', title: '24/7 Support Available', desc: 'With "24/7 Support Available," help is always accessible for any concerns or questions.', link: '/contact' },
        { icon: 'access', title: 'Lifetime access', desc: 'With "Lifetime access," users have perpetual and unrestricted use of a product or service.', link: '/courses' },
        { icon: 'anywhere', title: 'Learn Anywhere', desc: 'With "Learn Anywhere," education and skill development can happen from any location, anytime.', link: '/courses' },
      ],
    },
  },
  {
    slug: 'categories',
    label: 'Explore Courses by Categories',
    type: 'categories_v2',
    order: 2,
    content: {
      eyebrow: 'Learn Best Things',
      title: 'Explore Courses by Categories',
      cta_label: 'View all Courses',
      cta_link: '/courses',
      items: [
        { title: 'Graphic Design', course_count: 'Over 700 Courses', image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=300&h=300&fit=crop' },
        { title: 'UI/UX Design', course_count: 'Over 480 Courses', image: 'https://images.unsplash.com/photo-1559028012-481c04fa702d?w=300&h=300&fit=crop' },
        { title: 'Software Development', course_count: 'Over 190 Courses', image: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=300&h=300&fit=crop' },
        { title: 'Web Development', course_count: 'Over 540 Courses', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&h=300&fit=crop' },
        { title: 'Photography', course_count: 'Over 340 Courses', image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&h=300&fit=crop' },
        { title: 'Audio + Music', course_count: 'Over 320 Courses', image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop' },
        { title: 'Digital Marketing', course_count: 'Over 720 Courses', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=300&fit=crop' },
        { title: '3D + Animation', course_count: 'Over 910 Courses', image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=300&fit=crop' },
      ],
    },
  },
  {
    slug: 'cta_banner',
    label: 'CTA Banner',
    type: 'cta_banner_v2',
    order: 3,
    content: {
      eyebrow: 'The Best Choice',
      title_line1: 'Apply for Your favorite',
      title_line2: 'Courses Today !',
      cta_label: 'Apply Now',
      cta_link: '/courses',
    },
  },
  {
    slug: 'featured_collage',
    label: 'Newly Launched Courses',
    type: 'featured_collage_v2',
    order: 4,
    content: {
      eyebrow: 'New Courses',
      title: 'Newly Launched Courses',
      images: [
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&h=700&fit=crop',
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=340&h=220&fit=crop',
        'https://images.unsplash.com/photo-1517842645767-c639042777db?w=340&h=220&fit=crop',
        'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=340&h=440&fit=crop',
      ],
      stats: [
        { label: 'Users', value: '123456' },
        { label: 'Instructors', value: '123456' },
        { label: 'Students', value: '123456' },
        { label: 'Enrollment', value: '123456' },
        { label: 'Courses', value: '123456' },
      ],
    },
  },
  {
    slug: 'courses_grid',
    label: 'Best Selling Courses',
    type: 'courses_grid_v2',
    order: 5,
    content: {
      eyebrow: 'Our Best Courses',
      title: 'Best Selling Courses',
      filters: ['All Courses', 'UI/UX Design', 'Software Development', 'Web Development', 'Digital Marketing'],
      see_all_label: 'See all',
      see_all_link: '/courses',
      limit: 6,
    },
  },
  {
    slug: 'instructors',
    label: 'Meet Our Skill Instructors',
    type: 'instructors_v2',
    order: 6,
    content: {
      eyebrow: 'Our Instructor',
      title: 'Meet Our Skill Instructors',
      limit: 3,
    },
  },
  {
    slug: 'student_stories',
    label: "Stories of Our Successful Students",
    type: 'student_stories_v2',
    order: 7,
    content: {
      eyebrow: "Our Students' Stories",
      title_prefix: 'Stories of',
      title_highlight: 'Our Successful Students',
      subtitle: 'See what learners say after finishing their courses with us.',
      limit: 2,
    },
  },
  {
    slug: 'articles',
    label: 'Our New Articles',
    type: 'articles_v2',
    order: 8,
    content: {
      eyebrow: 'Our Blog',
      title: 'Our New Articles',
      limit: 3,
    },
  },
  {
    slug: 'faq',
    label: 'Frequently Asked Questions',
    type: 'faq_v2',
    order: 9,
    content: {
      eyebrow: 'FAQ',
      title: 'Frequently Asked Questions',
      items: [
        { q: 'Do you offer discounts for students?', a: 'Yes, students get a special discount on select courses. Contact support with your student ID to redeem it.' },
        { q: 'Do you have a refund policy for the course?', a: 'We offer a 30-day, no-questions-asked money-back guarantee on all paid courses.' },
        { q: 'Do you offer discounts for beginners?', a: 'Yes! Beginner-friendly bundles are discounted regularly — check the courses page for active offers.' },
        { q: 'Do you offer classes for students?', a: 'Yes, we run both live and recorded classes suited for students at every level.' },
        { q: 'What was the course included?', a: 'Every course includes lifetime access, downloadable resources, and a certificate on completion.' },
        { q: 'What instructors are included in the course?', a: 'Each course is led by a vetted, experienced instructor with real industry background.' },
      ],
      cta_label: 'View all FAQs',
      cta_link: '/faq',
    },
  },
  {
    slug: 'newsletter',
    label: 'Newsletter',
    type: 'newsletter_v2',
    order: 10,
    content: {
      title: 'Subscribe our Newsletter',
      subtitle: 'Get the latest course updates and offers straight to your inbox.',
      placeholder: 'Enter your email',
      cta_label: 'Subscribe',
    },
  },
];

const SEEDS: { page: string; sections: SeedSection[] }[] = [
  { page: 'home', sections: HOME_SECTIONS },
  { page: 'home-v1', sections: HOME_V4_SECTIONS },

  // ── Footer ────────────────────────────────────────────────────────────────
  {
    page: 'footer',
    sections: [
      {
        slug: 'footer_info',
        label: 'Footer Info',
        type: 'footer_info',
        order: 0,
        content: {
          site_name: 'Skillkoro',
          description: 'One of the leading online learning platforms, committed to making quality education accessible to everyone.',
          address: '123 Learning Street, Dhaka, Bangladesh',
          phone: '+880 1700-000000',
          email: 'hello@skillkoro.com',
          students_count: '56K+',
          courses_count: '200+',
          copyright: `© ${new Date().getFullYear()} Skillkoro. All rights reserved.`,
        },
      },
    ],
  },

  // ── Contact ───────────────────────────────────────────────────────────────
  {
    page: 'contact',
    sections: [
      {
        slug: 'contact_hero',
        label: 'Contact Hero',
        type: 'simple_hero',
        order: 0,
        content: {
          eyebrow: '',
          title: 'Join the learning journey',
          subtitle: "Become an instructor and change your life and others'.",
        },
      },
      {
        slug: 'contact_info',
        label: 'Contact Info',
        type: 'contact_info',
        order: 1,
        content: {
          email: 'support@skillkoro.com',
          phone: '+880 1321-204263',
          address: 'House 90/2, Gulshan Badda Link Rd, Dhaka 1212, Bangladesh',
          hours_days: 'Saturday – Thursday',
          hours_time: '10:00 AM – 6:00 PM',
        },
      },
    ],
  },

  // ── About ─────────────────────────────────────────────────────────────────
  {
    page: 'about',
    sections: [
      {
        slug: 'about_intro',
        label: 'About Intro',
        type: 'about_intro',
        order: 0,
        content: {
          title: 'About Us',
          intro_lead: "One of today's most popular online learning platforms — ",
          intro_link_text: 'SkillKoro.com',
          intro_link_url: '/',
          intro_paragraph:
            "SkillKoro.com's journey began in 2018. Although it started primarily with domain-hosting and bulk SMS marketing, in 2024 — under the leadership of Majadur Rahaman Robin — SkillKoro was re-established with a single goal: to make IT education simple and accessible for everyone worldwide and to help them develop their careers.",
          subsections: [
            {
              title: 'Our Founders',
              paragraphs: [
                'Founded by angel investor and entrepreneur Mr. Rafid Ahsan Noor, alongside co-founder Mr. Arif M Rajon who joined in June 2024, SkillKoro.com formally began its journey with government approval and has steadily moved forward, earning growing trust. Through modern skill-development courses, real-life projects and industry-expert mentors, we are preparing the next generation for tomorrow\'s job and freelancing markets.',
              ],
            },
            {
              title: 'Our Belief & Goal',
              paragraphs: [
                'With the right guidance, skills and opportunity, anyone can move forward toward success.',
                'Smart learning to build your future — with us. Through skill development we make you job-ready. On this online platform you get practical, industry-ready courses built under experienced mentors. After every course you also get job-placement support, so learning is never the end of the road.',
              ],
            },
            {
              title: 'Interested in a job or freelancing?',
              paragraphs: ['Then our courses are made for you!'],
            },
          ],
        },
      },
      {
        slug: 'founding_team',
        label: 'Founding Team',
        type: 'founding_team',
        order: 1,
        content: {
          title: 'Our Founding Team',
          members: [
            { name: 'Majadur Rahaman Robin', role: 'FOUNDER & CEO', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop' },
            { name: 'Arif M Rajon', role: 'CBO', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=400&fit=crop' },
            { name: 'MD Kuhel Ahmed', role: 'CTO', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=400&fit=crop' },
          ],
        },
      },
      {
        slug: 'about_testimonials',
        label: 'Testimonials (About)',
        type: 'testimonials',
        order: 2,
        content: {
          eyebrow: 'Testimonials',
          title: "SkillKoro through professionals' eyes",
          subtitle: 'Join thousands of successful learners who have transformed their careers with us.',
          items: [
            { name: 'Shamim Parvez Himel', role: 'Tech Content Creator, AFR Technology', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&h=160&fit=crop&crop=face', rating: 5, amount: '', text: 'When it comes to building technology-driven skills, this is a brilliant initiative.' },
            { name: 'Jessica Martinez', role: 'Frontend Developer, Google', image: 'https://images.unsplash.com/photo-1494790108755-2616b332906c?w=160&h=160&fit=crop&crop=face', rating: 5, amount: '', text: 'The courses transformed my career. World-class content that is always up-to-date.' },
            { name: 'David Kim', role: 'UX Designer, Apple', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&h=160&fit=crop&crop=face', rating: 5, amount: '', text: 'The masterclass was incredibly thorough. Best investment I have ever made.' },
          ],
        },
      },
      {
        slug: 'about_partners',
        label: 'Partners (About)',
        type: 'partners',
        order: 3,
        content: {
          title: 'Our Partners',
          brands: ['bdjobs.com', 'FOODi', 'FURNITO', 'GRAHO Academy', 'MotoFix', "Rider's Option", 'RedData', 'ShahjiPark'],
        },
      },
      {
        slug: 'why_ict',
        label: 'Why SkillKoro',
        type: 'why_ict',
        order: 4,
        content: {
          title: 'The skill journey — why SkillKoro?',
          reasons: [
            { title: "Guidance from the country's best entrepreneurs", desc: 'Direct guidance and hands-on skill assurance from experienced, real-world instructors.' },
            { title: 'Corporate or freelancing-demand courses', desc: 'Project-based skill development built to match the demands of the job market or freelancing platforms.' },
            { title: 'Professional networking', desc: 'A career-growth community where students and professionals connect — all in one place.' },
          ],
        },
      },
      {
        slug: 'about_certificate',
        label: 'Certificate (About)',
        type: 'certificate',
        order: 5,
        content: {
          title: 'Let the goal be to become skilled',
          subtitle: 'Learn easily, wherever you are — the treasure of knowledge is now in the palm of your hand.',
          features: [
            { title: 'Recognition of your skills', desc: 'The certificate earned after completing a course is recognition of your acquired knowledge and skills.' },
            { title: 'Valuable in the workplace', desc: 'This certificate helps you move forward in your workplace and establishes you as a professional.' },
            { title: 'A symbol of trust', desc: 'It is a symbol of trust that ensures the quality of your skills and training.' },
            { title: 'Helps career development', desc: 'This certificate helps open new horizons in your career, preparing you for new opportunities.' },
          ],
        },
      },
      {
        slug: 'media',
        label: 'In the Media',
        type: 'media',
        order: 6,
        content: {
          title: 'SkillKoro in Media',
          articles: [
            { id: 1, outlet: 'THE BUSINESS STANDARD', date: '25th Nov 2025', image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=360&fit=crop', title: 'SkillKoro launches idea innovation 5.0', link: '/blog' },
            { id: 2, outlet: 'THE BUSINESS STANDARD', date: '25th Nov 2025', image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=360&fit=crop', title: 'SkillKoro launches idea innovation 5.0', link: '/blog' },
            { id: 3, outlet: 'THE BUSINESS STANDARD', date: '25th Nov 2025', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=360&fit=crop', title: 'SkillKoro launches idea innovation 5.0', link: '/blog' },
          ],
        },
      },
      {
        slug: 'milestones',
        label: 'Milestones',
        type: 'milestones',
        order: 7,
        content: {
          title: "How far we've come",
          subtitle: 'The biggest achievement at SkillKoro is including you as a true companion of time.',
          milestones: [
            { date: '26 December, 2019', desc: 'Participated in the BYLC Youth Carnival 2019.' },
            { date: '26 December, 2019', desc: 'Participated in the BYLC Youth Carnival 2019.' },
            { date: '26 December, 2019', desc: 'Participated in the BYLC Youth Carnival 2019.' },
            { date: '26 December, 2019', desc: 'Participated in the BYLC Youth Carnival 2019.' },
          ],
        },
      },
      {
        slug: 'about_community',
        label: 'Community (About)',
        type: 'community',
        order: 8,
        content: {
          title: 'Join the largest learning community',
          subtitle:
            'With direct guidance from experienced instructors and round-the-clock skill assurance, our project-based skill development and career-focused community brings everything a market or freelancing platform demands — professionals all in one place.',
          members_label: 'Our learners now',
          members_count: '22 thousand+',
          avatars: [
            'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=80&h=80&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1494790108755-2616b332906c?w=80&h=80&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face',
          ],
        },
      },
    ],
  },

  // ── Our Instructor (Mentors) ──────────────────────────────────────────────
  {
    page: 'our-instructor',
    sections: [
      {
        slug: 'mentor_hero',
        label: 'Mentors Hero',
        type: 'simple_hero',
        order: 0,
        content: {
          eyebrow: '',
          title: 'Our Expert Mentors',
          subtitle:
            "For those who want to learn — the best guides by your side. Our mentors don't just teach; they show you the path to move forward in your career and become a strong companion on your journey to success.",
        },
      },
      {
        slug: 'mentor_grid',
        label: 'Mentor Grid',
        type: 'mentor_grid',
        order: 1,
        content: {
          mentors: [
            { name: 'MD Naimul Islam', role: 'Video Editing, Instructor', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=600&fit=crop' },
            { name: 'Ashrafur Rahman', role: 'Digital Marketing, Instructor', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=600&fit=crop' },
            { name: 'Sadia Islam Promi', role: 'Fiverr Freelancing, Instructor', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&h=600&fit=crop' },
            { name: 'Arif M Rajon', role: 'Soft Skill, Instructor', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&h=600&fit=crop' },
            { name: 'Tahmid Arman', role: 'AI Designer, Instructor', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=600&fit=crop' },
            { name: 'Md. Tahmidur Rahman', role: 'Excel Expert, Instructor', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&h=600&fit=crop' },
            { name: 'Tamim Asif Chowdhury', role: 'Canva Design, Instructor', image: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=500&h=600&fit=crop' },
          ],
        },
      },
      {
        slug: 'mentor_top_courses',
        label: 'Top Courses Carousel',
        type: 'top_courses',
        order: 2,
        content: {
          title_prefix: 'Our',
          title_highlight: 'Top Courses',
          title_suffix: 'All',
          see_all_label: 'See all',
          see_all_link: '/courses',
        },
      },
    ],
  },

  // ── Success Stories ───────────────────────────────────────────────────────
  {
    page: 'success-stories',
    sections: [
      {
        slug: 'success_stories_hero',
        label: 'Success Stories Hero',
        type: 'simple_hero',
        order: 0,
        content: {
          eyebrow: '',
          title: 'Student Reviews',
          subtitle: 'What our students say about our courses',
        },
      },
      {
        slug: 'success_stories_panel',
        label: 'Success Stories Panel',
        type: 'success_stories_panel',
        order: 1,
        content: {
          page_size: 6,
          filters: [
            { key: 'all', label: 'All' },
            { key: 'capcut', label: 'Video Editing (CapCut)' },
            { key: 'video', label: 'Video Editing' },
            { key: 'excel', label: 'Excel' },
            { key: 'callcenter', label: 'Call Center' },
          ],
          videos: [
            { id: 1, title: 'Customer Service Success Story', category: 'callcenter', categoryLabel: 'Call Center', image: 'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=600&h=360&fit=crop' },
            { id: 2, title: 'Sales Team Transformation', category: 'video', categoryLabel: 'Sales', image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=360&fit=crop' },
            { id: 3, title: 'Technical Support Breakthrough', category: 'callcenter', categoryLabel: 'Support', image: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=600&h=360&fit=crop' },
            { id: 4, title: 'Call Center Efficiency', category: 'callcenter', categoryLabel: 'Call Center', image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&h=360&fit=crop' },
            { id: 5, title: 'Team Management Success', category: 'excel', categoryLabel: 'Management', image: 'https://images.unsplash.com/photo-1494790108755-2616b332906c?w=600&h=360&fit=crop' },
            { id: 6, title: 'Record Sales Achievement', category: 'video', categoryLabel: 'Sales', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=360&fit=crop' },
            { id: 7, title: 'CapCut Editing Mastery', category: 'capcut', categoryLabel: 'Video Editing (CapCut)', image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&h=360&fit=crop' },
            { id: 8, title: 'From Beginner to Pro Editor', category: 'video', categoryLabel: 'Video Editing', image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&h=360&fit=crop' },
            { id: 9, title: 'Excel Reporting Wins', category: 'excel', categoryLabel: 'Excel', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=360&fit=crop' },
          ],
          texts: [
            { id: 1, name: 'Md. Mahfuzul Islam', batch: 'FC2501', category: 'capcut', rating: 5, text: 'A brilliant mentor. Every step was covered to turn a simple video into an eye-catching one — effects, transitions, color correction and more.' },
            { id: 2, name: 'HM Rifat Hossain', batch: 'FC2412', category: 'video', rating: 5, text: 'The teaching approach is far better than many others. I learnt practical tips I now use in real client work every day.' },
            { id: 3, name: 'Tania Akter', batch: 'EE2401', category: 'excel', rating: 5, text: 'Practical, up to date and well structured. The live support cleared all my doubts quickly.' },
            { id: 4, name: 'Sajid Rahman', batch: 'CC2402', category: 'callcenter', rating: 5, text: 'The job placement guidance and one-to-one support genuinely helped me start earning.' },
            { id: 5, name: 'Nusrat Jahan', batch: 'FC2409', category: 'video', rating: 5, text: 'Great mentors and lessons. The recorded classes made revising before assignments effortless.' },
            { id: 6, name: 'Abu Altamas', batch: 'CC2402', category: 'callcenter', rating: 5, text: 'Confident on calls now. The role-play sessions made a real difference to my communication.' },
          ],
        },
      },
    ],
  },

  // ── Live Classes (Upcoming Batches) ───────────────────────────────────────
  {
    page: 'live-classes',
    sections: [
      {
        slug: 'live_classes_hero',
        label: 'Live Classes Hero',
        type: 'simple_hero',
        order: 0,
        content: {
          eyebrow: '',
          title: 'Upcoming Batches',
          subtitle: 'New batches are starting very soon. Get ready now — seats are limited, so register early and secure your spot.',
        },
      },
      {
        slug: 'batches_grid',
        label: 'Batches Grid',
        type: 'batches_grid',
        order: 1,
        content: {
          batches: [
            { id: 1, title: 'NextGen Graphic Design & AI for Passive Income', image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&h=360&fit=crop', type: 'live', batch: '4th Batch', lessons: 15, hours: 20, reviews: 124, students: 302, price: 2399, oldPrice: 7999 },
            { id: 2, title: 'Nextgen All In One Video Editing Masterclass', image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&h=360&fit=crop', type: 'live', batch: '4th Batch', lessons: 15, hours: 23, reviews: 230, students: 636, price: 2399, oldPrice: 7999 },
            { id: 3, title: 'Ai Content Creation with Capcut (Live Course)', image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&h=360&fit=crop', type: 'live', batch: '2nd Batch', lessons: 31, hours: 43, reviews: 6261, students: 7903, price: 2499, oldPrice: 4999 },
            { id: 4, title: 'Canva Mastery Bootcamp (Live Course)', image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=360&fit=crop', type: 'live', batch: '', lessons: 22, hours: 31, reviews: 503, students: 922, price: 2399, oldPrice: 2399 },
            { id: 5, title: 'Become A Digital Marketing Rockstar', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=360&fit=crop', type: 'recorded', batch: '', lessons: 22, hours: 28, reviews: 587, students: 6873, price: 7999, oldPrice: 7999 },
            { id: 6, title: 'Content Creation with Capcut (Pre-Recorded)', image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=360&fit=crop', type: 'recorded', batch: '', lessons: 23, hours: 15, reviews: 521, students: 1679, price: 999, oldPrice: 999 },
            { id: 7, title: 'Become A Digital Marketing Rockstar (Pre-Recorded)', image: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&h=360&fit=crop', type: 'recorded', batch: '', lessons: 60, hours: 17, reviews: 269, students: 794, price: 399, oldPrice: 999 },
            { id: 8, title: 'Fiverr Freelancing Success: From Zero to Hero', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=360&fit=crop', type: 'recorded', batch: '', lessons: 16, hours: 14, reviews: 194, students: 3409, price: 399, oldPrice: 999 },
            { id: 9, title: 'Next Level Social Media Marketing (Pre-Recorded)', image: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=600&h=360&fit=crop', type: 'recorded', batch: '', lessons: 22, hours: 19, reviews: 78, students: 591, price: 399, oldPrice: 999 },
            { id: 10, title: 'Call Center Professional (Pre-Recorded)', image: 'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=600&h=360&fit=crop', type: 'recorded', batch: '', lessons: 13, hours: 9, reviews: 71, students: 191, price: 399, oldPrice: 999 },
            { id: 11, title: 'Journey To Excel Expert (Pre-Recorded)', image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=360&fit=crop', type: 'recorded', batch: '', lessons: 12, hours: 15, reviews: 110, students: 541, price: 399, oldPrice: 999 },
            { id: 12, title: 'Canva Mastery with AI (Pre-Recorded)', image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=360&fit=crop', type: 'recorded', batch: '', lessons: 54, hours: 15, reviews: 182, students: 679, price: 399, oldPrice: 999 },
            { id: 13, title: 'AI Design with Passive Income (Pre-recorded)', image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&h=360&fit=crop', type: 'recorded', batch: '', lessons: 24, hours: 6, reviews: 124, students: 480, price: 399, oldPrice: 999 },
            { id: 14, title: 'E-Commerce Business Mastery (Pre-Recorded)', image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=360&fit=crop', type: 'recorded', batch: '', lessons: 15, hours: 4, reviews: 0, students: 0, price: 3999, oldPrice: 3999 },
            { id: 15, title: 'AI Filmmaking Boot-Camp (Live Course)', image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=600&h=360&fit=crop', type: 'live', batch: '', lessons: 0, hours: 0, reviews: 0, students: 0, price: 2399, oldPrice: 2399 },
            { id: 16, title: 'Facebook-Youtube Monitizing Bootcamp (Live Course)', image: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=600&h=360&fit=crop', type: 'live', batch: '11th Batch', lessons: 0, hours: 0, reviews: 0, students: 0, price: 2399, oldPrice: 2399 },
            { id: 17, title: 'Job Hunting And Preparation For Bangladeshis (Pre-Recorded)', image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=360&fit=crop', type: 'recorded', batch: '', lessons: 40, hours: 7, reviews: 0, students: 59, price: 3999, oldPrice: 3999 },
            { id: 18, title: 'Lovable AI Vibe Coding Mastermind (Non-Code)', image: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=600&h=360&fit=crop', type: 'live', batch: '1st Batch', lessons: 0, hours: 0, reviews: 0, students: 0, price: 7999, oldPrice: 7999 },
            { id: 19, title: 'N8N AI Automation Mastery (Non-Code)', image: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=600&h=360&fit=crop', type: 'live', batch: '1st Batch', lessons: 0, hours: 0, reviews: 0, students: 0, price: 7999, oldPrice: 7999 },
          ],
        },
      },
    ],
  },

  // ── Free Courses ──────────────────────────────────────────────────────────
  {
    page: 'free-courses',
    sections: [
      {
        slug: 'free_courses_hero',
        label: 'Free Courses Hero',
        type: 'simple_hero',
        order: 0,
        content: {
          eyebrow: '',
          title: 'Free Courses',
          subtitle: 'A source of learning and inspiration for newcomers — explore and start for free.',
        },
      },
      {
        slug: 'free_courses_grid',
        label: 'Free Courses Grid',
        type: 'free_courses_grid',
        order: 1,
        content: {
          title_prefix: 'Our',
          title_highlight: 'Free Courses',
          title_suffix: '',
        },
      },
      {
        slug: 'coming_soon_card',
        label: 'Coming Soon Card',
        type: 'coming_soon_card',
        order: 2,
        content: {
          message: "🎓 Don't worry! New free courses are being added soon — stay tuned!",
          subtext_lead: 'For deeper learning, take a look at our ',
          subtext_link_text: 'premium courses',
          subtext_link_url: '/courses',
          subtext_trail: '.',
          cta_label: 'Browse premium courses',
          cta_link: '/courses',
        },
      },
      {
        slug: 'free_recorded_courses',
        label: 'Recorded Courses Carousel',
        type: 'recorded_courses',
        order: 3,
        content: {
          title_prefix: '',
          title_highlight: 'Recorded',
          title_suffix: 'Courses All',
          see_all_label: 'See all',
          see_all_link: '/courses',
        },
      },
    ],
  },

  // ── Join as Instructor ────────────────────────────────────────────────────
  {
    page: 'join-as-instructor',
    sections: [
      {
        slug: 'join_instructor_hero',
        label: 'Join as Instructor Hero',
        type: 'simple_hero',
        order: 0,
        content: {
          eyebrow: '',
          title: 'Become an Instructor',
          subtitle: "Share your expertise with thousands of learners. Fill out the form below and we'll be in touch.",
        },
      },
    ],
  },

  // ── Blog ─────────────────────────────────────────────────────────────────
  {
    page: 'blog',
    sections: [
      {
        slug: 'blog_hero',
        label: 'Blog Hero',
        type: 'simple_hero',
        order: 0,
        content: {
          eyebrow: '',
          title: 'Blogs',
          subtitle: 'A source of learning and inspiration for newcomers — our blogs.',
        },
      },
    ],
  },

  // ── Courses ───────────────────────────────────────────────────────────────
  {
    page: 'courses',
    sections: [
      {
        slug: 'courses_hero',
        label: 'Courses Hero',
        type: 'simple_hero',
        order: 0,
        content: {
          eyebrow: '',
          title: 'Our Courses',
          subtitle:
            'All the modern, practical courses you need to build your career, now on one platform. Each course is curated to match current market demand — with live support, project-based learning and real experience for assured skill development.',
        },
      },
    ],
  },

  // ── Signup ────────────────────────────────────────────────────────────────
  {
    page: 'signup',
    sections: [
      {
        slug: 'signup_panel',
        label: 'Signup Panel',
        type: 'login_panel',
        order: 0,
        content: {
          title: 'Join our community',
          image: 'https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?w=800&h=1000&fit=crop',
        },
      },
    ],
  },

  // ── Login ─────────────────────────────────────────────────────────────────
  {
    page: 'login',
    sections: [
      {
        slug: 'login_panel',
        label: 'Login Panel',
        type: 'login_panel',
        order: 0,
        content: {
          title: 'Welcome to SkillKoro',
          image: 'https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?w=800&h=1000&fit=crop',
        },
      },
    ],
  },

  // ── FAQ ───────────────────────────────────────────────────────────────────
  {
    page: 'faq',
    sections: [
      {
        slug: 'faq_hero',
        label: 'FAQ Hero',
        type: 'simple_hero',
        order: 0,
        content: {
          eyebrow: '',
          title: 'FAQ',
          subtitle: 'Your frequently asked questions.',
        },
      },
      {
        slug: 'faq_main',
        label: 'FAQ Categories',
        type: 'faq_main',
        order: 1,
        content: {
          categories: [
            {
              id: 'payment',
              title: 'Payment & Enrollment related questions',
              questions: [
                { q: 'What is the course enrollment process like?', a: 'Pick your course, click enroll, complete the payment, and you instantly get access from your course dashboard — the whole process takes under a minute.' },
                { q: 'What payment options are available?', a: 'We accept bKash, Nagad, Rocket, and all major debit/credit cards via SSLCommerz. Every transaction is secured with SSL encryption.' },
                { q: 'Can I pay in installments?', a: "Selected premium courses support installment payments. The available installment plan is shown on the course's checkout page." },
                { q: 'Is there any refund option after purchasing a course?', a: 'Yes — we offer a no-questions-asked money-back guarantee within the refund window. Just contact our support team with your order details.' },
              ],
            },
            {
              id: 'support',
              title: 'Technical & Support related questions',
              questions: [
                { q: 'Do I need any special software or hardware to view the courses?', a: 'No. Any modern browser on a phone, tablet, or computer with an internet connection is enough — no special software or hardware required.' },
                { q: 'Who do I contact if I face a problem during a course?', a: 'Use our community group or one-to-one support, or reach out via the Contact page. Our support team responds quickly during office hours.' },
                { q: 'How do I access my course dashboard?', a: 'Log in to your account and open the dashboard from your profile menu. All enrolled courses, progress, and certificates live there.' },
              ],
            },
          ],
        },
      },
    ],
  },
];

@Injectable()
export class PageSectionsService implements OnModuleInit {
  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly revalidation: RevalidationService,
  ) { }

  async onModuleInit() {
    // ── One-time migration ──────────────────────────────────────────────────
    // The home page CMS was redesigned from 6 sections (hero, partners,
    // flexible_learning, testimonials, faq_section, cta) to 18 sections that
    // mirror the live landing page. Old rows have stale `order` values that
    // would collide with the new SEEDS, so when we detect the legacy layout
    // (no `top_courses` slug exists yet) we wipe the home page and let the
    // seed loop below reinsert everything with the new orders.
    //
    // This is idempotent: after first run, `top_courses` exists and the
    // wipe is skipped.
    const homeRows = await this.db
      .select({ slug: pageSections.slug })
      .from(pageSections)
      .where(eq(pageSections.page, 'home'));
    const homeSlugs = new Set(homeRows.map((r) => r.slug));
    if (homeRows.length > 0 && !homeSlugs.has('top_courses')) {
      await this.db.delete(pageSections).where(eq(pageSections.page, 'home'));
    }

    // Same migration pattern for the about page: the original 5-section
    // template (about_hero/about_stats/about_mission_vision/about_team/about_cta)
    // was replaced with a 9-section layout matching what the web actually
    // renders. Wipe when `about_intro` is missing so the seed loop reinserts
    // the new shape cleanly. Idempotent after first run.
    const aboutRows = await this.db
      .select({ slug: pageSections.slug })
      .from(pageSections)
      .where(eq(pageSections.page, 'about'));
    const aboutSlugs = new Set(aboutRows.map((r) => r.slug));
    if (aboutRows.length > 0 && !aboutSlugs.has('about_intro')) {
      await this.db.delete(pageSections).where(eq(pageSections.page, 'about'));
    }

    // Same migration pattern for the `home-v1` template: its section set was
    // redesigned from a reused copy of the standard home sections to a fully
    // custom layout (feature_cards/categories/cta_banner/etc). Wipe when
    // `feature_cards` is missing (old shape never seeded) OR the legacy
    // `top_courses` slug is still present (one restart landed the new SEEDS
    // insert-loop on top of the old rows without a wipe, leaving both sets
    // mixed) — either case means the row set isn't the current clean shape.
    // Idempotent once both conditions clear.
    const homeV4Rows = await this.db
      .select({ slug: pageSections.slug })
      .from(pageSections)
      .where(eq(pageSections.page, 'home-v1'));
    const homeV4Slugs = new Set(homeV4Rows.map((r) => r.slug));
    if (
      homeV4Rows.length > 0 &&
      (!homeV4Slugs.has('feature_cards') || homeV4Slugs.has('top_courses'))
    ) {
      await this.db.delete(pageSections).where(eq(pageSections.page, 'home-v1'));
    }

    // The "Course-Focused" (home-v2) and "Minimal" (home-v3) templates were
    // removed from the picker — drop their now-unreachable rows. Plain
    // DELETE is naturally idempotent (no-op once already empty).
    await this.db.delete(pageSections).where(inArray(pageSections.page, ['home-v2', 'home-v3']));

    for (const { page, sections } of SEEDS) {
      for (const section of sections) {
        const existing = await this.db
          .select()
          .from(pageSections)
          .where(
            and(
              eq(pageSections.page, page),
              eq(pageSections.slug, section.slug),
            ),
          )
          .limit(1);

        if (!existing[0]) {
          await this.db.insert(pageSections).values({ page, ...section });
        }
      }
    }
  }

  // Public — active sections only, ordered
  async getPublicByPage(page: string) {
    return this.db
      .select()
      .from(pageSections)
      .where(and(eq(pageSections.page, page), eq(pageSections.active, true)))
      .orderBy(asc(pageSections.order));
  }

  // Admin — all sections for a page
  async getAllByPage(page: string) {
    return this.db
      .select()
      .from(pageSections)
      .where(eq(pageSections.page, page))
      .orderBy(asc(pageSections.order));
  }

  // Admin — create section
  async create(data: {
    page: string;
    slug: string;
    label: string;
    type: string;
    order?: number;
    content?: Record<string, unknown>;
  }) {
    const [row] = await this.db.insert(pageSections).values(data).returning();
    if (row) this.revalidation.revalidate([pageSectionsTag(row.page)]);
    return row;
  }

  // Admin — update section content/label
  async update(
    id: number,
    data: { label?: string; content?: Record<string, unknown>; active?: boolean },
  ) {
    const [row] = await this.db
      .update(pageSections)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(pageSections.id, id))
      .returning();
    if (row) this.revalidation.revalidate([pageSectionsTag(row.page)]);
    return row;
  }

  // Admin — toggle active
  async toggle(id: number) {
    const [existing] = await this.db
      .select()
      .from(pageSections)
      .where(eq(pageSections.id, id))
      .limit(1);
    if (!existing) return null;

    const [row] = await this.db
      .update(pageSections)
      .set({ active: !existing.active, updatedAt: new Date() })
      .where(eq(pageSections.id, id))
      .returning();
    if (row) this.revalidation.revalidate([pageSectionsTag(row.page)]);
    return row;
  }

  // Admin — bulk reorder
  async reorder(items: { id: number; order: number }[]) {
    for (const { id, order } of items) {
      await this.db
        .update(pageSections)
        .set({ order, updatedAt: new Date() })
        .where(eq(pageSections.id, id));
    }
    // Purge every distinct page touched by the reorder.
    const ids = items.map((i) => i.id);
    if (ids.length > 0) {
      const rows = await this.db
        .select({ page: pageSections.page })
        .from(pageSections)
        .where(inArray(pageSections.id, ids));
      const pages = [...new Set(rows.map((r) => r.page))];
      this.revalidation.revalidate(pages.map(pageSectionsTag));
    }
  }

  // Admin — delete
  async delete(id: number) {
    const [existing] = await this.db
      .select({ page: pageSections.page })
      .from(pageSections)
      .where(eq(pageSections.id, id))
      .limit(1);
    await this.db.delete(pageSections).where(eq(pageSections.id, id));
    if (existing) this.revalidation.revalidate([pageSectionsTag(existing.page)]);
  }
}
