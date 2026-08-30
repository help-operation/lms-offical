"use client";

import { useEffect, useState, useTransition, Fragment, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Save,
  Loader2, Monitor, Smartphone, Eye, EyeOff,
} from "lucide-react";
import {
  createLiveCourseAction, updateLiveCourseAction, fetchTeachersAction, checkLiveCoursePathAction,
  toggleLiveCoursePublishAction, deleteLiveCourseAction, restoreLiveCourseAction,
  scheduleLiveCourseAction, unscheduleLiveCourseAction,
} from "@/features/live-courses/actions/live-courses.actions";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { validatePathFormat, type PathCheckResult } from "@/features/live-courses/path-validation";
import type { LiveCourse, UpsertLiveCourseDto, LiveCourseSection, LiveCourseTeacher } from "@/features/live-courses/api";
import { LiveCourseBatchesPanel } from "./LiveCourseBatchesPanel";
import { LiveBatchManagerPanel } from "./LiveBatchManagerPanel";
import { CurriculumBuilder } from "@/features/courses/curriculum/CurriculumBuilder";
import { liveCurriculumAdapter } from "./curriculum/live-curriculum-adapter";
import type { CourseModule } from "@/features/courses/api";
import { fetchLiveCourseModulesAction } from "./actions/live-course-curriculum.actions";
import { LiveCourseTemplate, resolveSectionOrder, type LiveCourseTemplateData } from "@repo/ui/live-course-template";
import type { StyleOverrides } from "@repo/ui/template-style-overrides";
import { InlineStyleEditor } from "./InlineStyleEditor";
import { MobilePreviewFrame } from "./MobilePreviewFrame";
import { LiveCourseTemplate2, type LiveCourseTemplate2Data } from "@repo/ui/live-course-template-2";
import { LiveCourseTemplate3, type LiveCourseTemplate3Data } from "@repo/ui/live-course-template-3";
import { LiveCourseTemplate4, type LiveCourseTemplate4Data } from "@repo/ui/live-course-template-4";
import { LiveCourseTemplate5 } from "@repo/ui/live-course-template-5";
import { LiveCourseTemplate6 } from "@repo/ui/live-course-template-6";
import { TEMPLATES } from "./templates";
import { toast } from "@repo/ui/sonner";
import type {
  PaymentLogo, BatchInfo, CurriculumItem, Tool, WhyItem, Instructor,
  WhatYouGetItem, VideoItem, Testimonial, ValueItem, FaqItem, CompRow,
  VideoTabItem, PcConfig,
} from "./live-course-editor.types";
import { MOCK } from "./live-course-editor.constants";
import { toSlug, inputCls, Lbl, Panel, AddBtn, DelBtn, type PanelReorder } from "./LiveCourseEditorUI";
import { ImagePickerField } from "@/shared/components/ImagePickerField";
import {
  PaymentLogosPanel, BatchPanel, CurriculumPanel, ToolsPanel, WhyPanel,
  InstructorsPanel, WhatYouGetPanel, VideosPanel, TestimonialsPanel,
  ValuePanel, FaqPanel, VideoTabsPanel,
  T3WhyJoinPanel, T3FeaturesGridPanel, T3BonusChecklistPanel,
  T3SupportLevelsPanel, T3ImageSliderPanel, T3TextReviewsPanel,
  T3SuccessStoriesPanel, T3VideoGridPanel,
  T4LiveSessionCardPanel, T4StudentProgressPanel, T4ForWhomPanel,
  T4InstructorStoryPanel, T4ModuleGridPanel, T4PricingSectionPanel,
  T4SupportSectionPanel, T4CountdownBannerPanel,
  BundleCoursesPanel,
} from "./LiveCourseEditorSections";
import type { T3FeatureItem, T3Level, T3Review, T3SuccessStory, T3VideoItem, T4ForWhomCard, T4Module } from "./live-course-editor.types";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  mode: "create" | "edit";
  templateId: string;
  course?: LiveCourse;
}


// Template 1 (Mastery) page sections — id, sidebar label, and the on-page
// heading default (omitted for sections that have no editable heading, or whose
// heading is edited elsewhere e.g. Value Breakdown → Value panel).
const TEMPLATE1_SECTIONS: Array<{ id: string; label: string; defaultHeading?: string }> = [
  { id: "hero",        label: "Hero" },
  { id: "batch",       label: "Batch Info Cards" },
  { id: "curriculum",  label: "Curriculum",            defaultHeading: "কোর্স কারিকুলাম" },
  { id: "tools",       label: "Tools / Technologies",  defaultHeading: "যেসব টুলস ও টেকনোলাজি শিখবেন" },
  { id: "why",         label: "Why Different",         defaultHeading: "Why This Course is Different?" },
  { id: "stats",       label: "Stats / Social Proof" },
  { id: "instructors", label: "Instructors",           defaultHeading: "Our Professional Instructors" },
  { id: "whatYouGet",  label: "What You Get",          defaultHeading: "কি কি পাচ্ছেন এই কোর্সে" },
  { id: "videos",      label: "Videos & Testimonials", defaultHeading: "যারা আমাদের উপর আস্থা রেখেছেন – তাদের কিছু কথা" },
  { id: "value",       label: "Value Breakdown" },
  { id: "urgencyCta",  label: "Urgency CTA (Sticky Bar)" },
  { id: "enrollment",  label: "Enrollment Form" },
];

// Template 2 (Sales) page sections. Sections whose heading lives in their own
// data (ctaBanner/certificate/urgencyCta titles) get no defaultHeading here —
// they are reorder-only and keep editing their title in their own fields.
const TEMPLATE2_SECTIONS: Array<{ id: string; label: string; defaultHeading?: string }> = [
  { id: "hero",         label: "Hero" },
  { id: "comparison",   label: "Comparison Table" },
  { id: "curriculum",   label: "Curriculum (Masterplan)", defaultHeading: "এই কোর্সের মেইন ফোকাস পয়েন্ট" },
  { id: "instructors",  label: "Instructors",             defaultHeading: "ইন্ডাস্ট্রি এক্সপার্ট মেন্টর" },
  { id: "why",          label: "Why / Features",          defaultHeading: "যে ফিচারগুলো এই ডিপ্লোমাকে বাংলাদেশের সেরা করেছে" },
  { id: "ctaBanner",    label: "CTA Banner (Red Strip)" },
  { id: "certificate",  label: "Certificate" },
  { id: "videoTabs",    label: "Video Tabs",              defaultHeading: "ভিতর আগেই দেখুন প্রিমিয়াম ক্লাসের ঝলক" },
  { id: "pcReqs",       label: "PC Requirements",         defaultHeading: "আপনার পিসি কি প্রস্তুত এই জার্নির জন্য?" },
  { id: "testimonials", label: "Testimonials",            defaultHeading: "আগের ব্যাচের রিয়েল স্টেরি" },
  { id: "faq",          label: "FAQ",                     defaultHeading: "আমাদের নিয়ে আপনার জিজ্ঞাসা" },
  { id: "urgencyCta",   label: "Urgency CTA (Bottom)" },
  { id: "enrollment",   label: "Enrollment Form" },
];

// Template 3 (Membership) page sections. Only the two hardcoded headings
// (Why Join, FAQ) get a defaultHeading override — the rest edit their title in
// their own panel fields and are reorder-only.
const TEMPLATE3_SECTIONS: Array<{ id: string; label: string; defaultHeading?: string }> = [
  { id: "marquee",        label: "Marquee Ticker" },
  { id: "hero",           label: "Hero & Announcement" },
  { id: "stats",          label: "Stats Bar" },
  { id: "blueprint",      label: "Blueprint Showcase" },
  { id: "whyJoin",        label: "Why Join Grid",       defaultHeading: "কেন আমাদের সাথে যোগ দেবেন?" },
  { id: "featuresGrid",   label: "Features Grid" },
  { id: "bonusChecklist", label: "Bonus Checklist" },
  { id: "challenge",      label: "Challenge Card" },
  { id: "supportLevels",  label: "Level Roadmap" },
  { id: "salesUpdate",    label: "Sales Update Slider" },
  { id: "community",      label: "Community Section" },
  { id: "textReviews",    label: "Text Reviews Slider" },
  { id: "successStories", label: "Success Stories" },
  { id: "videoGrid",      label: "Video Grid" },
  { id: "faq",            label: "FAQ",                 defaultHeading: "সচরাচর জিজ্ঞাসা" },
  { id: "enrollment",     label: "Enrollment Form" },
  { id: "footer",         label: "Footer Branding" },
];

// Template 4 (Nexemy) page sections. Hardcoded headings (curriculum, what-you-get,
// FAQ) get overrides; the rest edit their title in their own panel fields.
const TEMPLATE4_SECTIONS: Array<{ id: string; label: string; defaultHeading?: string }> = [
  { id: "hero",            label: "Hero" },
  { id: "curriculum",      label: "Curriculum",       defaultHeading: "আপনি কী কী শিখবেন" },
  { id: "studentProgress", label: "Student Progress" },
  { id: "forWhom",         label: "For Whom" },
  { id: "instructorStory", label: "Instructor Story" },
  { id: "moduleGrid",      label: "Module Grid" },
  { id: "whatYouGet",      label: "What You Get",      defaultHeading: "আপনি পাবেন" },
  { id: "pricing",         label: "Pricing" },
  { id: "support",         label: "Support Section" },
  { id: "countdown",       label: "Countdown Banner" },
  { id: "faq",             label: "FAQ",              defaultHeading: "সাধারণ প্রশ্নোত্তর" },
  { id: "enrollment",      label: "Enrollment Form" },
];

// Template 5 (Masterclass) page sections. The Section-helper titles that are
// hardcoded (tools, demo, instructors, what-you-get, curriculum, FAQ) get
// overrides; the rest edit their title in their own fields.
const TEMPLATE5_SECTIONS: Array<{ id: string; label: string; defaultHeading?: string }> = [
  { id: "countdown",   label: "Countdown Strip" },
  { id: "hero",        label: "Hero" },
  { id: "tools",       label: "Tools",            defaultHeading: "যেসব টুলস ও টেকনোলোজি শিখবেন" },
  { id: "demoVideo",   label: "Demo Video",       defaultHeading: "ডেমো ক্লাস" },
  { id: "instructors", label: "Instructors",      defaultHeading: "Meet Our Lead Instructors" },
  { id: "about",       label: "About / Outcomes" },
  { id: "whatYouGet",  label: "What You Get",     defaultHeading: "এই কোর্সে যা যা পাচ্ছেন" },
  { id: "whoFor",      label: "Who Is This For" },
  { id: "projects",    label: "Real-life Projects" },
  { id: "curriculum",  label: "Curriculum",       defaultHeading: "লাইভ ক্লাস" },
  { id: "roadmap",     label: "Roadmap Timeline" },
  { id: "certificate", label: "Certificate" },
  { id: "faq",         label: "FAQ",              defaultHeading: "সচরাচর জিজ্ঞাসা" },
  { id: "enrollment",  label: "Enrollment Form" },
];

const TEMPLATE6_SECTIONS: Array<{ id: string; label: string; defaultHeading?: string }> = [
  { id: "hero",           label: "Hero" },
  { id: "pricingCard",    label: "Pricing Card" },
  { id: "statsBar",       label: "Stats Bar" },
  { id: "comparison",     label: "Comparison Table" },
  { id: "organGrid",      label: "Organ Grid" },
  { id: "curriculum",     label: "Curriculum",        defaultHeading: "কোর্স কারিকুলাম" },
  { id: "instructor",     label: "Instructor" },
  { id: "whoFor",         label: "Who Is This For" },
  { id: "valueBreakdown", label: "Value / Pricing" },
  { id: "video",          label: "Intro Video" },
  { id: "faq",            label: "FAQ",               defaultHeading: "সচরাচর জিজ্ঞাসা" },
  { id: "testimonials",   label: "Testimonials" },
  { id: "enrollment",     label: "Enrollment Form" },
];

// ─── Main Editor ──────────────────────────────────────────────────────────────

