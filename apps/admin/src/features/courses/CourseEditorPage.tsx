"use client";

import { useState, useCallback, useRef, useEffect, Fragment } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Monitor, Smartphone, Loader2, Save, ImagePlus, Plus, Trash2 } from "lucide-react";
import { Panel, type PanelReorder } from "@/features/live-courses/LiveCourseEditorUI";
import { resolveSectionOrder } from "@repo/ui/live-course-template";
import { MediaLibraryModal } from "@/features/media/components/MediaLibraryModal";
import { ImagePickerField } from "@/shared/components/ImagePickerField";
import { CourseForm } from "./CourseForm";
import { CourseDetailPageForm } from "./CourseDetailPageForm";
import { CourseReviewsTab } from "./CourseReviewsTab";
import { CurriculumBuilder } from "./curriculum/CurriculumBuilder";
import { RecordedCoursePreview } from "./RecordedCoursePreview";
import { MobilePreviewFrame } from "@/features/live-courses/MobilePreviewFrame";
import { InlineStyleEditor } from "@/features/live-courses/InlineStyleEditor";
import { updateCourseAction, createCourseWithTemplateAction } from "./actions/courses.actions";
import { RECORDED_TEMPLATES } from "./recorded-templates"; // ADDED
import { BundleCoursesPanel } from "@/features/live-courses/LiveCourseEditorSections";
import { BundleCurriculumPanel } from "./BundleCurriculumPanel";
import { fetchRecordedCoursesAction } from "@/features/live-courses/actions/live-courses.actions";
import type { StyleOverrides } from "@repo/ui/template-style-overrides";
import { TemplateStyleScope } from "@repo/ui/template-style-overrides";
import { MasteryStickyOfferBar } from "@repo/ui/mastery-sticky-offer-bar";
import { MasteryBottomBar } from "@repo/ui/mastery-bottom-bar";
import type { InstructorCourse, Category, CourseModule } from "@/features/courses/api";
import { toast } from "@repo/ui/sonner";

interface CourseEditorPageProps {
  course: InstructorCourse;
  categories: Category[];
  modules: CourseModule[];
  role: string;
  mode?: "create" | "edit";
  templateId?: string;
}

type Tab = "basics" | "detail" | "reviews";

const TABS: { key: Tab; label: string }[] = [
  { key: "basics", label: "Basics" },
  { key: "detail", label: "Detail Page" },
  { key: "reviews", label: "Reviews" },
];

// Mastery template sections — order controls public page via resolveSectionOrder
const MASTERY_SECTIONS: Array<{ id: string; label: string }> = [
  { id: "batch",             label: "Batch Info Cards" },
  { id: "curriculum",        label: "Curriculum" },
  { id: "tools",             label: "Tools / Technologies" },
  { id: "why",               label: "Why Different" },
  { id: "instructors",       label: "Instructors" },
  { id: "benefits",          label: "What You Get / Benefits" },
  { id: "videoTestimonials", label: "Video Testimonials" },
  { id: "testimonials",      label: "Testimonials" },
  { id: "value",             label: "Value Breakdown" },
];

const STATUS_STYLES: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-600",
  archived: "bg-red-100 text-red-600",
};

