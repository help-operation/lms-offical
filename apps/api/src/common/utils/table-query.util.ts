import { and, asc, desc, gte, ilike, lte, or, sql, type AnyColumn, type SQL } from 'drizzle-orm';

// ─── Input / Config / Output Types ───────────────────────────────────────────

/** Query parameters accepted from the HTTP request (mirrors frontend TableQueryParams) */
export interface TableQueryInput {
  page?: number | string;
  per_page?: number | string;
  search?: string;
  sort_field?: string;
  sort_direction?: 'asc' | 'desc';
  date_from?: string;
  date_to?: string;
  [key: string]: unknown;
}

/**
 * Configuration object — declare once per service method,
 * analogous to the PHP HandleTableQuery trait's class properties.
 */
export interface TableQueryConfig {
  /** Columns to apply ILIKE search across (OR-joined) */
  searchable?: AnyColumn[];

  /**
   * Maps a sort_field string value → the actual DB column.
   * e.g. { createdAt: users.createdAt, email: users.email }
   */
  sortable?: Record<string, AnyColumn>;

  /**
   * Maps a filter key → DB column (eq match) OR a callback that returns an SQL expression.
   * e.g. { role: users.role, isActive: (v) => eq(coupons.isActive, v === 'true') }
   */
  filterable?: Record<string, AnyColumn | ((value: string) => SQL)>;

  /** Column used for date_from / date_to range filtering */
  dateColumn?: AnyColumn;

  /** Fallback ORDER BY when sort_field is absent or invalid (required) */
  defaultSort: SQL;

  /** Hard cap on per_page (default: 100) */
  maxPerPage?: number;
}

/** Everything the service needs to complete its Drizzle query */
export interface TableQueryBuilt {
  where: SQL | undefined;
  orderBy: SQL;
  limit: number;
  offset: number;
  /** Resolved current page (1-based) */
  page: number;
  /** Resolved rows-per-page */
  perPage: number;
}

/** Standard paginated response envelope, matches frontend TablePagination shape */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

// ─── Core Helpers ─────────────────────────────────────────────────────────────

/**
 * Translate raw HTTP query params + a config object into
 * `{ where, orderBy, limit, offset, page, perPage }`.
 *
 * Usage in a service:
 * ```ts
 * const q = buildTableQuery(params, {
 *   searchable:  [users.firstName, users.lastName, users.email],
 *   sortable:    { createdAt: users.createdAt, email: users.email },
 *   filterable:  { role: users.role, status: users.status },
 *   dateColumn:  users.createdAt,
 *   defaultSort: desc(users.createdAt),
 * });
 *
 * const [rows, [{ count }]] = await Promise.all([
 *   db.select().from(users).where(q.where).orderBy(q.orderBy).limit(q.limit).offset(q.offset),
 *   db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) }).from(users).where(q.where),
 * ]);
 * return formatPaginatedResponse(rows, count, q.page, q.perPage);
 * ```
 */
export function buildTableQuery(
  params: TableQueryInput,
  config: TableQueryConfig,
): TableQueryBuilt {
  const maxPerPage = config.maxPerPage ?? 100_000;

  // ── Pagination ──────────────────────────────────────────────────────────────
  const page    = Math.max(1, Number(params.page    ?? 1));
  const perPage = Math.min(maxPerPage, Math.max(1, Number(params.per_page ?? 20)));
  const offset  = (page - 1) * perPage;

  // ── Conditions collector ────────────────────────────────────────────────────
  const conditions: SQL[] = [];

  // ── Search (ILIKE OR across searchable columns) ─────────────────────────────
  if (params.search?.trim() && config.searchable?.length) {
    const term = `%${params.search.trim()}%`;
    const likeExprs = config.searchable.map((col) => ilike(col, term));
    conditions.push(or(...likeExprs) as SQL);
  }

  // ── Filterable columns / callbacks ──────────────────────────────────────────
  if (config.filterable) {
    for (const [key, colOrFn] of Object.entries(config.filterable)) {
      const raw = params[key];
      if (raw === undefined || raw === null || raw === '') continue;
      const value = String(raw);

      if (typeof colOrFn === 'function') {
        // Custom callback — e.g. boolean conversion
        conditions.push(colOrFn(value));
      } else {
        // Direct column equality
        conditions.push(sql`${colOrFn} = ${value}`);
      }
    }
  }

  // ── Date range ───────────────────────────────────────────────────────────────
  if (config.dateColumn) {
    if (params.date_from) {
      conditions.push(gte(config.dateColumn, new Date(params.date_from)) as SQL);
    }
    if (params.date_to) {
      const endOfDay = new Date(params.date_to);
      endOfDay.setUTCHours(23, 59, 59, 999);
      conditions.push(lte(config.dateColumn, endOfDay) as SQL);
    }
  }

  // ── WHERE clause ─────────────────────────────────────────────────────────────
  const where: SQL | undefined =
    conditions.length > 0 ? (and(...conditions) as SQL) : undefined;

  // ── ORDER BY ─────────────────────────────────────────────────────────────────
  let orderBy: SQL = config.defaultSort;
  if (params.sort_field && config.sortable) {
    const col = config.sortable[params.sort_field];
    if (col) {
      orderBy = params.sort_direction === 'asc' ? asc(col) : desc(col);
    }
  }

  return { where, orderBy, limit: perPage, offset, page, perPage };
}

/**
 * Wrap a data array + total count into the standard paginated envelope.
 */
export function formatPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  perPage: number,
): PaginatedResponse<T> {
  const lastPage = Math.max(1, Math.ceil(total / perPage));
  const from     = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to       = Math.min(page * perPage, total);

  return {
    data,
    pagination: {
      total,
      per_page:     perPage,
      current_page: page,
      last_page:    lastPage,
      from,
      to,
    },
  };
}