export function LiveCourseEditor({ mode, templateId, course }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError]           = useState<string | null>(null);
  const [slugEdited, setSlugEdited] = useState(false);
  const [showPreview, setShowPreview]     = useState(true);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [activeTab, setActiveTab]         = useState<"content" | "batches" | "curriculum" | "classhub">("content");
  const [curriculumModules, setCurriculumModules] = useState<import("./api").LiveCourseModule[] | null>(null);
  const [curriculumLoading, setCurriculumLoading] = useState(false);

  const isMock = mode === "create" && !course;

  // Determine which template we are editing
  const tplDef      = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0]!;
  const dbTemplate  = course?.template ?? tplDef.dbTemplate;
  const isTemplate2 = dbTemplate === "2";
  const isTemplate3 = dbTemplate === "3";
  const isTemplate4 = dbTemplate === "4";
  const isTemplate5 = dbTemplate === "5";
  const isTemplate6 = dbTemplate === "6";
  const isTemplate1 = !isTemplate2 && !isTemplate3 && !isTemplate4 && !isTemplate5 && !isTemplate6;
  // Lesson-icon picker only applies to templates that render per-lesson icon rows.
  const usesLessonIcon = isTemplate2 || isTemplate1;

  // ── Bundle ──────────────────────────────────────────────────────────────────
  const [courseType,      setCourseType]      = useState<'live' | 'bundle'>((course as any)?.courseType ?? 'live');
  const [bundledCourseIds, setBundledCourseIds] = useState<number[]>(
    (course as any)?.bundledCourses?.map((c: { id: number }) => c.id) ?? []
  );

  // ── Basic ───────────────────────────────────────────────────────────────────
  const [title,           setTitle]           = useState(course?.title           ?? (isMock ? MOCK.title           : ""));
  const [slug,            setSlug]            = useState(course?.slug            ?? (isMock ? MOCK.slug            : ""));
  const [price,           setPrice]           = useState(course?.price           ?? (isMock ? MOCK.price           : ""));
  const [originalPrice,   setOriginalPrice]   = useState(course?.originalPrice   ?? (isMock ? MOCK.originalPrice   : ""));
  const [hasSubscription, setHasSubscription] = useState(course?.hasSubscription ?? false);
  const [monthlyPrice,    setMonthlyPrice]    = useState(course?.monthlyPrice    ?? "");
  const [totalValue,      setTotalValue]      = useState(course?.totalValue      ?? (isMock ? MOCK.totalValue      : ""));
  const [totalLiveClasses, setTotalLiveClasses] = useState(course?.totalLiveClasses ?? (isMock ? MOCK.totalLiveClasses : ""));
  const [totalModules,     setTotalModules]     = useState(course?.totalModules ?? "");
  const [countdownEnd,    setCountdownEnd]    = useState(
    course?.countdownEnd
      ? new Date(course.countdownEnd).toISOString().slice(0, 16)
      : isMock ? MOCK.countdownEnd : ""
  );

  useEffect(() => {
    if (!slugEdited && mode === "create") setSlug(toSlug(title));
  }, [title, slugEdited, mode]);

  // Curriculum now lives in its own always-visible column (beside the content
  // tabs), so load it on mount rather than lazily on a tab click.
  useEffect(() => {
    if (mode !== "edit" || !course?.id || curriculumModules !== null) return;
    setCurriculumLoading(true);
    fetchLiveCourseModulesAction(course.id)
      .then((res) => setCurriculumModules(res.data ?? []))
      .finally(() => setCurriculumLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, course?.id]);

  // ── Live URL-path validation (format/reserved instantly, uniqueness debounced) ─
  const [pathCheck, setPathCheck] = useState<PathCheckResult | null>(
    mode === "edit" && course?.slug ? { status: "available", message: "Available" } : null,
  );
  useEffect(() => {
    const formatError = validatePathFormat(slug);
    if (formatError) { setPathCheck(formatError); return; }
    // In edit mode, if slug hasn't changed from the original it's already valid
    if (mode === "edit" && slug.trim() === (course?.slug ?? "").trim()) {
      setPathCheck({ status: "available", message: "Available" });
      return;
    }
    setPathCheck({ status: "checking", message: "Checking availability…" });
    const t = setTimeout(async () => {
      setPathCheck(await checkLiveCoursePathAction(slug.trim(), course?.id));
    }, 400);
    return () => clearTimeout(t);
  }, [slug, course?.id, course?.slug, mode]);
  const pathOk = pathCheck?.status === "available";

  // ── Hero ────────────────────────────────────────────────────────────────────
  const [heroBadge,          setHeroBadge]          = useState(course?.hero?.badgeText         ?? (isMock ? MOCK.heroBadge        : ""));
  const [heroSubtitle,       setHeroSubtitle]       = useState(course?.hero?.subtitle          ?? (isMock ? MOCK.heroSubtitle     : ""));
  const [heroBanner,         setHeroBanner]         = useState(course?.hero?.bannerImage       ?? (isMock ? MOCK.heroBanner       : ""));
  const [t6AnatomicalImage, setT6AnatomicalImage] = useState((course?.hero as any)?.anatomicalImage ?? "");
  // T2/T4 hero uses `heroBanner` for the YouTube video URL, so those templates need their own
  // separate image field — used only for the listing-card thumbnail (the hero itself shows the video).
  const [heroBannerImage,    setHeroBannerImage]    = useState(course?.hero?.bannerImage       ?? (isMock && (isTemplate2 || isTemplate4) ? MOCK.heroBanner : ""));
  const [heroRating,         setHeroRating]         = useState(String(course?.hero?.rating      ?? (isMock ? MOCK.heroRating       : "")));
  const [heroRatingCount,    setHeroRatingCount]    = useState(String(course?.hero?.ratingCount ?? (isMock ? MOCK.heroRatingCount  : "")));
  const [heroCtaText,        setHeroCtaText]        = useState(course?.hero?.ctaText           ?? (isMock ? MOCK.heroCtaText      : ""));
  const [heroSecondaryBtn,   setHeroSecondaryBtn]   = useState((course?.hero as any)?.secondaryCtaText ?? (isMock && isTemplate2 ? MOCK.t2HeroSecondaryBtn : ""));
  const [heroPromoText,      setHeroPromoText]      = useState(course?.hero?.promoText         ?? (isMock ? MOCK.heroPromoText    : ""));
  const [heroStudentCount,   setHeroStudentCount]   = useState(course?.hero?.studentCountText  ?? (isMock ? MOCK.heroStudentCount : ""));
  // Template 2 split headline
  const [heroHeadline,       setHeroHeadline]       = useState((course?.hero as any)?.headline          ?? (isMock && isTemplate2 ? MOCK.t2HeroHeadline : ""));
  const [heroHeadlineHl,     setHeroHeadlineHl]     = useState((course?.hero as any)?.headlineHighlight ?? (isMock && isTemplate2 ? MOCK.t2HeroHeadlineHl : ""));
  const [heroHeadlineAfter,  setHeroHeadlineAfter]  = useState((course?.hero as any)?.headlineAfter     ?? (isMock && isTemplate2 ? MOCK.t2HeroHeadlineAfter : ""));

  // ── Sections ────────────────────────────────────────────────────────────────
  const [paymentLogos, setPaymentLogos] = useState<PaymentLogo[]>(
    course?.paymentLogos ?? (isMock ? MOCK.paymentLogos : [])
  );
  const [batchInfo, setBatchInfo] = useState<BatchInfo>(
    course?.batchInfo ?? (isMock ? MOCK.batchInfo : {})
  );
  const [curriculum, setCurriculum] = useState<CurriculumItem[]>(
    course?.curriculum
      ? course.curriculum.map((c) => ({ title: c.title, lessons: c.lessons ?? [] }))
      : isMock ? MOCK.curriculum : []
  );
  const [tools,      setTools]      = useState<Tool[]>(course?.tools         ?? (isMock ? MOCK.tools      : []));
  const [whyItems,   setWhyItems]   = useState<WhyItem[]>(course?.whyDifferent ?? (isMock ? MOCK.whyItems   : []));

  const [statsStudents,   setStatsStudents]   = useState(course?.stats?.studentsCount  ?? (isMock ? MOCK.statsStudents   : ""));
  const [statsRatings,    setStatsRatings]    = useState(course?.stats?.ratingsCount   ?? (isMock ? MOCK.statsRatings    : ""));
  const [statsCompletion, setStatsCompletion] = useState(course?.stats?.completionRate ?? (isMock ? MOCK.statsCompletion : ""));
  const [statsExtra,      setStatsExtra]      = useState(course?.stats?.extra          ?? (isMock ? MOCK.statsExtra      : ""));
  const [statsLabels,     setStatsLabels]     = useState<[string, string, string, string]>(
    course?.stats?.labels ?? (isMock ? MOCK.statsLabels : ["", "", "", ""])
  );

  const [instructors,  setInstructors]  = useState<Instructor[]>(course?.instructors  ?? (isMock ? MOCK.instructors  : []));
  const [teachers, setTeachers] = useState<LiveCourseTeacher[] | undefined>(undefined);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const loadTeachers = async () => {
    if (teachers || teachersLoading) return;
    setTeachersLoading(true);
    const res = await fetchTeachersAction();
    setTeachers(res.data ?? []);
    setTeachersLoading(false);
  };
  const [whatYouGet,   setWhatYouGet]   = useState<WhatYouGetItem[]>(course?.whatYouGet   ?? (isMock ? MOCK.whatYouGet   : []));
  const [videos,       setVideos]       = useState<VideoItem[]>(course?.videos         ?? (isMock ? MOCK.videos       : []));
  const [testimonials, setTestimonials] = useState<Testimonial[]>(course?.testimonials  ?? (isMock ? MOCK.testimonials  : []));
  const [valueItems,   setValueItems]   = useState<ValueItem[]>(course?.valueItems      ?? (isMock ? MOCK.valueItems   : []));

  // ── Template 2 state ────────────────────────────────────────────────────────
  const t2mock = isMock && isTemplate2;
  const [faqItems,     setFaqItems]     = useState<FaqItem[]>((course as any)?.faq ?? (t2mock ? MOCK.t2FaqItems : isMock && isTemplate3 ? MOCK.t3FaqItems : isMock && isTemplate4 ? MOCK.t4FaqItems : isMock && isTemplate6 ? MOCK.t4FaqItems : []));
  const [compCol1,     setCompCol1]     = useState<string>((course as any)?.comparisonTable?.col1Label ?? (t2mock ? MOCK.t2Comparison.col1Label : ""));
  const [compCol2,     setCompCol2]     = useState<string>((course as any)?.comparisonTable?.col2Label ?? (t2mock ? MOCK.t2Comparison.col2Label : ""));
  const [compRows,     setCompRows]     = useState<CompRow[]>((course as any)?.comparisonTable?.rows ?? (t2mock ? MOCK.t2Comparison.rows : []));
  const [videoTabs,    setVideoTabs]    = useState<VideoTabItem[]>((course as any)?.videoTabs ?? (t2mock ? MOCK.t2VideoTabs : []));
  const [pcBasic,      setPcBasic]      = useState<PcConfig>((course as any)?.pcRequirements?.basic ?? (t2mock ? MOCK.t2PcBasic : {}));
  const [pcPro,        setPcPro]        = useState<PcConfig>((course as any)?.pcRequirements?.pro ?? (t2mock ? MOCK.t2PcPro : {}));
  const [pcInternet,   setPcInternet]   = useState<string>((course as any)?.pcRequirements?.internet ?? (t2mock ? MOCK.t2PcInternet : ""));
  const [ctaBLabel,    setCtaBLabel]    = useState<string>((course as any)?.ctaBanner?.label ?? (t2mock ? MOCK.t2CtaBanner.label : ""));
  const [ctaBTitle,    setCtaBTitle]    = useState<string>((course as any)?.ctaBanner?.title ?? (t2mock ? MOCK.t2CtaBanner.title : ""));
  const [ctaBPrice,    setCtaBPrice]    = useState<string>((course as any)?.ctaBanner?.price ?? (t2mock ? MOCK.t2CtaBanner.price : ""));
  const [ctaBOrigPrice,setCtaBOrigPrice]= useState<string>((course as any)?.ctaBanner?.originalPrice ?? (t2mock ? MOCK.t2CtaBanner.originalPrice : ""));
  const [ctaBBtn,      setCtaBBtn]      = useState<string>((course as any)?.ctaBanner?.buttonText ?? (t2mock ? MOCK.t2CtaBanner.buttonText : ""));
  const [ctaBInst1,    setCtaBInst1]    = useState<string>((course as any)?.ctaBanner?.installment1 ?? (t2mock ? MOCK.t2CtaBanner.installment1 : ""));
  const [ctaBInst2,    setCtaBInst2]    = useState<string>((course as any)?.ctaBanner?.installment2 ?? (t2mock ? MOCK.t2CtaBanner.installment2 : ""));
  const [certTitle,    setCertTitle]    = useState<string>((course as any)?.certificate?.title ?? (t2mock ? MOCK.t2Certificate.title : ""));
  const [certHl,       setCertHl]       = useState<string>((course as any)?.certificate?.highlight ?? (t2mock ? MOCK.t2Certificate.highlight : ""));
  const [certDesc,     setCertDesc]     = useState<string>((course as any)?.certificate?.description ?? (t2mock ? MOCK.t2Certificate.description : ""));
  const [certImg,      setCertImg]      = useState<string>((course as any)?.certificate?.image ?? (t2mock ? MOCK.t2Certificate.image : ""));
  const [certFounder,  setCertFounder]  = useState<string>((course as any)?.certificate?.founderName ?? (t2mock ? MOCK.t2Certificate.founderName : ""));
  const [certRole,     setCertRole]     = useState<string>((course as any)?.certificate?.founderRole ?? (t2mock ? MOCK.t2Certificate.founderRole : ""));
  const [urgLabel,     setUrgLabel]     = useState<string>((course as any)?.urgencyCta?.batchLabel ?? (t2mock ? MOCK.t2UrgencyCta.batchLabel : ""));
  const [urgTitle,     setUrgTitle]     = useState<string>((course as any)?.urgencyCta?.title ?? (t2mock ? MOCK.t2UrgencyCta.title : ""));
  const [urgHl,        setUrgHl]        = useState<string>((course as any)?.urgencyCta?.highlight ?? (t2mock ? MOCK.t2UrgencyCta.highlight : ""));
  const [urgSub,       setUrgSub]       = useState<string>((course as any)?.urgencyCta?.subtitle ?? (t2mock ? MOCK.t2UrgencyCta.subtitle : ""));
  const [urgBtn,       setUrgBtn]       = useState<string>((course as any)?.urgencyCta?.buttonText ?? (t2mock ? MOCK.t2UrgencyCta.buttonText : ""));
  const [urgWa,        setUrgWa]        = useState<string>((course as any)?.urgencyCta?.whatsapp ?? (t2mock ? MOCK.t2UrgencyCta.whatsapp : ""));

  // ── Template 3 state ────────────────────────────────────────────────────────
  // m3: use mock demo data when creating a new T3 course (preview pre-populated)
  const m3 = isMock && isTemplate3;

  const [t3Marquee,       setT3Marquee]       = useState<string>((course as any)?.marqueeText                    ?? (m3 ? MOCK.t3Marquee        : ""));
  const [t3AnnounceText,  setT3AnnounceText]  = useState<string>((course as any)?.announcementBar?.text          ?? (m3 ? MOCK.t3AnnounceText   : ""));
  const [t3AnnounceBtn,   setT3AnnounceBtn]   = useState<string>((course as any)?.announcementBar?.ctaText       ?? (m3 ? MOCK.t3AnnounceBtn    : ""));
  const [t3AnnounceAnchor,setT3AnnounceAnchor]= useState<string>((course as any)?.announcementBar?.ctaAnchor     ?? (m3 ? MOCK.t3AnnounceAnchor : ""));
  const [t3BlueprintTitle,setT3BlueprintTitle]= useState<string>((course as any)?.blueprintSection?.title        ?? (m3 ? MOCK.t3BlueprintTitle : ""));
  const [t3BlueprintSub,  setT3BlueprintSub]  = useState<string>((course as any)?.blueprintSection?.subtitle     ?? (m3 ? MOCK.t3BlueprintSub   : ""));
  const [t3BlueprintImg,  setT3BlueprintImg]  = useState<string>((course as any)?.blueprintSection?.image        ?? (m3 ? MOCK.t3BlueprintImg   : ""));
  const [t3WhyItems,      setT3WhyItems]      = useState<string[]>((course as any)?.whyJoinItems                 ?? (m3 ? MOCK.t3WhyItems        : []));
  const [t3FeaturesTitle, setT3FeaturesTitle] = useState<string>((course as any)?.featuresGrid?.title            ?? (m3 ? MOCK.t3FeaturesTitle  : ""));
  const [t3FeaturesSub,   setT3FeaturesSub]   = useState<string>((course as any)?.featuresGrid?.subtitle         ?? (m3 ? MOCK.t3FeaturesSub    : ""));
  const [t3FeatureItems,  setT3FeatureItems]  = useState<T3FeatureItem[]>((course as any)?.featuresGrid?.items   ?? (m3 ? MOCK.t3FeatureItems   : []));
  const [t3BonusTitle,    setT3BonusTitle]    = useState<string>((course as any)?.bonusChecklist?.title          ?? (m3 ? MOCK.t3BonusTitle     : ""));
  const [t3BonusItems,    setT3BonusItems]    = useState<string[]>((course as any)?.bonusChecklist?.items        ?? (m3 ? MOCK.t3BonusItems     : []));
  const [t3ChallengeTitle,setT3ChallengeTitle]= useState<string>((course as any)?.challengeSection?.title        ?? (m3 ? MOCK.t3ChallengeTitle : ""));
  const [t3ChallengeMonth,setT3ChallengeMonth]= useState<string>((course as any)?.challengeSection?.monthCount   ?? (m3 ? MOCK.t3ChallengeMonth : ""));
  const [t3ChallengeDesc, setT3ChallengeDesc] = useState<string>((course as any)?.challengeSection?.description  ?? (m3 ? MOCK.t3ChallengeDesc  : ""));
  const [t3ChallengeLink, setT3ChallengeLink] = useState<string>((course as any)?.challengeSection?.linkText     ?? (m3 ? MOCK.t3ChallengeLink  : ""));
  const [t3LevelsTitle,   setT3LevelsTitle]   = useState<string>((course as any)?.supportLevels?.title           ?? (m3 ? MOCK.t3LevelsTitle    : ""));
  const [t3LevelsSub,     setT3LevelsSub]     = useState<string>((course as any)?.supportLevels?.subtitle        ?? (m3 ? MOCK.t3LevelsSub      : ""));
  const [t3Levels,        setT3Levels]        = useState<T3Level[]>((course as any)?.supportLevels?.levels       ?? (m3 ? MOCK.t3Levels         : []));
  const [t3SalesTitle,    setT3SalesTitle]    = useState<string>((course as any)?.salesUpdateSlider?.title       ?? (m3 ? MOCK.t3SalesTitle     : ""));
  const [t3SalesSub,      setT3SalesSub]      = useState<string>((course as any)?.salesUpdateSlider?.subtitle    ?? (m3 ? MOCK.t3SalesSub       : ""));
  const [t3SalesImages,   setT3SalesImages]   = useState<string[]>((course as any)?.salesUpdateSlider?.images    ?? (m3 ? MOCK.t3SalesImages    : []));
  const [t3CommTitle,     setT3CommTitle]     = useState<string>((course as any)?.communitySection?.title        ?? (m3 ? MOCK.t3CommTitle      : ""));
  const [t3CommSub,       setT3CommSub]       = useState<string>((course as any)?.communitySection?.subtitle     ?? (m3 ? MOCK.t3CommSub        : ""));
  const [t3CommCaption,   setT3CommCaption]   = useState<string>((course as any)?.communitySection?.caption      ?? (m3 ? MOCK.t3CommCaption    : ""));
  const [t3CommImages,    setT3CommImages]    = useState<string[]>((course as any)?.communitySection?.images     ?? (m3 ? MOCK.t3CommImages     : []));
  const [t3ReviewsTitle,  setT3ReviewsTitle]  = useState<string>((course as any)?.textReviewsSlider?.title       ?? (m3 ? MOCK.t3ReviewsTitle   : ""));
  const [t3Reviews,       setT3Reviews]       = useState<T3Review[]>((course as any)?.textReviewsSlider?.reviews ?? (m3 ? MOCK.t3Reviews        : []));
  const [t3StoriesTitle,  setT3StoriesTitle]  = useState<string>((course as any)?.successStories?.title          ?? (m3 ? MOCK.t3StoriesTitle   : ""));
  const [t3Stories,       setT3Stories]       = useState<T3SuccessStory[]>((course as any)?.successStories?.stories ?? (m3 ? MOCK.t3Stories     : []));
  const [t3VidGridTitle,  setT3VidGridTitle]  = useState<string>((course as any)?.videoGrid?.title               ?? (m3 ? MOCK.t3VidGridTitle   : ""));
  const [t3VidGridItems,  setT3VidGridItems]  = useState<T3VideoItem[]>((course as any)?.videoGrid?.videos       ?? (m3 ? MOCK.t3VidGridItems   : []));
  const [t3MessengerUrl,  setT3MessengerUrl]  = useState<string>((course as any)?.faqContactButtons?.messengerUrl ?? (m3 ? MOCK.t3MessengerUrl  : ""));
  const [t3Phone,         setT3Phone]         = useState<string>((course as any)?.faqContactButtons?.phone       ?? (m3 ? MOCK.t3Phone          : ""));
  const [t3BrandName,     setT3BrandName]     = useState<string>((course as any)?.footerBranding?.brandName      ?? (m3 ? MOCK.t3BrandName      : ""));
  const [t3Tagline,       setT3Tagline]       = useState<string>((course as any)?.footerBranding?.tagline        ?? (m3 ? MOCK.t3Tagline        : ""));
  const [t3Copyright,     setT3Copyright]     = useState<string>((course as any)?.footerBranding?.copyright      ?? (m3 ? MOCK.t3Copyright      : ""));

  // ── Template 4 state ────────────────────────────────────────────────────────
  // m4: use mock demo data when creating a new T4 course
  const m4 = isMock && isTemplate4;

  const [t4HeroQuestion,    setT4HeroQuestion]    = useState<string>((course as any)?.hero?.questionText           ?? (m4 ? MOCK.t4HeroQuestion    : ""));
  const [t4LiveSessionCard, setT4LiveSessionCard] = useState<{ batchLabel?: string; title?: string; description?: string; mentorLine1?: string; mentorLine2?: string; features?: string[]; ctaText?: string }>(
    (course as any)?.t4LiveSessionCard ?? (m4 ? MOCK.t4LiveSessionCard : {})
  );
  const [t4StudentProgress, setT4StudentProgress] = useState<{ preText?: string; title?: string; images?: string[] }>(
    (course as any)?.t4StudentProgress ?? (m4 ? MOCK.t4StudentProgress : {})
  );
  const [t4ForWhomSection,  setT4ForWhomSection]  = useState<{ title?: string; titleHighlight?: string; cards?: T4ForWhomCard[]; closingText?: string }>(
    (course as any)?.t4ForWhomSection ?? (m4 ? MOCK.t4ForWhomSection : {})
  );
  const [t4InstructorStory, setT4InstructorStory] = useState<{ title?: string; titleHighlight?: string; bio?: string; videoUrl?: string }>(
    (course as any)?.t4InstructorStory ?? (m4 ? MOCK.t4InstructorStory : {})
  );
  const [t4ModuleGrid,      setT4ModuleGrid]      = useState<{ title?: string; titleHighlight?: string; modules?: T4Module[] }>(
    (course as any)?.t4ModuleGrid ?? (m4 ? MOCK.t4ModuleGrid : {})
  );
  const [t4PricingSection,  setT4PricingSection]  = useState<{ bonusLabel?: string; bonusText?: string; savingsText?: string; ctaText?: string; paymentBadge1?: string; paymentBadge2?: string; paymentBadge3?: string }>(
    (course as any)?.t4PricingSection ?? (m4 ? MOCK.t4PricingSection : {})
  );
  const [t4SupportSection,  setT4SupportSection]  = useState<{ title?: string; content?: string; instructorImage?: string }>(
    (course as any)?.t4SupportSection ?? (m4 ? MOCK.t4SupportSection : {})
  );
  const [t4CountdownBanner, setT4CountdownBanner] = useState<{ text?: string; ctaText?: string }>(
    (course as any)?.t4CountdownBanner ?? (m4 ? MOCK.t4CountdownBanner : {})
  );

  // ── Template 5 ────────────────────────────────────────────────────────────────
  const [t5StatCards, setT5StatCards] = useState<{ icon?: string; value: string; label: string }[]>(
    (course as any)?.t5StatCards ?? []
  );
  const [t5WhoFor, setT5WhoFor] = useState<{ title?: string; items?: string[]; ctaText?: string; ctaUrl?: string }>(
    (course as any)?.t5WhoFor ?? {}
  );
  const [t5RealProjects, setT5RealProjects] = useState<{ title?: string; items?: string[] }>(
    (course as any)?.t5RealProjects ?? {}
  );
  const [t5Roadmap, setT5Roadmap] = useState<{ title?: string; steps?: { title: string; description?: string }[] }>(
    (course as any)?.t5Roadmap ?? {}
  );

  // ── Template 6 (Medical) ────────────────────────────────────────────────────
  const m6 = isMock && isTemplate6;
  const [t6Credentials, setT6Credentials] = useState<Array<{ icon: string; label: string }>>(
    (course as any)?.t6Credentials ?? (m6 ? MOCK.t6Credentials : [])
  );
  const [t6Stats, setT6Stats] = useState<Array<{ value: string; label: string }>>(
    (course as any)?.t6Stats ?? (m6 ? MOCK.t6Stats : [])
  );
  const [t6Comparison, setT6Comparison] = useState<Array<{ feature: string; selfStudy: boolean; liveCourse: boolean }>>(
    (course as any)?.t6Comparison ?? (m6 ? MOCK.t6Comparison : [])
  );
  const [t6Organs, setT6Organs] = useState<Array<{ name: string; icon?: string }>>(
    (course as any)?.t6Organs ?? (m6 ? MOCK.t6Organs : [])
  );
  const [t6Instructor, setT6Instructor] = useState<{ name?: string; title?: string; credentials?: string; photo?: string; hospital?: string }>(
    (course as any)?.t6Instructor ?? (m6 ? MOCK.t6Instructor : {})
  );
  const [t6WhoFor, setT6WhoFor] = useState<{ title?: string; items?: string[] }>(
    (course as any)?.t6WhoFor ?? (m6 ? MOCK.t6WhoFor : {})
  );
  const [t6Pricing, setT6Pricing] = useState<{ tiers?: Array<{ name: string; price: string; period: string; features?: string[]; highlighted?: boolean }> }>(
    (course as any)?.t6Pricing ?? (m6 ? MOCK.t6Pricing : {})
  );
  const [t6Video, setT6Video] = useState<string>(
    (course as any)?.t6Video ?? (m6 ? MOCK.t6Video : "")
  );
  const [t6Testimonials, setT6Testimonials] = useState<Array<{ name: string; rating?: number; text: string; photo?: string }>>(
    (course as any)?.t6Testimonials ?? (m6 ? MOCK.t6Testimonials : [])
  );
  const [t6HeroInfoBadges, setT6HeroInfoBadges] = useState<Array<{ icon: string; label: string; value: string }>>(
    (course?.hero as any)?.infoBadges ?? []
  );
  const [t6HeroPricingCard, setTHeroPricingCard] = useState<{
    header?: string;
    tiers?: Array<{ icon?: string; label: string; value: string; suffix?: string }>;
    highlighted?: { label?: string; value: string; suffix?: string; badge?: string };
    ctaText?: string;
    installmentNote?: string;
  }>((course?.hero as any)?.pricingCard ?? {});

  // ── Player settings ──────────────────────────────────────────────────────────
  const [requireSequentialProgress, setRequireSequentialProgress] = useState<boolean>(
    course?.requireSequentialProgress ?? false
  );

  // ── Access duration ──────────────────────────────────────────────────────────
  const [hasLifetimeAccess, setHasLifetimeAccess] = useState<boolean>(course?.hasLifetimeAccess ?? true);
  const [showBadge, setShowBadge] = useState<boolean>(course?.showBadge ?? true);
  const [accessDurationDays, setAccessDurationDays] = useState<string>(
    course?.accessDurationDays ? String(course.accessDurationDays) : "365",
  );
  const [accessPreset, setAccessPreset] = useState<string>(() => {
    const d = course?.accessDurationDays;
    if (!d) return "365";
    if (d === 90 || d === 180 || d === 365) return String(d);
    return "custom";
  });

  // ── Publish / Trash actions ──────────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");

  function handleTogglePublish() {
    if (!course) return;
    startTransition(async () => {
      const res = await toggleLiveCoursePublishAction(course.id);
      if (res.data) {
        toast.success(res.data.status === "published" ? "Live course published" : "Live course unpublished");
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to update live course");
      }
    });
  }

  function handleDeleteLiveCourse() {
    if (!course) return;
    setShowDeleteConfirm(false);
    startTransition(async () => {
      const res = await deleteLiveCourseAction(course.id);
      if (res.data) {
        toast.success("Live course moved to Trash");
        router.push("/admin/live-courses");
      } else {
        toast.error(res.error ?? "Failed to move live course to Trash");
      }
    });
  }

  function handleRestoreLiveCourse() {
    if (!course) return;
    startTransition(async () => {
      const res = await restoreLiveCourseAction(course.id);
      if (res.data) {
        toast.success("Live course restored to Draft");
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to restore live course");
      }
    });
  }

  function handleScheduleLiveCourse() {
    if (!course || !scheduleAt) return;
    startTransition(async () => {
      const res = await scheduleLiveCourseAction(course.id, new Date(scheduleAt).toISOString());
      if (res.data) {
        toast.success("Live course scheduled");
        setShowScheduleModal(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to schedule live course");
      }
    });
  }

  function handleUnscheduleLiveCourse() {
    if (!course) return;
    startTransition(async () => {
      const res = await unscheduleLiveCourseAction(course.id);
      if (res.data) {
        toast.success("Schedule cancelled — course reverted to Draft");
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to unschedule live course");
      }
    });
  }

  // ── Per-element style overrides (click-to-edit in the preview) ──────────────
  const [styleOverrides, setStyleOverrides] = useState<StyleOverrides>(
    (course as any)?.styleOverrides ?? {}
  );
  const [lessonIcon, setLessonIcon] = useState<string>((course as any)?.lessonIcon ?? "");
  const [valueSection, setValueSection] = useState<{ heading?: string; totalLabel?: string; offerLine?: string; ctaText?: string }>(
    (course as any)?.valueSection ?? {}
  );
  // Per-section heading overrides + custom render order (keyed by section id).
  const [sectionHeadings, setSectionHeadings] = useState<Record<string, string>>(
    (course as any)?.sectionHeadings ?? {}
  );
  const [sectionOrder, setSectionOrder] = useState<string[]>(
    (course as any)?.sectionOrder ?? []
  );
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  // Section descriptors for the active template (drives the ordered accordion).
  const activeSectionDescriptors = isTemplate2 ? TEMPLATE2_SECTIONS : isTemplate3 ? TEMPLATE3_SECTIONS : isTemplate4 ? TEMPLATE4_SECTIONS : isTemplate5 ? TEMPLATE5_SECTIONS : isTemplate6 ? TEMPLATE6_SECTIONS : TEMPLATE1_SECTIONS;
  // Current resolved order of the active template's sections (falls back to default).
  const orderedSectionIds = resolveSectionOrder(sectionOrder, activeSectionDescriptors.map((s) => s.id));
  function moveSection(index: number, dir: -1 | 1) {
    const ids = [...orderedSectionIds];
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    setSectionOrder(ids);
  }
  // Default heading per section (used as input placeholders).
  const sectionHeadingDefaults: Record<string, string> = Object.fromEntries(
    activeSectionDescriptors.filter((s) => s.defaultHeading).map((s) => [s.id, s.defaultHeading!]),
  );
  function mv(idx: number): PanelReorder {
    return {
      index: idx + 1,
      onMoveUp: () => moveSection(idx, -1),
      onMoveDown: () => moveSection(idx, 1),
      canMoveUp: idx > 0,
      canMoveDown: idx < orderedSectionIds.length - 1,
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        setDragIdx(idx);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(idx));
      },
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setOverIdx(idx);
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        const from = dragIdx;
        if (from === null || from === idx) { setDragIdx(null); setOverIdx(null); return; }
        const ids = [...orderedSectionIds];
        const [moved] = ids.splice(from, 1);
        ids.splice(idx, 0, moved!);
        setSectionOrder(ids);
        setDragIdx(null);
        setOverIdx(null);
      },
      onDragEnd: () => { setDragIdx(null); setOverIdx(null); },
      isDragOver: overIdx === idx && dragIdx !== null && dragIdx !== idx,
    };
  }
  // Heading edit field rendered as the first field inside a section card.
  function headingLeading(id: string): ReactNode {
    const ph = sectionHeadingDefaults[id];
    if (ph === undefined) return null;
    return (
      <div>
        <Lbl text="Section Heading" />
        <input
          value={sectionHeadings[id] ?? ""}
          onChange={(e) => setSectionHeadings((prev) => ({ ...prev, [id]: e.target.value }))}
          placeholder={ph}
          className={inputCls}
        />
      </div>
    );
  }
  // Render one Template 1 section card, in the user-defined order. Sub-cards that
  // render *inside* another page section (Payment Logos → hero, Testimonials →
  // videos) travel with their parent and carry no move arrows of their own.
  function renderT1Section(id: string, idx: number): ReactNode {
    const p = mv(idx);
    switch (id) {
      case "hero":
        return (
          <Fragment key={id}>
            <Panel title="Hero" {...p}>
              <div>
                <Lbl text="Badge Text" />
                <input value={heroBadge} onChange={(e) => setHeroBadge(e.target.value)}
                  placeholder="🔥 Limited Seats!" className={inputCls} />
              </div>
              <div>
                <Lbl text="Subtitle" />
                <textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)}
                  rows={2} placeholder="Short compelling subtitle..." className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Lbl text="Rating (0–5)" />
                  <input value={heroRating} onChange={(e) => setHeroRating(e.target.value)}
                    placeholder="4.8" type="number" step="0.1" className={inputCls} />
                </div>
                <div>
                  <Lbl text="Rating Count" />
                  <input value={heroRatingCount} onChange={(e) => setHeroRatingCount(e.target.value)}
                    placeholder="1200" type="number" className={inputCls} />
                </div>
              </div>
              <div>
                <Lbl text="Primary CTA Button" />
                <input value={heroCtaText} onChange={(e) => setHeroCtaText(e.target.value)}
                  placeholder="এখনই এনরোল করুন" className={inputCls} />
              </div>
              <div>
                <Lbl text="Promo Text (discount note)" />
                <input value={heroPromoText} onChange={(e) => setHeroPromoText(e.target.value)}
                  placeholder="৳৫,০০০ ছাড় পেতে আজই যোগ দিন!" className={inputCls} />
              </div>
              <div>
                <Lbl text="Student Count Text" />
                <input value={heroStudentCount} onChange={(e) => setHeroStudentCount(e.target.value)}
                  placeholder="১২,০০০+ শিক্ষার্থী ইতিমধ্যে যোগ দিয়েছেন" className={inputCls} />
              </div>
              <div>
                <Lbl text="Banner Image URL" />
                <ImagePickerField value={heroBanner} onChange={setHeroBanner} />
              </div>
            </Panel>
            <PaymentLogosPanel value={paymentLogos} onChange={setPaymentLogos} />
          </Fragment>
        );
      case "batch":
        return <BatchPanel key={id} value={batchInfo} onChange={setBatchInfo} panel={p} />;
      case "curriculum":
        return (
          <CurriculumPanel key={id} value={curriculum} onChange={setCurriculum}
            lessonIcon={lessonIcon} onLessonIcon={setLessonIcon} showLessonIcon={usesLessonIcon}
            panel={p}
            leading={
              <>
                {headingLeading("curriculum")}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Lbl text="Module count" />
                    <input value={totalModules} onChange={(e) => setTotalModules(e.target.value)}
                      placeholder={`${curriculum.length} (auto)`} className={inputCls} />
                  </div>
                  <div>
                    <Lbl text="Live class count" />
                    <input value={totalLiveClasses} onChange={(e) => setTotalLiveClasses(e.target.value)}
                      placeholder="60" className={inputCls} />
                  </div>
                </div>
              </>
            } />
        );
      case "tools":
        return <ToolsPanel key={id} value={tools} onChange={setTools} panel={p} leading={headingLeading("tools")} />;
      case "why":
        return <WhyPanel key={id} value={whyItems} onChange={setWhyItems} panel={p} leading={headingLeading("why")} />;
      case "stats":
        return (
          <Panel key={id} title="Stats / Social Proof" {...p}>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Students",     val: statsStudents,   set: setStatsStudents,   ph: "10,000+" },
                { label: "Ratings",      val: statsRatings,    set: setStatsRatings,    ph: "4,500+" },
                { label: "Completion %", val: statsCompletion, set: setStatsCompletion, ph: "94%" },
                { label: "Extra",        val: statsExtra,      set: setStatsExtra,      ph: "24/7 Support" },
              ].map(({ label: lbl, val, set, ph }) => (
                <div key={lbl}>
                  <Lbl text={lbl} />
                  <input value={val} onChange={(e) => set(e.target.value)} placeholder={ph} className={inputCls} />
                </div>
              ))}
            </div>
            <div>
              <Lbl text="Stat Labels (4)" />
              <div className="grid grid-cols-2 gap-2">
                {statsLabels.map((lbl, i) => (
                  <input key={i} value={lbl}
                    onChange={(e) => setStatsLabels((prev) => {
                      const next = [...prev] as [string, string, string, string];
                      next[i] = e.target.value;
                      return next;
                    })}
                    placeholder={`Label ${i + 1}`} className={`${inputCls} text-xs`} />
                ))}
              </div>
            </div>
          </Panel>
        );
      case "instructors":
        return (
          <InstructorsPanel key={id} value={instructors} onChange={setInstructors}
            teachers={teachers} teachersLoading={teachersLoading} onLoadTeachers={loadTeachers}
            panel={p} leading={headingLeading("instructors")} />
        );
      case "whatYouGet":
        return <WhatYouGetPanel key={id} value={whatYouGet} onChange={setWhatYouGet} panel={p} leading={headingLeading("whatYouGet")} />;
      case "videos":
        return (
          <Fragment key={id}>
            <VideosPanel value={videos} onChange={setVideos} panel={p} leading={headingLeading("videos")} />
            <TestimonialsPanel value={testimonials} onChange={setTestimonials} />
          </Fragment>
        );
      case "value":
        return (
          <ValuePanel key={id} value={valueItems} onChange={setValueItems}
            valueSection={valueSection} onValueSection={(patch) => setValueSection((pp) => ({ ...pp, ...patch }))}
            showValueText panel={p} />
        );
      case "urgencyCta":
        return (
          <Panel key={id} title="Urgency CTA (Sticky Bar)" {...p}>
            <p className="text-xs text-gray-400">Controls the sticky bottom bar shown on the course page.</p>
            <div className="grid grid-cols-1 gap-2">
              <div><Lbl text="Phone Number" /><input value={urgWa} onChange={(e) => setUrgWa(e.target.value)} placeholder="+880 1700-000000" className={inputCls} /></div>
              <div><Lbl text="Call Label" /><input value={urgTitle} onChange={(e) => setUrgTitle(e.target.value)} placeholder="কল করুন" className={inputCls} /></div>
              <div><Lbl text="Tagline" /><input value={urgSub} onChange={(e) => setUrgSub(e.target.value)} placeholder="সিট সংখ্যা শেষ হওয়ার আগে" className={inputCls} /></div>
            </div>
          </Panel>
        );
      case "enrollment":
        return (
          <Panel key={id} title="Enrollment Form" {...p}>
            <p className="text-xs text-gray-400">
              This section has no editable content here — use the arrows to position the enrollment form among the page sections.
            </p>
          </Panel>
        );
      default:
        return null;
    }
  }

  // Render one Template 2 (Sales) section card, in the user-defined order.
  function renderT2Section(id: string, idx: number): ReactNode {
    const p = mv(idx);
    switch (id) {
      case "hero":
        return (
          <Panel key={id} title="Hero" {...p}>
            <div>
              <Lbl text="Badge Text" />
              <input value={heroBadge} onChange={(e) => setHeroBadge(e.target.value)}
                placeholder="🔥 Limited Seats!" className={inputCls} />
              <p className="text-xs text-gray-400 mt-1">Separate multiple badges with | (pipe)</p>
            </div>
            <div className="space-y-2 border border-red-100 rounded-xl p-3 bg-red-50">
              <p className="text-xs font-semibold text-red-600">Split Headline (3 lines)</p>
              <div>
                <Lbl text="Line 1 — Black" />
                <input value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)}
                  placeholder="শূণ্য থেকে প্রফেশনাল" className={inputCls} />
              </div>
              <div>
                <Lbl text="Line 2 — Red highlight" />
                <input value={heroHeadlineHl} onChange={(e) => setHeroHeadlineHl(e.target.value)}
                  placeholder="ডিজাইনার ও ভিডিও এডিটর" className={inputCls} />
              </div>
              <div>
                <Lbl text="Line 3 — Black" />
                <input value={heroHeadlineAfter} onChange={(e) => setHeroHeadlineAfter(e.target.value)}
                  placeholder="হওয়ার অনলাইন জার্নি শুরু করুন" className={inputCls} />
              </div>
              <p className="text-xs text-gray-400">Leave all three blank to show the course title as a plain heading.</p>
            </div>
            <div>
              <Lbl text="Subtitle" />
              <textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)}
                rows={2} placeholder="Short compelling subtitle..." className={inputCls} />
            </div>
            <div>
              <Lbl text="Primary CTA Button" />
              <input value={heroCtaText} onChange={(e) => setHeroCtaText(e.target.value)}
                placeholder="ভর্তি হোন" className={inputCls} />
            </div>
            <div>
              <Lbl text="Secondary Button (e.g. মডিউল দেখুন)" />
              <input value={heroSecondaryBtn} onChange={(e) => setHeroSecondaryBtn(e.target.value)}
                placeholder="মডিউল দেখুন" className={inputCls} />
              <p className="text-xs text-gray-400 mt-1">Scrolls to the curriculum section.</p>
            </div>
            <div>
              <Lbl text="Hero YouTube Video URL" />
              <input value={heroBanner} onChange={(e) => setHeroBanner(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..." className={inputCls} />
              <p className="text-xs text-gray-400 mt-1">Shown in the hero instead of a static image.</p>
            </div>
            <div>
              <Lbl text="Thumbnail / Banner Image" />
              <ImagePickerField value={heroBannerImage} onChange={setHeroBannerImage} />
              <p className="text-xs text-gray-400 mt-1">Used on course listing cards (the hero section itself shows the video above).</p>
            </div>
            <div className="space-y-2 border border-gray-100 rounded-xl p-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-600">Stat Cards (4 cards shown below the subtitle)</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Students",     val: statsStudents,   set: setStatsStudents,   ph: "240+" },
                  { label: "Ratings",      val: statsRatings,    set: setStatsRatings,    ph: "১ জন" },
                  { label: "Completion %", val: statsCompletion, set: setStatsCompletion, ph: "১০+ জন" },
                  { label: "Extra",        val: statsExtra,      set: setStatsExtra,      ph: "শীঘ্রই" },
                ].map(({ label: lbl, val, set, ph }) => (
                  <div key={lbl}><Lbl text={lbl} /><input value={val} onChange={(e) => set(e.target.value)} placeholder={ph} className={inputCls} /></div>
                ))}
              </div>
              <div>
                <Lbl text="Stat Labels (4)" />
                <div className="grid grid-cols-2 gap-2">
                  {statsLabels.map((lbl, i) => (
                    <input key={i} value={lbl}
                      onChange={(e) => setStatsLabels((prev) => { const next = [...prev] as [string, string, string, string]; next[i] = e.target.value; return next; })}
                      placeholder={`Label ${i + 1}`} className={`${inputCls} text-xs`} />
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        );
      case "comparison":
        return (
          <Panel key={id} title="Comparison Table" {...p}>
            <p className="text-xs text-gray-400">Side-by-side comparison (e.g. Self-study vs Course).</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Lbl text="Column 1 Label" />
                <input value={compCol1} onChange={(e) => setCompCol1(e.target.value)}
                  placeholder="নিজে নিজে শেখা" className={inputCls} />
              </div>
              <div>
                <Lbl text="Column 2 Label" />
                <input value={compCol2} onChange={(e) => setCompCol2(e.target.value)}
                  placeholder="আমাদের কোর্স" className={inputCls} />
              </div>
            </div>
            {compRows.map((row, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
                <div className="flex items-center gap-2">
                  <input value={row.feature}
                    onChange={(e) => setCompRows((r) => r.map((x, j) => j === i ? { ...x, feature: e.target.value } : x))}
                    placeholder="Feature name" className={`${inputCls} flex-1`} />
                  <label className="flex items-center gap-1 text-xs text-amber-600 shrink-0 cursor-pointer">
                    <input type="checkbox" checked={row.highlight ?? false}
                      onChange={(e) => setCompRows((r) => r.map((x, j) => j === i ? { ...x, highlight: e.target.checked } : x))} />
                    Highlight
                  </label>
                  <DelBtn onClick={() => setCompRows((r) => r.filter((_, j) => j !== i))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Lbl text="Col 1 value" />
                    <input value={row.col1 ?? ""}
                      onChange={(e) => setCompRows((r) => r.map((x, j) => j === i ? { ...x, col1: e.target.value } : x))}
                      placeholder="❌ or text" className={inputCls} />
                  </div>
                  <div>
                    <Lbl text="Col 2 value" />
                    <input value={row.col2 ?? ""}
                      onChange={(e) => setCompRows((r) => r.map((x, j) => j === i ? { ...x, col2: e.target.value } : x))}
                      placeholder="✅ or text" className={inputCls} />
                  </div>
                </div>
              </div>
            ))}
            <AddBtn label="Add Row" onClick={() => setCompRows((r) => [...r, { feature: "" }])} />
          </Panel>
        );
      case "curriculum":
        return (
          <CurriculumPanel key={id} value={curriculum} onChange={setCurriculum}
            lessonIcon={lessonIcon} onLessonIcon={setLessonIcon} showLessonIcon={usesLessonIcon}
            panel={p} leading={headingLeading("curriculum")} />
        );
      case "instructors":
        return (
          <InstructorsPanel key={id} value={instructors} onChange={setInstructors}
            teachers={teachers} teachersLoading={teachersLoading} onLoadTeachers={loadTeachers}
            panel={p} leading={headingLeading("instructors")} />
        );
      case "why":
        return <WhyPanel key={id} value={whyItems} onChange={setWhyItems} panel={p} leading={headingLeading("why")} />;
      case "ctaBanner":
        return (
          <Panel key={id} title="CTA Banner (Red Strip)" {...p}>
            <p className="text-xs text-gray-400">Full-width red promotional strip shown mid-page.</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2"><Lbl text="Label (e.g. batch name)" /><input value={ctaBLabel} onChange={(e) => setCtaBLabel(e.target.value)} placeholder="Batch 7 চলছে" className={inputCls} /></div>
              <div className="col-span-2"><Lbl text="Title" /><input value={ctaBTitle} onChange={(e) => setCtaBTitle(e.target.value)} placeholder="আজই কোর্সে যোগ দিন" className={inputCls} /></div>
              <div><Lbl text="Price (৳)" /><input value={ctaBPrice} onChange={(e) => setCtaBPrice(e.target.value)} placeholder="4999" className={inputCls} /></div>
              <div><Lbl text="Original Price (৳)" /><input value={ctaBOrigPrice} onChange={(e) => setCtaBOrigPrice(e.target.value)} placeholder="9999" className={inputCls} /></div>
              <div className="col-span-2"><Lbl text="Button Text" /><input value={ctaBBtn} onChange={(e) => setCtaBBtn(e.target.value)} placeholder="এখনই এনরোল করুন" className={inputCls} /></div>
              <div><Lbl text="Installment 1" /><input value={ctaBInst1} onChange={(e) => setCtaBInst1(e.target.value)} placeholder="৳১,৬৬৭/মাস" className={inputCls} /></div>
              <div><Lbl text="Installment 2" /><input value={ctaBInst2} onChange={(e) => setCtaBInst2(e.target.value)} placeholder="৳৮৩৪/মাস" className={inputCls} /></div>
            </div>
          </Panel>
        );
      case "certificate":
        return (
          <Panel key={id} title="Certificate Section" {...p}>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2"><Lbl text="Section Title" /><input value={certTitle} onChange={(e) => setCertTitle(e.target.value)} placeholder="আপনি পাবেন সার্টিফিকেট" className={inputCls} /></div>
              <div className="col-span-2"><Lbl text="Highlighted Word/Phrase" /><input value={certHl} onChange={(e) => setCertHl(e.target.value)} placeholder="সার্টিফিকেট" className={inputCls} /></div>
              <div className="col-span-2"><Lbl text="Description" /><textarea value={certDesc} onChange={(e) => setCertDesc(e.target.value)} rows={2} placeholder="কোর্স সম্পন্ন করলে..." className={inputCls} /></div>
              <div className="col-span-2"><Lbl text="Certificate Image URL" /><ImagePickerField value={certImg} onChange={setCertImg} /></div>
              <div><Lbl text="Founder Name" /><input value={certFounder} onChange={(e) => setCertFounder(e.target.value)} placeholder="Md. Rahim" className={inputCls} /></div>
              <div><Lbl text="Founder Role" /><input value={certRole} onChange={(e) => setCertRole(e.target.value)} placeholder="CEO & Founder" className={inputCls} /></div>
            </div>
          </Panel>
        );
      case "videoTabs":
        return <VideoTabsPanel key={id} value={videoTabs} onChange={setVideoTabs} panel={p} leading={headingLeading("videoTabs")} />;
      case "pcReqs":
        return (
          <Panel key={id} title="PC Requirements" {...p}>
            {headingLeading("pcReqs")}
            <p className="text-xs text-gray-400">Minimum specs for Basic and Pro configs.</p>
            {(["basic", "pro"] as const).map((tier) => {
              const cfg    = tier === "basic" ? pcBasic  : pcPro;
              const setCfg  = tier === "basic" ? setPcBasic : setPcPro;
              return (
                <div key={tier} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-600 capitalize">{tier} Config</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["ram", "processor", "storage", "graphics"] as const).map((field) => (
                      <div key={field}>
                        <Lbl text={field.charAt(0).toUpperCase() + field.slice(1)} />
                        <input value={cfg[field] ?? ""}
                          onChange={(e) => setCfg((c) => ({ ...c, [field]: e.target.value }))}
                          placeholder={field === "ram" ? "8GB DDR4" : field === "processor" ? "Core i5" : field === "storage" ? "256GB SSD" : "Integrated"}
                          className={inputCls} />
                      </div>
                    ))}
                    <div className="col-span-2">
                      <Lbl text="Note" />
                      <input value={cfg.note ?? ""}
                        onChange={(e) => setCfg((c) => ({ ...c, note: e.target.value }))}
                        placeholder="Additional note..." className={inputCls} />
                    </div>
                  </div>
                </div>
              );
            })}
            <div>
              <Lbl text="Internet Speed Requirement" />
              <input value={pcInternet} onChange={(e) => setPcInternet(e.target.value)}
                placeholder="Minimum 5 Mbps broadband" className={inputCls} />
            </div>
          </Panel>
        );
      case "testimonials":
        return <TestimonialsPanel key={id} value={testimonials} onChange={setTestimonials} panel={p} leading={headingLeading("testimonials")} />;
      case "faq":
        return <FaqPanel key={id} value={faqItems} onChange={setFaqItems} panel={p} leading={headingLeading("faq")} />;
      case "urgencyCta":
        return (
          <Panel key={id} title="Urgency CTA (Bottom)" {...p}>
            <p className="text-xs text-gray-400">Final call-to-action section with WhatsApp link.</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2"><Lbl text="Batch Label" /><input value={urgLabel} onChange={(e) => setUrgLabel(e.target.value)} placeholder="Batch 7 শুরু হচ্ছে ১ জুন" className={inputCls} /></div>
              <div className="col-span-2"><Lbl text="Title" /><input value={urgTitle} onChange={(e) => setUrgTitle(e.target.value)} placeholder="আর দেরি না করে" className={inputCls} /></div>
              <div className="col-span-2"><Lbl text="Highlighted Word" /><input value={urgHl} onChange={(e) => setUrgHl(e.target.value)} placeholder="এখনই এনরোল করুন" className={inputCls} /></div>
              <div className="col-span-2"><Lbl text="Subtitle" /><textarea value={urgSub} onChange={(e) => setUrgSub(e.target.value)} rows={2} placeholder="সীমিত আসন বাকি..." className={inputCls} /></div>
              <div className="col-span-2"><Lbl text="Button Text" /><input value={urgBtn} onChange={(e) => setUrgBtn(e.target.value)} placeholder="কোর্সে এনরোল করুন" className={inputCls} /></div>
              <div className="col-span-2"><Lbl text="WhatsApp Number / URL" /><input value={urgWa} onChange={(e) => setUrgWa(e.target.value)} placeholder="+8801XXXXXXXXX or https://wa.me/..." className={inputCls} /></div>
            </div>
          </Panel>
        );
      case "enrollment":
        return (
          <Panel key={id} title="Enrollment Form" {...p}>
            <p className="text-xs text-gray-400">
              This section has no editable content here — use the arrows to position the enrollment form among the page sections.
            </p>
          </Panel>
        );
      default:
        return null;
    }
  }

  // Render one Template 3 (Membership) section card, in the user-defined order.
  function renderT3Section(id: string, idx: number): ReactNode {
    const p = mv(idx);
    switch (id) {
      case "marquee":
        return (
          <Panel key={id} title="Marquee Ticker" {...p}>
            <div>
              <Lbl text="Marquee Ticker Text" />
              <input value={t3Marquee} onChange={(e) => setT3Marquee(e.target.value)}
                placeholder="🔥 সীমিত আসন বাকি • আজই যোগ দিন" className={inputCls} />
              <p className="text-xs text-gray-400 mt-1">Separate multiple items with | (pipe).</p>
            </div>
          </Panel>
        );
      case "hero":
        return (
          <Panel key={id} title="Hero & Announcement" {...p}>
            <div><Lbl text="Badge Text" /><input value={heroBadge} onChange={(e) => setHeroBadge(e.target.value)} placeholder="🔥 Limited Seats!" className={inputCls} /></div>
            <div><Lbl text="Subtitle" /><textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} rows={2} placeholder="Short compelling subtitle..." className={inputCls} /></div>
            <div><Lbl text="Primary CTA Button" /><input value={heroCtaText} onChange={(e) => setHeroCtaText(e.target.value)} placeholder="এখনই যোগ দিন" className={inputCls} /></div>
            <div><Lbl text="Student Count Text" /><input value={heroStudentCount} onChange={(e) => setHeroStudentCount(e.target.value)} placeholder="১২,০০০+ শিক্ষার্থী ইতিমধ্যে যোগ দিয়েছেন" className={inputCls} /></div>
            <div><Lbl text="Hero Image URL" /><ImagePickerField value={heroBanner} onChange={setHeroBanner} /></div>
            <div className="space-y-2 border border-amber-200 rounded-xl p-3 bg-amber-50">
              <p className="text-xs font-semibold text-amber-700">Announcement Bar</p>
              <div><Lbl text="Announcement Bar Text" /><input value={t3AnnounceText} onChange={(e) => setT3AnnounceText(e.target.value)} placeholder="📢 আজকের মধ্যে এনরোল করলে বিশেষ ছাড়!" className={inputCls} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Lbl text="Bar Button Text" /><input value={t3AnnounceBtn} onChange={(e) => setT3AnnounceBtn(e.target.value)} placeholder="এখনই দেখুন" className={inputCls} /></div>
                <div><Lbl text="Bar Button Anchor" /><input value={t3AnnounceAnchor} onChange={(e) => setT3AnnounceAnchor(e.target.value)} placeholder="#pricing" className={inputCls} /></div>
              </div>
            </div>
          </Panel>
        );
      case "stats":
        return (
          <Panel key={id} title="Stats Bar" {...p}>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Students",     val: statsStudents,   set: setStatsStudents,   ph: "10,000+" },
                { label: "Ratings",      val: statsRatings,    set: setStatsRatings,    ph: "4,500+" },
                { label: "Completion %", val: statsCompletion, set: setStatsCompletion, ph: "94%" },
                { label: "Extra",        val: statsExtra,      set: setStatsExtra,      ph: "24/7 Support" },
              ].map(({ label: lbl, val, set, ph }) => (
                <div key={lbl}><Lbl text={lbl} /><input value={val} onChange={(e) => set(e.target.value)} placeholder={ph} className={inputCls} /></div>
              ))}
            </div>
            <div>
              <Lbl text="Stat Labels (4)" />
              <div className="grid grid-cols-2 gap-2">
                {statsLabels.map((lbl, i) => (
                  <input key={i} value={lbl}
                    onChange={(e) => setStatsLabels((prev) => { const next = [...prev] as [string, string, string, string]; next[i] = e.target.value; return next; })}
                    placeholder={`Label ${i + 1}`} className={`${inputCls} text-xs`} />
                ))}
              </div>
            </div>
          </Panel>
        );
      case "blueprint":
        return (
          <Panel key={id} title="Blueprint Showcase" {...p}>
            <p className="text-xs text-gray-400">Product bundle image shown below the hero — what they will receive.</p>
            <div><Lbl text="Section Title" /><input value={t3BlueprintTitle} onChange={(e) => setT3BlueprintTitle(e.target.value)} placeholder="কোর্সের কমপ্লিট ব্লুপ্রিন্ট" className={inputCls} /></div>
            <div><Lbl text="Subtitle" /><input value={t3BlueprintSub} onChange={(e) => setT3BlueprintSub(e.target.value)} placeholder="আপনি যা যা শিখবেন ও পাবেন" className={inputCls} /></div>
            <div><Lbl text="Bundle / Blueprint Image URL" /><ImagePickerField value={t3BlueprintImg} onChange={setT3BlueprintImg} /></div>
          </Panel>
        );
      case "whyJoin":
        return <T3WhyJoinPanel key={id} value={t3WhyItems} onChange={setT3WhyItems} panel={p} leading={headingLeading("whyJoin")} />;
      case "featuresGrid":
        return <T3FeaturesGridPanel key={id} title={t3FeaturesTitle} subtitle={t3FeaturesSub} items={t3FeatureItems} onTitle={setT3FeaturesTitle} onSubtitle={setT3FeaturesSub} onItems={setT3FeatureItems} panel={p} />;
      case "bonusChecklist":
        return <T3BonusChecklistPanel key={id} title={t3BonusTitle} items={t3BonusItems} onTitle={setT3BonusTitle} onItems={setT3BonusItems} panel={p} />;
      case "challenge":
        return (
          <Panel key={id} title="Challenge Card" {...p}>
            <p className="text-xs text-gray-400">Bordered card featuring an N-month challenge badge.</p>
            <div><Lbl text="Title" /><input value={t3ChallengeTitle} onChange={(e) => setT3ChallengeTitle(e.target.value)} placeholder="৬ মাসের চ্যালেঞ্জ" className={inputCls} /></div>
            <div><Lbl text="Month Count (badge number)" /><input value={t3ChallengeMonth} onChange={(e) => setT3ChallengeMonth(e.target.value)} placeholder="৬" className={inputCls} /></div>
            <div><Lbl text="Description" /><textarea value={t3ChallengeDesc} onChange={(e) => setT3ChallengeDesc(e.target.value)} rows={3} placeholder="৬ মাস ধরে কাজ করুন এবং আপনার দক্ষতা প্রমাণ করুন..." className={inputCls} /></div>
            <div><Lbl text="Yellow Link Text" /><input value={t3ChallengeLink} onChange={(e) => setT3ChallengeLink(e.target.value)} placeholder="সম্পূর্ণ বিস্তারিত জানুন →" className={inputCls} /></div>
          </Panel>
        );
      case "supportLevels":
        return <T3SupportLevelsPanel key={id} title={t3LevelsTitle} subtitle={t3LevelsSub} levels={t3Levels} onTitle={setT3LevelsTitle} onSubtitle={setT3LevelsSub} onLevels={setT3Levels} panel={p} />;
      case "salesUpdate":
        return <T3ImageSliderPanel key={id} panelTitle="Sales Update Slider" sectionTitle={t3SalesTitle} sectionSubtitle={t3SalesSub} images={t3SalesImages} onTitle={setT3SalesTitle} onSubtitle={setT3SalesSub} onImages={setT3SalesImages} panel={p} />;
      case "community":
        return <T3ImageSliderPanel key={id} panelTitle="Community Section" sectionTitle={t3CommTitle} sectionSubtitle={t3CommSub} images={t3CommImages} caption={t3CommCaption} showCaption onCaption={setT3CommCaption} onTitle={setT3CommTitle} onSubtitle={setT3CommSub} onImages={setT3CommImages} panel={p} />;
      case "textReviews":
        return <T3TextReviewsPanel key={id} title={t3ReviewsTitle} reviews={t3Reviews} onTitle={setT3ReviewsTitle} onReviews={setT3Reviews} panel={p} />;
      case "successStories":
        return <T3SuccessStoriesPanel key={id} title={t3StoriesTitle} stories={t3Stories} onTitle={setT3StoriesTitle} onStories={setT3Stories} panel={p} />;
      case "videoGrid":
        return <T3VideoGridPanel key={id} title={t3VidGridTitle} videos={t3VidGridItems} onTitle={setT3VidGridTitle} onVideos={setT3VidGridItems} panel={p} />;
      case "faq":
        return (
          <Fragment key={id}>
            <FaqPanel value={faqItems} onChange={setFaqItems} panel={p} leading={headingLeading("faq")} />
            <Panel title="FAQ Contact Buttons">
              <p className="text-xs text-gray-400">Shown below the FAQ — Message Us &amp; Call Us buttons.</p>
              <div><Lbl text="Messenger URL" /><input value={t3MessengerUrl} onChange={(e) => setT3MessengerUrl(e.target.value)} placeholder="https://m.me/your-page" className={inputCls} /></div>
              <div><Lbl text="Phone Number" /><input value={t3Phone} onChange={(e) => setT3Phone(e.target.value)} placeholder="+8801XXXXXXXXX" className={inputCls} /></div>
            </Panel>
          </Fragment>
        );
      case "enrollment":
        return (
          <Panel key={id} title="Enrollment Form" {...p}>
            <p className="text-xs text-gray-400">
              This section has no editable content here — use the arrows to position the enrollment form among the page sections.
            </p>
          </Panel>
        );
      case "footer":
        return (
          <Panel key={id} title="Footer Branding" {...p}>
            <div><Lbl text="Brand Name" /><input value={t3BrandName} onChange={(e) => setT3BrandName(e.target.value)} placeholder="OTA Community" className={inputCls} /></div>
            <div><Lbl text="Tagline" /><input value={t3Tagline} onChange={(e) => setT3Tagline(e.target.value)} placeholder="Learn. Grow. Succeed." className={inputCls} /></div>
            <div><Lbl text="Copyright Text" /><input value={t3Copyright} onChange={(e) => setT3Copyright(e.target.value)} placeholder="© 2024 OTA Community. All rights reserved." className={inputCls} /></div>
          </Panel>
        );
      default:
        return null;
    }
  }

  // Render one Template 4 (Nexemy) section card, in the user-defined order.
  function renderT4Section(id: string, idx: number): ReactNode {
    const p = mv(idx);
    switch (id) {
      case "hero":
        return (
          <Fragment key={id}>
            <Panel title="Hero" {...p}>
              <div><Lbl text="Badge Text" /><input value={heroBadge} onChange={(e) => setHeroBadge(e.target.value)} placeholder="🔥 Limited Seats!" className={inputCls} /></div>
              <div><Lbl text="Question Text (above headline)" /><input value={t4HeroQuestion} onChange={(e) => setT4HeroQuestion(e.target.value)} placeholder="আপনি কি Upwork-এ সফল ফ্রিল্যান্সার হতে চান?" className={inputCls} /></div>
              <div><Lbl text="Headline Line 1 (black)" /><input value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)} placeholder="Live Upwork" className={inputCls} /></div>
              <div><Lbl text="Headline Line 2 (bold purple)" /><input value={heroHeadlineHl} onChange={(e) => setHeroHeadlineHl(e.target.value)} placeholder="Freelancing Course" className={inputCls} /></div>
              <div><Lbl text="Headline Line 3 (black)" /><input value={heroHeadlineAfter} onChange={(e) => setHeroHeadlineAfter(e.target.value)} placeholder="Batch 4" className={inputCls} /></div>
              <div><Lbl text="Subtitle" /><textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} rows={2} placeholder="Short compelling subtitle..." className={inputCls} /></div>
              <div><Lbl text="Hero YouTube Video URL" /><input value={heroBanner} onChange={(e) => setHeroBanner(e.target.value)} placeholder="https://www.youtube.com/embed/..." className={inputCls} /></div>
              <div>
                <Lbl text="Thumbnail / Banner Image" />
                <ImagePickerField value={heroBannerImage} onChange={setHeroBannerImage} />
                <p className="text-xs text-gray-400 mt-1">Used on course listing cards (the hero section itself shows the video above).</p>
              </div>
              <div><Lbl text="Primary CTA Button" /><input value={heroCtaText} onChange={(e) => setHeroCtaText(e.target.value)} placeholder="এখনই ভর্তি হন" className={inputCls} /></div>
            </Panel>
            <T4LiveSessionCardPanel value={t4LiveSessionCard} onChange={setT4LiveSessionCard} />
          </Fragment>
        );
      case "curriculum":
        return (
          <CurriculumPanel key={id} value={curriculum} onChange={setCurriculum}
            lessonIcon={lessonIcon} onLessonIcon={setLessonIcon} showLessonIcon={usesLessonIcon}
            panel={p} leading={headingLeading("curriculum")} />
        );
      case "studentProgress":
        return <T4StudentProgressPanel key={id} value={t4StudentProgress} onChange={setT4StudentProgress} panel={p} />;
      case "forWhom":
        return <T4ForWhomPanel key={id} value={t4ForWhomSection} onChange={setT4ForWhomSection} panel={p} />;
      case "instructorStory":
        return <T4InstructorStoryPanel key={id} value={t4InstructorStory} onChange={setT4InstructorStory} panel={p} />;
      case "moduleGrid":
        return <T4ModuleGridPanel key={id} value={t4ModuleGrid} onChange={setT4ModuleGrid} panel={p} />;
      case "whatYouGet":
        return <WhatYouGetPanel key={id} value={whatYouGet} onChange={setWhatYouGet} panel={p} leading={headingLeading("whatYouGet")} />;
      case "pricing":
        return <T4PricingSectionPanel key={id} value={t4PricingSection} onChange={setT4PricingSection} panel={p} />;
      case "support":
        return <T4SupportSectionPanel key={id} value={t4SupportSection} onChange={setT4SupportSection} panel={p} />;
      case "countdown":
        return <T4CountdownBannerPanel key={id} value={t4CountdownBanner} onChange={setT4CountdownBanner} panel={p} />;
      case "faq":
        return <FaqPanel key={id} value={faqItems} onChange={setFaqItems} panel={p} leading={headingLeading("faq")} />;
      case "enrollment":
        return (
          <Panel key={id} title="Enrollment Form" {...p}>
            <p className="text-xs text-gray-400">
              This section has no editable content here — use the arrows to position the enrollment form among the page sections.
            </p>
          </Panel>
        );
      default:
        return null;
    }
  }

  // Render one Template 5 (Masterclass) section card, in the user-defined order.
  function renderT5Section(id: string, idx: number): ReactNode {
    const p = mv(idx);
    switch (id) {
      case "countdown":
        return (
          <Panel key={id} title="Countdown Strip" {...p}>
            <p className="text-xs text-gray-400">Green offer-countdown bar at the very top (uses the main Countdown End date).</p>
            <div><Lbl text="Strip Text" /><input value={urgTitle} onChange={(e) => setUrgTitle(e.target.value)} placeholder="অফারের আর মাত্র বাকি" className={inputCls} /></div>
            <div><Lbl text="WhatsApp / Phone (FAQ call button)" /><input value={urgWa} onChange={(e) => setUrgWa(e.target.value)} placeholder="+8801XXXXXXXXX" className={inputCls} /></div>
          </Panel>
        );
      case "hero":
        return (
          <Fragment key={id}>
            <Panel title="Hero" {...p}>
              <div><Lbl text="Badge Text" /><input value={heroBadge} onChange={(e) => setHeroBadge(e.target.value)} placeholder="লাইভ কোর্স" className={inputCls} /></div>
              <div><Lbl text="Subtitle" /><textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} rows={2} placeholder="Short compelling subtitle..." className={inputCls} /></div>
              <div><Lbl text="Rating Count" /><input value={heroRatingCount} onChange={(e) => setHeroRatingCount(e.target.value)} placeholder="230" type="number" className={inputCls} /></div>
              <div><Lbl text="Hero Image URL (purchase card)" /><ImagePickerField value={heroBanner} onChange={setHeroBanner} /></div>
            </Panel>
            <Panel title="Hero Stat Cards (5 icons)">
              <p className="text-xs text-gray-400">The icon cards in the hero — e.g. ৬০ মডিউল, ২০+ রেগুলার ক্লাস. Icons: file, video, play, project, community.</p>
              {t5StatCards.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={s.icon ?? ""} onChange={(e) => setT5StatCards((pp) => pp.map((x, j) => j === i ? { ...x, icon: e.target.value } : x))} placeholder="icon" className={`${inputCls} w-24`} />
                  <input value={s.value} onChange={(e) => setT5StatCards((pp) => pp.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} placeholder="৬০" className={`${inputCls} w-20`} />
                  <input value={s.label} onChange={(e) => setT5StatCards((pp) => pp.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="মডিউল" className={`${inputCls} flex-1`} />
                  <DelBtn onClick={() => setT5StatCards((pp) => pp.filter((_, j) => j !== i))} />
                </div>
              ))}
              <AddBtn label="Add Stat Card" onClick={() => setT5StatCards((pp) => [...pp, { icon: "file", value: "", label: "" }])} />
            </Panel>
            <BatchPanel value={batchInfo} onChange={setBatchInfo} />
          </Fragment>
        );
      case "tools":
        return <ToolsPanel key={id} value={tools} onChange={setTools} panel={p} leading={headingLeading("tools")} />;
      case "demoVideo":
        return <VideosPanel key={id} value={videos} onChange={setVideos} panel={p} leading={headingLeading("demoVideo")} />;
      case "instructors":
        return (
          <InstructorsPanel key={id} value={instructors} onChange={setInstructors}
            teachers={teachers} teachersLoading={teachersLoading} onLoadTeachers={loadTeachers}
            panel={p} leading={headingLeading("instructors")} />
        );
      case "about":
        return (
          <Panel key={id} title="About / Outcomes" {...p}>
            <p className="text-xs text-gray-400">Uses the hero subtitle plus built-in outcome tags — no separate fields. Use the arrows to reposition.</p>
          </Panel>
        );
      case "whatYouGet":
        return <WhatYouGetPanel key={id} value={whatYouGet} onChange={setWhatYouGet} panel={p} leading={headingLeading("whatYouGet")} />;
      case "whoFor":
        return (
          <Panel key={id} title="Who Is This For" {...p}>
            <div><Lbl text="Section Title" /><input value={t5WhoFor.title ?? ""} onChange={(e) => setT5WhoFor((pp) => ({ ...pp, title: e.target.value }))} placeholder="কাদের প্রয়োজন" className={inputCls} /></div>
            {(t5WhoFor.items ?? []).map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={item} onChange={(e) => setT5WhoFor((pp) => ({ ...pp, items: (pp.items ?? []).map((x, j) => j === i ? e.target.value : x) }))} placeholder="যারা ভিডিও এডিটিং শিখতে চান" className={`${inputCls} flex-1`} />
                <DelBtn onClick={() => setT5WhoFor((pp) => ({ ...pp, items: (pp.items ?? []).filter((_, j) => j !== i) }))} />
              </div>
            ))}
            <AddBtn label="Add Item" onClick={() => setT5WhoFor((pp) => ({ ...pp, items: [...(pp.items ?? []), ""] }))} />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div><Lbl text="CTA Button Text" /><input value={t5WhoFor.ctaText ?? ""} onChange={(e) => setT5WhoFor((pp) => ({ ...pp, ctaText: e.target.value }))} placeholder="Free Career Consultancy" className={inputCls} /></div>
              <div><Lbl text="CTA URL (optional)" /><input value={t5WhoFor.ctaUrl ?? ""} onChange={(e) => setT5WhoFor((pp) => ({ ...pp, ctaUrl: e.target.value }))} placeholder="/contact" className={inputCls} /></div>
            </div>
          </Panel>
        );
      case "projects":
        return (
          <Panel key={id} title="Real-life Projects" {...p}>
            <div><Lbl text="Section Title" /><input value={t5RealProjects.title ?? ""} onChange={(e) => setT5RealProjects((pp) => ({ ...pp, title: e.target.value }))} placeholder="যেসব রিয়েল লাইফ প্রজেক্ট করানো হবে" className={inputCls} /></div>
            {(t5RealProjects.items ?? []).map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={item} onChange={(e) => setT5RealProjects((pp) => ({ ...pp, items: (pp.items ?? []).map((x, j) => j === i ? e.target.value : x) }))} placeholder="Documentary Video Edit" className={`${inputCls} flex-1`} />
                <DelBtn onClick={() => setT5RealProjects((pp) => ({ ...pp, items: (pp.items ?? []).filter((_, j) => j !== i) }))} />
              </div>
            ))}
            <AddBtn label="Add Project" onClick={() => setT5RealProjects((pp) => ({ ...pp, items: [...(pp.items ?? []), ""] }))} />
          </Panel>
        );
      case "curriculum":
        return (
          <CurriculumPanel key={id} value={curriculum} onChange={setCurriculum}
            lessonIcon={lessonIcon} onLessonIcon={setLessonIcon} showLessonIcon={usesLessonIcon}
            panel={p} leading={headingLeading("curriculum")} />
        );
      case "roadmap":
        return (
          <Panel key={id} title="Roadmap Timeline" {...p}>
            <div><Lbl text="Section Title" /><input value={t5Roadmap.title ?? ""} onChange={(e) => setT5Roadmap((pp) => ({ ...pp, title: e.target.value }))} placeholder="🎬 NextGen Video Editor হবার রোডম্যাপ" className={inputCls} /></div>
            {(t5Roadmap.steps ?? []).map((step, i) => (
              <div key={i} className="space-y-1.5 rounded-lg border border-gray-100 p-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-400">#{i + 1}</span>
                  <input value={step.title} onChange={(e) => setT5Roadmap((pp) => ({ ...pp, steps: (pp.steps ?? []).map((x, j) => j === i ? { ...x, title: e.target.value } : x) }))} placeholder="Step title" className={`${inputCls} flex-1`} />
                  <DelBtn onClick={() => setT5Roadmap((pp) => ({ ...pp, steps: (pp.steps ?? []).filter((_, j) => j !== i) }))} />
                </div>
                <textarea value={step.description ?? ""} onChange={(e) => setT5Roadmap((pp) => ({ ...pp, steps: (pp.steps ?? []).map((x, j) => j === i ? { ...x, description: e.target.value } : x) }))} rows={2} placeholder="Step description" className={inputCls} />
              </div>
            ))}
            <AddBtn label="Add Step" onClick={() => setT5Roadmap((pp) => ({ ...pp, steps: [...(pp.steps ?? []), { title: "", description: "" }] }))} />
          </Panel>
        );
      case "certificate":
        return (
          <Panel key={id} title="Certificate" {...p}>
            <div><Lbl text="Section Title" /><input value={certTitle} onChange={(e) => setCertTitle(e.target.value)} placeholder="সার্টিফিকেট" className={inputCls} /></div>
            <div><Lbl text="Description" /><textarea value={certDesc} onChange={(e) => setCertDesc(e.target.value)} rows={2} placeholder="কোর্স শেষে পাবেন..." className={inputCls} /></div>
            <div><Lbl text="Certificate Image URL" /><ImagePickerField value={certImg} onChange={setCertImg} /></div>
          </Panel>
        );
      case "faq":
        return <FaqPanel key={id} value={faqItems} onChange={setFaqItems} panel={p} leading={headingLeading("faq")} />;
      case "enrollment":
        return (
          <Panel key={id} title="Enrollment Form" {...p}>
            <p className="text-xs text-gray-400">
              This section has no editable content here — use the arrows to position the enrollment form among the page sections.
            </p>
          </Panel>
        );
      default:
        return null;
    }
  }

  // Render one Template 6 (Medical) section card, in the user-defined order.
  function renderT6Section(id: string, idx: number): ReactNode {
    const p = mv(idx);
    switch (id) {
      case "hero":
        return (
          <Panel key={id} title="Hero" {...p}>
            <div><Lbl text="Headline" /><input value={heroHeadline} onChange={(e) => setHeroHeadline(e.target.value)} placeholder="মানবদেহের গঠন জানুন" className={inputCls} /></div>
            <div><Lbl text="Headline Highlight" /><input value={heroHeadlineHl} onChange={(e) => setHeroHeadlineHl(e.target.value)} placeholder="Anatomy & Physiology" className={inputCls} /></div>
            <div><Lbl text="Headline After" /><input value={heroHeadlineAfter} onChange={(e) => setHeroHeadlineAfter(e.target.value)} placeholder="চিকিৎসাবিজ্ঞানের ভিত্তি গড়ুন" className={inputCls} /></div>
            <div><Lbl text="Subheadline" /><textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} rows={2} placeholder="Basic Concept of Anatomy & Physiology..." className={inputCls} /></div>
            <div><Lbl text="Banner Image" /><ImagePickerField value={heroBanner} onChange={setHeroBanner} /></div>
            <div><Lbl text="Anatomical Illustration URL" /><ImagePickerField value={t6AnatomicalImage} onChange={setT6AnatomicalImage} /></div>
            <div><Lbl text="CTA Button Text" /><input value={heroCtaText} onChange={(e) => setHeroCtaText(e.target.value)} placeholder="এখনই ভর্তি হোন" className={inputCls} /></div>
            <div><Lbl text="Secondary Button Text" /><input value={heroSecondaryBtn} onChange={(e) => setHeroSecondaryBtn(e.target.value)} placeholder="কোর্স সম্পর্কে ভিডিও দেখুন" className={inputCls} /></div>
          </Panel>
        );
      case "pricingCard":
        return (
          <Panel key={id} title="Pricing Card" {...p}>
            <Lbl text="Header" />
            <input value={t6HeroPricingCard.header ?? ""} onChange={(e) => setTHeroPricingCard((pp) => ({ ...pp, header: e.target.value }))} placeholder="ভর্তি ও ফি সংক্রান্ত তথ্য" className={inputCls} />
            <Lbl text="CTA Text" />
            <input value={t6HeroPricingCard.ctaText ?? ""} onChange={(e) => setTHeroPricingCard((pp) => ({ ...pp, ctaText: e.target.value }))} placeholder="এখনই ভর্তি হোন" className={inputCls} />

            <div className="mt-2">
              <Lbl text="Pricing Tiers" />
              {(t6HeroPricingCard.tiers ?? []).map((tier, i) => (
                <div key={i} className="flex items-center gap-1 mb-1">
                  <select value={tier.icon ?? ""} onChange={(e) => setTHeroPricingCard((pp) => ({ ...pp, tiers: (pp.tiers ?? []).map((x, j) => j === i ? { ...x, icon: e.target.value } : x) }))} className={`${inputCls} w-20 text-xs`}>
                    <option value="">-</option>
                    <option value="edit">Pencil</option>
                    <option value="calendar">Calendar</option>
                    <option value="repeat">Repeat</option>
                  </select>
                  <input value={tier.label} onChange={(e) => setTHeroPricingCard((pp) => ({ ...pp, tiers: (pp.tiers ?? []).map((x, j) => j === i ? { ...x, label: e.target.value } : x) }))} placeholder="Label" className={`${inputCls} w-24 text-xs`} />
                  <input value={tier.value} onChange={(e) => setTHeroPricingCard((pp) => ({ ...pp, tiers: (pp.tiers ?? []).map((x, j) => j === i ? { ...x, value: e.target.value } : x) }))} placeholder="Value" className={`${inputCls} w-20 text-xs`} />
                  <input value={tier.suffix ?? ""} onChange={(e) => setTHeroPricingCard((pp) => ({ ...pp, tiers: (pp.tiers ?? []).map((x, j) => j === i ? { ...x, suffix: e.target.value } : x) }))} placeholder="/ মাস" className={`${inputCls} w-16 text-xs`} />
                  <DelBtn onClick={() => setTHeroPricingCard((pp) => ({ ...pp, tiers: (pp.tiers ?? []).filter((_, j) => j !== i) }))} />
                </div>
              ))}
              <AddBtn label="Add Tier" onClick={() => setTHeroPricingCard((pp) => ({ ...pp, tiers: [...(pp.tiers ?? []), { icon: "", label: "", value: "", suffix: "" }] }))} />
            </div>

            <div className="mt-2 rounded-lg border border-red-100 bg-red-50/50 p-2">
              <Lbl text="Highlighted Tier" />
              <div className="flex gap-1">
                <input value={t6HeroPricingCard.highlighted?.label ?? ""} onChange={(e) => setTHeroPricingCard((pp) => ({ ...pp, highlighted: { ...pp.highlighted, label: e.target.value, value: pp.highlighted?.value ?? "", suffix: pp.highlighted?.suffix } }))} placeholder="Label" className={`${inputCls} flex-1 text-xs`} />
                <input value={t6HeroPricingCard.highlighted?.value ?? ""} onChange={(e) => setTHeroPricingCard((pp) => ({ ...pp, highlighted: { ...pp.highlighted, value: e.target.value, label: pp.highlighted?.label, suffix: pp.highlighted?.suffix } }))} placeholder="Value" className={`${inputCls} w-20 text-xs`} />
              </div>
              <div className="flex gap-1 mt-1">
                <input value={t6HeroPricingCard.highlighted?.suffix ?? ""} onChange={(e) => setTHeroPricingCard((pp) => ({ ...pp, highlighted: { ...pp.highlighted, suffix: e.target.value, label: pp.highlighted?.label, value: pp.highlighted?.value ?? "" } }))} placeholder="/ বছর" className={`${inputCls} flex-1 text-xs`} />
                <input value={t6HeroPricingCard.highlighted?.badge ?? ""} onChange={(e) => setTHeroPricingCard((pp) => ({ ...pp, highlighted: { ...pp.highlighted, badge: e.target.value, label: pp.highlighted?.label, value: pp.highlighted?.value ?? "" } }))} placeholder="Badge" className={`${inputCls} flex-1 text-xs`} />
              </div>
            </div>
          </Panel>
        );
      case "statsBar":
        return (
          <Panel key={id} title="Stats Bar" {...p}>
            <p className="text-xs text-gray-400">Statistics cards displayed below the hero (e.g. ৩০০ জন শিক্ষার্থী, ৯৩টি ক্লাস).</p>
            {t6Stats.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={s.value} onChange={(e) => setT6Stats((pp) => pp.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} placeholder="৩০০" className={`${inputCls} w-24`} />
                <input value={s.label} onChange={(e) => setT6Stats((pp) => pp.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="সক্রিয় শিক্ষার্থী" className={`${inputCls} flex-1`} />
                <DelBtn onClick={() => setT6Stats((pp) => pp.filter((_, j) => j !== i))} />
              </div>
            ))}
            <AddBtn label="Add Stat" onClick={() => setT6Stats((pp) => [...pp, { value: "", label: "" }])} />
          </Panel>
        );
      case "comparison":
        return (
          <Panel key={id} title="Comparison Table" {...p}>
            <p className="text-xs text-gray-400">Feature comparison between self-study and live course.</p>
            {t6Comparison.map((row, i) => (
              <div key={i} className="space-y-1 rounded-lg border border-gray-100 p-2">
                <div className="flex items-center gap-2">
                  <input value={row.feature} onChange={(e) => setT6Comparison((pp) => pp.map((x, j) => j === i ? { ...x, feature: e.target.value } : x))} placeholder="Feature name" className={`${inputCls} flex-1`} />
                  <DelBtn onClick={() => setT6Comparison((pp) => pp.filter((_, j) => j !== i))} />
                </div>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-1"><input type="checkbox" checked={row.selfStudy} onChange={(e) => setT6Comparison((pp) => pp.map((x, j) => j === i ? { ...x, selfStudy: e.target.checked } : x))} /> Self Study</label>
                  <label className="flex items-center gap-1"><input type="checkbox" checked={row.liveCourse} onChange={(e) => setT6Comparison((pp) => pp.map((x, j) => j === i ? { ...x, liveCourse: e.target.checked } : x))} /> Live Course</label>
                </div>
              </div>
            ))}
            <AddBtn label="Add Feature Row" onClick={() => setT6Comparison((pp) => [...pp, { feature: "", selfStudy: false, liveCourse: true }])} />
          </Panel>
        );
      case "organGrid":
        return (
          <Panel key={id} title="Organ Grid" {...p}>
            <p className="text-xs text-gray-400">Organ illustration cards (Brain, Heart, Lungs, etc.).</p>
            {t6Organs.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={o.name} onChange={(e) => setT6Organs((pp) => pp.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Brain" className={`${inputCls} flex-1`} />
                <input value={o.icon ?? ""} onChange={(e) => setT6Organs((pp) => pp.map((x, j) => j === i ? { ...x, icon: e.target.value } : x))} placeholder="Icon URL" className={`${inputCls} w-32`} />
                <DelBtn onClick={() => setT6Organs((pp) => pp.filter((_, j) => j !== i))} />
              </div>
            ))}
            <AddBtn label="Add Organ" onClick={() => setT6Organs((pp) => [...pp, { name: "", icon: "" }])} />
          </Panel>
        );
      case "curriculum":
        return (
          <CurriculumPanel key={id} value={curriculum} onChange={setCurriculum}
            lessonIcon={lessonIcon} onLessonIcon={setLessonIcon} showLessonIcon={usesLessonIcon}
            panel={p} leading={headingLeading("curriculum")} />
        );
      case "instructor":
        return (
          <Panel key={id} title="Instructor" {...p}>
            <div><Lbl text="Name" /><input value={t6Instructor.name ?? ""} onChange={(e) => setT6Instructor((pp) => ({ ...pp, name: e.target.value }))} placeholder="ডা. আল আমিন সূদা" className={inputCls} /></div>
            <div><Lbl text="Title" /><input value={t6Instructor.title ?? ""} onChange={(e) => setT6Instructor((pp) => ({ ...pp, title: e.target.value }))} placeholder="প্রশিক্ষক" className={inputCls} /></div>
            <div><Lbl text="Credentials" /><input value={t6Instructor.credentials ?? ""} onChange={(e) => setT6Instructor((pp) => ({ ...pp, credentials: e.target.value }))} placeholder="যুক্তরাজ্যের..." className={inputCls} /></div>
            <div><Lbl text="Hospital" /><input value={t6Instructor.hospital ?? ""} onChange={(e) => setT6Instructor((pp) => ({ ...pp, hospital: e.target.value }))} placeholder="হোমিও সেবা কেন্দ্র" className={inputCls} /></div>
            <div><Lbl text="Photo URL" /><ImagePickerField value={t6Instructor.photo ?? ""} onChange={(v) => setT6Instructor((pp) => ({ ...pp, photo: v }))} /></div>
          </Panel>
        );
      case "whoFor":
        return (
          <Panel key={id} title="Who Is This For" {...p}>
            <div><Lbl text="Section Title" /><input value={t6WhoFor.title ?? ""} onChange={(e) => setT6WhoFor((pp) => ({ ...pp, title: e.target.value }))} placeholder="এই কোর্সে যা যা পাচ্ছেন" className={inputCls} /></div>
            {(t6WhoFor.items ?? []).map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={item} onChange={(e) => setT6WhoFor((pp) => ({ ...pp, items: (pp.items ?? []).map((x, j) => j === i ? e.target.value : x) }))} placeholder="Feature item" className={`${inputCls} flex-1`} />
                <DelBtn onClick={() => setT6WhoFor((pp) => ({ ...pp, items: (pp.items ?? []).filter((_, j) => j !== i) }))} />
              </div>
            ))}
            <AddBtn label="Add Item" onClick={() => setT6WhoFor((pp) => ({ ...pp, items: [...(pp.items ?? []), ""] }))} />
          </Panel>
        );
      case "valueBreakdown":
        return (
          <Panel key={id} title="Value / Pricing" {...p}>
            <p className="text-xs text-gray-400">Pricing tiers for the course (one-time, monthly, annual).</p>
            {(t6Pricing.tiers ?? []).map((tier, i) => (
              <div key={i} className="space-y-1 rounded-lg border border-gray-100 p-2">
                <div className="flex items-center gap-2">
                  <input value={tier.name} onChange={(e) => setT6Pricing((pp) => ({ ...pp, tiers: (pp.tiers ?? []).map((x, j) => j === i ? { ...x, name: e.target.value } : x) }))} placeholder="Tier name" className={`${inputCls} flex-1`} />
                  <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={tier.highlighted ?? false} onChange={(e) => setT6Pricing((pp) => ({ ...pp, tiers: (pp.tiers ?? []).map((x, j) => j === i ? { ...x, highlighted: e.target.checked } : x) }))} /> Featured</label>
                  <DelBtn onClick={() => setT6Pricing((pp) => ({ ...pp, tiers: (pp.tiers ?? []).filter((_, j) => j !== i) }))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Lbl text="Price" /><input value={tier.price} onChange={(e) => setT6Pricing((pp) => ({ ...pp, tiers: (pp.tiers ?? []).map((x, j) => j === i ? { ...x, price: e.target.value } : x) }))} placeholder="৮৫,০০০" className={inputCls} /></div>
                  <div><Lbl text="Period" /><input value={tier.period} onChange={(e) => setT6Pricing((pp) => ({ ...pp, tiers: (pp.tiers ?? []).map((x, j) => j === i ? { ...x, period: e.target.value } : x) }))} placeholder="এককালীন" className={inputCls} /></div>
                </div>
              </div>
            ))}
            <AddBtn label="Add Pricing Tier" onClick={() => setT6Pricing((pp) => ({ ...pp, tiers: [...(pp.tiers ?? []), { name: "", price: "", period: "", features: [], highlighted: false }] }))} />
          </Panel>
        );
      case "video":
        return (
          <Panel key={id} title="Intro Video" {...p}>
            <div><Lbl text="Video URL" /><input value={t6Video} onChange={(e) => setT6Video(e.target.value)} placeholder="https://youtube.com/..." className={inputCls} /></div>
          </Panel>
        );
      case "faq":
        return <FaqPanel key={id} value={faqItems} onChange={setFaqItems} panel={p} leading={headingLeading("faq")} />;
      case "testimonials":
        return (
          <Panel key={id} title="Testimonials" {...p}>
            {t6Testimonials.map((t, i) => (
              <div key={i} className="space-y-1 rounded-lg border border-gray-100 p-2">
                <div className="flex items-center gap-2">
                  <input value={t.name} onChange={(e) => setT6Testimonials((pp) => pp.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Student name" className={`${inputCls} flex-1`} />
                  <DelBtn onClick={() => setT6Testimonials((pp) => pp.filter((_, j) => j !== i))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Lbl text="Rating" /><input type="number" min={1} max={5} value={t.rating ?? 5} onChange={(e) => setT6Testimonials((pp) => pp.map((x, j) => j === i ? { ...x, rating: Number(e.target.value) } : x))} className={inputCls} /></div>
                  <div><Lbl text="Photo URL" /><ImagePickerField value={t.photo ?? ""} onChange={(v) => setT6Testimonials((pp) => pp.map((x, j) => j === i ? { ...x, photo: v } : x))} /></div>
                </div>
                <div><Lbl text="Review Text" /><textarea value={t.text} onChange={(e) => setT6Testimonials((pp) => pp.map((x, j) => j === i ? { ...x, text: e.target.value } : x))} rows={2} placeholder="Review text" className={inputCls} /></div>
              </div>
            ))}
            <AddBtn label="Add Testimonial" onClick={() => setT6Testimonials((pp) => [...pp, { name: "", rating: 5, text: "", photo: "" }])} />
          </Panel>
        );
      case "enrollment":
        return (
          <Panel key={id} title="Enrollment Form" {...p}>
            <p className="text-xs text-gray-400">
              This section has no editable content here — use the arrows to position the enrollment form among the page sections.
            </p>
          </Panel>
        );
      default:
        return null;
    }
  }

  // ── Live preview data ───────────────────────────────────────────────────────
  const previewData: LiveCourseTemplateData = {
    id:               course?.id,
    styleOverrides,
    lessonIcon:       lessonIcon || undefined,
    valueSection:     Object.values(valueSection).some(Boolean) ? valueSection : undefined,
    sectionHeadings,
    sectionOrder,
    title:            title || "Course Title",
    slug,
    price:            price || "0",
    originalPrice:    originalPrice || null,
    totalValue:       totalValue || null,
    totalLiveClasses: totalLiveClasses || null,
    totalModules:     totalModules || null,
    countdownEnd:     countdownEnd ? new Date(countdownEnd).toISOString() : null,
    hero: {
      badgeText:        heroBadge        || undefined,
      subtitle:         heroSubtitle     || undefined,
      bannerImage:      heroBanner       || undefined,
      rating:           heroRating       ? parseFloat(heroRating)       : undefined,
      ratingCount:      heroRatingCount  ? parseInt(heroRatingCount)    : undefined,
      ctaText:          heroCtaText      || undefined,
      promoText:        heroPromoText    || undefined,
      studentCountText: heroStudentCount || undefined,
    },
    paymentLogos,
    batchInfo: Object.values(batchInfo).some(Boolean) ? batchInfo : undefined,
    curriculum,
    tools,
    whyDifferent: whyItems,
    stats: (statsStudents || statsRatings || statsCompletion || statsExtra) ? {
      studentsCount:  statsStudents  || undefined,
      ratingsCount:   statsRatings   || undefined,
      completionRate: statsCompletion || undefined,
      extra:          statsExtra     || undefined,
      labels: statsLabels.some((l) => l.trim()) ? statsLabels : undefined,
    } : undefined,
    instructors,
    whatYouGet,
    videos,
    testimonials,
    valueItems,
  };

  // ── Build DTO ────────────────────────────────────────────────────────────────
  function buildDto(): UpsertLiveCourseDto {
    const hero: LiveCourseSection["hero"] & {
      headline?: string; headlineHighlight?: string; headlineAfter?: string; secondaryCtaText?: string;
    } = {};
    if (heroBadge.trim())          hero.badgeText          = heroBadge.trim();
    if (heroSubtitle.trim())       hero.subtitle           = heroSubtitle.trim();
    if (heroRating.trim())         hero.rating             = parseFloat(heroRating);
    if (heroRatingCount.trim())    hero.ratingCount        = parseInt(heroRatingCount);
    if (heroCtaText.trim())        hero.ctaText            = heroCtaText.trim();
    if (heroSecondaryBtn.trim())   hero.secondaryCtaText   = heroSecondaryBtn.trim();
    if (heroPromoText.trim())      hero.promoText          = heroPromoText.trim();
    if (heroStudentCount.trim())   hero.studentCountText   = heroStudentCount.trim();
    if (t6AnatomicalImage.trim())  (hero as any).anatomicalImage = t6AnatomicalImage.trim();
    if (t6HeroInfoBadges.length)   (hero as any).infoBadges     = t6HeroInfoBadges;
    if (t6HeroPricingCard.header || (t6HeroPricingCard.tiers ?? []).length) (hero as any).pricingCard = t6HeroPricingCard;
    if (isTemplate2) {
      // For T2 the video URL is stored in heroBanner state but sent as videoUrl
      if (heroBanner.trim())         (hero as any).videoUrl         = heroBanner.trim();
      if (heroBannerImage.trim())    hero.bannerImage       = heroBannerImage.trim();
      if (heroHeadline.trim())       hero.headline          = heroHeadline.trim();
      if (heroHeadlineHl.trim())     hero.headlineHighlight = heroHeadlineHl.trim();
      if (heroHeadlineAfter.trim())  hero.headlineAfter     = heroHeadlineAfter.trim();
    } else if (isTemplate4) {
      // For T4 heroBanner stores the YouTube video URL; heroHeadline* stores 3-line headline
      if (heroBanner.trim())         (hero as any).videoUrl         = heroBanner.trim();
      if (heroBannerImage.trim())    hero.bannerImage       = heroBannerImage.trim();
      if (heroHeadline.trim())       hero.headline          = heroHeadline.trim();
      if (heroHeadlineHl.trim())     hero.headlineHighlight = heroHeadlineHl.trim();
      if (heroHeadlineAfter.trim())  hero.headlineAfter     = heroHeadlineAfter.trim();
      if (t4HeroQuestion.trim())     (hero as any).questionText     = t4HeroQuestion.trim();
    } else if (isTemplate6) {
      if (heroBanner.trim())         hero.bannerImage       = heroBanner.trim();
      if (heroHeadline.trim())       hero.headline          = heroHeadline.trim();
      if (heroHeadlineHl.trim())     hero.headlineHighlight = heroHeadlineHl.trim();
      if (heroHeadlineAfter.trim())  hero.headlineAfter     = heroHeadlineAfter.trim();
    } else {
      if (heroBanner.trim())         hero.bannerImage       = heroBanner.trim();
    }

    const stats: LiveCourseSection["stats"] = {};
    if (statsStudents.trim())   stats.studentsCount  = statsStudents.trim();
    if (statsRatings.trim())    stats.ratingsCount   = statsRatings.trim();
    if (statsCompletion.trim()) stats.completionRate = statsCompletion.trim();
    if (statsExtra.trim())      stats.extra          = statsExtra.trim();
    if (statsLabels.some((l) => l.trim())) stats.labels = statsLabels;

    const cleanBatch: LiveCourseSection["batchInfo"] = {};
    if (batchInfo.startDate?.trim())      cleanBatch.startDate      = batchInfo.startDate.trim();
    if (batchInfo.liveSchedule?.trim())   cleanBatch.liveSchedule   = batchInfo.liveSchedule.trim();
    if (batchInfo.supportSchedule?.trim()) cleanBatch.supportSchedule = batchInfo.supportSchedule.trim();
    if (batchInfo.seatsLeft?.trim())      cleanBatch.seatsLeft      = batchInfo.seatsLeft.trim();

    const base = {
      styleOverrides,
      lessonIcon:                   lessonIcon || null,
      valueSection,
      sectionHeadings,
      sectionOrder,
      title:                        title.trim(),
      slug:                         slug.trim(),
      price:                        price.trim(),
      originalPrice:                originalPrice.trim() || null,
      hasSubscription,
      monthlyPrice:                 hasSubscription ? (monthlyPrice.trim() || null) : null,
      totalValue:                   totalValue.trim() || null,
      totalLiveClasses:             totalLiveClasses.trim() || null,
      totalModules:                 totalModules.trim() || null,
      countdownEnd:                 countdownEnd ? new Date(countdownEnd).toISOString() : null,
      template:                     dbTemplate,
      requireSequentialProgress,
      hasLifetimeAccess,
      showBadge,
      accessDurationDays:           hasLifetimeAccess ? undefined : (Number(accessDurationDays) || undefined),
      courseType,
      bundledCourseIds:             courseType === 'bundle' ? bundledCourseIds : [],
      hero:             Object.keys(hero).length ? hero : undefined,
      paymentLogos:     paymentLogos.filter((l) => l.name.trim()),
      batchInfo:        Object.keys(cleanBatch).length ? cleanBatch : undefined,
      curriculum:       curriculum.filter((c) => c.title.trim()).map((c) => ({
        title: c.title.trim(), lessons: c.lessons.filter((l) => l.trim()),
      })),
      tools:            tools.filter((t) => t.name.trim()),
      whyDifferent:     whyItems.filter((w) => w.title.trim()),
      stats:            Object.keys(stats).length ? stats : undefined,
      instructors:      instructors.filter((i) => i.name.trim()),
      whatYouGet:       whatYouGet.filter((w) => w.title.trim()),
      videos:           videos.filter((v) => v.url.trim()),
      testimonials:     testimonials.filter((t) => t.name.trim() && t.review.trim()),
      valueItems:       valueItems.filter((v) => v.title.trim() && v.value.trim()),
    };

    if (isTemplate2) {
      return {
        ...base,
        faq:             faqItems.filter((f) => f.question.trim()),
        comparisonTable: {
          col1Label: compCol1.trim() || undefined,
          col2Label: compCol2.trim() || undefined,
          rows:      compRows.filter((r) => r.feature.trim()),
        },
        videoTabs:       videoTabs.filter((t) => t.category.trim()),
        pcRequirements: {
          basic:    Object.values(pcBasic).some(Boolean) ? pcBasic : undefined,
          pro:      Object.values(pcPro).some(Boolean) ? pcPro : undefined,
          internet: pcInternet.trim() || undefined,
        },
        ctaBanner: {
          label: ctaBLabel.trim() || undefined,
          title: ctaBTitle.trim() || undefined,
          price: ctaBPrice.trim() || undefined,
          originalPrice: ctaBOrigPrice.trim() || undefined,
          buttonText: ctaBBtn.trim() || undefined,
          installment1: ctaBInst1.trim() || undefined,
          installment2: ctaBInst2.trim() || undefined,
        },
        certificate: {
          title: certTitle.trim() || undefined,
          highlight: certHl.trim() || undefined,
          description: certDesc.trim() || undefined,
          image: certImg.trim() || undefined,
          founderName: certFounder.trim() || undefined,
          founderRole: certRole.trim() || undefined,
        },
        urgencyCta: {
          batchLabel: urgLabel.trim() || undefined,
          title: urgTitle.trim() || undefined,
          highlight: urgHl.trim() || undefined,
          subtitle: urgSub.trim() || undefined,
          buttonText: urgBtn.trim() || undefined,
          whatsapp: urgWa.trim() || undefined,
        },
      } as UpsertLiveCourseDto;
    }

    if (isTemplate3) {
      return {
        ...base,
        marqueeText:       t3Marquee.trim() || null,
        announcementBar:   (t3AnnounceText || t3AnnounceBtn) ? {
          text:      t3AnnounceText.trim()  || undefined,
          ctaText:   t3AnnounceBtn.trim()   || undefined,
          ctaAnchor: t3AnnounceAnchor.trim() || undefined,
        } : undefined,
        blueprintSection:  (t3BlueprintTitle || t3BlueprintImg) ? {
          title:    t3BlueprintTitle.trim() || undefined,
          subtitle: t3BlueprintSub.trim()   || undefined,
          image:    t3BlueprintImg.trim()   || undefined,
        } : undefined,
        whyJoinItems:      t3WhyItems.filter((i) => i.trim()),
        featuresGrid:      (t3FeaturesTitle || t3FeatureItems.length) ? {
          title:    t3FeaturesTitle.trim() || undefined,
          subtitle: t3FeaturesSub.trim()   || undefined,
          items:    t3FeatureItems.filter((i) => i.text.trim()),
        } : undefined,
        bonusChecklist:    (t3BonusTitle || t3BonusItems.length) ? {
          title: t3BonusTitle.trim() || undefined,
          items: t3BonusItems.filter((i) => i.trim()),
        } : undefined,
        challengeSection:  (t3ChallengeTitle || t3ChallengeDesc) ? {
          title:      t3ChallengeTitle.trim() || undefined,
          monthCount: t3ChallengeMonth.trim() || undefined,
          description:t3ChallengeDesc.trim()  || undefined,
          linkText:   t3ChallengeLink.trim()  || undefined,
        } : undefined,
        supportLevels:     (t3LevelsTitle || t3Levels.length) ? {
          title:    t3LevelsTitle.trim() || undefined,
          subtitle: t3LevelsSub.trim()   || undefined,
          levels:   t3Levels.filter((l) => l.label.trim()),
        } : undefined,
        salesUpdateSlider: (t3SalesTitle || t3SalesImages.length) ? {
          title:    t3SalesTitle.trim() || undefined,
          subtitle: t3SalesSub.trim()   || undefined,
          images:   t3SalesImages.filter((i) => i.trim()),
        } : undefined,
        communitySection:  (t3CommTitle || t3CommImages.length) ? {
          title:    t3CommTitle.trim()   || undefined,
          subtitle: t3CommSub.trim()     || undefined,
          caption:  t3CommCaption.trim() || undefined,
          images:   t3CommImages.filter((i) => i.trim()),
        } : undefined,
        textReviewsSlider: (t3ReviewsTitle || t3Reviews.length) ? {
          title:   t3ReviewsTitle.trim() || undefined,
          reviews: t3Reviews.filter((r) => r.name.trim()),
        } : undefined,
        successStories:    (t3StoriesTitle || t3Stories.length) ? {
          title:   t3StoriesTitle.trim() || undefined,
          stories: t3Stories.filter((s) => s.name.trim()),
        } : undefined,
        videoGrid:         (t3VidGridTitle || t3VidGridItems.length) ? {
          title:  t3VidGridTitle.trim() || undefined,
          videos: t3VidGridItems.filter((v) => v.url.trim()),
        } : undefined,
        faq:               faqItems.filter((f) => f.question.trim()),
        faqContactButtons: (t3MessengerUrl || t3Phone) ? {
          messengerUrl: t3MessengerUrl.trim() || undefined,
          phone:        t3Phone.trim()        || undefined,
        } : undefined,
        footerBranding:    (t3BrandName || t3Tagline || t3Copyright) ? {
          brandName:  t3BrandName.trim()  || undefined,
          tagline:    t3Tagline.trim()    || undefined,
          copyright:  t3Copyright.trim() || undefined,
        } : undefined,
      } as UpsertLiveCourseDto;
    }

    if (isTemplate4) {
      return {
        ...base,
        t4LiveSessionCard: Object.values(t4LiveSessionCard).some(Boolean) ? t4LiveSessionCard : undefined,
        t4StudentProgress: (t4StudentProgress.title || (t4StudentProgress.images ?? []).length) ? t4StudentProgress : undefined,
        t4ForWhomSection:  (t4ForWhomSection.title || (t4ForWhomSection.cards ?? []).length) ? t4ForWhomSection : undefined,
        t4InstructorStory: (t4InstructorStory.bio || t4InstructorStory.videoUrl) ? t4InstructorStory : undefined,
        t4ModuleGrid:      (t4ModuleGrid.title || (t4ModuleGrid.modules ?? []).length) ? t4ModuleGrid : undefined,
        t4PricingSection:  Object.values(t4PricingSection).some(Boolean) ? t4PricingSection : undefined,
        t4SupportSection:  (t4SupportSection.title || t4SupportSection.content) ? t4SupportSection : undefined,
        t4CountdownBanner: (t4CountdownBanner.text || t4CountdownBanner.ctaText) ? t4CountdownBanner : undefined,
        faq:               faqItems.filter((f) => f.question.trim()),
      } as UpsertLiveCourseDto;
    }

    if (isTemplate5) {
      return {
        ...base,
        t5StatCards:    t5StatCards.filter((s) => (s.label?.trim() || s.value?.trim())),
        t5WhoFor:       (t5WhoFor.title || (t5WhoFor.items ?? []).length) ? t5WhoFor : undefined,
        t5RealProjects: (t5RealProjects.title || (t5RealProjects.items ?? []).length) ? t5RealProjects : undefined,
        t5Roadmap:      (t5Roadmap.title || (t5Roadmap.steps ?? []).length) ? t5Roadmap : undefined,
        faq:            faqItems.filter((f) => f.question.trim()),
      } as UpsertLiveCourseDto;
    }

    if (isTemplate6) {
      return {
        ...base,
        t6Credentials:   t6Credentials.filter((c) => c.label.trim()),
        t6Stats:         t6Stats.filter((s) => s.label.trim()),
        t6Comparison:    t6Comparison.filter((r) => r.feature.trim()),
        t6Organs:        t6Organs.filter((o) => o.name.trim()),
        t6Instructor:    (t6Instructor.name || t6Instructor.title) ? t6Instructor : undefined,
        t6WhoFor:        (t6WhoFor.title || (t6WhoFor.items ?? []).length) ? t6WhoFor : undefined,
        t6Pricing:       (t6Pricing.tiers ?? []).length ? t6Pricing : undefined,
        t6Video:         t6Video.trim() || undefined,
        t6Testimonials:  t6Testimonials.filter((t) => t.name.trim() || t.text.trim()),
        faq:             faqItems.filter((f) => f.question.trim()),
      } as UpsertLiveCourseDto;
    }

    return base as UpsertLiveCourseDto;
  }

  function handleSave() {
    if (!title.trim()) { setError("Title is required"); return; }
    if (!price.trim()) { setError("Price is required"); return; }
    if (courseType === 'bundle' && bundledCourseIds.length === 0) {
      setError("A bundle must include at least one recorded course");
      return;
    }
    setError(null);
    startTransition(async () => {
      const dto = buildDto();
      const res = mode === "create"
        ? await createLiveCourseAction(dto)
        : await updateLiveCourseAction(course!.id, dto);
      if (res.error) {
        setError(res.error);
        toast.error(res.error);
      } else {
        if (mode === "create") {
          toast.success("Live course created");
          router.push("/admin/live-courses");
        } else {
          // Edit mode — stay on the editor for further changes.
          toast.success("Live course updated");
        }
        // Bust the client router cache so the list (create) or the preview
        // (edit) re-renders with the latest saved data immediately.
        router.refresh();
      }
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  const templateElement = isTemplate2 ? (
                  <LiveCourseTemplate2
                    course={{
                      id:               course?.id,
                      styleOverrides,
                      lessonIcon:       lessonIcon || undefined,
                      sectionHeadings,
                      sectionOrder,
                      title:            title || "Course Title",
                      slug,
                      price:            price || "0",
                      originalPrice:    originalPrice || null,
                      totalLiveClasses: totalLiveClasses || null,
                      countdownEnd:     countdownEnd ? new Date(countdownEnd).toISOString() : null,
                      hero: {
                        badgeText:          heroBadge          || undefined,
                        headline:           heroHeadline       || undefined,
                        headlineHighlight:  heroHeadlineHl     || undefined,
                        headlineAfter:      heroHeadlineAfter  || undefined,
                        subtitle:           heroSubtitle       || undefined,
                        videoUrl:           heroBanner         || undefined,
                        bannerImage:        heroBannerImage    || undefined,
                        ctaText:            heroCtaText        || undefined,
                        secondaryCtaText:   heroSecondaryBtn   || undefined,
                        promoText:          heroPromoText      || undefined,
                        studentCountText:   heroStudentCount   || undefined,
                        rating:             heroRating         ? parseFloat(heroRating)    : undefined,
                        ratingCount:        heroRatingCount    ? parseInt(heroRatingCount) : undefined,
                      },
                      stats: (statsStudents || statsRatings || statsCompletion || statsExtra) ? {
                        studentsCount:  statsStudents   || undefined,
                        ratingsCount:   statsRatings    || undefined,
                        completionRate: statsCompletion || undefined,
                        extra:          statsExtra      || undefined,
                        labels: statsLabels.some((l) => l.trim()) ? statsLabels : undefined,
                      } : undefined,
                      batchInfo: Object.values(batchInfo).some(Boolean) ? batchInfo : undefined,
                      curriculum,
                      instructors,
                      whyDifferent: whyItems,
                      testimonials,
                      comparisonTable: (compCol1 || compCol2 || compRows.length) ? {
                        col1Label: compCol1 || undefined,
                        col2Label: compCol2 || undefined,
                        rows:      compRows,
                      } : undefined,
                      ctaBanner: (ctaBLabel || ctaBTitle || ctaBPrice) ? {
                        label:         ctaBLabel    || undefined,
                        title:         ctaBTitle    || undefined,
                        price:         ctaBPrice    || undefined,
                        originalPrice: ctaBOrigPrice || undefined,
                        buttonText:    ctaBBtn      || undefined,
                        installment1:  ctaBInst1    || undefined,
                        installment2:  ctaBInst2    || undefined,
                      } : undefined,
                      certificate: (certTitle || certImg) ? {
                        title:       certTitle   || undefined,
                        highlight:   certHl      || undefined,
                        description: certDesc    || undefined,
                        image:       certImg     || undefined,
                        founderName: certFounder || undefined,
                        founderRole: certRole    || undefined,
                      } : undefined,
                      videoTabs:      videoTabs.filter((t) => t.category.trim()),
                      pcRequirements: (Object.values(pcBasic).some(Boolean) || Object.values(pcPro).some(Boolean) || pcInternet) ? {
                        basic:    Object.values(pcBasic).some(Boolean) ? pcBasic : undefined,
                        pro:      Object.values(pcPro).some(Boolean)   ? pcPro   : undefined,
                        internet: pcInternet || undefined,
                      } : undefined,
                      faq:        faqItems,
                      urgencyCta: (urgTitle || urgLabel) ? {
                        batchLabel: urgLabel || undefined,
                        title:      urgTitle || undefined,
                        highlight:  urgHl    || undefined,
                        subtitle:   urgSub   || undefined,
                        buttonText: urgBtn   || undefined,
                        whatsapp:   urgWa    || undefined,
                      } : undefined,
                    }}
                    previewMode
                  />
                ) : isTemplate3 ? (
                  <LiveCourseTemplate3
                    course={{
                      id:            course?.id,
                      styleOverrides,
                      sectionHeadings,
                      sectionOrder,
                      title:         title || "Course Title",
                      slug,
                      price:         price || "0",
                      originalPrice: originalPrice || null,
                      countdownEnd:  countdownEnd ? new Date(countdownEnd).toISOString() : null,
                      hero: {
                        badgeText:        heroBadge        || undefined,
                        subtitle:         heroSubtitle     || undefined,
                        bannerImage:      heroBanner       || undefined,
                        ctaText:          heroCtaText      || undefined,
                        promoText:        heroPromoText    || undefined,
                        studentCountText: heroStudentCount || undefined,
                        rating:           heroRating       ? parseFloat(heroRating)    : undefined,
                        ratingCount:      heroRatingCount  ? parseInt(heroRatingCount) : undefined,
                      },
                      stats: (statsStudents || statsRatings || statsCompletion || statsExtra) ? {
                        studentsCount:  statsStudents   || undefined,
                        ratingsCount:   statsRatings    || undefined,
                        completionRate: statsCompletion || undefined,
                        extra:          statsExtra      || undefined,
                        labels: statsLabels.some((l) => l.trim()) ? statsLabels : undefined,
                      } : undefined,
                      marqueeText:       t3Marquee       || null,
                      announcementBar:   (t3AnnounceText || t3AnnounceBtn) ? {
                        text: t3AnnounceText || undefined, ctaText: t3AnnounceBtn || undefined, ctaAnchor: t3AnnounceAnchor || undefined,
                      } : undefined,
                      blueprintSection:  (t3BlueprintTitle || t3BlueprintImg) ? {
                        title: t3BlueprintTitle || undefined, subtitle: t3BlueprintSub || undefined, image: t3BlueprintImg || undefined,
                      } : undefined,
                      whyJoinItems:      t3WhyItems.filter(Boolean),
                      featuresGrid:      (t3FeaturesTitle || t3FeatureItems.length) ? {
                        title: t3FeaturesTitle || undefined, subtitle: t3FeaturesSub || undefined, items: t3FeatureItems,
                      } : undefined,
                      bonusChecklist:    (t3BonusTitle || t3BonusItems.length) ? {
                        title: t3BonusTitle || undefined, items: t3BonusItems.filter(Boolean),
                      } : undefined,
                      challengeSection:  (t3ChallengeTitle || t3ChallengeDesc) ? {
                        title: t3ChallengeTitle || undefined, monthCount: t3ChallengeMonth || undefined,
                        description: t3ChallengeDesc || undefined, linkText: t3ChallengeLink || undefined,
                      } : undefined,
                      supportLevels:     (t3LevelsTitle || t3Levels.length) ? {
                        title: t3LevelsTitle || undefined, subtitle: t3LevelsSub || undefined, levels: t3Levels,
                      } : undefined,
                      salesUpdateSlider: (t3SalesTitle || t3SalesImages.length) ? {
                        title: t3SalesTitle || undefined, subtitle: t3SalesSub || undefined, images: t3SalesImages.filter(Boolean),
                      } : undefined,
                      communitySection:  (t3CommTitle || t3CommImages.length) ? {
                        title: t3CommTitle || undefined, subtitle: t3CommSub || undefined,
                        caption: t3CommCaption || undefined, images: t3CommImages.filter(Boolean),
                      } : undefined,
                      textReviewsSlider: (t3ReviewsTitle || t3Reviews.length) ? {
                        title: t3ReviewsTitle || undefined, reviews: t3Reviews,
                      } : undefined,
                      successStories:    (t3StoriesTitle || t3Stories.length) ? {
                        title: t3StoriesTitle || undefined, stories: t3Stories,
                      } : undefined,
                      videoGrid:         (t3VidGridTitle || t3VidGridItems.length) ? {
                        title: t3VidGridTitle || undefined, videos: t3VidGridItems,
                      } : undefined,
                      faq:               faqItems,
                      faqContactButtons: (t3MessengerUrl || t3Phone) ? {
                        messengerUrl: t3MessengerUrl || undefined, phone: t3Phone || undefined,
                      } : undefined,
                      footerBranding:    (t3BrandName || t3Tagline || t3Copyright) ? {
                        brandName: t3BrandName || undefined, tagline: t3Tagline || undefined, copyright: t3Copyright || undefined,
                      } : undefined,
                    }}
                    previewMode
                  />
                ) : isTemplate4 ? (
                  <LiveCourseTemplate4
                    course={{
                      id:            course?.id,
                      styleOverrides,
                      sectionHeadings,
                      sectionOrder,
                      title:         title || "Course Title",
                      slug,
                      price:         price || "0",
                      originalPrice: originalPrice || null,
                      countdownEnd:  countdownEnd ? new Date(countdownEnd).toISOString() : null,
                      hero: {
                        badgeText:          heroBadge        || undefined,
                        subtitle:           heroSubtitle     || undefined,
                        videoUrl:           heroBanner       || undefined,
                        bannerImage:        heroBannerImage  || undefined,
                        ctaText:            heroCtaText      || undefined,
                        headline:           heroHeadline     || undefined,
                        headlineHighlight:  heroHeadlineHl   || undefined,
                        headlineAfter:      heroHeadlineAfter || undefined,
                        questionText:       t4HeroQuestion   || undefined,
                        rating:             heroRating       ? parseFloat(heroRating)    : undefined,
                        ratingCount:        heroRatingCount  ? parseInt(heroRatingCount) : undefined,
                      },
                      curriculum,
                      whatYouGet,
                      faq:               faqItems,
                      t4LiveSessionCard: Object.values(t4LiveSessionCard).some(Boolean) ? t4LiveSessionCard : undefined,
                      t4StudentProgress: (t4StudentProgress.title || (t4StudentProgress.images ?? []).length) ? t4StudentProgress : undefined,
                      t4ForWhomSection:  (t4ForWhomSection.title || (t4ForWhomSection.cards ?? []).length) ? t4ForWhomSection : undefined,
                      t4InstructorStory: (t4InstructorStory.bio || t4InstructorStory.videoUrl) ? t4InstructorStory : undefined,
                      t4ModuleGrid:      (t4ModuleGrid.title || (t4ModuleGrid.modules ?? []).length) ? t4ModuleGrid : undefined,
                      t4PricingSection:  Object.values(t4PricingSection).some(Boolean) ? t4PricingSection : undefined,
                      t4SupportSection:  (t4SupportSection.title || t4SupportSection.content) ? t4SupportSection : undefined,
                      t4CountdownBanner: (t4CountdownBanner.text || t4CountdownBanner.ctaText) ? t4CountdownBanner : undefined,
                    }}
                    previewMode
                  />
                ) : isTemplate5 ? (
                  <LiveCourseTemplate5
                    course={{
                      ...previewData,
                      title: title || "Course Title",
                      slug: slug || "preview",
                      price: price || "0",
                      faq: faqItems,
                      t5StatCards: t5StatCards.filter((s) => (s.label?.trim() || s.value?.trim())),
                      t5WhoFor,
                      t5RealProjects,
                      t5Roadmap,
                    }}
                    previewMode
                  />
                ) : isTemplate6 ? (
                  <LiveCourseTemplate6
                    course={{
                      id:               course?.id,
                      styleOverrides,
                      sectionHeadings,
                      sectionOrder,
                      title:            title || "Course Title",
                      slug,
                      price:            price || "0",
                      originalPrice:    originalPrice || null,
                      countdownEnd:     countdownEnd ? new Date(countdownEnd).toISOString() : null,
                      hero: {
                        badgeText:          heroBadge          || undefined,
                        headline:           heroHeadline       || undefined,
                        headlineHighlight:  heroHeadlineHl     || undefined,
                        headlineAfter:      heroHeadlineAfter  || undefined,
                        subtitle:           heroSubtitle       || undefined,
                        bannerImage:        heroBannerImage    || undefined,
                        anatomicalImage:    t6AnatomicalImage  || undefined,
                        ctaText:            heroCtaText        || undefined,
                        secondaryCtaText:   heroSecondaryBtn   || undefined,
                      },
                      heroInfoBadges:       t6HeroInfoBadges.length ? t6HeroInfoBadges : undefined,
                      heroPricingCard:      (t6HeroPricingCard.header || (t6HeroPricingCard.tiers ?? []).length) ? t6HeroPricingCard : undefined,
                      t6Credentials,
                      t6Stats,
                      t6Comparison,
                      t6Organs,
                      t6Instructor:    (t6Instructor.name || t6Instructor.title) ? t6Instructor : undefined,
                      t6WhoFor:        (t6WhoFor.title || (t6WhoFor.items ?? []).length) ? t6WhoFor : undefined,
                      t6Pricing:       (t6Pricing.tiers ?? []).length ? t6Pricing : undefined,
                      t6Video,
                      t6Testimonials,
                      curriculum,
                      faq:             faqItems,
                    }}
                    previewMode
                  />
                ) : (
                  <LiveCourseTemplate course={previewData} previewMode />
                );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-6">

      <ConfirmModal
        open={showDeleteConfirm}
        title="Move to Trash"
        message={<>Move <strong>{course?.title}</strong> to Trash? It will be hidden from students and can be restored later from the live courses list&apos;s Trash filter.</>}
        confirmLabel="Yes, Move to Trash"
        variant="danger"
        isPending={isPending}
        onConfirm={handleDeleteLiveCourse}
        onClose={() => setShowDeleteConfirm(false)}
      />
      <ConfirmModal
        open={showScheduleModal}
        title="Schedule Publish"
        message={
          <div className="space-y-2">
            <p>Choose when <strong>{course?.title}</strong> should automatically go live.</p>
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
            />
          </div>
        }
        confirmLabel="Schedule"
        variant="success"
        isPending={isPending}
        onConfirm={handleScheduleLiveCourse}
        onClose={() => setShowScheduleModal(false)}
      />

      {/* ── Top toolbar ── */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <button onClick={() => router.push("/admin/live-courses")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <span className="text-sm font-semibold text-gray-700 truncate max-w-xs">
          {mode === "create" ? "New Live Course" : `Edit: ${course?.title}`}
        </span>

        <div className="flex items-center gap-2">
          {/* Preview toggle */}
          <button onClick={() => setShowPreview((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5">
            {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>

          {/* Device toggle (only when preview shown) */}
          {showPreview && (
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button onClick={() => setPreviewDevice("desktop")}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${previewDevice === "desktop" ? "bg-brand-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
                <Monitor className="h-3.5 w-3.5" /> Desktop
              </button>
              <button onClick={() => setPreviewDevice("mobile")}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs transition-colors ${previewDevice === "mobile" ? "bg-brand-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
                <Smartphone className="h-3.5 w-3.5" /> Mobile
              </button>
            </div>
          )}

          {/* Save */}
          <button onClick={handleSave} disabled={isPending || !pathOk}
            title={!pathOk ? "Fix the course URL before saving" : undefined}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm transition-colors">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {mode === "create" ? "Create" : "Save"}
          </button>
        </div>
      </div>

      {error && (
        <div className="shrink-0 bg-red-50 border-b border-red-200 text-red-700 text-sm px-4 py-2">
          {error}
        </div>
      )}

      {/* ── Body: form + preview ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── SECTION 1: Content / Batches / Class Hub (+ optional preview) ── */}
        <div className={`flex flex-col bg-gray-50 border-r border-gray-200 ${showPreview ? "w-[360px] shrink-0" : "flex-1"}`}>

          {/* Tab bar (only in edit mode — need a real courseId for batches/classhub) */}
          {mode === "edit" && course?.id && (
            <div className="shrink-0 flex border-b border-gray-200 bg-white">
              {(["content", "batches", "classhub"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? "border-brand-600 text-brand-700"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab === "content" ? "Content" : tab === "batches" ? "Batches" : "Class Hub"}
                </button>
              ))}
            </div>
          )}

          {/* ── Batches tab ── */}
          {activeTab === "batches" && course?.id ? (
            <div className="flex-1 overflow-y-auto p-4">
              <LiveCourseBatchesPanel courseId={course.id} />
            </div>
          ) : activeTab === "classhub" && course?.id ? (
            <div className="flex-1 overflow-y-auto p-4">
              <LiveBatchManagerPanel courseId={course.id} />
            </div>
          ) : activeTab !== "curriculum" && activeTab !== "classhub" ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {/* Bundle / Live toggle */}
          <Panel title="Course Type" open>
            <p className="text-xs text-gray-400">Choose whether this is a live cohort course or a bundle of recorded courses.</p>
            <div className="flex gap-3 mt-1">
              {(['live', 'bundle'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCourseType(type)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    courseType === type
                      ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {type === 'live' ? '🎥 Live Course' : '📦 Bundle (Recorded Courses)'}
                </button>
              ))}
            </div>
          </Panel>

          {/* Bundle course picker — only shown when courseType = bundle */}
          {courseType === 'bundle' && (
            <BundleCoursesPanel
              selectedIds={bundledCourseIds}
              onChange={setBundledCourseIds}
            />
          )}

          {/* Basic Info */}
          <Panel title="Basic Information" open>
            <div>
              <Lbl text="Course Title" req />
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Full-Stack Web Development Mastery" className={inputCls} />
            </div>
            <div>
              <Lbl text="Slug (URL)" req />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400 shrink-0">/</span>
                <input value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
                  placeholder="course-slug" className={inputCls} />
              </div>
              {pathCheck && pathCheck.status !== "empty" && (
                <p className={`mt-1 text-xs ${
                  pathCheck.status === "available" ? "text-green-600"
                  : pathCheck.status === "checking" ? "text-gray-400"
                  : "text-red-500"
                }`}>
                  {pathCheck.status === "available" ? "✓ " : pathCheck.status === "checking" ? "… " : "✗ "}
                  {pathCheck.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Lbl text="Price (৳)" req />
                <input value={price} onChange={(e) => setPrice(e.target.value)}
                  placeholder="4999" type="number" className={inputCls} />
              </div>
              <div>
                <Lbl text="Original Price (৳)" />
                <input value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="9999" type="number" className={inputCls} />
              </div>
              <div>
                <Lbl text="Total Value (৳)" />
                <input value={totalValue} onChange={(e) => setTotalValue(e.target.value)}
                  placeholder="25000" type="number" className={inputCls} />
              </div>
              <div className="col-span-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 hover:bg-gray-50">
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={hasSubscription}
                      onChange={(e) => setHasSubscription(e.target.checked)}
                    />
                    <div className={`h-5 w-9 rounded-full transition-colors ${hasSubscription ? "bg-brand-500" : "bg-gray-300"}`}>
                      <div className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${hasSubscription ? "translate-x-4" : ""}`} />
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-800">Enable Subscription Option</span>
                    <p className="text-xs text-gray-500">Allow students to pay monthly instead of one-time</p>
                  </div>
                </label>
              </div>
              {hasSubscription && (
                <div className="col-span-2">
                  <Lbl text="Monthly Price (৳)" req />
                  <input value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)}
                    placeholder="999" type="number" className={inputCls} />
                  <p className="mt-1 text-xs text-gray-400">Students will be charged this amount monthly via recurring payment</p>
                </div>
              )}
              <div>
                <Lbl text="Total Live Classes" />
                <input value={totalLiveClasses} onChange={(e) => setTotalLiveClasses(e.target.value)}
                  placeholder="60" type="number" className={inputCls} />
              </div>
              <div className="col-span-2">
                <Lbl text="Countdown End" />
                <input value={countdownEnd} onChange={(e) => setCountdownEnd(e.target.value)}
                  type="datetime-local" className={inputCls} />
              </div>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 hover:bg-gray-50">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={requireSequentialProgress}
                  onChange={(e) => setRequireSequentialProgress(e.target.checked)}
                />
                <div className={`h-5 w-9 rounded-full transition-colors ${requireSequentialProgress ? "bg-brand-600" : "bg-gray-300"}`} />
                <div className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${requireSequentialProgress ? "translate-x-4" : ""}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Sequential Progress Lock</p>
                <p className="text-xs text-gray-500 mt-0.5">Students must complete each lesson before unlocking the next. Free preview lessons are exempt.</p>
              </div>
            </label>

            {/* Access duration */}
            <div className="rounded-xl border border-gray-200 p-3 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasLifetimeAccess}
                  onChange={(e) => setHasLifetimeAccess(e.target.checked)}
                  disabled={isPending}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800">Lifetime access</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    When off, a student&apos;s access to this course automatically expires after the duration below.
                  </p>
                </div>
              </label>

              {!hasLifetimeAccess && (
                <div className="flex flex-wrap items-center gap-2 pl-7">
                  <select
                    value={accessPreset}
                    onChange={(e) => {
                      const v = e.target.value;
                      setAccessPreset(v);
                      if (v !== "custom") setAccessDurationDays(v);
                    }}
                    disabled={isPending}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800"
                  >
                    <option value="90">3 months</option>
                    <option value="180">6 months</option>
                    <option value="365">1 year</option>
                    <option value="custom">Custom</option>
                  </select>
                  {accessPreset === "custom" && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={accessDurationDays}
                        onChange={(e) => setAccessDurationDays(e.target.value)}
                        disabled={isPending}
                        className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800"
                      />
                      <span className="text-xs text-gray-500">days</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Show Badge */}
            <label className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/40 p-3 cursor-pointer hover:bg-gray-50/70 transition-colors">
              <input
                type="checkbox"
                checked={showBadge}
                onChange={(e) => setShowBadge(e.target.checked)}
                disabled={isPending}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Show badge on course card
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  When enabled, a &ldquo;Live Course&rdquo; badge appears on the course card.
                </p>
              </div>
            </label>
          </Panel>

          {/* Publish & Trash — status-driven actions (edit mode only, matches
              the recorded-course editor's button branching exactly). */}
          {mode === "edit" && course && (
            <Panel title="Publish & Trash" open>
              <div className="flex items-center gap-3 flex-wrap">
                {course.status === "trash" ? (
                  <button
                    onClick={handleRestoreLiveCourse}
                    disabled={isPending}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                  >
                    Restore from Trash
                  </button>
                ) : course.status === "scheduled" ? (
                  <>
                    <span className="text-sm text-blue-600">
                      Publishing {course.publishAt ? new Date(course.publishAt).toLocaleString() : "soon"}
                    </span>
                    <button
                      onClick={handleUnscheduleLiveCourse}
                      disabled={isPending}
                      className="border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                    >
                      Cancel Schedule
                    </button>
                  </>
                ) : course.status === "draft" || course.status === "inactive" ? (
                  <>
                    <button
                      onClick={handleTogglePublish}
                      disabled={isPending}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                    >
                      Publish
                    </button>
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      disabled={isPending}
                      className="border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                    >
                      Schedule…
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleTogglePublish}
                    disabled={isPending}
                    className="border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                  >
                    Unpublish
                  </button>
                )}

                {course.status !== "trash" && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isPending}
                    className="ml-auto text-red-600 hover:text-red-700 text-sm font-medium px-4 py-2 rounded-xl border border-red-200 hover:border-red-300 transition-colors"
                  >
                    Move to Trash
                  </button>
                )}
              </div>
            </Panel>
          )}

          {/* Templates 1 & 2 — ordered, collapsible section cards with reorder arrows
              and inline heading fields. Templates 3–5 keep the fixed panels below. */}
          {isTemplate1 && orderedSectionIds.map((id, idx) => renderT1Section(id, idx))}
          {isTemplate2 && orderedSectionIds.map((id, idx) => renderT2Section(id, idx))}
          {isTemplate3 && orderedSectionIds.map((id, idx) => renderT3Section(id, idx))}
          {isTemplate4 && orderedSectionIds.map((id, idx) => renderT4Section(id, idx))}
          {isTemplate5 && orderedSectionIds.map((id, idx) => renderT5Section(id, idx))}
          {isTemplate6 && orderedSectionIds.map((id, idx) => renderT6Section(id, idx))}

          </div>
          ) : null}
        </div>

        {/* ── SECTION 2: Curriculum (its own column, beside Section 1) ── */}
        {mode === "edit" && course?.id && (
          <div className={`flex flex-col bg-gray-50 border-r border-gray-200 ${showPreview ? "w-[360px] shrink-0" : "flex-1"}`}>
            <div className="shrink-0 flex items-center border-b border-gray-200 bg-white px-5 py-2.5">
              <span className="text-sm font-semibold text-brand-700">Curriculum</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {curriculumLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-400 text-sm">Loading curriculum…</div>
              ) : (
                <CurriculumBuilder
                  courseId={course.id}
                  initialModules={(curriculumModules ?? []) as unknown as CourseModule[]}
                  adapter={liveCurriculumAdapter}
                />
              )}
            </div>
          </div>
        )}

        {/* ── SECTION 3: Live Preview (optional) ── */}
        {showPreview && (
          <div className="flex-1 overflow-y-auto bg-gray-100">
            {previewDevice === "mobile" ? (
              <MobilePreviewFrame>
                <div className="bg-white">{templateElement}</div>
              </MobilePreviewFrame>
            ) : (
              <div className="mx-auto w-full">
                <InlineStyleEditor overrides={styleOverrides} onChange={setStyleOverrides}>
                  <div className="bg-white shadow-sm">{templateElement}</div>
                </InlineStyleEditor>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