export function CourseEditorPage({ course, categories, modules: initialModules, role, mode = "edit", templateId }: CourseEditorPageProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("basics");
  const [showPreview, setShowPreview] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [isPending, startTransition] = useState<false | (() => void)>(false);
  const [saving, setSaving] = useState(false);
  const creatingRef = useRef(false);
  const [styleOverrides, setStyleOverrides] = useState<StyleOverrides>(
    (course as any).styleOverrides ?? {}
  );

  // Editable fields for live preview updates
  const [editableFields, setEditableFields] = useState({
    title: course.title,
    shortDescription: course.shortDescription ?? "",
    description: course.description ?? "",
    thumbnail: course.thumbnail,
    price: course.price,
    discountPrice: course.discountPrice ?? "",
    rating: course.rating ?? "",
    ratingCount: course.ratingCount ?? 0,
    ratingSource: course.ratingSource ?? "auto",
    socialProofImage: course.socialProofImage ?? "",
    isUnlisted: (course as any).isUnlisted ?? false,
  });

  const isMastery = course.template === "2";

  // Mastery section order (collapsible + drag reorder, like Live Course template)
  const [masterySectionOrder, setMasterySectionOrder] = useState<string[]>(
    (course as any).masterySectionOrder ?? []
  );
  const [masteryDragIdx, setMasteryDragIdx] = useState<number | null>(null);
  const [masteryOverIdx, setMasteryOverIdx] = useState<number | null>(null);
  const orderedMasteryIds = resolveSectionOrder(masterySectionOrder, MASTERY_SECTIONS.map((s) => s.id));
  function moveMasterySection(index: number, dir: -1 | 1) {
    const ids = [...orderedMasteryIds];
    const target = index + dir;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    setMasterySectionOrder(ids);
  }
  function mvMastery(idx: number): PanelReorder {
    return {
      index: idx + 1,
      onMoveUp: () => moveMasterySection(idx, -1),
      onMoveDown: () => moveMasterySection(idx, 1),
      canMoveUp: idx > 0,
      canMoveDown: idx < orderedMasteryIds.length - 1,
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        setMasteryDragIdx(idx);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(idx));
      },
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setMasteryOverIdx(idx);
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        const from = masteryDragIdx;
        if (from === null || from === idx) { setMasteryDragIdx(null); setMasteryOverIdx(null); return; }
        const ids = [...orderedMasteryIds];
        const [moved] = ids.splice(from, 1);
        ids.splice(idx, 0, moved!);
        setMasterySectionOrder(ids);
        setMasteryDragIdx(null);
        setMasteryOverIdx(null);
      },
      onDragEnd: () => { setMasteryDragIdx(null); setMasteryOverIdx(null); },
      isDragOver: masteryOverIdx === idx && masteryDragIdx !== null && masteryDragIdx !== idx,
    };
  }

  // Mastery bundle — only for template 2
  const [courseType, setCourseType] = useState<"single" | "bundle">((course as any).courseType ?? "single");
  const [bundledCourseIds, setBundledCourseIds] = useState<number[]>(
    (course as any).bundledCourses?.map((c: { id: number }) => c.id) ?? []
  );
  const [bundleCurriculum, setBundleCurriculum] = useState<Array<{ title: string; lessons: string[] }>>(
    (course as any).bundleCurriculum ?? []
  );
  const [bundleCurriculumHeader, setBundleCurriculumHeader] = useState<{ title?: string; moduleLabel?: string; courseTypeLabel?: string }>(
    (course as any).bundleCurriculumHeader ?? { title: "কোর্স কারিকুলাম", moduleLabel: "মডিউল", courseTypeLabel: "রেকর্ডেড কোর্স" }
  );
  const [masteryCheckoutImage, setMasteryCheckoutImage] = useState<string>((course as any).masteryCheckoutImage ?? "");
  const [bundlePriceMap, setBundlePriceMap] = useState<Map<number, number>>(new Map());

  // Bundle price = sum of selected recorded courses (1500 + free 0 + 1000 = 2500) — syncs to top/middle/bottom taka
  useEffect(() => {
    if (!isMastery || courseType !== "bundle") return;
    fetchRecordedCoursesAction().then((res: any) => {
      if (res.success) {
        const m = new Map<number, number>();
        res.data.forEach((c: any) => m.set(c.id, parseFloat(c.price) || 0));
        setBundlePriceMap(m);
      }
    });
  }, [isMastery, courseType]);

  useEffect(() => {
    if (!isMastery || courseType !== "bundle") return;
    if (bundledCourseIds.length === 0) return;
    if (bundlePriceMap.size === 0) return;
    const fallbackMap = new Map<number, number>();
    ((course as any).bundledCourses ?? []).forEach((c: any) => fallbackMap.set(c.id, parseFloat(c.price) || 0));
    let total = 0;
    bundledCourseIds.forEach((id) => {
      total += bundlePriceMap.get(id) ?? fallbackMap.get(id) ?? 0;
    });
    const totalStr = String(Math.round(total));
    if (totalStr !== editableFields.price) {
      setEditableFields((prev) => ({ ...prev, price: totalStr }));
    }
  }, [bundledCourseIds, bundlePriceMap, isMastery, courseType]);

  const [modules, setModules] = useState<CourseModule[]>(initialModules);
  const handleModulesChange = useCallback((m: CourseModule[]) => setModules(m), []);

  const [batchInfo, setBatchInfo] = useState<{ label: string; value: string; bgColor: string }[]>(
    (course as any).batchInfo?.length > 0
      ? (course as any).batchInfo
      : [
          { label: "ব্যাচ গ্রুপ", value: "১০ প্রচলিত", bgColor: "bg-blue-50" },
          { label: "লাইভ ক্লাস", value: "রাত 9:00 - 10:30 (শুক্র,শনি)", bgColor: "bg-orange-50" },
          { label: "সাপোর্টি ক্লাস", value: "রাত 9:30 - 11:30", bgColor: "bg-green-50" },
          { label: "সিট বাকি", value: "৫০ টি", bgColor: "bg-pink-50" },
        ]
  );

  const [toolsTitle, setToolsTitle] = useState<string>(
    (course as any).toolsTitle ?? "যেসব টুলস ও টেকনোলজি শিখবেন"
  );

  const [toolsInfo, setToolsInfo] = useState<{ name: string; image: string; bgColor: string }[]>(
    (course as any).toolsInfo?.length > 0
      ? (course as any).toolsInfo
      : [
          { name: "MS Excel", image: "", bgColor: "bg-green-700" },
          { name: "MS Power point", image: "", bgColor: "bg-red-800" },
          { name: "Power BI", image: "", bgColor: "bg-yellow-500" },
          { name: "MS Word", image: "", bgColor: "bg-blue-800" },
        ]
  );
  const [toolsPickerIndex, setToolsPickerIndex] = useState<number | null>(null);

  const DEFAULT_FEATURES = [
    { title: "Live Class", description: "২৪ টি লাইভ ইন্টারঅ্যাকটিভ ক্লাস। সপ্তাহে ২ দিন নির্ধারিত ক্লাস", image: "", bgColor: "bg-red-50 border-red-100" },
    { title: "Job Placement Support", description: "কোর্স শেষে সিভি প্রস্তুত এবং ইন্টারভিউ গাইডলাইন সাপোর্ট প্রদান করা হবে।", image: "", bgColor: "bg-green-50 border-green-100" },
    { title: "Scholarship & Reward", description: "পরীক্ষায় সর্বোচ্চ নম্বর প্রাপ্ত শিক্ষার্থী বিশেষ স্কলারশিপ ও রিওয়ার্ড পাবেন।", image: "", bgColor: "bg-blue-50 border-blue-100" },
    { title: "Assignment & Exam", description: "প্র্যাকটিকাল অ্যাসাইনমেন্ট ও ফাইনাল এক্সাম", image: "", bgColor: "bg-orange-50 border-orange-100" },
    { title: "Live Support", description: "২৪/৭ সাপোর্ট", image: "", bgColor: "bg-green-50 border-green-100" },
    { title: "Certificate", description: "ইন্টারন্যাশনাল ভ্যালিড সার্টিফিকেট", image: "", bgColor: "bg-yellow-50 border-yellow-100" },
  ];
  const DEFAULT_STATS = [
    { value: "৩,০০০", label: "জব প্লেসমেন্ট", bgColor: "bg-green-50" },
    { value: "৯,০০০", label: "লার্নার", bgColor: "bg-blue-50" },
    { value: "৮৩%", label: "কোর্স কমপ্লিশন রেট", bgColor: "bg-yellow-50" },
    { value: "৬", label: "লাইভ এবং রেকর্ডেড কোর্স", bgColor: "bg-pink-50" },
  ];

  const existingWhyDifferent = (course as any).whyDifferentInfo;
  const [whyDifferentTitle, setWhyDifferentTitle] = useState<string>(
    existingWhyDifferent?.title ?? "Why This Course is Different?"
  );
  const [whyFeatures, setWhyFeatures] = useState<{ title: string; description: string; image: string; bgColor: string }[]>(
    existingWhyDifferent?.features && existingWhyDifferent.features.length > 0 ? existingWhyDifferent.features : DEFAULT_FEATURES
  );
  const [whyStats, setWhyStats] = useState<{ value: string; label: string; bgColor: string }[]>(
    existingWhyDifferent?.stats && existingWhyDifferent.stats.length > 0 ? existingWhyDifferent.stats : DEFAULT_STATS
  );
  const [whyFeaturePickerIndex, setWhyFeaturePickerIndex] = useState<number | null>(null);

  const existingInstructors = (course as any).instructorsInfo;
  const [instructorsTitle, setInstructorsTitle] = useState<string>(
    existingInstructors?.title ?? "Our Professional Instructors"
  );
  const [instructors, setInstructors] = useState<{ name: string; role: string; photo: string; years: string; clients: string; projects: string; yearsLabel: string; clientsLabel: string; projectsLabel: string; summary: string; skills: string[]; experience: string[]; companies: { name: string; logo: string }[] }[]>(
    existingInstructors?.instructors && existingInstructors.instructors.length > 0 ? existingInstructors.instructors : []
  );
  const [instructorPhotoIndex, setInstructorPhotoIndex] = useState<number | null>(null);
  const [companyLogoPickerIndex, setCompanyLogoPickerIndex] = useState<{ instructorIdx: number; companyIdx: number } | null>(null);

  const existingBenefits = (course as any).benefitsInfo;
  const [benefitsTitle, setBenefitsTitle] = useState<string>(
    existingBenefits?.title ?? "কি কি পাচ্ছেন মাস্টারির কোর্স"
  );
  const [benefitsSubtitle, setBenefitsSubtitle] = useState<string>(
    existingBenefits?.subtitle ?? "দেখে নিন কি কি পাচ্ছেন মাস্টারির কোর্সজয়েন করলে"
  );
  const [benefitsItems, setBenefitsItems] = useState<{ title: string; description: string; image: string }[]>(
    existingBenefits?.items && existingBenefits.items.length > 0 ? existingBenefits.items : [
      { title: "ক্যারিয়ার রেডিত লাইভ/রেকর্ডেড কোর্স", description: "আমাদের কোর্সগুলো এমনভাবে তৈরি করা যাতে আপনি আমাদের ক্যারিয়ারের গ্রাউন্ড পাতাতে পারেন।", image: "" },
      { title: "জুম লাইভ সাপোর্ট সেশন", description: "আমাদের প্রতিটি ক্লাস / সাপোর্ট সেশন ভিডিও জুম (zoom) আপনার মাধ্যমে নতুন যত করে আপনি হিসাবে লাইভ ক্লাস উপভোগ করতে পারবেন।", image: "" },
      { title: "রিয়েলটাইম স্টুডেন্ট ট্র্যাকিং", description: "২৪/৭ ড্যাশবোর্ড সাপোর্ট সেশন সর্বাধিক একটি ক্লাস এবং সাথে থাকার ক্লাসের মাধ্যমে প্রগতির দৃষ্টির সাথে সময় হৈ সময় সেশন।", image: "" },
      { title: "কোর্স ভিডিও ডাউনলোড", description: "ওয়েবসাইট থেকে ডাউনলোড করার পারবেন এবং আমাদের এই ভিডিও গুলো আপনি নিজের কি সময়ে দেখতে পারবেন।", image: "" },
    ]
  );
  const [benefitImagePickerIndex, setBenefitImagePickerIndex] = useState<number | null>(null);

  const existingVideoTestimonials = (course as any).videoTestimonialsInfo;
  const [videoTestimonialsTitle, setVideoTestimonialsTitle] = useState<string>(
    existingVideoTestimonials?.title ?? "যারা আমাদের উপর আস্থা রেখেছেন \u2013 তাদের কিছু কথা"
  );
  const [videoTestimonialsItems, setVideoTestimonialsItems] = useState<{ title: string; videoUrl: string }[]>(
    existingVideoTestimonials?.items && existingVideoTestimonials.items.length > 0 ? existingVideoTestimonials.items : []
  );

  const existingTestimonials = (course as any).testimonialsInfo;
  const [testimonialsTitle, setTestimonialsTitle] = useState<string>(
    existingTestimonials?.title ?? "Students Testimonial"
  );
  const [testimonialsItems, setTestimonialsItems] = useState<{ name: string; role: string; quote: string }[]>(
    existingTestimonials?.items && existingTestimonials.items.length > 0 ? existingTestimonials.items : []
  );

  const existingValueBreakdown = (course as any).valueBreakdownInfo;
  const [valueBreakdownTitle, setValueBreakdownTitle] = useState<string>(
    existingValueBreakdown?.title ?? "চলুন দেখি এই টাকায় আপনি কি পরিমাণ ভ্যালু পাচ্ছেন"
  );
  const [valueBreakdownHighlight, setValueBreakdownHighlight] = useState<string>(
    existingValueBreakdown?.highlightWords ?? "পরিমাণ ভ্যালু"
  );
  const [valueBreakdownItems, setValueBreakdownItems] = useState<{ name: string; price: string; description: string }[]>(
    existingValueBreakdown?.items && existingValueBreakdown.items.length > 0 ? existingValueBreakdown.items : []
  );
  const [valueBreakdownOfferTitle, setValueBreakdownOfferTitle] = useState<string>(
    existingValueBreakdown?.offerTitle ?? "টোটাল ৮,০০০ টাকার বেশি ভ্যালু পাচ্ছেন!"
  );
  const [valueBreakdownOfferHighlight, setValueBreakdownOfferHighlight] = useState<string>(
    existingValueBreakdown?.offerHighlight ?? "ভ্যালু পাচ্ছেন!"
  );
  const [valueBreakdownOfferSubtitle1, setValueBreakdownOfferSubtitle1] = useState<string>(
    existingValueBreakdown?.offerSubtitle1 ?? "বিশেষ ছাড়ে পাচ্ছেন ২,৯৯০টাকায়! এই অফার চলবে"
  );
  const [valueBreakdownOfferSubtitle2, setValueBreakdownOfferSubtitle2] = useState<string>(
    existingValueBreakdown?.offerSubtitle2 ?? "৫ এপ্রিল পর্যন্ত। এর পর প্রাইস বেড়ে হবে ৮,০০০টাকা।"
  );
  const [valueBreakdownCtaText, setValueBreakdownCtaText] = useState<string>(
    existingValueBreakdown?.ctaText ?? "এখনই এনরোল করুন"
  );
  const [valueBreakdownTimerHours, setValueBreakdownTimerHours] = useState<string>(
    existingValueBreakdown?.timerHours ?? "20"
  );
  const [valueBreakdownTimerMinutes, setValueBreakdownTimerMinutes] = useState<string>(
    existingValueBreakdown?.timerMinutes ?? "07"
  );
  const [valueBreakdownTimerSeconds, setValueBreakdownTimerSeconds] = useState<string>(
    existingValueBreakdown?.timerSeconds ?? "12"
  );
  const [valueBreakdownOfferLabel, setValueBreakdownOfferLabel] = useState<string>(
    existingValueBreakdown?.offerLabel ?? ""
  );
  const [valueBreakdownPaymentButtonText, setValueBreakdownPaymentButtonText] = useState<string>(
    existingValueBreakdown?.paymentButtonText ?? ""
  );

  // Merged course object for preview
  const previewCourse = { ...course, ...editableFields, courseType, bundledCourseIds, bundleCurriculum, bundleCurriculumHeader, masteryCheckoutImage, masterySectionOrder, styleOverrides, batchInfo, toolsInfo, toolsTitle, modules: courseType === "bundle" ? [] : modules, whyDifferentInfo: { title: whyDifferentTitle, features: whyFeatures, stats: whyStats }, instructorsInfo: { title: instructorsTitle, instructors }, benefitsInfo: { title: benefitsTitle, subtitle: benefitsSubtitle, items: benefitsItems }, videoTestimonialsInfo: { title: videoTestimonialsTitle, items: videoTestimonialsItems }, testimonialsInfo: { title: testimonialsTitle, items: testimonialsItems }, valueBreakdownInfo: { title: valueBreakdownTitle, highlightWords: valueBreakdownHighlight, items: valueBreakdownItems, offerTitle: valueBreakdownOfferTitle, offerHighlight: valueBreakdownOfferHighlight, offerSubtitle1: valueBreakdownOfferSubtitle1, offerSubtitle2: valueBreakdownOfferSubtitle2, ctaText: valueBreakdownCtaText, offerLabel: valueBreakdownOfferLabel, paymentButtonText: valueBreakdownPaymentButtonText, timerHours: valueBreakdownTimerHours, timerMinutes: valueBreakdownTimerMinutes, timerSeconds: valueBreakdownTimerSeconds } };

  const templateName = RECORDED_TEMPLATES.find(t => t.dbTemplate === course.template)?.name ?? "Unknown";

  function handleFieldChange(key: string, value: any) {
    setEditableFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (mode === "create") {
      handleCreate();
      return;
    }
    handleSaveStyles();
  }

  async function handleCreate() {
    if (creatingRef.current) return;
    if (isMastery && courseType === "bundle" && bundledCourseIds.length === 0) {
      toast.error("A bundle must include at least one course");
      return;
    }
    creatingRef.current = true;
    setSaving(true);
    const formData = new FormData();
    formData.set("title", editableFields.title || "Untitled Course");
    formData.set("template", course.template);
    if (isMastery) {
      formData.set("courseType", courseType);
      formData.set("masteryCheckoutImage", masteryCheckoutImage || "");
      if (courseType === "bundle") {
        formData.set("bundledCourseIds", JSON.stringify(bundledCourseIds));
        formData.set("bundleCurriculum", JSON.stringify(bundleCurriculum));
        formData.set("bundleCurriculumHeader", JSON.stringify(bundleCurriculumHeader));
      }
    }
    if (editableFields.description) formData.set("description", editableFields.description);
    if (editableFields.shortDescription) formData.set("shortDescription", editableFields.shortDescription);
    if (editableFields.thumbnail) formData.set("thumbnail", editableFields.thumbnail);
    if (editableFields.price) formData.set("price", editableFields.price);
    if (editableFields.discountPrice) formData.set("discountPrice", editableFields.discountPrice);

    const res = await createCourseWithTemplateAction(formData);
    setSaving(false);
    if (res.success) {
      toast.success("Course created");
      router.push(`/course-builder/${res.data.id}`);
    } else {
      creatingRef.current = false;
      toast.error(res.message ?? "Failed to create course");
    }
  }

  function handleDelete() {
    router.push("/admin/courses");
  }

  function handleSaveStyles() {
    if (isMastery && courseType === "bundle" && bundledCourseIds.length === 0) {
      toast.error("A bundle must include at least one course");
      return;
    }
    setSaving(true);
    startTransition(async () => {
      const res = await updateCourseAction(course.id, {
        ...editableFields,
        ...(isMastery ? { courseType, bundledCourseIds, bundleCurriculum, bundleCurriculumHeader, masteryCheckoutImage, masterySectionOrder } as any : {}),
        styleOverrides: styleOverrides as any,
        batchInfo: batchInfo as any,
        toolsInfo: toolsInfo as any,
        toolsTitle: toolsTitle as any,
        whyDifferentInfo: { title: whyDifferentTitle, features: whyFeatures, stats: whyStats } as any,
        instructorsInfo: { title: instructorsTitle, instructors } as any,
        benefitsInfo: { title: benefitsTitle, subtitle: benefitsSubtitle, items: benefitsItems } as any,
        videoTestimonialsInfo: { title: videoTestimonialsTitle, items: videoTestimonialsItems } as any,
        testimonialsInfo: { title: testimonialsTitle, items: testimonialsItems } as any,
        valueBreakdownInfo: { title: valueBreakdownTitle, highlightWords: valueBreakdownHighlight, items: valueBreakdownItems, offerTitle: valueBreakdownOfferTitle, offerHighlight: valueBreakdownOfferHighlight, offerSubtitle1: valueBreakdownOfferSubtitle1, offerSubtitle2: valueBreakdownOfferSubtitle2, ctaText: valueBreakdownCtaText, offerLabel: valueBreakdownOfferLabel, paymentButtonText: valueBreakdownPaymentButtonText, timerHours: valueBreakdownTimerHours, timerMinutes: valueBreakdownTimerMinutes, timerSeconds: valueBreakdownTimerSeconds } as any,
      });
      setSaving(false);
      if (res.success) {
        toast.success("Course saved successfully");
        router.refresh();
      } else {
        toast.error(res.message ?? "Failed to save course");
      }
    });
  }

  // Mastery section content renderers (used by the reorderable loop below)
  const masterySectionContent: Record<string, () => React.ReactNode> = {
    batch: () => (<>
                      <label className="block text-sm font-semibold text-gray-700 mt-4 mb-1">Social Proof Text</label>
                      <input
                        type="text"
                        value={(styleOverrides.heroSocialProof as any)?.text ?? ""}
                        onChange={(e) => setStyleOverrides((prev) => ({
                          ...prev,
                          heroSocialProof: { text: e.target.value },
                        }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                        placeholder="e.g. আমাদের ২০,০০০+ ছাত্রের কর্তৃক আমানিত বিশ্বাসের ও বিশ্বস্ততার প্রমাণ:"
                      />
                      <label className="block text-sm font-semibold text-gray-700 mt-4 mb-2">Batch Info Cards</label>
                      <div className="space-y-2">
                        {batchInfo.map((item, i) => (
                          <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                            <input type="text" value={item.label} onChange={(e) => { const next = [...batchInfo]; next[i] = { ...next[i]!, label: e.target.value }; setBatchInfo(next); }}
                              className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Label" />
                            <input type="text" value={item.value} onChange={(e) => { const next = [...batchInfo]; next[i] = { ...next[i]!, value: e.target.value }; setBatchInfo(next); }}
                              className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Value" />
                            <select value={item.bgColor} onChange={(e) => { const next = [...batchInfo]; next[i] = { ...next[i]!, bgColor: e.target.value }; setBatchInfo(next); }}
                              className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                              <option value="bg-blue-50">Blue</option><option value="bg-orange-50">Orange</option><option value="bg-green-50">Green</option>
                              <option value="bg-pink-50">Pink</option><option value="bg-purple-50">Purple</option><option value="bg-yellow-50">Yellow</option>
                            </select>
                          </div>
                        ))}
                      </div>
    </>),

    tools: () => (<>
                      <label className="block text-sm font-semibold text-gray-700 mt-4 mb-1">Tools Section Title</label>
                      <input type="text" value={toolsTitle} onChange={(e) => setToolsTitle(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="e.g. যেসব টুলস ও টেকনোলজি শিখবেন" />
                      <label className="block text-sm font-semibold text-gray-700 mt-4 mb-2">Tools Info Cards</label>
                      <div className="space-y-2">
                        {toolsInfo.map((item, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <button type="button" onClick={() => setToolsPickerIndex(i)} className="shrink-0 h-9 w-9 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 overflow-hidden">
                              {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-4 w-4 text-gray-400" />}
                            </button>
                            <input type="url" value={item.image} onChange={(e) => { const next = [...toolsInfo]; next[i] = { ...next[i]!, image: e.target.value }; setToolsInfo(next); }}
                              className="w-36 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Image URL" />
                            <input type="text" value={item.name} onChange={(e) => { const next = [...toolsInfo]; next[i] = { ...next[i]!, name: e.target.value }; setToolsInfo(next); }}
                              className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Tool name" />
                            <select value={item.bgColor} onChange={(e) => { const next = [...toolsInfo]; next[i] = { ...next[i]!, bgColor: e.target.value }; setToolsInfo(next); }}
                              className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                              <option value="bg-green-700">Green</option><option value="bg-red-800">Red</option><option value="bg-yellow-500">Yellow</option>
                              <option value="bg-blue-800">Blue</option><option value="bg-purple-700">Purple</option><option value="bg-orange-600">Orange</option>
                              <option value="bg-gray-700">Gray</option><option value="bg-pink-600">Pink</option>
                            </select>
                            {toolsInfo.length > 1 && (
                              <button type="button" onClick={() => setToolsInfo(toolsInfo.filter((_, j) => j !== i))} className="shrink-0 text-gray-400 hover:text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => setToolsInfo([...toolsInfo, { name: "", image: "", bgColor: "bg-green-700" }])}
                          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
                          <Plus className="h-3.5 w-3.5" /> Add Tool
                        </button>
                      </div>
    </>),

    why: () => (<>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Why Different Section Title</label>
                      <input type="text" value={whyDifferentTitle} onChange={(e) => setWhyDifferentTitle(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="e.g. Why This Course is Different?" />
                      <label className="block text-sm font-semibold text-gray-700 mt-4 mb-2">Features</label>
                      <div className="space-y-2">
                        {whyFeatures.map((item, i) => (
                          <div key={i} className="flex gap-2 items-start">
                            <button type="button" onClick={() => setWhyFeaturePickerIndex(i)} className="shrink-0 h-9 w-9 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 overflow-hidden">
                              {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-4 w-4 text-gray-400" />}
                            </button>
                            <input type="url" value={item.image} onChange={(e) => { const next = [...whyFeatures]; next[i] = { ...next[i]!, image: e.target.value }; setWhyFeatures(next); }}
                              className="w-36 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Image URL" />
                            <div className="flex-1 space-y-1">
                              <input type="text" value={item.title} onChange={(e) => { const next = [...whyFeatures]; next[i] = { ...next[i]!, title: e.target.value }; setWhyFeatures(next); }}
                                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Feature title" />
                              <input type="text" value={item.description} onChange={(e) => { const next = [...whyFeatures]; next[i] = { ...next[i]!, description: e.target.value }; setWhyFeatures(next); }}
                                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Feature description" />
                            </div>
                            <select value={item.bgColor} onChange={(e) => { const next = [...whyFeatures]; next[i] = { ...next[i]!, bgColor: e.target.value }; setWhyFeatures(next); }}
                              className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                              <option value="bg-red-50 border-red-100">Red</option><option value="bg-green-50 border-green-100">Green</option>
                              <option value="bg-blue-50 border-blue-100">Blue</option><option value="bg-orange-50 border-orange-100">Orange</option>
                              <option value="bg-yellow-50 border-yellow-100">Yellow</option><option value="bg-purple-50 border-purple-100">Purple</option>
                            </select>
                            {whyFeatures.length > 1 && (
                              <button type="button" onClick={() => setWhyFeatures(whyFeatures.filter((_, j) => j !== i))} className="shrink-0 text-gray-400 hover:text-red-500 mt-1">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => setWhyFeatures([...whyFeatures, { title: "", description: "", image: "", bgColor: "bg-blue-50 border-blue-100" }])}
                          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
                          <Plus className="h-3.5 w-3.5" /> Add Feature
                        </button>
                      </div>
                      <label className="block text-sm font-semibold text-gray-700 mt-4 mb-2">Stats</label>
                      <div className="space-y-2">
                        {whyStats.map((item, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <input type="text" value={item.value} onChange={(e) => { const next = [...whyStats]; next[i] = { ...next[i]!, value: e.target.value }; setWhyStats(next); }}
                              className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Value" />
                            <input type="text" value={item.label} onChange={(e) => { const next = [...whyStats]; next[i] = { ...next[i]!, label: e.target.value }; setWhyStats(next); }}
                              className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Label" />
                            <select value={item.bgColor} onChange={(e) => { const next = [...whyStats]; next[i] = { ...next[i]!, bgColor: e.target.value }; setWhyStats(next); }}
                              className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                              <option value="bg-green-50">Green</option><option value="bg-blue-50">Blue</option><option value="bg-yellow-50">Yellow</option>
                              <option value="bg-pink-50">Pink</option><option value="bg-purple-50">Purple</option><option value="bg-orange-50">Orange</option>
                            </select>
                            {whyStats.length > 1 && (
                              <button type="button" onClick={() => setWhyStats(whyStats.filter((_, j) => j !== i))} className="shrink-0 text-gray-400 hover:text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => setWhyStats([...whyStats, { value: "", label: "", bgColor: "bg-green-50" }])}
                          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
                          <Plus className="h-3.5 w-3.5" /> Add Stat
                        </button>
                      </div>
    </>),

    instructors: () => (<>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Instructors Section Title</label>
                      <input type="text" value={instructorsTitle} onChange={(e) => setInstructorsTitle(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="e.g. Our Professional Instructors" />
                      <label className="block text-sm font-semibold text-gray-700 mt-4 mb-2">Instructors</label>
                      <div className="space-y-4">
                        {instructors.map((inst, i) => (
                          <div key={i} className="rounded-lg border border-gray-200 p-3 space-y-2">
                            <div className="flex gap-2 items-start">
                              <button type="button" onClick={() => setInstructorPhotoIndex(i)} className="shrink-0 h-16 w-16 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 overflow-hidden">
                                {inst.photo ? <img src={inst.photo} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-5 w-5 text-gray-400" />}
                              </button>
                              <input type="url" value={inst.photo} onChange={(e) => { const n = [...instructors]; n[i] = { ...n[i]!, photo: e.target.value }; setInstructors(n); }}
                                className="w-36 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Photo URL" />
                              <div className="flex-1 grid grid-cols-2 gap-2">
                                <input type="text" value={inst.name} onChange={(e) => { const n = [...instructors]; n[i] = { ...n[i]!, name: e.target.value }; setInstructors(n); }} className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Name" />
                                <input type="text" value={inst.role} onChange={(e) => { const n = [...instructors]; n[i] = { ...n[i]!, role: e.target.value }; setInstructors(n); }} className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Role" />
                                <input type="text" value={inst.years} onChange={(e) => { const n = [...instructors]; n[i] = { ...n[i]!, years: e.target.value }; setInstructors(n); }} className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Years (e.g. 10+)" />
                                <input type="text" value={inst.yearsLabel ?? "Years"} onChange={(e) => { const n = [...instructors]; n[i] = { ...n[i]!, yearsLabel: e.target.value }; setInstructors(n); }} className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Label (e.g. Years)" />
                                <input type="text" value={inst.clients} onChange={(e) => { const n = [...instructors]; n[i] = { ...n[i]!, clients: e.target.value }; setInstructors(n); }} className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Clients (e.g. 100+)" />
                                <input type="text" value={inst.clientsLabel ?? "Clients"} onChange={(e) => { const n = [...instructors]; n[i] = { ...n[i]!, clientsLabel: e.target.value }; setInstructors(n); }} className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Label (e.g. Clients)" />
                                <input type="text" value={inst.projects} onChange={(e) => { const n = [...instructors]; n[i] = { ...n[i]!, projects: e.target.value }; setInstructors(n); }} className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Projects (e.g. 200+)" />
                                <input type="text" value={inst.projectsLabel ?? "Projects"} onChange={(e) => { const n = [...instructors]; n[i] = { ...n[i]!, projectsLabel: e.target.value }; setInstructors(n); }} className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Label (e.g. Projects)" />
                              </div>
                              {instructors.length > 1 && (
                                <button type="button" onClick={() => setInstructors(instructors.filter((_, j) => j !== i))} className="shrink-0 text-gray-400 hover:text-red-500">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            <textarea value={inst.summary} onChange={(e) => { const n = [...instructors]; n[i] = { ...n[i]!, summary: e.target.value }; setInstructors(n); }}
                              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Summary" rows={2} />
                            <input type="text" value={inst.skills.join(", ")} onChange={(e) => { const n = [...instructors]; n[i] = { ...n[i]!, skills: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }; setInstructors(n); }}
                              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Skills (comma separated)" />
                            <input type="text" value={inst.experience.join(", ")} onChange={(e) => { const n = [...instructors]; n[i] = { ...n[i]!, experience: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }; setInstructors(n); }}
                              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Experience (comma separated)" />
                            <div className="mt-2">
                              <label className="block text-xs font-semibold text-gray-500 mb-1">Companies</label>
                              <div className="space-y-2">
                                {(inst.companies || []).map((comp, ci) => (
                                  <div key={ci} className="flex gap-2 items-center">
                                    <button type="button" onClick={() => setCompanyLogoPickerIndex({ instructorIdx: i, companyIdx: ci })} className="shrink-0 h-9 w-9 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 overflow-hidden">
                                      {comp.logo ? <img src={comp.logo} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-4 w-4 text-gray-400" />}
                                    </button>
                                    <input type="url" value={comp.logo} onChange={(e) => { const n = [...instructors]; const companies = [...(n[i]!.companies || [])]; companies[ci] = { ...companies[ci]!, logo: e.target.value }; n[i] = { ...n[i]!, companies }; setInstructors(n); }}
                                      className="w-36 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Logo URL" />
                                    <input type="text" value={comp.name} onChange={(e) => { const n = [...instructors]; const companies = [...(n[i]!.companies || [])]; companies[ci] = { ...companies[ci]!, name: e.target.value }; n[i] = { ...n[i]!, companies }; setInstructors(n); }}
                                      className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Company Name" />
                                    <button type="button" onClick={() => { const n = [...instructors]; const companies = (n[i]!.companies || []).filter((_, j) => j !== ci); n[i] = { ...n[i]!, companies }; setInstructors(n); }} className="shrink-0 text-gray-400 hover:text-red-500">
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                                <button type="button" onClick={() => { const n = [...instructors]; const companies = [...(n[i]!.companies || []), { name: "", logo: "" }]; n[i] = { ...n[i]!, companies }; setInstructors(n); }}
                                  className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
                                  <Plus className="h-3.5 w-3.5" /> Add Company
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => setInstructors([...instructors, { name: "", role: "", photo: "", years: "", clients: "", projects: "", yearsLabel: "Years", clientsLabel: "Clients", projectsLabel: "Projects", summary: "", skills: [], experience: [], companies: [] }])}
                          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
                          <Plus className="h-3.5 w-3.5" /> Add Instructor
                        </button>
                      </div>
    </>),

    benefits: () => (<>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Benefits Section Title</label>
                      <input type="text" value={benefitsTitle} onChange={(e) => setBenefitsTitle(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="e.g. কি কি পাচ্ছেন মাস্টারির কোর্স" />
                      <label className="block text-sm font-semibold text-gray-700 mt-4 mb-1">Benefits Subtitle</label>
                      <input type="text" value={benefitsSubtitle} onChange={(e) => setBenefitsSubtitle(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="e.g. দেখে নিন কি কি পাচ্ছেন মাস্টারির কোর্সজয়েন করলে" />
                      <label className="block text-sm font-semibold text-gray-700 mt-4 mb-2">Benefits Items</label>
                      <div className="space-y-3">
                        {benefitsItems.map((item, i) => (
                          <div key={i} className="rounded-lg border border-gray-200 p-3 space-y-2">
                            <div className="flex gap-2 items-start">
                              <button type="button" onClick={() => setBenefitImagePickerIndex(i)} className="shrink-0 h-14 w-14 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 overflow-hidden">
                                {item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-4 w-4 text-gray-400" />}
                              </button>
                              <input type="url" value={item.image} onChange={(e) => { const next = [...benefitsItems]; next[i] = { ...next[i]!, image: e.target.value }; setBenefitsItems(next); }}
                                className="w-36 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Image URL" />
                              <div className="flex-1 space-y-2">
                                <input type="text" value={item.title} onChange={(e) => { const next = [...benefitsItems]; next[i] = { ...next[i]!, title: e.target.value }; setBenefitsItems(next); }}
                                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Benefit title" />
                                <input type="text" value={item.description} onChange={(e) => { const next = [...benefitsItems]; next[i] = { ...next[i]!, description: e.target.value }; setBenefitsItems(next); }}
                                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Benefit description" />
                              </div>
                              {benefitsItems.length > 1 && (
                                <button type="button" onClick={() => setBenefitsItems(benefitsItems.filter((_, j) => j !== i))} className="shrink-0 text-gray-400 hover:text-red-500 mt-1">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => setBenefitsItems([...benefitsItems, { title: "", description: "", image: "" }])}
                          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
                          <Plus className="h-3.5 w-3.5" /> Add Benefit
                        </button>
                      </div>
    </>),

    videoTestimonials: () => (<>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Video Testimonials Title</label>
                      <input type="text" value={videoTestimonialsTitle} onChange={(e) => setVideoTestimonialsTitle(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="e.g. যারা আমাদের উপর আস্থা রেখেছেন - তাদের কিছু কথা" />
                      <label className="block text-sm font-semibold text-gray-700 mt-4 mb-2">Video Testimonials</label>
                      <div className="space-y-3">
                        {videoTestimonialsItems.map((item, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <input type="text" value={item.title} onChange={(e) => { const next = [...videoTestimonialsItems]; next[i] = { ...next[i]!, title: e.target.value }; setVideoTestimonialsItems(next); }}
                              className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Video title" />
                            <input type="text" value={item.videoUrl} onChange={(e) => { const next = [...videoTestimonialsItems]; next[i] = { ...next[i]!, videoUrl: e.target.value }; setVideoTestimonialsItems(next); }}
                              className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="YouTube URL" />
                            {videoTestimonialsItems.length > 1 && (
                              <button type="button" onClick={() => setVideoTestimonialsItems(videoTestimonialsItems.filter((_, j) => j !== i))} className="shrink-0 text-gray-400 hover:text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => setVideoTestimonialsItems([...videoTestimonialsItems, { title: "", videoUrl: "" }])}
                          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
                          <Plus className="h-3.5 w-3.5" /> Add Video
                        </button>
                      </div>
    </>),

    testimonials: () => (<>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Testimonials Title</label>
                      <input type="text" value={testimonialsTitle} onChange={(e) => setTestimonialsTitle(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="e.g. Students Testimonial" />
                      <label className="block text-sm font-semibold text-gray-700 mt-4 mb-2">Testimonials</label>
                      <div className="space-y-3">
                        {testimonialsItems.map((item, i) => (
                          <div key={i} className="rounded-lg border border-gray-200 p-3 space-y-2">
                            <div className="flex gap-2 items-center">
                              <input type="text" value={item.name} onChange={(e) => { const next = [...testimonialsItems]; next[i] = { ...next[i]!, name: e.target.value }; setTestimonialsItems(next); }}
                                className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Name" />
                              <input type="text" value={item.role} onChange={(e) => { const next = [...testimonialsItems]; next[i] = { ...next[i]!, role: e.target.value }; setTestimonialsItems(next); }}
                                className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Role" />
                              {testimonialsItems.length > 1 && (
                                <button type="button" onClick={() => setTestimonialsItems(testimonialsItems.filter((_, j) => j !== i))} className="shrink-0 text-gray-400 hover:text-red-500">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            <textarea value={item.quote} onChange={(e) => { const next = [...testimonialsItems]; next[i] = { ...next[i]!, quote: e.target.value }; setTestimonialsItems(next); }}
                              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Testimonial quote" rows={2} />
                          </div>
                        ))}
                        <button type="button" onClick={() => setTestimonialsItems([...testimonialsItems, { name: "", role: "", quote: "" }])}
                          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
                          <Plus className="h-3.5 w-3.5" /> Add Testimonial
                        </button>
                      </div>
    </>),

    value: () => (<>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Value Breakdown Title</label>
                      <input type="text" value={valueBreakdownTitle} onChange={(e) => setValueBreakdownTitle(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="e.g. চলুন দেখি এই টাকায় আপনি কি পাচ্ছেন" />
                      <label className="block text-sm font-semibold text-gray-700 mt-4 mb-1">Highlight Words (Red)</label>
                      <input type="text" value={valueBreakdownHighlight} onChange={(e) => setValueBreakdownHighlight(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="e.g. পরিমাপ ভালু" />
                      <label className="block text-sm font-semibold text-gray-700 mt-4 mb-2">Value Items</label>
                      <div className="space-y-3">
                        {valueBreakdownItems.map((item, i) => (
                          <div key={i} className="rounded-lg border border-gray-200 p-3 space-y-2">
                            <div className="flex gap-2 items-center">
                              <input type="text" value={item.name} onChange={(e) => { const next = [...valueBreakdownItems]; next[i] = { ...next[i]!, name: e.target.value }; setValueBreakdownItems(next); }}
                                className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Course name" />
                              <input type="text" value={item.price} onChange={(e) => { const next = [...valueBreakdownItems]; next[i] = { ...next[i]!, price: e.target.value }; setValueBreakdownItems(next); }}
                                className="w-28 rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Price" />
                              {valueBreakdownItems.length > 1 && (
                                <button type="button" onClick={() => setValueBreakdownItems(valueBreakdownItems.filter((_, j) => j !== i))} className="shrink-0 text-gray-400 hover:text-red-500">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                            <input type="text" value={item.description} onChange={(e) => { const next = [...valueBreakdownItems]; next[i] = { ...next[i]!, description: e.target.value }; setValueBreakdownItems(next); }}
                              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="Description" />
                          </div>
                        ))}
                        <button type="button" onClick={() => setValueBreakdownItems([...valueBreakdownItems, { name: "", price: "", description: "" }])}
                          className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium">
                          <Plus className="h-3.5 w-3.5" /> Add Item
                        </button>
                      </div>
                      <div className="pt-4 border-t border-gray-200 mt-4 space-y-3">
                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Offer & Countdown Banner</h4>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Offer Heading</label>
                          <input type="text" value={valueBreakdownOfferTitle} onChange={(e) => setValueBreakdownOfferTitle(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="e.g. টোটাল ৮,০০০ টাকার বেশি ভ্যালু পাচ্ছেন!" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Offer Highlight (Circled Red)</label>
                          <input type="text" value={valueBreakdownOfferHighlight} onChange={(e) => setValueBreakdownOfferHighlight(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="e.g. ভ্যালু পাচ্ছেন!" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Offer Banner Subtitle Line 1</label>
                          <input type="text" value={valueBreakdownOfferSubtitle1} onChange={(e) => setValueBreakdownOfferSubtitle1(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="e.g. বিশেষ ছাড়ে পাচ্ছেন ২,৯৯০টাকায়! এই অফার চলবে" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Offer Banner Subtitle Line 2</label>
                          <input type="text" value={valueBreakdownOfferSubtitle2} onChange={(e) => setValueBreakdownOfferSubtitle2(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="e.g. ৫ এপ্রিল পর্যন্ত। এর পর প্রাইস বেড়ে হবে ৮,০০০টাকা।" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">CTA Button Text</label>
                          <input type="text" value={valueBreakdownCtaText} onChange={(e) => setValueBreakdownCtaText(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="e.g. এখনই এনরোল করুন" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Button Text</label>
                          <input type="text" value={valueBreakdownPaymentButtonText} onChange={(e) => setValueBreakdownPaymentButtonText(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="e.g. পেমেন্ট করুন ৳2,990" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Offer Label (Timer Prefix)</label>
                          <input type="text" value={valueBreakdownOfferLabel} onChange={(e) => setValueBreakdownOfferLabel(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="e.g. অফার শেষ হতে:" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Checkout Payment Image (before Enroll)</label>
                          <ImagePickerField value={masteryCheckoutImage} onChange={setMasteryCheckoutImage} placeholder="Upload payment method image (optional, leave blank to hide)" />
                          <p className="text-[11px] text-gray-400 mt-1">Shown centered just before the purple Enroll button in Mastery checkout. Remove to leave blank.</p>
                        </div>
                        <div className="pt-2">
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Initial Countdown Timer (Hours / Mins / Secs)</label>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <span className="block text-[10px] text-gray-500 mb-0.5">Hours</span>
                              <input type="number" min="0" value={valueBreakdownTimerHours} onChange={(e) => setValueBreakdownTimerHours(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-center focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="20" />
                            </div>
                            <div>
                              <span className="block text-[10px] text-gray-500 mb-0.5">Minutes</span>
                              <input type="number" min="0" max="59" value={valueBreakdownTimerMinutes} onChange={(e) => setValueBreakdownTimerMinutes(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-center focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="07" />
                            </div>
                            <div>
                              <span className="block text-[10px] text-gray-500 mb-0.5">Seconds</span>
                              <input type="number" min="0" max="59" value={valueBreakdownTimerSeconds} onChange={(e) => setValueBreakdownTimerSeconds(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-center focus:border-brand-500 focus:ring-1 focus:ring-brand-500" placeholder="12" />
                            </div>
                          </div>
                        </div>
                      </div>
    </>),
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-6">
      {/* ── Top toolbar ── */}
      <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
        <button onClick={() => router.push("/admin/courses")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-gray-700 truncate max-w-xs">
            {mode === "create" ? "Untitled Course" : course.title}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${STATUS_STYLES[mode === "create" ? "draft" : course.status] ?? "bg-gray-100 text-gray-600"}`}>
            {mode === "create" ? "draft" : course.status}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 shrink-0">{templateName}</span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5">
            {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>

          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 text-xs text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-60 rounded-lg px-3 py-1.5">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Changes
          </button>

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
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Content sidebar ── */}
        <div className={`flex flex-col bg-gray-50 border-r border-gray-200 ${showPreview ? "w-[380px] shrink-0" : "flex-1"}`}>
          {/* Tab bar */}
          <div className="shrink-0 flex border-b border-gray-200 bg-white">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-5 py-2.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                  tab === t.key ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {tab === "basics" && (
              <div className="space-y-3">
                <Panel title="Course Info">
                  <CourseForm course={course} categories={categories} onSave={handleSave} onDelete={handleDelete} role={role} onFieldChange={handleFieldChange} />
                </Panel>
                {isMastery && (
                  <Panel title="Bundle Settings">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Course Type — Mastery Bundle</label>
                    <p className="text-xs text-gray-500 mb-2">Bundle only works with Mastery template. Single = normal course. Bundle = one price gives access to multiple recorded courses.</p>
                    <div className="flex gap-2">
                      {(["single", "bundle"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setCourseType(t)}
                          className={`flex-1 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors ${courseType === t ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}
                        >
                          {t === "single" ? "📘 Single Course" : "📦 Bundle (Multiple Courses)"}
                        </button>
                      ))}
                    </div>
                    {courseType === "bundle" && (
                      <>
                        <div className="mt-3">
                          <BundleCoursesPanel selectedIds={bundledCourseIds} onChange={setBundledCourseIds} excludeCourseId={course.id} />
                        </div>
                        <div className="mt-4">
                          <BundleCurriculumPanel value={bundleCurriculum} onChange={setBundleCurriculum} header={bundleCurriculumHeader} onHeaderChange={setBundleCurriculumHeader} />
                        </div>
                      </>
                    )}
                  </Panel>
                )}
                {isMastery && (
                  <div className="space-y-3">
                  <Panel title="Hero CTA & Style Overrides">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Hero CTA Button Text — ব্যাচে ভর্তি হোন</label>
                    <input
                      type="text"
                      value={(styleOverrides.cta as any)?.text ?? (styleOverrides.heroCta as any)?.text ?? ""}
                      onChange={(e) => setStyleOverrides((prev) => ({
                        ...prev,
                        cta: { text: e.target.value },
                      }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      placeholder="e.g. ব্যাচে ভর্তি হোন"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">Also editable by clicking the button in preview.</p>
                    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-gray-800">Top Bar — Separate per-element</h4>
                        <button type="button" onClick={() => setStyleOverrides(prev => { const n:any={...prev}; delete n.topbarOuter; delete n.topbarCountdownBox; delete n.topbarCountdownText; delete n.topbarOfferCard; delete n.topbarOfferText; delete n.topbarEnroll; delete n["[data-topbar]"]; return n; })} className="text-[10px] font-semibold text-brand-600 hover:text-brand-700 border border-brand-200 rounded px-2 py-0.5">Reset all</button>
                      </div>
                      <p className="text-[11px] text-gray-500 mb-3">Each part of the mint top bar has its own Background / Text color. Empty = default.</p>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Outer Bar Bg</label>
                            <div className="flex items-center gap-1">
                              <input type="color" value={(styleOverrides as any).topbarOuter?.backgroundColor ?? "#ecfdf5"} onChange={(e) => setStyleOverrides(prev => ({ ...prev, topbarOuter: { ...(prev as any).topbarOuter, backgroundColor: e.target.value } }))} className="h-7 w-7 rounded border p-0.5" />
                              <input type="text" value={(styleOverrides as any).topbarOuter?.backgroundColor ?? ""} onChange={(e) => setStyleOverrides(prev => {
                                const raw = e.target.value?.trim();
                                const v = !raw || raw === "-" || raw === "#" ? undefined : raw;
                                const next: any = { ...prev, topbarOuter: { ...(prev as any).topbarOuter, backgroundColor: v } };
                                if (!v) { delete next.topbarOuter.backgroundColor; if (!Object.keys(next.topbarOuter).length) delete next.topbarOuter; }
                                return next;
                              })} placeholder="#ecfdf5" className="flex-1 rounded border px-1 py-1 text-[11px]" />
                              {(styleOverrides as any).topbarOuter?.backgroundColor && <button type="button" onClick={() => setStyleOverrides(prev => { const n:any={...prev, topbarOuter:{...(prev as any).topbarOuter}}; delete n.topbarOuter.backgroundColor; if(!Object.keys(n.topbarOuter).length) delete n.topbarOuter; return n; })} className="text-[10px] text-gray-400 hover:text-red-500 px-1" title="Reset">✕</button>}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Outer Text (অফার...)</label>
                            <div className="flex items-center gap-1">
                              <input type="color" value={(styleOverrides as any).topbarOuter?.color ?? "#064e3b"} onChange={(e) => setStyleOverrides(prev => ({ ...prev, topbarOuter: { ...(prev as any).topbarOuter, color: e.target.value } }))} className="h-7 w-7 rounded border p-0.5" />
                              <input type="text" value={(styleOverrides as any).topbarOuter?.color ?? ""} onChange={(e) => setStyleOverrides(prev => {
                                const v = e.target.value || undefined;
                                const next: any = { ...prev, topbarOuter: { ...(prev as any).topbarOuter, color: v } };
                                if (!v) { delete next.topbarOuter.color; if (!Object.keys(next.topbarOuter).length) delete next.topbarOuter; }
                                return next;
                              })} placeholder="#064e3b" className="flex-1 rounded border px-1 py-1 text-[11px]" />
                              {(styleOverrides as any).topbarOuter?.color && <button type="button" onClick={() => setStyleOverrides(prev => { const n:any={...prev, topbarOuter:{...(prev as any).topbarOuter}}; delete n.topbarOuter.color; if(!Object.keys(n.topbarOuter).length) delete n.topbarOuter; return n; })} className="text-[10px] text-gray-400 hover:text-red-500 px-1" title="Reset">✕</button>}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Countdown Box Bg</label>
                            <div className="flex items-center gap-1">
                              <input type="color" value={(styleOverrides as any).topbarCountdownBox?.backgroundColor ?? "#064e3b"} onChange={(e) => setStyleOverrides(prev => ({ ...prev, topbarCountdownBox: { ...(prev as any).topbarCountdownBox, backgroundColor: e.target.value } }))} className="h-7 w-7 rounded border p-0.5" />
                              <input type="text" value={(styleOverrides as any).topbarCountdownBox?.backgroundColor ?? ""} onChange={(e) => setStyleOverrides(prev => ({ ...prev, topbarCountdownBox: { ...(prev as any).topbarCountdownBox, backgroundColor: e.target.value || undefined } }))} placeholder="#064e3b" className="flex-1 rounded border px-1 py-1 text-[11px]" />
                              {(styleOverrides as any).topbarCountdownBox?.backgroundColor && <button type="button" onClick={() => setStyleOverrides(prev => { const n:any={...prev, topbarCountdownBox:{...(prev as any).topbarCountdownBox}}; delete n.topbarCountdownBox.backgroundColor; if(!Object.keys(n.topbarCountdownBox).length) delete n.topbarCountdownBox; return n; })} className="text-[10px] text-gray-400 hover:text-red-500 px-1" title="Reset">✕</button>}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Countdown Text</label>
                            <div className="flex items-center gap-1">
                              <input type="color" value={(styleOverrides as any).topbarCountdownText?.color ?? "#ffffff"} onChange={(e) => setStyleOverrides(prev => ({ ...prev, topbarCountdownText: { ...(prev as any).topbarCountdownText, color: e.target.value } }))} className="h-7 w-7 rounded border p-0.5" />
                              <input type="text" value={(styleOverrides as any).topbarCountdownText?.color ?? ""} onChange={(e) => setStyleOverrides(prev => ({ ...prev, topbarCountdownText: { ...(prev as any).topbarCountdownText, color: e.target.value || undefined } }))} placeholder="#ffffff" className="flex-1 rounded border px-1 py-1 text-[11px]" />
                              {(styleOverrides as any).topbarCountdownText?.color && <button type="button" onClick={() => setStyleOverrides(prev => { const n:any={...prev, topbarCountdownText:{...(prev as any).topbarCountdownText}}; delete n.topbarCountdownText.color; if(!Object.keys(n.topbarCountdownText).length) delete n.topbarCountdownText; return n; })} className="text-[10px] text-gray-400 hover:text-red-500 px-1" title="Reset">✕</button>}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Offer Card Bg</label>
                            <div className="flex items-center gap-1">
                              <input type="color" value={(styleOverrides as any).topbarOfferCard?.backgroundColor ?? "#d1fae5"} onChange={(e) => setStyleOverrides(prev => ({ ...prev, topbarOfferCard: { ...(prev as any).topbarOfferCard, backgroundColor: e.target.value } }))} className="h-7 w-7 rounded border p-0.5" />
                              <input type="text" value={(styleOverrides as any).topbarOfferCard?.backgroundColor ?? ""} onChange={(e) => setStyleOverrides(prev => ({ ...prev, topbarOfferCard: { ...(prev as any).topbarOfferCard, backgroundColor: e.target.value || undefined } }))} placeholder="#d1fae5" className="flex-1 rounded border px-1 py-1 text-[11px]" />
                              {(styleOverrides as any).topbarOfferCard?.backgroundColor && <button type="button" onClick={() => setStyleOverrides(prev => { const n:any={...prev, topbarOfferCard:{...(prev as any).topbarOfferCard}}; delete n.topbarOfferCard.backgroundColor; if(!Object.keys(n.topbarOfferCard).length) delete n.topbarOfferCard; return n; })} className="text-[10px] text-gray-400 hover:text-red-500 px-1" title="Reset">✕</button>}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Offer Text</label>
                            <div className="flex items-center gap-1">
                              <input type="color" value={(styleOverrides as any).topbarOfferText?.color ?? "#065f46"} onChange={(e) => setStyleOverrides(prev => ({ ...prev, topbarOfferText: { ...(prev as any).topbarOfferText, color: e.target.value } }))} className="h-7 w-7 rounded border p-0.5" />
                              <input type="text" value={(styleOverrides as any).topbarOfferText?.color ?? ""} onChange={(e) => setStyleOverrides(prev => ({ ...prev, topbarOfferText: { ...(prev as any).topbarOfferText, color: e.target.value || undefined } }))} placeholder="#065f46" className="flex-1 rounded border px-1 py-1 text-[11px]" />
                              {(styleOverrides as any).topbarOfferText?.color && <button type="button" onClick={() => setStyleOverrides(prev => { const n:any={...prev, topbarOfferText:{...(prev as any).topbarOfferText}}; delete n.topbarOfferText.color; if(!Object.keys(n.topbarOfferText).length) delete n.topbarOfferText; return n; })} className="text-[10px] text-gray-400 hover:text-red-500 px-1" title="Reset">✕</button>}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Enroll Btn Bg</label>
                            <div className="flex items-center gap-1">
                              <input type="color" value={(styleOverrides as any).topbarEnroll?.backgroundColor ?? "#059669"} onChange={(e) => setStyleOverrides(prev => ({ ...prev, topbarEnroll: { ...(prev as any).topbarEnroll, backgroundColor: e.target.value } }))} className="h-7 w-7 rounded border p-0.5" />
                              <input type="text" value={(styleOverrides as any).topbarEnroll?.backgroundColor ?? ""} onChange={(e) => setStyleOverrides(prev => ({ ...prev, topbarEnroll: { ...(prev as any).topbarEnroll, backgroundColor: e.target.value || undefined } }))} placeholder="#059669" className="flex-1 rounded border px-1 py-1 text-[11px]" />
                              {(styleOverrides as any).topbarEnroll?.backgroundColor && <button type="button" onClick={() => setStyleOverrides(prev => { const n:any={...prev, topbarEnroll:{...(prev as any).topbarEnroll}}; delete n.topbarEnroll.backgroundColor; if(!Object.keys(n.topbarEnroll).length) delete n.topbarEnroll; return n; })} className="text-[10px] text-gray-400 hover:text-red-500 px-1" title="Reset">✕</button>}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Enroll Btn Text</label>
                            <div className="flex items-center gap-1">
                              <input type="color" value={(styleOverrides as any).topbarEnroll?.color ?? "#ffffff"} onChange={(e) => setStyleOverrides(prev => ({ ...prev, topbarEnroll: { ...(prev as any).topbarEnroll, color: e.target.value } }))} className="h-7 w-7 rounded border p-0.5" />
                              <input type="text" value={(styleOverrides as any).topbarEnroll?.color ?? ""} onChange={(e) => setStyleOverrides(prev => ({ ...prev, topbarEnroll: { ...(prev as any).topbarEnroll, color: e.target.value || undefined } }))} placeholder="#ffffff" className="flex-1 rounded border px-1 py-1 text-[11px]" />
                              {(styleOverrides as any).topbarEnroll?.color && <button type="button" onClick={() => setStyleOverrides(prev => { const n:any={...prev, topbarEnroll:{...(prev as any).topbarEnroll}}; delete n.topbarEnroll.color; if(!Object.keys(n.topbarEnroll).length) delete n.topbarEnroll; return n; })} className="text-[10px] text-gray-400 hover:text-red-500 px-1" title="Reset">✕</button>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-gray-800">Bottom Bar — Separate per-element</h4>
                        <button type="button" onClick={() => setStyleOverrides(prev => { const n:any={...prev}; delete n.bottombarOuter; delete n.bottombarPhone; delete n.bottombarPrice; delete n.bottombarDiscount; delete n.bottombarPromo; delete n.bottombarEnroll; delete n["[data-bottombar]"]; return n; })} className="text-[10px] font-semibold text-brand-600 hover:text-brand-700 border border-brand-200 rounded px-2 py-0.5">Reset all</button>
                      </div>
                      <p className="text-[11px] text-gray-500 mb-3">Each part of the bottom sticky bar has its own Background / Text color. Empty = default.</p>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Outer Bar Bg</label>
                            <div className="flex items-center gap-1">
                              <input type="color" value={(styleOverrides as any).bottombarOuter?.backgroundColor ?? "#ecfdf5"} onChange={(e) => setStyleOverrides(prev => ({ ...prev, bottombarOuter: { ...(prev as any).bottombarOuter, backgroundColor: e.target.value } }))} className="h-7 w-7 rounded border p-0.5" />
                              <input type="text" value={(styleOverrides as any).bottombarOuter?.backgroundColor ?? ""} onChange={(e) => setStyleOverrides(prev => {
                                const v = e.target.value || undefined;
                                const next: any = { ...prev, bottombarOuter: { ...(prev as any).bottombarOuter, backgroundColor: v } };
                                if (!v) { delete next.bottombarOuter.backgroundColor; if (!Object.keys(next.bottombarOuter).length) delete next.bottombarOuter; }
                                return next;
                              })} placeholder="#ecfdf5" className="flex-1 rounded border px-1 py-1 text-[11px]" />
                              {(styleOverrides as any).bottombarOuter?.backgroundColor && <button type="button" onClick={() => setStyleOverrides(prev => { const n:any={...prev, bottombarOuter:{...(prev as any).bottombarOuter}}; delete n.bottombarOuter.backgroundColor; if(!Object.keys(n.bottombarOuter).length) delete n.bottombarOuter; return n; })} className="text-[10px] text-gray-400 hover:text-red-500 px-1" title="Reset">✕</button>}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Border Color</label>
                            <div className="flex items-center gap-1">
                              <input type="color" value={(styleOverrides as any).bottombarOuter?.borderColor ?? "#a7f3d0"} onChange={(e) => setStyleOverrides(prev => ({ ...prev, bottombarOuter: { ...(prev as any).bottombarOuter, borderColor: e.target.value } }))} className="h-7 w-7 rounded border p-0.5" />
                              <input type="text" value={(styleOverrides as any).bottombarOuter?.borderColor ?? ""} onChange={(e) => setStyleOverrides(prev => {
                                const v = e.target.value || undefined;
                                const next: any = { ...prev, bottombarOuter: { ...(prev as any).bottombarOuter, borderColor: v } };
                                if (!v) { delete next.bottombarOuter.borderColor; if (!Object.keys(next.bottombarOuter).length) delete next.bottombarOuter; }
                                return next;
                              })} placeholder="#a7f3d0" className="flex-1 rounded border px-1 py-1 text-[11px]" />
                              {(styleOverrides as any).bottombarOuter?.borderColor && <button type="button" onClick={() => setStyleOverrides(prev => { const n:any={...prev, bottombarOuter:{...(prev as any).bottombarOuter}}; delete n.bottombarOuter.borderColor; if(!Object.keys(n.bottombarOuter).length) delete n.bottombarOuter; return n; })} className="text-[10px] text-gray-400 hover:text-red-500 px-1" title="Reset">✕</button>}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Phone Text</label>
                            <div className="flex items-center gap-1">
                              <input type="color" value={(styleOverrides as any).bottombarPhone?.color ?? "#000000"} onChange={(e) => setStyleOverrides(prev => ({ ...prev, bottombarPhone: { ...(prev as any).bottombarPhone, color: e.target.value } }))} className="h-7 w-7 rounded border p-0.5" />
                              <input type="text" value={(styleOverrides as any).bottombarPhone?.color ?? ""} onChange={(e) => setStyleOverrides(prev => ({ ...prev, bottombarPhone: { ...(prev as any).bottombarPhone, color: e.target.value || undefined } }))} placeholder="#000000" className="flex-1 rounded border px-1 py-1 text-[11px]" />
                              {(styleOverrides as any).bottombarPhone?.color && <button type="button" onClick={() => setStyleOverrides(prev => { const n:any={...prev, bottombarPhone:{...(prev as any).bottombarPhone}}; delete n.bottombarPhone.color; if(!Object.keys(n.bottombarPhone).length) delete n.bottombarPhone; return n; })} className="text-[10px] text-gray-400 hover:text-red-500 px-1" title="Reset">✕</button>}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Final Price Text</label>
                            <div className="flex items-center gap-1">
                              <input type="color" value={(styleOverrides as any).bottombarPrice?.color ?? "#000000"} onChange={(e) => setStyleOverrides(prev => ({ ...prev, bottombarPrice: { ...(prev as any).bottombarPrice, color: e.target.value } }))} className="h-7 w-7 rounded border p-0.5" />
                              <input type="text" value={(styleOverrides as any).bottombarPrice?.color ?? ""} onChange={(e) => setStyleOverrides(prev => ({ ...prev, bottombarPrice: { ...(prev as any).bottombarPrice, color: e.target.value || undefined } }))} placeholder="#000000" className="flex-1 rounded border px-1 py-1 text-[11px]" />
                              {(styleOverrides as any).bottombarPrice?.color && <button type="button" onClick={() => setStyleOverrides(prev => { const n:any={...prev, bottombarPrice:{...(prev as any).bottombarPrice}}; delete n.bottombarPrice.color; if(!Object.keys(n.bottombarPrice).length) delete n.bottombarPrice; return n; })} className="text-[10px] text-gray-400 hover:text-red-500 px-1" title="Reset">✕</button>}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Discount Price Text</label>
                            <div className="flex items-center gap-1">
                              <input type="color" value={(styleOverrides as any).bottombarDiscount?.color ?? "#FE0000"} onChange={(e) => setStyleOverrides(prev => ({ ...prev, bottombarDiscount: { ...(prev as any).bottombarDiscount, color: e.target.value } }))} className="h-7 w-7 rounded border p-0.5" />
                              <input type="text" value={(styleOverrides as any).bottombarDiscount?.color ?? ""} onChange={(e) => setStyleOverrides(prev => ({ ...prev, bottombarDiscount: { ...(prev as any).bottombarDiscount, color: e.target.value || undefined } }))} placeholder="#FE0000" className="flex-1 rounded border px-1 py-1 text-[11px]" />
                              {(styleOverrides as any).bottombarDiscount?.color && <button type="button" onClick={() => setStyleOverrides(prev => { const n:any={...prev, bottombarDiscount:{...(prev as any).bottombarDiscount}}; delete n.bottombarDiscount.color; if(!Object.keys(n.bottombarDiscount).length) delete n.bottombarDiscount; return n; })} className="text-[10px] text-gray-400 hover:text-red-500 px-1" title="Reset">✕</button>}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Promo Text</label>
                            <div className="flex items-center gap-1">
                              <input type="color" value={(styleOverrides as any).bottombarPromo?.color ?? "#000000"} onChange={(e) => setStyleOverrides(prev => ({ ...prev, bottombarPromo: { ...(prev as any).bottombarPromo, color: e.target.value } }))} className="h-7 w-7 rounded border p-0.5" />
                              <input type="text" value={(styleOverrides as any).bottombarPromo?.color ?? ""} onChange={(e) => setStyleOverrides(prev => ({ ...prev, bottombarPromo: { ...(prev as any).bottombarPromo, color: e.target.value || undefined } }))} placeholder="#000000" className="flex-1 rounded border px-1 py-1 text-[11px]" />
                              {(styleOverrides as any).bottombarPromo?.color && <button type="button" onClick={() => setStyleOverrides(prev => { const n:any={...prev, bottombarPromo:{...(prev as any).bottombarPromo}}; delete n.bottombarPromo.color; if(!Object.keys(n.bottombarPromo).length) delete n.bottombarPromo; return n; })} className="text-[10px] text-gray-400 hover:text-red-500 px-1" title="Reset">✕</button>}
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-600 mb-1">Promo Label (প্রোমো অফারে)</label>
                          <div className="flex items-center gap-1">
                            <input type="text" value={(styleOverrides as any).bottombarPromo?.text ?? ""} onChange={(e) => setStyleOverrides(prev => {
                              const v = e.target.value || undefined;
                              const next: any = { ...prev, bottombarPromo: { ...(prev as any).bottombarPromo, text: v } };
                              if (!v) { delete next.bottombarPromo.text; if (!Object.keys(next.bottombarPromo).length) delete next.bottombarPromo; }
                              return next;
                            })} placeholder="প্রোমো অফারে" className="flex-1 rounded border px-2 py-1 text-[11px]" />
                            {(styleOverrides as any).bottombarPromo?.text && <button type="button" onClick={() => setStyleOverrides(prev => { const n:any={...prev, bottombarPromo:{...(prev as any).bottombarPromo}}; delete n.bottombarPromo.text; if(!Object.keys(n.bottombarPromo).length) delete n.bottombarPromo; return n; })} className="text-[10px] text-gray-400 hover:text-red-500 px-1" title="Reset">✕</button>}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Promo Check Color</label>
                            <div className="flex items-center gap-1">
                              <input type="color" value={(styleOverrides as any).bottombarPromo?.backgroundColor ?? "#10b981"} onChange={(e) => setStyleOverrides(prev => ({ ...prev, bottombarPromo: { ...(prev as any).bottombarPromo, backgroundColor: e.target.value } }))} className="h-7 w-7 rounded border p-0.5" />
                              <input type="text" value={(styleOverrides as any).bottombarPromo?.backgroundColor ?? ""} onChange={(e) => setStyleOverrides(prev => ({ ...prev, bottombarPromo: { ...(prev as any).bottombarPromo, backgroundColor: e.target.value || undefined } }))} placeholder="#10b981" className="flex-1 rounded border px-1 py-1 text-[11px]" />
                              {(styleOverrides as any).bottombarPromo?.backgroundColor && <button type="button" onClick={() => setStyleOverrides(prev => { const n:any={...prev, bottombarPromo:{...(prev as any).bottombarPromo}}; delete n.bottombarPromo.backgroundColor; if(!Object.keys(n.bottombarPromo).length) delete n.bottombarPromo; return n; })} className="text-[10px] text-gray-400 hover:text-red-500 px-1" title="Reset">✕</button>}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Enroll Btn Bg</label>
                            <div className="flex items-center gap-1">
                              <input type="color" value={(styleOverrides as any).bottombarEnroll?.backgroundColor ?? "#1E4600"} onChange={(e) => setStyleOverrides(prev => ({ ...prev, bottombarEnroll: { ...(prev as any).bottombarEnroll, backgroundColor: e.target.value } }))} className="h-7 w-7 rounded border p-0.5" />
                              <input type="text" value={(styleOverrides as any).bottombarEnroll?.backgroundColor ?? ""} onChange={(e) => setStyleOverrides(prev => ({ ...prev, bottombarEnroll: { ...(prev as any).bottombarEnroll, backgroundColor: e.target.value || undefined } }))} placeholder="#1E4600" className="flex-1 rounded border px-1 py-1 text-[11px]" />
                              {(styleOverrides as any).bottombarEnroll?.backgroundColor && <button type="button" onClick={() => setStyleOverrides(prev => { const n:any={...prev, bottombarEnroll:{...(prev as any).bottombarEnroll}}; delete n.bottombarEnroll.backgroundColor; if(!Object.keys(n.bottombarEnroll).length) delete n.bottombarEnroll; return n; })} className="text-[10px] text-gray-400 hover:text-red-500 px-1" title="Reset">✕</button>}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-600 mb-1">Enroll Btn Text</label>
                            <div className="flex items-center gap-1">
                              <input type="color" value={(styleOverrides as any).bottombarEnroll?.color ?? "#FFFFFF"} onChange={(e) => setStyleOverrides(prev => ({ ...prev, bottombarEnroll: { ...(prev as any).bottombarEnroll, color: e.target.value } }))} className="h-7 w-7 rounded border p-0.5" />
                              <input type="text" value={(styleOverrides as any).bottombarEnroll?.color ?? ""} onChange={(e) => setStyleOverrides(prev => ({ ...prev, bottombarEnroll: { ...(prev as any).bottombarEnroll, color: e.target.value || undefined } }))} placeholder="#FFFFFF" className="flex-1 rounded border px-1 py-1 text-[11px]" />
                              {(styleOverrides as any).bottombarEnroll?.color && <button type="button" onClick={() => setStyleOverrides(prev => { const n:any={...prev, bottombarEnroll:{...(prev as any).bottombarEnroll}}; delete n.bottombarEnroll.color; if(!Object.keys(n.bottombarEnroll).length) delete n.bottombarEnroll; return n; })} className="text-[10px] text-gray-400 hover:text-red-500 px-1" title="Reset">✕</button>}
                            </div>
                          </div>
                        </div>
                       </div>
                      </div>
                    </Panel>
                    {/* Reorderable mastery sections */}
                    {orderedMasteryIds.filter(id => id !== "curriculum").map((sectionId, idx) => {
                      const section = MASTERY_SECTIONS.find(s => s.id === sectionId);
                      const renderer = masterySectionContent[sectionId];
                      if (!section || !renderer) return null;
                      return (
                        <Panel key={sectionId} title={section.label} {...mvMastery(idx)}>
                          {renderer()}
                        </Panel>
                      );
                    })}
                    <p className="mt-3 text-xs text-gray-400">Save styles after editing to persist changes.                    </p>
                  </div>
                )}
              </div>
            )}
            {tab === "detail" && <CourseDetailPageForm course={course} />}
            {tab === "reviews" && (
              mode === "create" ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 max-w-sm">
                    <p className="text-sm font-semibold text-amber-800 mb-1">Create course first</p>
                    <p className="text-xs text-amber-600">
                      Save the course before adding reviews. Fill in the basics and click <strong>Create</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <CourseReviewsTab course={course} />
              )
            )}
          </div>
        </div>

        {/* ── Middle: Curriculum ── */}
        <div className={`flex flex-col bg-gray-50 border-r border-gray-200 ${showPreview ? "w-[380px] shrink-0" : "flex-1"}`}>
          <div className="shrink-0 flex items-center border-b border-gray-200 bg-white px-5 py-2.5">
            <span className="text-sm font-semibold text-brand-700">Curriculum</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {isMastery && courseType === "bundle" ? (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-6 text-center">
                <p className="text-sm font-semibold text-indigo-800">Bundle has no curriculum</p>
                <p className="text-xs text-indigo-600 mt-1">Real lessons live inside the selected courses. Use the <strong>Bundle Curriculum</strong> editor on the left to control the landing page <em>কোর্স কারিকুলাম</em> display only.</p>
              </div>
            ) : mode === "create" ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 max-w-sm">
                  <p className="text-sm font-semibold text-amber-800 mb-1">Create course first</p>
                  <p className="text-xs text-amber-600">
                    Save the course before adding curriculum content. Fill in the basics and click <strong>Create</strong>.
                  </p>
                </div>
              </div>
            ) : (
              <CurriculumBuilder courseId={course.id} initialModules={modules} onModulesChange={handleModulesChange} />
            )}
          </div>
        </div>

        {/* ── Right: Live Preview ── */}
        {showPreview && (
          <div className="flex-1 overflow-y-auto bg-gray-100">
            {previewDevice === "mobile" ? (
              <MobilePreviewFrame>
                <div className="bg-white">
                  {isMastery && (
                    <MasteryStickyOfferBar
                      overrides={styleOverrides as any}
                      price={parseFloat(previewCourse.price) || 0}
                      discountPrice={previewCourse.discountPrice ? parseFloat(previewCourse.discountPrice) : null}
                      timerHours={previewCourse.valueBreakdownInfo?.timerHours}
                      timerMinutes={previewCourse.valueBreakdownInfo?.timerMinutes}
                      timerSeconds={previewCourse.valueBreakdownInfo?.timerSeconds}
                      offerLabel={previewCourse.valueBreakdownInfo?.offerLabel}
                      logo={<img src="/Skillkoro-logo.png" alt="SkillKoro" className="h-8 w-auto" />}
                      ctaButton={<span className="bg-green-500 text-white text-[13px] font-bold px-5 py-2 rounded-lg whitespace-nowrap shadow-md">{previewCourse.valueBreakdownInfo?.ctaText || "Enroll Now"}</span>}
                    />
                  )}
                  <InlineStyleEditor overrides={styleOverrides} onChange={setStyleOverrides}>
                    <TemplateStyleScope overrides={styleOverrides}>
                      <RecordedCoursePreview course={previewCourse} />
                    </TemplateStyleScope>
                  </InlineStyleEditor>
                  {isMastery && (
                    <MasteryBottomBar
                      overrides={styleOverrides as any}
                      fixed={false}
                      phone={previewCourse.supportPhone || "+880 1700-000000"}
                      price={parseFloat(previewCourse.price) || 0}
                      discountPrice={previewCourse.discountPrice ? parseFloat(previewCourse.discountPrice) : null}
                      ctaButtons={
                        <span className="bg-green-700 text-white text-[13px] font-bold px-6 py-2.5 rounded-lg whitespace-nowrap shadow-md">{previewCourse.valueBreakdownInfo?.ctaText || "এখনই এনরোল করুন"}</span>
                      }
                    />
                  )}
                </div>
              </MobilePreviewFrame>
            ) : (
              <div className="bg-white shadow-sm">
                {isMastery && (
                  <MasteryStickyOfferBar
                    overrides={styleOverrides as any}
                    price={parseFloat(previewCourse.price) || 0}
                    discountPrice={previewCourse.discountPrice ? parseFloat(previewCourse.discountPrice) : null}
                    timerHours={previewCourse.valueBreakdownInfo?.timerHours}
                    timerMinutes={previewCourse.valueBreakdownInfo?.timerMinutes}
                    timerSeconds={previewCourse.valueBreakdownInfo?.timerSeconds}
                    offerLabel={previewCourse.valueBreakdownInfo?.offerLabel}
                    logo={<img src="/Skillkoro-logo.png" alt="SkillKoro" className="h-8 w-auto" />}
                    ctaButton={<span className="bg-green-500 text-white text-[13px] font-bold px-5 py-2 rounded-lg whitespace-nowrap shadow-md">{previewCourse.valueBreakdownInfo?.ctaText || "Enroll Now"}</span>}
                  />
                )}
                <InlineStyleEditor overrides={styleOverrides} onChange={setStyleOverrides}>
                  <TemplateStyleScope overrides={styleOverrides}>
                    <RecordedCoursePreview course={previewCourse} />
                  </TemplateStyleScope>
                </InlineStyleEditor>
                {isMastery && (
                  <MasteryBottomBar
                    overrides={styleOverrides as any}
                    fixed={false}
                    phone={previewCourse.supportPhone || "+880 1700-000000"}
                    price={parseFloat(previewCourse.price) || 0}
                    discountPrice={previewCourse.discountPrice ? parseFloat(previewCourse.discountPrice) : null}
                    ctaButtons={
                      <span className="bg-green-700 text-white text-[13px] font-bold px-6 py-2.5 rounded-lg whitespace-nowrap shadow-md">{previewCourse.valueBreakdownInfo?.ctaText || "এখনই এনরোল করুন"}</span>
                    }
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {toolsPickerIndex !== null && (
        <MediaLibraryModal
          filterType="image"
          onSelect={(file) => {
            const next = [...toolsInfo];
            next[toolsPickerIndex] = { ...next[toolsPickerIndex]!, image: file.url };
            setToolsInfo(next);
            setToolsPickerIndex(null);
          }}
          onClose={() => setToolsPickerIndex(null)}
        />
      )}

      {whyFeaturePickerIndex !== null && (
        <MediaLibraryModal
          filterType="image"
          onSelect={(file) => {
            const next = [...whyFeatures];
            next[whyFeaturePickerIndex] = { ...next[whyFeaturePickerIndex]!, image: file.url };
            setWhyFeatures(next);
            setWhyFeaturePickerIndex(null);
          }}
          onClose={() => setWhyFeaturePickerIndex(null)}
        />
      )}

      {instructorPhotoIndex !== null && (
        <MediaLibraryModal
          filterType="image"
          onSelect={(file) => {
            const next = [...instructors];
            next[instructorPhotoIndex] = { ...next[instructorPhotoIndex]!, photo: file.url };
            setInstructors(next);
            setInstructorPhotoIndex(null);
          }}
          onClose={() => setInstructorPhotoIndex(null)}
        />
      )}

      {companyLogoPickerIndex !== null && (
        <MediaLibraryModal
          filterType="image"
          onSelect={(file) => {
            const next = [...instructors];
            const companies = [...(next[companyLogoPickerIndex.instructorIdx]!.companies || [])];
            companies[companyLogoPickerIndex.companyIdx] = { ...companies[companyLogoPickerIndex.companyIdx]!, logo: file.url };
            next[companyLogoPickerIndex.instructorIdx] = { ...next[companyLogoPickerIndex.instructorIdx]!, companies };
            setInstructors(next);
            setCompanyLogoPickerIndex(null);
          }}
          onClose={() => setCompanyLogoPickerIndex(null)}
        />
      )}

      {benefitImagePickerIndex !== null && (
        <MediaLibraryModal
          filterType="image"
          onSelect={(file) => {
            const next = [...benefitsItems];
            next[benefitImagePickerIndex] = { ...next[benefitImagePickerIndex]!, image: file.url };
            setBenefitsItems(next);
            setBenefitImagePickerIndex(null);
          }}
          onClose={() => setBenefitImagePickerIndex(null)}
        />
      )}
    </div>
  );
}
