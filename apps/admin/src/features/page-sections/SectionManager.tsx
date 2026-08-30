"use client";

import { useState, useTransition } from "react";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { toast } from "@repo/ui/sonner";
import {
  ArrowUp, ArrowDown, Eye, EyeOff, Trash2, Edit2, Save, X,
  Plus, ExternalLink,
} from "lucide-react";
import {
  updatePageSectionAction,
  togglePageSectionAction,
  reorderPageSectionsAction,
  deletePageSectionAction,
  createPageSectionAction,
} from "@/features/pages/actions/pages.actions";
import type { PageSection } from "@/features/page-sections/api";
import { EDITORS } from "./SectionEditors";

// ─── Section type colours ─────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  // Home
  hero:                 { bg: "bg-rose-100",    text: "text-rose-600",    label: "Hero"          },
  top_courses:          { bg: "bg-blue-100",    text: "text-blue-600",    label: "Top Courses"   },
  upcoming_batches:     { bg: "bg-teal-100",    text: "text-teal-600",    label: "Batches"       },
  recorded_courses:     { bg: "bg-sky-100",     text: "text-sky-600",     label: "Recorded"      },
  our_courses:          { bg: "bg-indigo-100",  text: "text-indigo-600",  label: "Categories"    },
  flexible_learning:    { bg: "bg-blue-100",    text: "text-blue-600",    label: "Features"      },
  course_facilities:    { bg: "bg-lime-100",    text: "text-lime-700",    label: "Facilities"    },
  testimonials:         { bg: "bg-brand-100",  text: "text-brand-600",  label: "Testimonials"  },
  get_started_steps:    { bg: "bg-emerald-100", text: "text-emerald-700", label: "Steps"         },
  featured_in:          { bg: "bg-stone-100",   text: "text-stone-700",   label: "Press"         },
  partners:             { bg: "bg-gray-100",    text: "text-gray-600",    label: "Partners"      },
  student_reviews:      { bg: "bg-fuchsia-100", text: "text-fuchsia-600", label: "Reviews"       },
  cta:                  { bg: "bg-green-100",   text: "text-green-600",   label: "CTA"           },
  success_stories:      { bg: "bg-red-100",     text: "text-red-600",     label: "Stories"       },
  certificate:          { bg: "bg-amber-100",   text: "text-amber-700",   label: "Certificate"   },
  payment_method:       { bg: "bg-yellow-100",  text: "text-yellow-700",  label: "Payment"       },
  join_instructor:      { bg: "bg-green-100",   text: "text-green-700",   label: "Instructor"    },
  community:            { bg: "bg-emerald-100", text: "text-emerald-600", label: "Community"     },
  // Footer
  footer_info:          { bg: "bg-teal-100",    text: "text-teal-600",    label: "Footer"        },
  // Shared
  simple_hero:          { bg: "bg-sky-100",     text: "text-sky-600",     label: "Hero"          },
  // Contact
  contact_info:         { bg: "bg-cyan-100",    text: "text-cyan-600",    label: "Contact"       },
  // Our Instructor
  mentor_grid:           { bg: "bg-rose-100",    text: "text-rose-700",    label: "Mentors"       },
  // Success Stories
  success_stories_panel: { bg: "bg-brand-100",  text: "text-brand-700",  label: "Reviews"       },
  // Live Classes
  batches_grid:          { bg: "bg-teal-100",    text: "text-teal-700",    label: "Batches"       },
  // Free Courses
  free_courses_grid:     { bg: "bg-blue-100",    text: "text-blue-700",    label: "Free Grid"     },
  coming_soon_card:      { bg: "bg-yellow-100",  text: "text-yellow-700",  label: "Coming Soon"   },
  // About
  about_intro:          { bg: "bg-emerald-100", text: "text-emerald-700", label: "Intro"         },
  founding_team:        { bg: "bg-rose-100",    text: "text-rose-700",    label: "Founders"      },
  why_ict:              { bg: "bg-lime-100",    text: "text-lime-700",    label: "Why Us"        },
  media:                { bg: "bg-brand-100",  text: "text-brand-700",  label: "Media"         },
  milestones:           { bg: "bg-amber-100",   text: "text-amber-700",   label: "Milestones"    },
  about_stats:          { bg: "bg-indigo-100",  text: "text-indigo-600",  label: "Stats"         },
  about_mission_vision: { bg: "bg-brand-100",  text: "text-brand-600",  label: "Mission"       },
  about_team:           { bg: "bg-pink-100",    text: "text-pink-600",    label: "Team"          },
  // FAQ page
  faq_main:             { bg: "bg-orange-100",  text: "text-orange-600",  label: "FAQ"           },
  // Auth
  login_panel:          { bg: "bg-sky-100",     text: "text-sky-700",     label: "Login Panel"   },
};

