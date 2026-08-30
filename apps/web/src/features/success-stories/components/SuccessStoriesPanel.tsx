import { Play, Star } from "lucide-react";
import Link from "next/link";

type Filter = { key: string; label: string };

export type VideoReview = {
  id: number;
  title: string;
  category: string;
  categoryLabel: string;
  image: string;
};

export type TextReview = {
  id: number;
  name: string;
  batch: string;
  category: string;
  rating: number;
  text: string;
};

export type SuccessStoriesPanelContent = {
  page_size?: number;
  filters?: Filter[];
  videos?: VideoReview[];
  texts?: TextReview[];
};

type SearchParams = { tab?: string; category?: string; show?: string };

type Props = {
  content?: SuccessStoriesPanelContent;
  searchParams: SearchParams;
};

const DEFAULT_PAGE_SIZE = 6;

const DEFAULTS: Required<SuccessStoriesPanelContent> = {
  page_size: DEFAULT_PAGE_SIZE,
  filters: [
    { key: "all",        label: "All" },
    { key: "capcut",     label: "Video Editing (CapCut)" },
    { key: "video",      label: "Video Editing" },
    { key: "excel",      label: "Excel" },
    { key: "callcenter", label: "Call Center" },
  ],
  videos: [
    { id: 1, title: "Customer Service Success Story", category: "callcenter", categoryLabel: "Call Center",             image: "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=600&h=360&fit=crop" },
    { id: 2, title: "Sales Team Transformation",      category: "video",      categoryLabel: "Sales",                   image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=360&fit=crop" },
    { id: 3, title: "Technical Support Breakthrough", category: "callcenter", categoryLabel: "Support",                 image: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?w=600&h=360&fit=crop" },
    { id: 4, title: "Call Center Efficiency",          category: "callcenter", categoryLabel: "Call Center",             image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&h=360&fit=crop" },
    { id: 5, title: "Team Management Success",        category: "excel",      categoryLabel: "Management",              image: "https://images.unsplash.com/photo-1494790108755-2616b332906c?w=600&h=360&fit=crop" },
    { id: 6, title: "Record Sales Achievement",       category: "video",      categoryLabel: "Sales",                   image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&h=360&fit=crop" },
    { id: 7, title: "CapCut Editing Mastery",          category: "capcut",     categoryLabel: "Video Editing (CapCut)", image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&h=360&fit=crop" },
    { id: 8, title: "From Beginner to Pro Editor",     category: "video",      categoryLabel: "Video Editing",          image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&h=360&fit=crop" },
    { id: 9, title: "Excel Reporting Wins",            category: "excel",      categoryLabel: "Excel",                   image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=360&fit=crop" },
  ],
  texts: [
    { id: 1, name: "Md. Mahfuzul Islam", batch: "FC2501", category: "capcut",     rating: 5, text: "A brilliant mentor. Every step was covered to turn a simple video into an eye-catching one — effects, transitions, color correction and more." },
    { id: 2, name: "HM Rifat Hossain",    batch: "FC2412", category: "video",      rating: 5, text: "The teaching approach is far better than many others. I learnt practical tips I now use in real client work every day." },
    { id: 3, name: "Tania Akter",         batch: "EE2401", category: "excel",      rating: 5, text: "Practical, up to date and well structured. The live support cleared all my doubts quickly." },
    { id: 4, name: "Sajid Rahman",        batch: "CC2402", category: "callcenter", rating: 5, text: "The job placement guidance and one-to-one support genuinely helped me start earning." },
    { id: 5, name: "Nusrat Jahan",        batch: "FC2409", category: "video",      rating: 5, text: "Great mentors and lessons. The recorded classes made revising before assignments effortless." },
    { id: 6, name: "Abu Altamas",         batch: "CC2402", category: "callcenter", rating: 5, text: "Confident on calls now. The role-play sessions made a real difference to my communication." },
  ],
};

/**
 * Server component — handles searchParams-driven filtering + pagination.
 * Content (filters, videos, texts) is CMS-driven; the page rewriting logic
 * is hardcoded since admin doesn't need to change it.
 */
const SuccessStoriesPanel = ({ content = {}, searchParams }: Props) => {
  const d = { ...DEFAULTS, ...content };
  const filters = Array.isArray(d.filters) && d.filters.length > 0 ? d.filters : DEFAULTS.filters;
  const videos  = Array.isArray(d.videos)  ? d.videos  : DEFAULTS.videos;
  const texts   = Array.isArray(d.texts)   ? d.texts   : DEFAULTS.texts;
  const pageSize = d.page_size > 0 ? d.page_size : DEFAULT_PAGE_SIZE;

  const tab = searchParams.tab === "text" ? "text" : "video";
  const category = searchParams.category ?? "all";
  const show = Math.max(pageSize, Number(searchParams.show ?? pageSize) || pageSize);

  const all = tab === "video" ? videos : texts;
  const filtered = category === "all" ? all : all.filter((i) => i.category === category);
  const visible = filtered.slice(0, show);
  const hasMore = filtered.length > show;

  const tabHref = (t: "text" | "video") => `?tab=${t}`;
  const categoryHref = (key: string) => `?tab=${tab}&category=${key}`;
  const moreHref = `?tab=${tab}&category=${category}&show=${show + pageSize}`;

  return (
    <div className="container mx-auto px-4">
      {/* Text / Video toggle */}
      <div className="mt-8 flex items-center justify-center gap-3">
        {[
          { key: "text" as const,  label: `Text Reviews (${texts.length})` },
          { key: "video" as const, label: `Video Reviews (${videos.length})` },
        ].map((t) => {
          const active = tab === t.key;
          return (
            <Link
              key={t.key}
              href={tabHref(t.key)}
              scroll={false}
              className={`rounded-md px-6 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-gradient-to-r from-brand-from to-brand-to text-white shadow-md"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* Panel */}
      <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm sm:p-10">
        {/* Category filters */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {filters.map((f) => {
            const active = f.key === category;
            return (
              <Link
                key={f.key}
                href={categoryHref(f.key)}
                scroll={false}
                className={`rounded-md px-5 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-gradient-to-r from-brand-from to-brand-to text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        {/* Content */}
        {tab === "video" ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(visible as VideoReview[]).map((v) => (
              <div
                key={v.id}
                className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm"
              >
                <div className="group relative aspect-video bg-gray-900">
                  <img
                    src={v.image}
                    alt={v.title}
                    className="h-full w-full object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
                  />
                  <span
                    aria-label={`Play ${v.title}`}
                    className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm ring-4 ring-white/40"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white">
                      <Play className="h-5 w-5 fill-brand-600 text-brand-600" />
                    </span>
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-bold text-gray-900">{v.title}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{v.categoryLabel}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(visible as TextReview[]).map((t) => (
              <div
                key={t.id}
                className="rounded-2xl border border-gray-100 p-6 shadow-sm"
              >
                <div className="flex items-center gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="mt-4 border-t border-dashed border-gray-200 pt-3">
                  <p className="text-sm font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-brand-600">Batch - {t.batch}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="mt-10 flex justify-center">
            <Link
              href={moreHref}
              scroll={false}
              className="rounded-md bg-gradient-to-r from-brand-from to-brand-to px-8 py-3 text-sm font-bold text-white shadow-md transition-all hover:scale-105"
            >
              Load More {tab === "video" ? "Videos" : "Reviews"}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuccessStoriesPanel;
