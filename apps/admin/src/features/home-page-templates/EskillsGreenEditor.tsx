"use client";

import { useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "@repo/ui/sonner";
import {
  ArrowLeft, Monitor, Smartphone, Eye, EyeOff, Save, ExternalLink, Loader2,
} from "lucide-react";
import { Panel } from "@/features/live-courses/LiveCourseEditorUI";
import { EDITORS } from "@/features/page-sections/SectionEditors";
import {
  updatePageSectionAction,
  togglePageSectionAction,
  reorderPageSectionsAction,
} from "@/features/pages/actions/pages.actions";
import type { PageSection } from "@/features/page-sections/api";
import { generateBrandScale, brandScaleToCssVars, isHexColor } from "@/shared/utils/color";

import HeroV2 from "@repo/ui/home-v1-hero";
import FeatureCardsV2 from "@repo/ui/home-v1-feature-cards";
import CategoriesGridV2 from "@repo/ui/home-v1-categories-grid";
import CtaBannerV2 from "@repo/ui/home-v1-cta-banner";
import FeaturedCollageV2 from "@repo/ui/home-v1-featured-collage";
import CoursesGridV2 from "@repo/ui/home-v1-courses-grid";
import InstructorsGridV2 from "@repo/ui/home-v1-instructors-grid";
import StudentStoriesV2 from "@repo/ui/home-v1-student-stories";
import ArticlesV2 from "@repo/ui/home-v1-articles";
import FaqAccordionV2 from "@repo/ui/home-v1-faq-accordion";
import NewsletterV2 from "@repo/ui/home-v1-newsletter";

type Props = { initialSections: PageSection[]; previewColor?: string };

// Live-preview renderers for every "_v2" (ESkills Green) section type. The
// 4 data-driven types (courses/instructors/reviews/articles) get an empty
// list here — this screen only edits their copy (eyebrow/title/limit etc.),
// not the underlying live data, which is fetched for real on the public site.
const PREVIEW: Record<string, (content: Record<string, unknown>) => ReactNode> = {
  hero_v2:             (c) => <HeroV2 content={c} />,
  feature_cards_v2:    (c) => <FeatureCardsV2 content={c} />,
  categories_v2:       (c) => <CategoriesGridV2 content={c} />,
  cta_banner_v2:       (c) => <CtaBannerV2 content={c} />,
  featured_collage_v2: (c) => <FeaturedCollageV2 content={c} />,
  courses_grid_v2:     (c) => <CoursesGridV2 content={c} courses={[]} />,
  instructors_v2:      (c) => <InstructorsGridV2 content={c} instructors={[]} />,
  student_stories_v2:  (c) => <StudentStoriesV2 content={c} reviews={[]} />,
  articles_v2:         (c) => <ArticlesV2 content={c} posts={[]} />,
  faq_v2:              (c) => <FaqAccordionV2 content={c} />,
  newsletter_v2:       (c) => <NewsletterV2 content={c} />,
};

const toolbarBtn =
  "flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800";

export function EskillsGreenEditor({ initialSections, previewColor }: Props) {
  const previewStyle =
    previewColor && isHexColor(previewColor)
      ? (brandScaleToCssVars(generateBrandScale(previewColor)) as React.CSSProperties)
      : undefined;

  const router = useRouter();
  const [sections, setSections] = useState<PageSection[]>(
    [...initialSections].sort((a, b) => a.order - b.order),
  );
  const [dirty, setDirty] = useState<Set<number>>(new Set());
  const [busyId, setBusyId] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [isSaving, startSaving] = useTransition();

  function handleContentChange(id: number, content: Record<string, unknown>) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, content } : s)));
    setDirty((prev) => new Set(prev).add(id));
  }

  async function handleToggle(id: number) {
    setBusyId(id);
    try {
      await togglePageSectionAction(id);
      setSections((prev) => prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)));
    } catch {
      toast.error("Failed to update visibility");
    } finally {
      setBusyId(null);
    }
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= sections.length) return;
    const next = [...sections];
    [next[index], next[swapIdx]] = [next[swapIdx]!, next[index]!];
    const reordered = next.map((s, i) => ({ ...s, order: i }));
    setSections(reordered);
    try {
      await reorderPageSectionsAction(reordered.map((s) => ({ id: s.id, order: s.order })));
    } catch {
      toast.error("Failed to reorder");
    }
  }

  function handleSave() {
    if (dirty.size === 0) return;
    startSaving(async () => {
      const ids = Array.from(dirty);
      const results = await Promise.all(
        ids.map((id) => {
          const section = sections.find((s) => s.id === id)!;
          return updatePageSectionAction(id, { content: section.content });
        }),
      );
      const failed = results.filter((r) => !r.success).length;
      if (failed > 0) {
        toast.error(`Failed to save ${failed} section(s)`);
        return;
      }
      setDirty(new Set());
      toast.success("Changes saved");
      router.refresh();
    });
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)] flex-col">
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/content/home-templates"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-gray-900 dark:text-slate-100">Elevate — Template Editor</h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {dirty.size > 0 ? `${dirty.size} unsaved change${dirty.size > 1 ? "s" : ""}` : "All changes saved"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowPreview((v) => !v)} className={toolbarBtn}>
            {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>

          {showPreview && (
            <div className="flex items-center rounded-lg border border-gray-200 p-0.5 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setDevice("desktop")}
                title="Desktop preview"
                className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                  device === "desktop" ? "bg-brand-600 text-white" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDevice("mobile")}
                title="Mobile preview"
                className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                  device === "mobile" ? "bg-brand-600 text-white" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <a href="/" target="_blank" rel="noreferrer" className={toolbarBtn}>
            <ExternalLink className="h-3.5 w-3.5" />
            Preview Site
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || dirty.size === 0}
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-400"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save{dirty.size > 0 ? ` (${dirty.size})` : ""}
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Content panels */}
        <div
          className={`overflow-y-auto border-r border-gray-200 bg-gray-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40 ${
            showPreview ? "w-[420px] shrink-0" : "flex-1"
          }`}
        >
          <div className="space-y-3">
            {sections.map((section, i) => {
              const Editor = EDITORS[section.type];
              return (
                <Panel
                  key={section.id}
                  title={section.label}
                  index={i + 1}
                  onMoveUp={() => handleMove(i, "up")}
                  onMoveDown={() => handleMove(i, "down")}
                  canMoveUp={i > 0}
                  canMoveDown={i < sections.length - 1}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-gray-400 dark:text-slate-500">{section.type}</span>
                    <button
                      type="button"
                      onClick={() => handleToggle(section.id)}
                      disabled={busyId === section.id}
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                        section.active
                          ? "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400"
                          : "bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-500"
                      }`}
                    >
                      {section.active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {section.active ? "Visible" : "Hidden"}
                    </button>
                  </div>
                  {Editor ? (
                    <Editor content={section.content} onChange={(c) => handleContentChange(section.id, c)} />
                  ) : (
                    <p className="text-xs text-gray-400">No editor available for this section type.</p>
                  )}
                </Panel>
              );
            })}
            {sections.length === 0 && (
              <div className="py-16 text-center text-sm text-gray-400">No sections found for this template.</div>
            )}
          </div>
        </div>

        {/* Live preview */}
        {showPreview && (
          <div className="flex-1 overflow-y-auto bg-gray-100 p-6 dark:bg-slate-950">
            <div
              style={previewStyle}
              className={`mx-auto overflow-hidden rounded-xl bg-white shadow-lg transition-all ${
                device === "mobile" ? "max-w-sm" : "max-w-none"
              }`}
            >
              {sections
                .filter((s) => s.active)
                .map((section) => {
                  const render = PREVIEW[section.type];
                  return render ? <div key={section.id}>{render(section.content)}</div> : null;
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