function typeInitial(type: string) {
  return (TYPE_COLORS[type]?.label ?? type).slice(0, 1).toUpperCase();
}

// ─── Content preview ──────────────────────────────────────────────────────────

function ContentPreview({ section }: { section: PageSection }) {
  const c = section.content;
  const entries: [string, string][] = [];

  const fmt = (v: unknown): string => {
    if (typeof v === "string") return v.slice(0, 80);
    if (Array.isArray(v)) return `[${v.length} items]`;
    return "";
  };

  for (const [k, v] of Object.entries(c)) {
    if (Array.isArray(v) || typeof v === "object") continue;
    const val = fmt(v);
    if (val) entries.push([k.replace(/_/g, " "), val]);
    if (entries.length >= 3) break;
  }

  return (
    <div className="mt-2 space-y-0.5">
      {entries.map(([k, v]) => (
        <p key={k} className="text-xs text-gray-500 truncate">
          <span className="font-medium capitalize text-gray-600">{k}:</span> {v}
        </p>
      ))}
    </div>
  );
}

// ─── Shared field components ──────────────────────────────────────────────────


function EditModal({ section, onClose, onSaved }: {
  section: PageSection;
  onClose: () => void;
  onSaved: (updated: PageSection) => void;
}) {
  const [content, setContent] = useState<Record<string, unknown>>(section.content);
  const [label, setLabel] = useState(section.label);
  const [isPending, startTransition] = useTransition();

  const Editor = EDITORS[section.type];

  function handleSave() {
    startTransition(async () => {
      try {
        const res = await updatePageSectionAction(section.id, { label, content });
        toast.success("Section saved");
        onSaved(res.data as unknown as PageSection);
        onClose();
      } catch {
        toast.error("Failed to save");
      }
    });
  }

  const color = TYPE_COLORS[section.type] ?? { bg: "bg-gray-100", text: "text-gray-600", label: section.type };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`flex items-center gap-3 px-6 py-4 ${color.bg}`}>
          <div className={`w-10 h-10 rounded-xl ${color.bg} flex items-center justify-center border-2 border-white shadow-sm`}>
            <span className={`text-base font-bold ${color.text}`}>{typeInitial(section.type)}</span>
          </div>
          <div className="flex-1">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="text-base font-bold text-gray-900 bg-transparent focus:outline-none border-b border-transparent focus:border-gray-400 w-full"
            />
            <p className="text-xs text-gray-500">{section.slug} • {section.type}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-white/60 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {Editor ? (
            <Editor content={content} onChange={setContent} />
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 mb-4">Raw JSON editor — no custom editor for this type yet.</p>
              <textarea
                rows={15}
                value={JSON.stringify(content, null, 2)}
                onChange={(e) => { try { setContent(JSON.parse(e.target.value)); } catch {} }}
                className="w-full font-mono text-xs rounded-xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 transition-colors"
          >
            <Save size={14} />
            {isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  section, isFirst, isLast, onToggle, onEdit, onDelete, onMoveUp, onMoveDown,
}: {
  section: PageSection;
  isFirst: boolean;
  isLast: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const color = TYPE_COLORS[section.type] ?? { bg: "bg-gray-100", text: "text-gray-600", label: section.type };

  return (
    <div className={`rounded-2xl border ${section.active ? "border-gray-200 bg-white" : "border-dashed border-gray-200 bg-gray-50"} shadow-sm overflow-hidden transition-all`}>
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Reorder arrows */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button onClick={onMoveUp} disabled={isFirst} className="text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors">
            <ArrowUp size={14} />
          </button>
          <button onClick={onMoveDown} disabled={isLast} className="text-gray-300 hover:text-gray-600 disabled:opacity-30 transition-colors">
            <ArrowDown size={14} />
          </button>
        </div>

        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl ${color.bg} flex items-center justify-center shrink-0`}>
          <span className={`text-sm font-bold ${color.text}`}>{typeInitial(section.type)}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`text-sm font-bold ${section.active ? "text-gray-900" : "text-gray-400"}`}>
              {section.label}
            </h3>
            {section.active
              ? <span className="text-[10px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-full">Active</span>
              : <span className="text-[10px] font-bold bg-gray-300 text-gray-600 px-1.5 py-0.5 rounded-full">Hidden</span>
            }
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {section.slug} • {color.label} • #{section.order}
          </p>
          <ContentPreview section={section} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggle}
            title={section.active ? "Hide section" : "Show section"}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${section.active ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}`}
          >
            {section.active ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
          <button
            onClick={onEdit}
            title="Edit section"
            className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 hover:bg-brand-100 flex items-center justify-center transition-colors"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={onDelete}
            title="Delete section"
            className="w-9 h-9 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main SectionManager ──────────────────────────────────────────────────────

type Props = {
  initialSections: PageSection[];
  page: string;
  pageTitle?: string;
  pageDescription?: string;
};

export function SectionManager({ initialSections, page, pageTitle, pageDescription }: Props) {
  const [sections, setSections] = useState<PageSection[]>(initialSections);
  const [editingSection, setEditingSection] = useState<PageSection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PageSection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeCount = sections.filter((s) => s.active).length;
  const hiddenCount = sections.filter((s) => !s.active).length;

  async function handleToggle(id: number) {
    try {
      await togglePageSectionAction(id);
      setSections((prev) => prev.map((s) => s.id === id ? { ...s, active: !s.active } : s));
      toast.success("Visibility updated");
    } catch {
      toast.error("Failed to update");
    }
  }

  async function handleDelete(section: PageSection) {
    setDeleteTarget(null);
    setIsDeleting(true);
    try {
      await deletePageSectionAction(section.id);
      setSections((prev) => prev.filter((s) => s.id !== section.id));
      toast.success("Section deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const newSections = [...sections];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newSections.length) return;
    [newSections[index], newSections[swapIdx]] = [newSections[swapIdx]!, newSections[index]!];
    const reordered = newSections.map((s, i) => ({ ...s, order: i }));
    setSections(reordered);
    try {
      await reorderPageSectionsAction(reordered.map((s) => ({ id: s.id, order: s.order })));
    } catch {
      toast.error("Failed to reorder");
    }
  }

  function handleSaved(updated: PageSection) {
    setSections((prev) => prev.map((s) => s.id === updated.id ? updated : s));
  }

  const title = pageTitle ?? "Content Manager";
  const description = pageDescription ?? `Manage all sections for the ${page} page — content, order, and visibility.`;

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Section"
        message={deleteTarget ? <>Delete the <strong>{deleteTarget.label}</strong> section? This cannot be undone.</> : ""}
        confirmLabel="Yes, Delete"
        variant="danger"
        isPending={isDeleting}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
        <a
          href="/"
          target="_blank"
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl px-4 py-2 transition-colors"
        >
          <ExternalLink size={14} />
          Preview Site
        </a>
      </div>

      {/* Stats pills */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full">
          <Eye size={12} /> {activeCount} Active
        </div>
        <div className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-500 text-xs font-semibold px-3 py-1.5 rounded-full">
          <EyeOff size={12} /> {hiddenCount} Hidden
        </div>
      </div>

      {/* Section list */}
      <div className="space-y-3">
        {sections.map((section, i) => (
          <SectionCard
            key={section.id}
            section={section}
            isFirst={i === 0}
            isLast={i === sections.length - 1}
            onToggle={() => handleToggle(section.id)}
            onEdit={() => setEditingSection(section)}
            onDelete={() => setDeleteTarget(section)}
            onMoveUp={() => handleMove(i, "up")}
            onMoveDown={() => handleMove(i, "down")}
          />
        ))}
        {sections.length === 0 && (
          <div className="text-center py-16 text-sm text-gray-400">
            No sections found for this page.
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingSection && (
        <EditModal
          section={editingSection}
          onClose={() => setEditingSection(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
