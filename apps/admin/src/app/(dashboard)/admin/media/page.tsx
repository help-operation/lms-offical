import { mediaAdminApi } from "@/features/media/api/media.api";
import { MediaFilters } from "@/features/media/components/MediaFilters";
import { MediaGridClient } from "@/features/media/components/MediaGridClient";
import type { MediaSortField, MediaSortDirection } from "@/features/media/types";

export const metadata = { title: "Media Library" };

/** Map the URL `sort` param to a backend sort field + direction. */
const SORT_MAP: Record<string, { field: MediaSortField; dir: MediaSortDirection }> = {
  created_at: { field: "created_at", dir: "desc" },
  filename:   { field: "filename",   dir: "asc"  },
  size:       { field: "size",       dir: "desc" },
  type:       { field: "type",       dir: "asc"  },
};

// Page-size options offered in the toolbar dropdown. Anything else in the URL
// falls back to the default.
const PER_PAGE_OPTIONS = [10, 20, 50, 100];
const DEFAULT_PER_PAGE = 10;

interface Props {
  searchParams: Promise<{
    search?:   string;
    type?:     string;
    sort?:     string;
    view?:     string;
    page?:     string;
    per_page?: string;
  }>;
}

export default async function AdminMediaPage({ searchParams }: Props) {
  const sp     = await searchParams;
  const page   = sp.page ? parseInt(sp.page, 10) : 1;
  const search = sp.search ?? "";
  const type   = sp.type   ?? "";
  const sort   = sp.sort   ?? "created_at";
  const view   = sp.view   ?? "grid";
  const perPage = PER_PAGE_OPTIONS.includes(Number(sp.per_page))
    ? Number(sp.per_page)
    : DEFAULT_PER_PAGE;

  const sortEntry = SORT_MAP[sort];
  const field: MediaSortField     = sortEntry?.field ?? "created_at";
  const dir:   MediaSortDirection = sortEntry?.dir   ?? "desc";

  const res = await mediaAdminApi
    .list({
      page,
      perPage,
      search:        search || undefined,
      type:          (type as import("@/features/media/types").MediaType) || undefined,
      sortField:     field,
      sortDirection: dir,
    })
    .catch(() => null);

  const files      = res?.data.data       ?? [];
  const pagination = res?.data.pagination ?? {
    current_page: 1,
    per_page: perPage,
    total: 0,
    last_page: 1,
    from: 0,
    to: 0,
  };
  const summary = res?.data.summary ?? {
    total_files:     0,
    total_size:      0,
    total_images:    0,
    total_videos:    0,
    total_documents: 0,
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {pagination.total} file{pagination.total !== 1 ? "s" : ""} — upload, organise, and reuse assets across your platform.
        </p>
      </div>

      {/* Filters (client island) */}
      <MediaFilters search={search} type={type} sort={sort} view={view} perPage={String(perPage)} />

      {/* Main grid / list (client island — holds all selection & modal state) */}
      <MediaGridClient
        files={files}
        pagination={pagination}
        summary={summary}
        view={view}
      />
    </div>
  );
}
