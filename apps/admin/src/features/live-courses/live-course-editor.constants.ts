import type {
  PaymentLogo,
  BatchInfo,
  CurriculumItem,
  Tool,
  WhyItem,
  Instructor,
  WhatYouGetItem,
  VideoItem,
  Testimonial,
  ValueItem,
  FaqItem,
  CompRow,
  VideoTabItem,
  PcConfig,
  T3FeatureItem,
  T3Level,
  T3Review,
  T3SuccessStory,
  T3VideoItem,
  T4ForWhomCard,
  T4Module,
} from "./live-course-editor.types";

export const TOOL_COLORS = [
  "#4F46E5", "#0EA5E9", "#10B981", "#F59E0B",
  "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6",
];

/** Demo content pre-filled in create mode. */
export const MOCK = {
  title:           "Complete Web Development Mastery Course",
  slug:            "complete-web-development-mastery",
  price:           "4999",
  originalPrice:   "9999",
  totalValue:      "28000",
  totalLiveClasses: "60",
  countdownEnd:    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),

  // Hero
  heroBadge:         "🔥 Enrolment Closing Soon!",
  heroSubtitle:      "বাংলাদেশের সেরা ওয়েব ডেভেলপমেন্ট কোর্স। শিখুন HTML, CSS, React, Node.js এবং আরো অনেক কিছু — একজন এক্সপার্টের কাছ থেকে।",
  heroBanner:        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
  heroRating:        "4.8",
  heroRatingCount:   "3200",
  heroCtaText:       "এখনই এনরোল করুন",
  heroPromoText:     "৳৫,০০০ ছাড় পেতে আজই যোগ দিন!",
  heroStudentCount:  "১২,০০০+ শিক্ষার্থী ইতিমধ্যে যোগ দিয়েছেন",

  // Payment logos
  paymentLogos: [
    { name: "bKash",  image: "" },
    { name: "Nagad",  image: "" },
    { name: "Rocket", image: "" },
    { name: "Card",   image: "" },
  ] as PaymentLogo[],

  // Batch info
  batchInfo: {
    startDate:      "১ জুন, ২০২৫",
    liveSchedule:   "শনি–বৃহস্পতি, রাত ১০টা",
    supportSchedule:"সকাল ১০টা – রাত ১০টা",
    seatsLeft:      "মাত্র ৪৭টি আসন বাকি",
  } as BatchInfo,

  // Curriculum
  curriculum: [
    { title: "Module 1: HTML & CSS Fundamentals",   lessons: ["HTML structure & tags", "CSS selectors & box model", "Flexbox & Grid layout", "Responsive design"] },
    { title: "Module 2: JavaScript Essentials",     lessons: ["Variables & data types", "Functions & scope", "DOM manipulation", "Async / Await & Promises"] },
    { title: "Module 3: React.js",                  lessons: ["Components & props", "State management", "Hooks (useState, useEffect)", "React Router"] },
    { title: "Module 4: Backend with Node.js",      lessons: ["Express.js basics", "REST APIs", "MongoDB & Mongoose", "Authentication with JWT"] },
  ] as CurriculumItem[],

  // Tools
  tools: [
    { name: "HTML5",       icon: "🌐", bgColor: TOOL_COLORS[0] },
    { name: "CSS3",        icon: "🎨", bgColor: TOOL_COLORS[1] },
    { name: "JavaScript",  icon: "⚡", bgColor: TOOL_COLORS[2] },
    { name: "React",       icon: "⚛️", bgColor: TOOL_COLORS[3] },
    { name: "Node.js",     icon: "🟢", bgColor: TOOL_COLORS[4] },
    { name: "MongoDB",     icon: "🍃", bgColor: TOOL_COLORS[5] },
    { name: "Git",         icon: "🔧", bgColor: TOOL_COLORS[6] },
    { name: "VS Code",     icon: "💻", bgColor: TOOL_COLORS[7] },
  ] as Tool[],

  // Why Different
  whyItems: [
    { icon: "🎯", title: "Project-Based Learning",  description: "Build 10+ real-world projects that you can add to your portfolio immediately." },
    { icon: "🧑‍🏫", title: "Expert Instructors",    description: "Learn from industry professionals with 10+ years of experience." },
    { icon: "💬", title: "Live Support",             description: "Get help within 24 hours via our dedicated Discord community." },
    { icon: "♾️", title: "Lifetime Access",          description: "Pay once, access forever — including all future updates to the course." },
    { icon: "📜", title: "Certificate",              description: "Receive a verifiable certificate upon course completion." },
    { icon: "🚀", title: "Job Placement Support",    description: "CV review, mock interviews, and referrals to our hiring partners." },
  ] as WhyItem[],

  // Stats
  statsStudents:   "12,000+",
  statsRatings:    "4,800+",
  statsCompletion: "94%",
  statsExtra:      "24/7 Support",
  statsLabels:     ["Students Enrolled", "5-Star Ratings", "Completion Rate", "Support"] as [string, string, string, string],

  // Instructors
  instructors: [
    {
      name:       "Rafiul Islam",
      title:      "Senior Full-Stack Developer @ TechBD",
      image:      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
      bio:        "Rafiul has 8 years of experience building scalable web applications. He has trained 5,000+ students and worked with companies like Shajgoj, Shohoz, and Pathao.",
      students:   "5,000+",
      courses:    "8",
      rating:     "4.9",
      years:      "8+",
      clients:    "50+",
      projects:   "120+",
      profileUrl: "#",
    },
  ] as Instructor[],

  // What You Get
  whatYouGet: [
    { icon: "📹", title: "50+ hours of HD video content",     description: "Watch on any device, at your own pace." },
    { icon: "📁", title: "Source code for every project",     description: "Download and use as reference." },
    { icon: "📝", title: "Downloadable cheat sheets & notes", description: "PDF-ready for offline reading." },
    { icon: "🎓", title: "Industry-recognised certificate",   description: "Share on LinkedIn or your CV." },
    { icon: "💬", title: "Private Discord community access",  description: "Network with 12,000+ peers." },
    { icon: "🔄", title: "Free updates for life",             description: "New content added regularly." },
  ] as WhatYouGetItem[],

  // Videos
  videos: [
    { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Course Introduction — Watch Before Enrolling", description: "Get a full overview of what you'll learn." },
    { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Free Preview: JavaScript Crash Course", description: "See exactly how we teach before you buy." },
  ] as VideoItem[],

  // Testimonials
  testimonials: [
    { name: "Arif Hossain",   role: "Junior Developer @ Shajgoj",  review: "এই কোর্সটি আমার জীবন বদলে দিয়েছে। মাত্র ৬ মাসে আমি একটি চাকরি পেয়েছি।" },
    { name: "Nusrat Jahan",   role: "Freelancer",                   review: "অসাধারণ কোর্স! ইন্সট্রাক্টর খুব সুন্দরভাবে সব কিছু বুঝিয়েছেন।" },
    { name: "Karim Uddin",    role: "Student, BUET",                review: "লাইভ সেশনগুলো সবচেয়ে ভালো ছিল। সরাসরি প্রশ্ন করার সুযোগ পেতাম।" },
    { name: "Sadia Islam",    role: "React Developer",              review: "Project-based approach দিয়ে শেখা অনেক সহজ হয়েছে। Highly recommended!" },
    { name: "Rahim Mia",      role: "Backend Engineer @ Pathao",   review: "Node.js module টা এত ভালোভাবে covered হয়েছে যে আর কিছু দরকারই নেই।" },
    { name: "Tahmina Akter",  role: "Freelance Designer",          review: "CSS ও Tailwind module দিয়ে আমার design-এর দক্ষতা অনেক বেড়ে গেছে।" },
  ] as Testimonial[],

  // Value Breakdown
  valueItems: [
    { title: "Full Course Access (50+ hours)",  value: "12,000" },
    { title: "Live Project Source Code",         value: "5,000"  },
    { title: "PDF Notes & Cheat Sheets",         value: "2,000"  },
    { title: "Certificate of Completion",        value: "3,000"  },
    { title: "Discord Community Access",         value: "3,000"  },
    { title: "Job Placement Support",            value: "3,000"  },
  ] as ValueItem[],

  // ── Template 2 mock data (Sales style) ─────────────────────────────────────
  t2HeroHeadline:      "শূন্য থেকে প্রফেশনাল",
  t2HeroHeadlineHl:    "ওয়েব ডেভেলপার",
  t2HeroHeadlineAfter: "হওয়ার সম্পূর্ণ গাইডলাইন",
  t2HeroSecondaryBtn:  "মডিউল দেখুন",

  t2Comparison: {
    col1Label: "নিজে নিজে শেখা",
    col2Label: "আমাদের কোর্স",
    rows: [
      { feature: "স্ট্রাকচার্ড কারিকুলাম",  col1: "❌", col2: "✅", highlight: false },
      { feature: "লাইভ মেন্টর সাপোর্ট",      col1: "❌", col2: "✅", highlight: true  },
      { feature: "রিয়েল-ওয়ার্ল্ড প্রজেক্ট",  col1: "❌", col2: "✅", highlight: false },
      { feature: "সার্টিফিকেট",              col1: "❌", col2: "✅", highlight: false },
      { feature: "জব প্লেসমেন্ট সাপোর্ট",    col1: "❌", col2: "✅", highlight: true  },
    ] as CompRow[],
  },

  t2CtaBanner: {
    label:         "Batch 7 চলছে",
    title:         "আজই কোর্সে যোগ দিন",
    price:         "4999",
    originalPrice: "9999",
    buttonText:    "এখনই এনরোল করুন",
    installment1:  "৳১,৬৬৭/মাস (৩ মাস)",
    installment2:  "৳৮৩৪/মাস (৬ মাস)",
  },

  t2Certificate: {
    title:       "আপনি পাবেন ভেরিফাইড সার্টিফিকেট",
    highlight:   "সার্টিফিকেট",
    description: "কোর্স সম্পন্ন করলে পাবেন একটি ইন্ডাস্ট্রি-রিকগনাইজড সার্টিফিকেট, যা LinkedIn ও CV-তে যোগ করতে পারবেন।",
    image:       "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=600&q=80",
    founderName: "Md. Rahim Uddin",
    founderRole: "CEO & Founder",
  },

  t2VideoTabs: [
    { category: "Class 1 — Intro",      videos: [{ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Welcome & Roadmap" }] },
    { category: "Class 2 — HTML/CSS",   videos: [{ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Building Your First Page" }] },
    { category: "Class 3 — JavaScript", videos: [{ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "JS Fundamentals" }] },
  ] as VideoTabItem[],

  t2PcBasic:    { ram: "8GB DDR4",  processor: "Core i3 / Ryzen 3", storage: "256GB SSD", graphics: "Integrated",     note: "শেখার জন্য যথেষ্ট" } as PcConfig,
  t2PcPro:      { ram: "16GB DDR4", processor: "Core i5 / Ryzen 5", storage: "512GB SSD", graphics: "2GB dedicated",  note: "স্মুথ মাল্টিটাস্কিং" } as PcConfig,
  t2PcInternet: "মিনিমাম 5 Mbps ব্রডব্যান্ড কানেকশন",

  t2FaqItems: [
    { question: "কোর্সটি কি বিগিনারদের জন্য?",  answer: "হ্যাঁ, এই কোর্সটি একদম শূন্য থেকে শুরু করা হয়েছে। আগে কোনো অভিজ্ঞতা না থাকলেও সমস্যা নেই।" },
    { question: "ক্লাস কি লাইভ নাকি রেকর্ডেড?", answer: "সপ্তাহে ৪টি লাইভ ক্লাস হবে এবং প্রতিটি ক্লাসের রেকর্ডিং আপনি পাবেন।" },
    { question: "পেমেন্ট কীভাবে করব?",          answer: "bKash, Nagad, Rocket বা কার্ডের মাধ্যমে পেমেন্ট করতে পারবেন। ইনস্টলমেন্ট সুবিধাও আছে।" },
    { question: "সার্টিফিকেট কি পাব?",          answer: "হ্যাঁ, কোর্স সম্পন্ন করার পর আপনি একটি ভেরিফাইড সার্টিফিকেট পাবেন।" },
  ] as FaqItem[],

  t2UrgencyCta: {
    batchLabel: "Batch 7 শুরু হচ্ছে ১ জুন",
    title:      "আর দেরি না করে",
    highlight:  "এখনই এনরোল করুন",
    subtitle:   "সীমিত আসন বাকি — মিস করবেন না এই সুযোগ!",
    buttonText: "কোর্সে এনরোল করুন",
    whatsapp:   "https://wa.me/8801XXXXXXXXX",
  },

  // ── Template 3 mock data ───────────────────────────────────────────────────
  t3Marquee:        "🔥 সীমিত আসন বাকি | এখনই এনরোল করুন | ক্যারিয়ার গড়ুন ঘরে বসেই | বিশেষ ছাড় চলছে",
  t3AnnounceText:   "📢 আজকের মধ্যে এনরোল করলে পাচ্ছেন ৩টি বিশেষ বোনাস কোর্স — একদম বিনামূল্যে!",
  t3AnnounceBtn:    "অফার দেখুন",
  t3AnnounceAnchor: "#pricing",

  t3BlueprintTitle: "কোর্সের কমপ্লিট ব্লুপ্রিন্ট",
  t3BlueprintSub:   "একটি কোর্সেই সব — শেখা থেকে উপার্জন পর্যন্ত",
  t3BlueprintImg:   "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",

  t3WhyItems: [
    "যদি ক্যারিয়ারে দ্রুত সফল হতে চান",
    "যদি ঘরে বসে ইনকাম করতে চান",
    "যদি ফ্রিল্যান্সিং শুরু করতে চান",
    "যদি নিজের বিজনেস অনলাইনে নিতে চান",
    "যদি প্রফেশনাল স্কিল অর্জন করতে চান",
    "যদি এক্সপার্টের গাইডেন্সে শিখতে চান",
  ] as string[],

  t3FeaturesTitle: "যা যা পাচ্ছেন এই কোর্সে",
  t3FeaturesSub:   "একটি কোর্সেই শূন্য থেকে প্রফেশনাল",
  t3FeatureItems: [
    { icon: "🎥", text: "৫০+ ঘণ্টা লাইভ ক্লাস" },
    { icon: "📁", text: "সব প্রজেক্টের সোর্স কোড" },
    { icon: "🏆", text: "সার্টিফিকেট অফ কমপ্লিশন" },
    { icon: "💬", text: "২৪/৭ লাইভ সাপোর্ট" },
    { icon: "👥", text: "প্রাইভেট কমিউনিটি অ্যাক্সেস" },
    { icon: "🔄", text: "লাইফটাইম আপডেট" },
    { icon: "📝", text: "PDF নোটস ও চিটশিট" },
    { icon: "🚀", text: "জব প্লেসমেন্ট সাপোর্ট" },
    { icon: "🎯", text: "রিয়েল-ওয়ার্ল্ড প্রজেক্ট" },
  ] as T3FeatureItem[],

  t3BonusTitle: "বোনাস হিসেবে যা পাচ্ছেন",
  t3BonusItems: [
    "ফ্রি ল্যাপটপ কনসালটেশন সেশন",
    "CV রিভিউ ও ক্যারিয়ার গাইড",
    "এক্সক্লুসিভ জব গ্রুপ অ্যাক্সেস",
    "মক ইন্টারভিউ সেশন (২টি)",
    "অনলাইন বিজনেস স্টার্টার গাইড",
    "ফ্রিল্যান্সিং মার্কেটপ্লেস মাস্টারক্লাস",
  ] as string[],

  t3ChallengeTitle: "৬ মাসের চ্যালেঞ্জ",
  t3ChallengeMonth: "৬",
  t3ChallengeDesc:  "৬ মাস ধরে প্রতিদিন মাত্র ২ ঘণ্টা দিন — আমরা গ্যারান্টি দিচ্ছি আপনি একটি প্রফেশনাল প্রজেক্ট তৈরি করতে পারবেন এবং ফ্রিল্যান্সিং বা জব মার্কেটে প্রবেশ করতে পারবেন। না পারলে সম্পূর্ণ টাকা ফেরত।",
  t3ChallengeLink:  "সম্পূর্ণ চ্যালেঞ্জ পলিসি পড়ুন →",

  t3LevelsTitle: "আমাদের লেভেল-বেজড সাপোর্ট সিস্টেম",
  t3LevelsSub:   "শূন্য থেকে প্রফেশনাল — প্রতিটি ধাপে আপনার পাশে",
  t3Levels: [
    { label: "Level-1", description: "কোর্সের বেসিক কনসেপ্ট ও ফাউন্ডেশন — HTML, CSS, এবং JavaScript এর মূল বিষয়গুলো শিখবেন।", color: "#14b8a6" },
    { label: "Level-2", description: "মিড-লেভেল স্কিল ডেভেলপমেন্ট — React, API integration, এবং প্রজেক্ট বিল্ডিং।",             color: "#f59e0b" },
    { label: "Level-3", description: "অ্যাডভান্স টপিক — Node.js, Database, Authentication, এবং Deployment।",                    color: "#8b5cf6" },
    { label: "Level-4", description: "প্রো লেভেল — Real-world project, Portfolio building, এবং Job/Freelancing প্রিপারেশন।",    color: "#ef4444" },
  ] as T3Level[],

  t3SalesTitle:  "আমাদের সাফল্যের আপডেট",
  t3SalesSub:    "প্রতিদিন নতুন শিক্ষার্থীরা যোগ দিচ্ছেন",
  t3SalesImages: [
    "https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&q=80",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80",
  ] as string[],

  t3CommTitle:   "আমাদের কমিউনিটি",
  t3CommSub:     "১২,০০০+ শিক্ষার্থীর একটি সক্রিয় পরিবার",
  t3CommCaption: "আমাদের কমিউনিটিতে যোগ দিন — একসাথে শিখুন, একসাথে বাড়ুন",
  t3CommImages:  [
    "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80",
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80",
  ] as string[],

  t3ReviewsTitle: "শিক্ষার্থীদের রিভিউ",
  t3Reviews: [
    { name: "Arif Hossain", role: "Junior Developer @ TechBD",  text: "এই কোর্সটি আমার জীবন বদলে দিয়েছে। মাত্র ৬ মাসে চাকরি পেয়েছি।" },
    { name: "Nusrat Jahan", role: "Freelancer, Fiverr",          text: "অসাধারণ কোর্স! ইন্সট্রাক্টর খুব সুন্দরভাবে বুঝিয়েছেন। কমিউনিটি সাপোর্টও দারুণ।" },
    { name: "Karim Uddin",  role: "Student, BUET",               text: "লাইভ সেশনগুলো সবচেয়ে ভালো ছিল। সরাসরি প্রশ্ন করার সুযোগ পেতাম।" },
  ] as T3Review[],

  t3StoriesTitle: "সাফল্যের গল্প",
  t3Stories: [
    { name: "Sadia Islam", badge: "ফ্রিল্যান্সার থেকে সফল উদ্যোক্তা!", description: "কোর্স শেষ করে ৩ মাসে Fiverr-এ ৫টি প্রজেক্ট পেয়েছেন এবং নিজের ডিজিটাল এজেন্সি খুলেছেন।", image: "" },
    { name: "Rahim Mia",   badge: "চাকরি পেয়েছেন স্বপ্নের কোম্পানিতে!",  description: "কোর্স সম্পন্ন করার পরপরই Pathao-তে Backend Developer হিসেবে যোগ দিয়েছেন।",           image: "" },
  ] as T3SuccessStory[],

  t3VidGridTitle: "শিক্ষার্থীদের ভিডিও রিভিউ",
  t3VidGridItems: [
    { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  ] as T3VideoItem[],

  t3MessengerUrl: "https://m.me/skillkoro",
  t3Phone:        "+8801XXXXXXXXX",
  t3BrandName:    "Skillkoro",
  t3Tagline:      "শিখুন। বাড়ুন। সফল হন।",
  t3Copyright:    `© ${new Date().getFullYear()} Skillkoro. All rights reserved.`,

  t3FaqItems: [
    { question: "কোর্সটি কি বাংলায়?",         answer: "হ্যাঁ, সম্পূর্ণ কোর্সটি বাংলায় পরিচালিত হয়।" },
    { question: "কোর্সের মেয়াদ কত?",           answer: "কোর্সটি ৬ মাসের। লাইভ ক্লাস সপ্তাহে ৩ দিন হয় এবং রেকর্ডেড ভিডিও সবসময় দেখতে পারবেন।" },
    { question: "কোন পূর্ব অভিজ্ঞতা লাগবে?", answer: "না, একদম শূন্য থেকে শুরু করা যায়।" },
    { question: "পেমেন্ট কীভাবে করব?",         answer: "bKash, Nagad, Rocket, ডেবিট/ক্রেডিট কার্ড বা ব্যাংক ট্রান্সফারে পেমেন্ট করতে পারবেন।" },
  ] as FaqItem[],

  // ── Template 4 mock data ──────────────────────────────────────────────────

  // Hero extras
  t4HeroQuestion:   "আপনি কি Upwork-এ সফল ফ্রিল্যান্সার হতে চান?",
  t4HeroHeadline:   "Live Upwork\nFreelancing Course\nBatch 4",
  t4HeroSubHighlight: "লাইভ মেন্টরিং সহ সম্পূর্ণ A-Z গাইড",
  t4HeroCtaText:    "এখনই ভর্তি হন",
  t4HeroVideoUrl:   "https://www.youtube.com/embed/dQw4w9WgXcQ",

  // Live Session Card
  t4LiveSessionCard: {
    batchLabel:  "Batch 4 চলছে",
    title:       "Live Upwork Freelancing Course",
    description: "Complete A-Z course with live mentoring & job support",
    mentorLine1: "Instructor: Jahangir Alam",
    mentorLine2: "Top-Rated Upwork Freelancer ($50k+ earned)",
    features:    ["লাইভ ক্লাস + রেকর্ডেড ভিডিও", "১ বছর মেন্টরিং সাপোর্ট", "জব প্লেসমেন্ট গ্যারান্টি"],
    ctaText:     "এখনই ভর্তি হন",
  },

  // Student Progress
  t4StudentProgress: {
    preText: "আমাদের শিক্ষার্থীরা ইতিমধ্যে Upwork-এ কাজ শুরু করেছেন।",
    title:   "তাদের প্রথম ইনকামের স্ক্রিনশট দেখুন",
    images:  [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80",
      "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&q=80",
      "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=400&q=80",
    ],
  },

  // For Whom
  t4ForWhomSection: {
    title:          "কাদের জন্য এই কোর্স?",
    titleHighlight: "এই কোর্স",
    cards: [
      { icon: "🎓", title: "শিক্ষার্থী",      description: "যারা ক্যারিয়ার শুরু করতে চান" },
      { icon: "💼", title: "চাকরিজীবী",       description: "যারা সাইড ইনকাম চান" },
      { icon: "🏠", title: "গৃহিণী",           description: "যারা ঘরে বসে আয় করতে চান" },
      { icon: "🚀", title: "উদ্যোক্তা",        description: "যারা নিজের বিজনেস বাড়াতে চান" },
      { icon: "🌍", title: "প্রবাসী",           description: "যারা অনলাইনে ইনকাম বাড়াতে চান" },
    ] as T4ForWhomCard[],
    closingText: "আপনি যদি উপরের যেকোনো ক্যাটাগরিতে পড়েন, তাহলে এই কোর্স আপনার জন্যই।",
  },

  // Instructor Story
  t4InstructorStory: {
    title:          "আমার গল্প",
    titleHighlight: "গল্প",
    bio:            "আমি ২০১৮ সালে মাত্র $১০ দিয়ে Upwork যাত্রা শুরু করেছিলাম। প্রথম ৩ মাস কোনো কাজ পাইনি। কিন্তু হাল ছাড়িনি। সঠিক স্ট্র্যাটেজি শিখে আজ আমি Top-Rated Plus ফ্রিল্যান্সার এবং $৫০,০০০+ আয় করেছি। এই কোর্সে আমি আমার সেই পুরো যাত্রার অভিজ্ঞতা শেয়ার করব।",
    videoUrl:       "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },

  // Module Grid
  t4ModuleGrid: {
    title:          "কোর্সের বিষয়বস্তু",
    titleHighlight: "বিষয়বস্তু",
    modules: [
      { icon: "🎯", title: "Module 1: Upwork Profile Setup",    bullets: ["Profile optimization", "Portfolio তৈরি", "Proposal লেখা"] },
      { icon: "🔍", title: "Module 2: Job Winning Strategy",    bullets: ["Niche selection", "Pricing strategy", "Client communication"] },
      { icon: "💰", title: "Module 3: Proposal Mastery",        bullets: ["Cover letter writing", "Fixed vs hourly", "Bid analysis"] },
      { icon: "⚡", title: "Module 4: Client Retention",        bullets: ["Long-term contracts", "Review strategies", "Upselling"] },
      { icon: "📈", title: "Module 5: Scaling Your Business",   bullets: ["Agency building", "Outsourcing", "Passive income"] },
      { icon: "🌟", title: "Bonus: Real Project Workshop",      bullets: ["Live project", "Client mock calls", "Portfolio piece"], fullWidth: true },
    ] as T4Module[],
  },

  // Pricing extras
  t4PricingSection: {
    bonusLabel:    "EXCLUSIVE BONUS",
    bonusText:     "Free lifetime access to all future updates + 3 bonus modules",
    savingsText:   "আপনি সাশ্রয় করছেন ৳৫,০০০",
    ctaText:       "এখনই ভর্তি হন",
    paymentBadge1: "bKash / Nagad",
    paymentBadge2: "Rocket / ডাচ-বাংলা",
    paymentBadge3: "Card / Bank Transfer",
  },

  // Support
  t4SupportSection: {
    title:            "আর সাপোর্ট?",
    content:          "আমরা সর্বদা আপনার পাশে আছি। প্রতিদিন সকাল ১০টা থেকে রাত ১০টা পর্যন্ত ডেডিকেটেড সাপোর্ট টিম আপনার যেকোনো প্রশ্নের উত্তর দিতে প্রস্তুত। Facebook গ্রুপে ২৪/৭ কমিউনিটি সাপোর্ট পাবেন।",
    instructorImage:  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
  },

  // Countdown Banner
  t4CountdownBanner: {
    text:    "Early Bird Offer শেষ হতে আর বাকি",
    ctaText: "এখনই সুযোগ নিন",
  },

  // FAQ for T4
  t4FaqItems: [
    { question: "কোর্সটি কি সম্পূর্ণ বাংলায়?",    answer: "হ্যাঁ, সম্পূর্ণ কোর্সটি বাংলায় পরিচালিত হয়।" },
    { question: "Upwork-এ কাজ পেতে কতদিন লাগে?", answer: "সঠিক স্ট্র্যাটেজি অনুসরণ করলে ৩০-৬০ দিনের মধ্যে প্রথম কাজ পাওয়া সম্ভব।" },
    { question: "কোনো পূর্ব অভিজ্ঞতা দরকার?",    answer: "না, শূন্য থেকে শুরু করা যাবে। তবে ইন্টারনেট ব্যবহার জানলেই যথেষ্ট।" },
    { question: "পেমেন্ট কীভাবে করব?",             answer: "bKash, Nagad, Rocket, ক্রেডিট/ডেবিট কার্ড বা ব্যাংক ট্রান্সফারে পেমেন্ট করতে পারবেন।" },
  ] as FaqItem[],

  // Template 6 (Medical) mock data
  t6Credentials: [
    { icon: "users", label: "৩০০ জন সক্রিয় শিক্ষার্থী" },
    { icon: "video", label: "৯৩টি লাইভ ক্লাস" },
    { icon: "clock", label: "৯৩ ঘণ্টা+ কনটেন্ট" },
    { icon: "award", label: "Professional সার্টিফিকেট (ইন্টারন্যাশনাল)" },
  ],
  t6Stats: [
    { value: "৩০০+", label: "সক্রিয় শিক্ষার্থী" },
    { value: "৯৩টি", label: "লাইভ ক্লাস" },
    { value: "৯৩+", label: "এককমূর্ত লাইভ" },
    { value: "৫টি মডিউল", label: "সম্পূর্ণ কারিকুলাম" },
    { value: "Professional", label: "সার্টিফিকেট (ইন্টারন্যাশনাল)" },
  ],
  t6Comparison: [
    { feature: "অনলাইন প্যাকেজ", selfStudy: false, liveCourse: true },
    { feature: "৬৩টি লাইভ ক্লাস", selfStudy: false, liveCourse: true },
    { feature: "৪৫+ এককমূর্ত লাইভ অংশগ্রহণ", selfStudy: false, liveCourse: true },
    { feature: "Practice Class", selfStudy: false, liveCourse: true },
    { feature: "Extra Knowledge Classes", selfStudy: false, liveCourse: true },
    { feature: "বিশেষজ্ঞ প্রশিক্ষকদের থেকে শেখানো", selfStudy: false, liveCourse: true },
    { feature: "প্রশ্নোত্তর ও সমস্যা সমাধান", selfStudy: false, liveCourse: true },
  ],
  t6Organs: [
    { name: "Brain", icon: "" },
    { name: "Heart", icon: "" },
    { name: "Lungs", icon: "" },
    { name: "Liver", icon: "" },
    { name: "Kidneys", icon: "" },
    { name: "Stomach", icon: "" },
    { name: "Intestine", icon: "" },
    { name: "Pancreas", icon: "" },
    { name: "Spleen", icon: "" },
    { name: "Skin", icon: "" },
    { name: "Thyroid Gland", icon: "" },
  ],
  t6Instructor: {
    name:    "ডা. আল আমিন সূদা",
    title:   "প্রশিক্ষক",
    credentials: "যুক্তরাজ্যের পেশাদার স্বাস্থ্য বিশেষজ্ঞ",
    hospital: "হোমিও সেবা কেন্দ্র",
    photo:   "",
  },
  t6WhoFor: {
    title: "এই কোর্সে যা যা পাচ্ছেন",
    items: [
      "১৩৩+ এককমূর্ত কনটেন্ট",
      "৯৩টি লাইভ ক্লাস",
      "Practice Class",
      "Extra Knowledge Classes",
      "Structured Learning",
      "Revision & Discussion",
    ],
  },
  t6Pricing: {
    tiers: [
      { name: "ফি ফি", price: "৮৫,০০০", period: "এককালীন", features: ["ফি ভর্তি বিকল্প"], highlighted: false },
      { name: "মাসিক ফি", price: "১৫০০", period: "প্রতি মাস", features: ["মাসিক পেমেন্ট সুবিধা"], highlighted: false },
      { name: "বার্ষিক ফি", price: "৮৫,০০০", period: "১ বছর", features: ["বার্ষিক মূল্য"], highlighted: true },
    ],
  },
  t6Video: "",
  t6Testimonials: [
    { name: "শিক্ষার্থী ১", rating: 5, text: "Anatomy & Physiology কোর্সটি অসাধারণ!", photo: "" },
    { name: "শিক্ষার্থী ২", rating: 5, text: "Practice Class ও Revision সত্যিই সাহায্যকারী।", photo: "" },
  ],
};
