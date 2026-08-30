import { isTrackingItemEnabled } from "@/shared/utils/tracking-registry.server";

interface ContentContextProps {
  type: "course" | "course_list" | "blog_post" | "blog_list";
  category?: string | null;
  author?: string | null;
  /** Only meaningful on listing/archive pages — omit entirely on single-item pages. */
  pageCount?: number;
  totalCount?: number;
}

/**
 * Server component — pushes page/content metadata into `dataLayer` as early as
 * this render allows (top of page body; per-page data like a course's category
 * isn't resolvable from the root layout without fetching every page there).
 * Renders nothing when the `content_context` registry item is disabled.
 */
export async function ContentContext({ type, category, author, pageCount, totalCount }: ContentContextProps) {
  if (!(await isTrackingItemEnabled("content_context"))) return null;

  const pageContext: Record<string, unknown> = { page_type: type };
  if (category) pageContext.category = category;
  if (author) pageContext.author = author;
  if (pageCount !== undefined) pageContext.post_count_page = pageCount;
  if (totalCount !== undefined) pageContext.post_count_total = totalCount;

  return (
    <script
      id="content-context"
      dangerouslySetInnerHTML={{
        __html: `window.dataLayer=window.dataLayer||[];window.dataLayer.push({page_context:${JSON.stringify(pageContext)}});`,
      }}
    />
  );
}
