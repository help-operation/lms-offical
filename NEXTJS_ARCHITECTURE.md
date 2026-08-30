# Next.js Architecture Guide

> **The definitive guide for building Next.js applications in this monorepo.**
> Follow these rules to build apps that are fast, scalable, maintainable, and use Next.js to its full potential.

> **Target version:** Next.js **16.2.x** with React **19.2** and **Turbopack** (default for `next dev` and `next build`).
> Caching follows the **Cache Components** model — see [Section 9](#9-caching-strategy). If you're reading code or docs from an older Next.js 13/14/15 era, the caching model has fundamentally changed: nothing is cached by default; you opt in with `'use cache'`.

---

## Table of Contents

1. [Core Philosophy](#1-core-philosophy)
2. [The Golden Rules](#2-the-golden-rules)
3. [Folder Structure](#3-folder-structure)
4. [Server vs Client Components](#4-server-vs-client-components)
5. [The 10 Core Patterns](#5-the-10-core-patterns)
6. [File Naming Conventions](#6-file-naming-conventions)
7. [Data Fetching Strategy](#7-data-fetching-strategy)
8. [Mutation Strategy (Server Actions vs API)](#8-mutation-strategy-server-actions-vs-api)
9. [Caching Strategy](#9-caching-strategy)
10. [Loading, Error & Suspense](#10-loading-error--suspense)
11. [State Management Rules](#11-state-management-rules)
12. [Routing Conventions](#12-routing-conventions)
13. [Performance Checklist](#13-performance-checklist)
14. [Anti-Patterns (What NOT to Do)](#14-anti-patterns-what-not-to-do)
15. [Decision Trees](#15-decision-trees)
16. [Code Review Checklist](#16-code-review-checklist)

---

## 1. Core Philosophy

### Server-First, Client-Last

Every component is a **Server Component by default**. Only opt-in to `'use client'` when there is no other choice. Treat `'use client'` as a **contagion** — quarantine it to the smallest possible leaf.

### Why?

Next.js Server Components give us:
- **Zero JS shipped** for static parts
- **Server-side data fetching** with no waterfalls
- **Streaming SSR** via Suspense
- **Partial Prerendering (PPR), automatic** — static shell + dynamic islands, on by default with `cacheComponents`
- **Component-level caching** via the `'use cache'` directive (Cache Components — see [Section 9](#9-caching-strategy))
- **Edge caching** of rendered HTML
- **Better SEO and faster LCP**

A Next.js app built like a React SPA throws all of this away.

### The Mental Shift

```
React SPA mindset                     Next.js native mindset
────────────────────                   ──────────────────────
"Fetch data in useEffect"        →    "Fetch data on the server"
"Manage state with useState"     →    "Manage state with URL params"
"Show loading spinner"           →    "Stream with Suspense + skeleton"
"Submit form via fetch()"        →    "Submit form via Server Action"
"Add 'use client' everywhere"    →    "Add 'use client' only at leaves"
```

---

## 2. The Golden Rules

These rules are **non-negotiable**. Break them only with explicit justification.

1. **Server Component by default.** Every file starts without `'use client'`. Add it only when forced.
2. **`'use client'` lives at the leaf.** Never at the top of a page or large container. Split first, then mark client.
3. **No data fetching in client components.** Use Server Components, or pass data down as props.
4. **Pages are thin.** A `page.tsx` orchestrates child components — it does not contain UI logic.
5. **Every route has `loading.tsx` and `error.tsx`.** No exceptions for user-facing routes.
6. **Every async boundary has a skeleton.** Skeletons match the real layout shape — no spinners.
7. **One file = one concern.** Target < 150 lines per file. Split aggressively.
8. **URL is state.** Filters, sorting, pagination, tab selection live in URL search params, not React state.
9. **Forms use Server Actions.** Not `onSubmit` with `fetch()` (unless there's a specific reason).
10. **Mutations invalidate cache.** After mutating data, call `revalidatePath` or `revalidateTag` so any matching `'use cache'` units are re-run.
11. **Cache is opt-in, not default.** Nothing is cached unless marked with `'use cache'`. Choose what to cache deliberately — see [Section 9](#9-caching-strategy).

---

## 3. Folder Structure

### Feature-First Organization

Group code by **business domain**, not by file type. Each feature owns its components, hooks, API calls, types, and actions.

```
apps/{app-name}/
├── src/
│   ├── app/                          ← Routes ONLY (thin pages)
│   │   ├── layout.tsx                ← Root layout (providers, fonts)
│   │   ├── globals.css
│   │   │
│   │   ├── (auth)/                   ← Route group: no sidebar
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── ...
│   │   │
│   │   └── (main)/                   ← Route group: with sidebar
│   │       ├── layout.tsx
│   │       ├── dashboard/
│   │       │   ├── page.tsx
│   │       │   ├── loading.tsx
│   │       │   └── error.tsx
│   │       └── {section}/
│   │           ├── page.tsx
│   │           ├── loading.tsx
│   │           ├── error.tsx
│   │           └── [id]/
│   │               ├── page.tsx
│   │               ├── loading.tsx
│   │               └── error.tsx
│   │
│   ├── features/                     ← All domain logic lives here
│   │   ├── {feature-name}/
│   │   │   ├── components/           ← UI components for this feature
│   │   │   │   ├── FeatureList.tsx              (Server)
│   │   │   │   ├── FeatureList.skeleton.tsx     (Server)
│   │   │   │   ├── FeatureRow.tsx               (Server)
│   │   │   │   ├── FeatureSearchInput.tsx       (Client)
│   │   │   │   ├── FeatureFilters.tsx           (Client)
│   │   │   │   └── FeatureActions.tsx           (Client)
│   │   │   ├── hooks/                ← Client hooks (only used in client components)
│   │   │   │   └── useFeatureFilters.ts
│   │   │   ├── api/                  ← Server-side fetch functions
│   │   │   │   └── feature.api.ts
│   │   │   ├── actions/              ← Server Actions ('use server')
│   │   │   │   └── feature.actions.ts
│   │   │   ├── schemas.ts            ← Zod validation schemas
│   │   │   ├── types.ts              ← TypeScript types
│   │   │   ├── constants.ts          ← Feature constants
│   │   │   └── mock-data.ts          ← Fake data for UI development
│   │   │
│   │   ├── auth/
│   │   ├── dashboard/
│   │   └── ...
│   │
│   ├── shared/                       ← Used across multiple features
│   │   ├── components/
│   │   │   ├── DataTable.tsx
│   │   │   ├── KPICard.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   └── AppShell.tsx
│   │   ├── hooks/
│   │   │   ├── useDebounce.ts
│   │   │   └── useMediaQuery.ts
│   │   └── providers/
│   │       ├── QueryProvider.tsx
│   │       └── ThemeProvider.tsx
│   │
│   ├── lib/                          ← Pure utilities (no React)
│   │   ├── api-client.ts             ← Axios/fetch wrapper
│   │   ├── utils.ts                  ← cn() and helpers
│   │   ├── format.ts                 ← Formatters
│   │   └── query-keys.ts             ← TanStack Query keys
│   │
│   ├── config/
│   │   ├── sidebar.ts                ← Navigation structure
│   │   ├── permissions.ts
│   │   └── env.ts                    ← Type-safe env vars
│   │
│   └── types/
│       └── api.ts                    ← Shared API response types
│
├── public/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Where Does My File Go?

| Question | Answer |
|---|---|
| Is it a page route? | `app/.../page.tsx` |
| Is it used by ONE feature? | `features/{feature}/components/` |
| Is it used by MULTIPLE features? | `shared/components/` |
| Is it an API call? | `features/{feature}/api/` |
| Is it a Server Action? | `features/{feature}/actions/` |
| Is it a custom hook? | `features/{feature}/hooks/` (or `shared/hooks/` if generic) |
| Is it a type/interface? | `features/{feature}/types.ts` |
| Is it a Zod schema? | `features/{feature}/schemas.ts` |
| Is it a constant? | `features/{feature}/constants.ts` |
| Is it a utility function (no React)? | `lib/` |

---

## 4. Server vs Client Components

### Server Component (Default)

Use when the component:
- Renders data (from props or fetched on server)
- Doesn't need state, effects, or event handlers with state
- Doesn't access browser APIs (`window`, `localStorage`)
- Doesn't use hooks like `useState`, `useEffect`, `useContext` (most contexts)

**Examples:** page.tsx files, layouts, lists, rows, badges, headers, cards, skeletons, static forms (with Server Actions).

### Client Component (Opt-in)

Add `'use client'` ONLY when the component needs:

| Need | Required? |
|---|---|
| `useState`, `useReducer` | ✅ Yes |
| `useEffect`, `useLayoutEffect` | ✅ Yes |
| `useContext` (most contexts) | ✅ Yes |
| `useRouter`, `usePathname`, `useSearchParams` | ✅ Yes |
| Browser APIs (`window`, `localStorage`, `document`) | ✅ Yes |
| Event handlers tied to state (`onChange`, complex `onClick`) | ✅ Yes |
| Third-party libs that require browser (Recharts, certain Radix) | ✅ Yes |
| **Just rendering data** | ❌ No — keep server |
| **Static `<button>` or `<Link>`** | ❌ No — keep server |

### The Decision Tree

```
Building a component
        │
        ▼
Does it need state, effects, or browser APIs?
        │
   ┌────┴────┐
   │         │
  Yes        No
   │         │
   ▼         ▼
Make it     Server Component
'use client' (default — do nothing)
   │
   ▼
Make this file as SMALL as possible.
Pass server-rendered children via props.
```

---

## 5. The 10 Core Patterns

### Pattern 1: Server Shell + Client Island

The page is a Server Component. Small interactive parts are client "islands."

```tsx
// app/(main)/products/page.tsx — Server
export default function ProductsPage({ searchParams }) {
  return (
    <div>
      <PageHeader title="Products" />              {/* Server */}
      <ProductsSearchBar />                         {/* Client island */}
      <ProductsFilters />                           {/* Client island */}
      <Suspense fallback={<ProductsListSkeleton />}>
        <ProductsList searchParams={searchParams} /> {/* Server */}
      </Suspense>
    </div>
  )
}
```

### Pattern 2: Server Fetches, Client Renders Interaction

Never fetch data in a client component. Fetch on the server, pass as props.

```tsx
// Server wrapper
export async function ProductsTableServer() {
  const products = await fetchProducts()
  return <ProductsTableClient initialData={products} />
}

// Client (separate file)
'use client'
export function ProductsTableClient({ initialData }) {
  const [sortBy, setSortBy] = useState('name')
  const sorted = useMemo(() => sort(initialData, sortBy), [initialData, sortBy])
  return <table>...</table>
}
```

### Pattern 3: Children-as-Server-in-Client-Wrapper

Client components can have Server Component children passed via the `children` prop.

```tsx
// Client wrapper
'use client'
export function DialogWrapper({ children, trigger }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>{trigger}</button>
      <Dialog open={open}>{children}</Dialog>
    </>
  )
}

// Used from a Server Component
<DialogWrapper trigger="Open">
  <ServerOnlyContent />  {/* This stays a Server Component! */}
</DialogWrapper>
```

This is one of the most powerful patterns. Use it whenever a client wrapper has heavy server-rendered content inside.

### Pattern 4: URL as State

Filters, sorting, pagination → URL search params. Keeps pages Server Components.

```tsx
// Page reads searchParams (Server)
export default async function Page({ searchParams }) {
  const products = await fetchProducts({
    status: searchParams.status,
    page: Number(searchParams.page ?? 1),
  })
  return <ProductsList items={products} />
}

// Filter is a tiny client island
'use client'
export function StatusFilter() {
  const router = useRouter()
  const params = useSearchParams()
  return (
    <select
      value={params.get('status') ?? ''}
      onChange={(e) => {
        const next = new URLSearchParams(params)
        next.set('status', e.target.value)
        router.push(`?${next.toString()}`)
      }}
    >
      <option value="">All</option>
      <option value="active">Active</option>
    </select>
  )
}
```

**Benefits:**
- Page stays Server Component
- Filters are bookmarkable, shareable
- Browser back button works
- No client state to manage

### Pattern 5: Server Actions for Forms

No need for `onSubmit` handlers and `fetch()` calls. Forms work without `'use client'`.

```tsx
// features/products/actions/products.actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createProductAction(formData: FormData) {
  const name = formData.get('name') as string
  await db.insert(products).values({ name })
  revalidatePath('/products')
  redirect('/products')
}

// Component (Server!)
import { createProductAction } from '@/features/products/actions/products.actions'

export function CreateProductForm() {
  return (
    <form action={createProductAction}>
      <input name="name" required />
      <button type="submit">Create</button>
    </form>
  )
}
```

For pending states or optimistic UI, use `useFormStatus`/`useOptimistic` in a small client child.

### Pattern 6: Container/Presenter Split

- **Container** (Server): fetches data
- **Presenter** (Server or Client): renders data

```tsx
// Container — Server
async function ProductsContainer() {
  const data = await fetchProducts()
  return <ProductsPresenter data={data} />
}

// Presenter — Server (just renders)
function ProductsPresenter({ data }) {
  return <ul>{data.map(...)}</ul>
}
```

### Pattern 7: Compound Components

Complex UI splits into many small composable parts. Each part is Server or Client based on its own needs.

```tsx
<ProductCard.Root>
  <ProductCard.Header />        {/* Server */}
  <ProductCard.Stats />          {/* Server */}
  <ProductCard.Actions />        {/* Client (menu) */}
  <ProductCard.Footer />         {/* Server */}
</ProductCard.Root>
```

### Pattern 8: Parallel Data Fetching

Always fetch in parallel, not sequentially. Use `Promise.all()`.

```tsx
// ❌ Sequential — slow (waterfall)
const products = await fetchProducts()
const categories = await fetchCategories()
const stats = await fetchStats()

// ✅ Parallel — fast
const [products, categories, stats] = await Promise.all([
  fetchProducts(),
  fetchCategories(),
  fetchStats(),
])
```

### Pattern 9: Streaming with Suspense

Wrap independent async sections in `<Suspense>`. They stream in independently.

```tsx
export default function Dashboard() {
  return (
    <div>
      <Suspense fallback={<KPISkeleton />}>
        <KPIRow />  {/* Slow query, streams independently */}
      </Suspense>

      <Suspense fallback={<ChartSkeleton />}>
        <Chart />   {/* Slow query, streams independently */}
      </Suspense>

      <Suspense fallback={<FeedSkeleton />}>
        <ActivityFeed />  {/* Slow query, streams independently */}
      </Suspense>
    </div>
  )
}
```

User sees the page immediately. Each section pops in as its data arrives. **No blank screen, no waterfall.**

### Pattern 10: Hooks Quarantined to Client Files

Custom hooks live in `hooks/` folders but should **only ever be imported by client components**. Document this with a comment.

```tsx
// features/products/hooks/useProductFilters.ts
'use client'  // optional but explicit
import { useState } from 'react'

export function useProductFilters() {
  // ...
}
```

If you accidentally import a hook into a Server Component, Next.js will throw a clear error.

---

## 6. File Naming Conventions

### Component Files

| Pattern | When to use |
|---|---|
| `ProductsList.tsx` | Default — Server Component |
| `ProductsList.client.tsx` | When making client variant explicit (rare; usually skip suffix) |
| `ProductsList.skeleton.tsx` | Skeleton for loading state (always Server) |
| `useProductFilters.ts` | Custom hook (always client-only) |
| `products.api.ts` | API/fetch functions (Server) |
| `products.actions.ts` | Server Actions (file starts with `'use server'`) |
| `schemas.ts` | Zod schemas |
| `types.ts` | TypeScript types & interfaces |
| `constants.ts` | Feature constants (enums, color maps) |
| `mock-data.ts` | Fake data for UI development |

### Route Files (Next.js Special)

| File | Purpose |
|---|---|
| `page.tsx` | The actual page route |
| `layout.tsx` | Wraps page + children with shared UI |
| `loading.tsx` | Auto-shown during navigation/streaming |
| `error.tsx` | Auto-shown when route throws (must be Client) |
| `not-found.tsx` | Auto-shown on `notFound()` call |
| `route.ts` | API route (rarely needed — prefer Server Actions) |
| `middleware.ts` | Edge middleware (auth, redirects, headers) |

### Component Naming Rules

- **PascalCase** for components: `ProductsList`, `SearchInput`
- **camelCase** for hooks, utilities, functions: `useDebounce`, `formatCurrency`
- **kebab-case** for folders: `failed-payments`, `tenant-detail`
- **PascalCase folder names** are acceptable for component folders (`Sidebar/`, `DataTable/`) when grouping related files

---

## 7. Data Fetching Strategy

> **Cache Components reminder:** in Next.js 16, data fetching is **dynamic by default**. A `fetch()` or DB query in a Server Component runs on every request unless its caller is wrapped in `'use cache'`. See [Section 9](#9-caching-strategy) for when and how to opt in.

### Where to Fetch

| Place | Use For |
|---|---|
| `page.tsx` (Server) | Page-level data (load when route opens) |
| `layout.tsx` (Server) | Shared data across child pages (user info, nav counts) |
| Child Server Component | Section-specific data (each `<Suspense>` boundary fetches its own) |
| Client component via TanStack Query | Truly interactive data (polling, real-time, optimistic updates) |
| **NEVER** in `useEffect` | This is a React SPA anti-pattern |

### Pattern: Fetch Close to the Use Site

Instead of fetching all data at the page and prop-drilling:

```tsx
// ❌ Avoid — top-down fetching forces waterfall
async function Page() {
  const a = await fetchA()
  const b = await fetchB()
  const c = await fetchC()
  return <Layout a={a} b={b} c={c} />
}

// ✅ Prefer — each section fetches its own data inside a Suspense
async function Page() {
  return (
    <Layout>
      <Suspense fallback={<S1 />}><SectionA /></Suspense>
      <Suspense fallback={<S2 />}><SectionB /></Suspense>
      <Suspense fallback={<S3 />}><SectionC /></Suspense>
    </Layout>
  )
}

async function SectionA() {
  const a = await fetchA()  // streams independently
  return <div>{a}</div>
}
```

### Reading Query / Path / Cookies

| Need | API |
|---|---|
| URL search params (in page) | `({ searchParams })` page prop |
| URL params (in page) | `({ params })` page prop |
| Cookies (Server) | `cookies()` from `next/headers` |
| Headers (Server) | `headers()` from `next/headers` |
| URL search params (in client) | `useSearchParams()` |
| Path (in client) | `usePathname()` |
| Router (in client) | `useRouter()` from `next/navigation` |

---

## 8. Mutation Strategy (Server Actions vs API)

### Use Server Actions For

- **Forms** (`<form action={...}>`)
- Buttons triggering simple mutations (`<button formAction={...}>`)
- Anything that mutates server state and doesn't need streaming/real-time response
- Cases where you want progressive enhancement (works without JS)

### Use Client API Calls (TanStack Query) For

- Background polling
- Optimistic UI with complex client state
- Mutations triggered from deeply nested client components
- Real-time updates (WebSocket / SSE complement)

### Server Action Template

```ts
// features/products/actions/products.actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().positive(),
})

export async function createProductAction(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.flatten() }
  }

  await db.insert(products).values(parsed.data)
  revalidatePath('/products')
  return { success: true }
}
```

### Cache Invalidation After Mutation

**Always** invalidate after a mutation:

```ts
import { revalidatePath, revalidateTag } from 'next/cache'

revalidatePath('/products')           // re-render this path
revalidateTag('products')             // re-fetch tagged queries
```

---

## 9. Caching Strategy

Next.js 16 introduces the **Cache Components** model. The mental model is the **opposite** of Next.js 13/14:

- **Old model:** `fetch()` was cached by default; you opted out with `no-store`. A route was either fully static or fully dynamic.
- **New model:** Nothing is cached by default. You opt *in* to caching at the **page, component, or function level** with the `'use cache'` directive. Every route is a **static shell + streamed dynamic islands** (Partial Prerendering, automatically).

This gives explicit, predictable control. No more guessing whether a `fetch` was cached.

### Enabling Cache Components

```ts
// apps/{app}/next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
}

export default nextConfig
```

> `cacheComponents` replaces the v15 `experimental.dynamicIO`, `experimental.useCache`, and `experimental.ppr` flags. If you see those in a config file, remove them — they no longer exist in v16.

### Old vs New at a Glance

| Old (Next.js ≤ 15) | New (Next.js 16 + Cache Components) |
|---|---|
| `fetch()` cached by default; opt out with `cache: 'no-store'` | Nothing cached by default; opt in with `'use cache'` |
| Route is fully static **or** fully dynamic | Route is a static shell + dynamic streamed regions (PPR auto) |
| `unstable_cache(fn, key, opts)` for custom memoization | `'use cache'` directive on a file, function, or component |
| `fetch(url, { next: { revalidate, tags } })` | `cacheLife()` / `cacheTag()` called inside a cached unit |
| `export const revalidate = 60` route segment | `'use cache'` + `cacheLife('minutes')` at the unit you want cached |
| `revalidatePath`, `revalidateTag` | `revalidatePath`, `revalidateTag(tag, profile)`, `updateTag(tag)` — see below |

### The Three Primitives

**1. `'use cache'` directive** — marks a file, function, or component as cacheable. The cache key is derived from arguments and closed-over values.

```ts
// File-level — every export in this file is a cached unit
'use cache'

export async function getProduct(id: string) {
  return await db.query.products.findFirst({ where: eq(products.id, id) })
}
```

```ts
// Function-level — only this function is cached
async function getProduct(id: string) {
  'use cache'
  return await db.query.products.findFirst({ where: eq(products.id, id) })
}
```

```tsx
// Component-level — the rendered output of this component is cached
async function ProductHeader({ id }: { id: string }) {
  'use cache'
  const product = await getProduct(id)
  return <h1>{product.name}</h1>
}
```

**2. `cacheLife(profile)`** — sets the staleness profile of a cached unit. Built-in profiles: `'seconds'`, `'minutes'`, `'hours'`, `'days'`, `'weeks'`, `'max'`. Pass a custom `{ stale, revalidate, expire }` object for fine control.

```ts
import { cacheLife } from 'next/cache'

async function getDashboardKPIs() {
  'use cache'
  cacheLife('minutes')
  return await fetchKPIs()
}
```

**3. `cacheTag(...tags)`** — attaches tags to a cached unit so it can be invalidated by `revalidateTag()`.

```ts
import { cacheTag } from 'next/cache'

async function getProducts(tenantId: string) {
  'use cache'
  cacheTag('products', `products:${tenantId}`)
  return await db.query.products.findMany({ where: eq(products.tenantId, tenantId) })
}
```

### Invalidating After a Mutation

v16 introduces a **new primitive** for tag invalidation. Pick based on context:

| Call | When | Semantics |
|---|---|---|
| `updateTag(tag)` | **From Server Actions** | Read-your-own-writes — the action's caller sees fresh data on the next render. **Preferred for mutations triggered by users.** |
| `revalidateTag(tag, profile)` | From webhooks, cron, or anywhere outside a Server Action | Purge — eventually consistent. The `profile` arg controls TTL. |
| `revalidatePath(path)` | When you want to invalidate by URL instead of by tag | Same as before; second arg picks `'layout'` vs `'page'`. |

**Use `updateTag` from Server Actions.** It's the only primitive that guarantees the action's redirect/refresh shows the fresh data:

```ts
'use server'
import { updateTag } from 'next/cache'

export async function createProductAction(formData: FormData) {
  await db.insert(products).values({ name: formData.get('name') as string })
  updateTag('products')   // any cached unit tagged 'products' is invalidated
                          // AND this request immediately reads fresh data
}
```

Use `revalidateTag` only outside Server Actions (e.g., a webhook handler):

```ts
// app/api/webhooks/stripe/route.ts
import { revalidateTag } from 'next/cache'

export async function POST(req: Request) {
  // ...verify signature, process event...
  revalidateTag('billing', 'minutes')  // purge billing cache; profile is required
  return Response.json({ ok: true })
}
```

### Caching Strategy by Data Type

| Data type | Strategy | Example |
|---|---|---|
| Truly static (rare changes) | `'use cache'` + `cacheLife('max')` | Login page, marketing page, footer |
| Updates occasionally | `'use cache'` + `cacheLife('hours')` + `cacheTag('plans')` | Plans, feature flags, settings |
| Updates frequently | `'use cache'` + `cacheLife('minutes')` | Dashboard KPIs, leaderboards |
| Real-time | Don't cache — leave dynamic (default) | Activity feed, chat |
| User-specific | Don't cache, or scope by user-id passed as an argument to the cached fn | Profile data |
| Tagged mutations | `cacheTag('x')` + `revalidateTag('x')` from action | Lists that change on create/delete |

> User-specific gotcha: a cached function closes over its arguments, not over request scope. Never call `cookies()` or `headers()` *inside* a `'use cache'` unit — pass the user/tenant id as an argument so it becomes part of the cache key.

### Partial Prerendering, Automatically

With `cacheComponents` on, every route renders as a **static shell + streamed dynamic islands** out of the box. To make a section prerender into the shell, mark it `'use cache'`. Anything not cached streams in via Suspense.

```tsx
// app/(main)/dashboard/page.tsx — Server
export default function Dashboard() {
  return (
    <>
      <CachedHeader />                            {/* prerendered into static shell */}
      <Suspense fallback={<KPISkeleton />}>
        <LiveKPIs />                              {/* streams in on request */}
      </Suspense>
    </>
  )
}

async function CachedHeader() {
  'use cache'
  cacheLife('hours')
  return <Header data={await getHeaderData()} />
}

async function LiveKPIs() {
  // No 'use cache' → dynamic, fetched per request
  const kpis = await fetchKPIs()
  return <KPIRow data={kpis} />
}
```

The `experimental.ppr` flag and `experimental_ppr` route-segment config are **removed** — don't add them.

### Migration Notes (from Next.js ≤ 15 code)

- Remove `experimental.ppr`, `experimental.dynamicIO`, `experimental.useCache` from `next.config.ts`. Replace with top-level `cacheComponents: true`.
- `fetch(url, { next: { revalidate, tags } })` no longer drives caching. Move the call inside a `'use cache'` function and use `cacheLife` / `cacheTag` instead.
- `fetch(url, { cache: 'force-cache' | 'no-store' })` is no longer needed — caching is opt-in via `'use cache'`.
- `export const revalidate = N` and `export const dynamic = 'force-static' | 'force-dynamic'` still parse but are unnecessary — prefer `'use cache'` at the level you actually want cached.
- `unstable_cache` still exists for legacy code, but new code should use `'use cache'`.

---

## 10. Loading, Error & Suspense

### Loading States

Every route MUST have a `loading.tsx`. Shown automatically during navigation.

```tsx
// app/(main)/products/loading.tsx
import { ProductsListSkeleton } from '@/features/products/components/ProductsList.skeleton'
import { PageHeader } from '@/shared/components/PageHeader'

export default function Loading() {
  return (
    <div>
      <PageHeader title="Products" />
      <ProductsListSkeleton />
    </div>
  )
}
```

### Error Boundaries

Every route MUST have `error.tsx`. Required to be `'use client'`.

```tsx
// app/(main)/products/error.tsx
'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to monitoring service (Sentry, etc.)
    console.error(error)
  }, [error])

  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="mt-2 text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="mt-4 underline">
        Try again
      </button>
    </div>
  )
}
```

### Not Found

```tsx
// app/(main)/products/[id]/not-found.tsx
export default function NotFound() {
  return <div>Product not found</div>
}

// Trigger from a server component:
import { notFound } from 'next/navigation'
if (!product) notFound()
```

### Suspense Rules

- Wrap async server components in `<Suspense>` when they're slow or independent of siblings
- Each `<Suspense>` boundary streams independently
- Fallback must match the real layout (no spinners — use skeletons)
- Don't wrap fast/synchronous components — adds overhead

```tsx
<Suspense fallback={<TableSkeleton />}>
  <SlowTable />
</Suspense>
```

### Skeleton Component Rules

1. **Always a Server Component** (pure JSX, no state)
2. **Match the real layout exactly** — same dimensions, same grid, same spacing
3. **Use `animate-pulse`** Tailwind class (or equivalent) for shimmer
4. **Co-located** with the real component: `ProductsList.tsx` + `ProductsList.skeleton.tsx`
5. **Export named**, not default

```tsx
// ProductsList.skeleton.tsx — Server
export function ProductsListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded bg-muted" />
      ))}
    </div>
  )
}
```

---

## 11. State Management Rules

### Hierarchy of State (Try in this order)

1. **URL state** — filters, sorting, pagination, tabs (preferred — survives refresh, shareable, server-readable)
2. **Server state** — fetched data (use Server Components or TanStack Query)
3. **Local component state** — `useState` for transient UI (dropdown open/close, modal state)
4. **Global client state** — Zustand for truly app-wide state (auth token, theme, current user)
5. **React Context** — last resort (re-render concerns)

### URL State Pattern

```tsx
// Page reads URL
export default async function Page({ searchParams }) {
  const data = await fetch(`/api/products?status=${searchParams.status ?? ''}`)
  return <List data={data} />
}

// Client component updates URL
'use client'
function StatusFilter() {
  const router = useRouter()
  const params = useSearchParams()
  const update = (value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set('status', value); else next.delete('status')
    router.push(`?${next.toString()}`)
  }
  return <Select onChange={update} />
}
```

### When to Use Zustand

- Auth token / current user (cross-cutting)
- Theme preference
- App-wide toast/notification queue

### When NOT to Use Global State

- Fetched data (use Server Components or TanStack Query)
- Form state (use React Hook Form)
- Filters (use URL)
- One-off UI state (use `useState`)

---

## 12. Routing Conventions

### Route Groups `(folder)`

Use route groups to apply different layouts without affecting URLs:

```
app/
├── (auth)/                ← No URL segment
│   ├── layout.tsx         ← Centered card layout
│   └── login/page.tsx     ← URL: /login
└── (main)/                ← No URL segment
    ├── layout.tsx         ← Sidebar + topbar
    └── dashboard/page.tsx ← URL: /dashboard
```

### Dynamic Routes `[param]`

```
products/[id]/page.tsx    ← /products/123
products/[...slug]/page.tsx ← catch-all
products/[[...slug]]/page.tsx ← optional catch-all
```

### Parallel Routes `@slot`

For complex pages with independent sections:

```
dashboard/
├── @analytics/page.tsx
├── @notifications/page.tsx
├── layout.tsx              ← receives @analytics, @notifications as props
└── page.tsx
```

### Intercepting Routes `(.)folder`

For "quick view" modals over a list page:

```
products/
├── page.tsx               ← List
└── (.)products/[id]/page.tsx  ← Modal version of detail
```

### Conventions for This Monorepo

- Use route groups `(auth)` and `(main)` to separate layouts
- Use dynamic `[id]` for detail pages
- Use parallel routes only when truly needed (complex dashboards)
- Avoid intercepting routes unless they add real value

### Navigation Preserves State (`<Activity>`)

When `cacheComponents` is enabled, Next.js wraps client-side navigations in React's [`<Activity>`](https://react.dev/reference/react/Activity). The previous route is **not unmounted** — it's hidden. When the user navigates back, it reappears with its state intact.

What this means in practice:
- Form inputs, expanded sections, scroll position, and `useState` survive a forward-then-back navigation.
- Effects (`useEffect`) are **cleaned up when hidden** and **re-run when visible again** — don't assume a mounted-once invariant.
- Older hidden routes are eventually evicted by Next.js; only a few recent ones are kept.

Things to watch for:
- Dropdowns/dialogs that listen on `document` globally should clean up on `useEffect` cleanup (they always should — this just makes it more obvious).
- Tests that assert "component unmounts on navigation" need updating.
- Heavy timers / subscriptions in client components should be in `useEffect` so they pause on hide.

See [Preserving UI state](https://nextjs.org/docs/app/guides/preserving-ui-state) for patterns.

---

## 13. Performance Checklist

For every page, verify:

- [ ] Page is a Server Component (no `'use client'` at the top)
- [ ] Data fetched in Server Components or via TanStack Query (never `useEffect`)
- [ ] `cacheComponents: true` is set in `next.config.ts`
- [ ] Each cacheable section uses `'use cache'` with an appropriate `cacheLife` profile
- [ ] Cached units that should invalidate on mutation are tagged with `cacheTag`
- [ ] Parallel data fetching with `Promise.all()` where possible
- [ ] Independent async sections wrapped in `<Suspense>`
- [ ] `loading.tsx` exists for the route
- [ ] `error.tsx` exists for the route
- [ ] Skeleton components match the real layout shape
- [ ] Filters/sorting/pagination use URL state (not React state)
- [ ] Forms use Server Actions (or have good reason not to)
- [ ] Client components are leaf-level only
- [ ] No file exceeds ~150 lines without good reason
- [ ] Mutations call `revalidatePath` or `revalidateTag`
- [ ] Images use `next/image`
- [ ] Fonts use `next/font`
- [ ] No unnecessary `'use client'` markers
- [ ] No data fetching inside client components

### Bundle Size Targets

- Each route's First Load JS: **< 100 KB** (excluding shared)
- Total shared JS: **< 200 KB**
- Largest client component: **< 50 KB**

Check with `npm run build` — Next.js shows bundle sizes per route.

---

## 14. Anti-Patterns (What NOT to Do)

### ❌ Don't: Put `'use client'` at the top of a page

```tsx
// ❌ BAD
'use client'
export default function Page() {
  const [x, setX] = useState(0)
  return <div>...</div>
}
```

```tsx
// ✅ GOOD
// page.tsx — Server
export default function Page() {
  return <PageContent />
}

// PageContent.tsx — Client (only if needed)
'use client'
export function PageContent() {
  const [x, setX] = useState(0)
  return <div>...</div>
}
```

### ❌ Don't: Fetch data with `useEffect`

```tsx
// ❌ BAD
'use client'
function Products() {
  const [data, setData] = useState([])
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setData)
  }, [])
  return <ul>{data.map(...)}</ul>
}
```

```tsx
// ✅ GOOD
async function Products() {
  const data = await fetchProducts()
  return <ul>{data.map(...)}</ul>
}
```

### ❌ Don't: Sequential server fetches (waterfall)

```tsx
// ❌ BAD
const user = await fetchUser()
const orders = await fetchOrders(user.id)
const stats = await fetchStats(user.id)
```

```tsx
// ✅ GOOD (when independent)
const [user, orders, stats] = await Promise.all([
  fetchUser(),
  fetchOrders(userId),
  fetchStats(userId),
])
```

### ❌ Don't: Use `useState` for filters

```tsx
// ❌ BAD
'use client'
function ProductsPage() {
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  // page state is lost on refresh, not shareable
}
```

```tsx
// ✅ GOOD
// Page reads from URL (Server)
function ProductsPage({ searchParams }) {
  const products = await fetchProducts(searchParams)
  // ...
}

// Filter updates URL (Client, tiny)
'use client'
function StatusFilter() {
  const router = useRouter()
  // pushes to URL
}
```

### ❌ Don't: One giant component file

```tsx
// ❌ BAD — 800 line file with everything mixed
'use client'
function ProductsPage() {
  // Header JSX
  // Search input
  // Filter dropdowns
  // Table with state
  // Pagination
  // Modal
  // ... 800 lines
}
```

```tsx
// ✅ GOOD — split into 15 small focused files
// page.tsx (40 lines, Server)
// ProductsHeader.tsx (20 lines, Server)
// ProductsSearchInput.tsx (40 lines, Client)
// ProductsStatusFilter.tsx (30 lines, Client)
// ProductsTable.tsx (60 lines, Server)
// ProductsTableRow.tsx (30 lines, Server)
// ProductsActionsMenu.tsx (40 lines, Client)
// ... etc
```

### ❌ Don't: Forget to invalidate cache after mutations

```ts
// ❌ BAD
'use server'
export async function deleteProduct(id: string) {
  await db.delete(products).where(eq(products.id, id))
  // ❌ Any 'use cache' unit listing products still serves the stale list
}
```

```ts
// ✅ GOOD — from a Server Action, use updateTag for read-your-own-writes
'use server'
import { updateTag } from 'next/cache'

export async function deleteProduct(id: string) {
  await db.delete(products).where(eq(products.id, id))
  updateTag('products')
}

// ✅ Also fine — invalidate by path
import { revalidatePath } from 'next/cache'
revalidatePath('/products')
```

### ❌ Don't: Cache request-scoped data inside `'use cache'`

```ts
// ❌ BAD — cookies() / headers() read the outer request, but the cached entry
// is shared across users. You'll serve one user's data to everyone.
async function getCurrentUserPosts() {
  'use cache'
  const userId = (await cookies()).get('user-id')?.value
  return db.query.posts.findMany({ where: eq(posts.userId, userId!) })
}
```

```ts
// ✅ GOOD — pass user-id as an argument so it becomes part of the cache key
async function getUserPosts(userId: string) {
  'use cache'
  cacheTag(`posts:${userId}`)
  return db.query.posts.findMany({ where: eq(posts.userId, userId) })
}

// Caller (Server Component) reads the request:
async function MyPosts() {
  const userId = (await cookies()).get('user-id')!.value
  const posts = await getUserPosts(userId)
  return <PostList posts={posts} />
}
```

### ❌ Don't: Use Context for everything

Context causes whole subtrees to re-render. Use only for truly global, rarely-changing state (theme, auth user).

### ❌ Don't: Skip skeletons and error boundaries

Every route needs `loading.tsx` and `error.tsx`. No exceptions.

---

## 15. Decision Trees

### Should this be a Server or Client Component?

```
START
  ↓
Does it use useState, useEffect, useContext, useRouter, browser APIs,
or event handlers tied to state?
  ↓
  ├── YES → 'use client'
  │         ↓
  │         Can I split off the static/server parts into a separate file?
  │         ├── YES → Split! Make this file as small as possible.
  │         └── NO  → OK, keep as client.
  │
  └── NO  → Server Component (default — do nothing)
```

### Where to put state?

```
START
  ↓
Is this state about data that the user might want to bookmark, share,
or persist across refresh?
  ├── YES → URL state (searchParams)
  └── NO  ↓
        Is this state shared across multiple unrelated components?
        ├── YES ↓
        │     Is it from the server?
        │     ├── YES → TanStack Query
        │     └── NO  → Zustand (only if truly global)
        └── NO  → useState in the component
```

### Mutation: Server Action or Client API call?

```
START
  ↓
Is this triggered by a <form> submission?
  ├── YES → Server Action (use `action` prop)
  └── NO  ↓
        Does this need optimistic UI / complex client state?
        ├── YES → Client API call via TanStack Query mutation
        └── NO  → Server Action via form or invoked from client
```

### Should I add a Suspense boundary?

```
START
  ↓
Is this server component async (awaits something slow)?
  ├── YES ↓
  │     Is it independent of sibling components?
  │     ├── YES → Wrap in <Suspense fallback={<Skeleton />}>
  │     └── NO  → Either fetch in parallel or skip Suspense
  └── NO  → Don't wrap (adds overhead for nothing)
```

---

## 16. Code Review Checklist

Use this when reviewing any PR that touches a Next.js app:

### Server/Client Boundaries
- [ ] No `'use client'` at the top of any `page.tsx` or `layout.tsx`
- [ ] Client components are small and focused (< 100 lines ideally)
- [ ] No `'use client'` on files that don't need it
- [ ] Server-only utilities don't leak into client bundles

### Data Fetching & Caching
- [ ] All data fetched in Server Components, not `useEffect`
- [ ] Cacheable units use `'use cache'` + `cacheLife()` (no leftover `fetch({ next: { revalidate } })` or `unstable_cache` in new code)
- [ ] No `cookies()` / `headers()` calls inside a `'use cache'` unit — request-scoped values are passed as arguments
- [ ] Cached units that change on mutation are tagged with `cacheTag` and matched by a `revalidateTag` in the Server Action
- [ ] Parallel fetches use `Promise.all()`
- [ ] Each Suspense boundary fetches its own data

### File Organization
- [ ] New code lives in the correct feature folder
- [ ] Shared components moved to `shared/` only if used by 2+ features
- [ ] Files are split — no monoliths
- [ ] File names follow conventions

### UX
- [ ] `loading.tsx` exists for the route
- [ ] `error.tsx` exists for the route
- [ ] Skeletons match real layout shape
- [ ] Forms have pending/error states
- [ ] Empty states are handled

### Mutations
- [ ] Server Actions used for forms
- [ ] `updateTag('x')` called after mutations (NOT `revalidateTag` from a Server Action — that's eventually-consistent and breaks read-your-own-writes)
- [ ] Tags in `updateTag` match tags on the cached APIs they need to invalidate
- [ ] Validation done with Zod
- [ ] Errors returned to user clearly

### Performance
- [ ] No client-side data fetching that could be server-side
- [ ] Bundle size hasn't ballooned (run `npm run build`)
- [ ] Images use `next/image`
- [ ] Fonts use `next/font`

### State
- [ ] Filters/sorting/pagination use URL state
- [ ] No `useState` for things that should be in URL
- [ ] No `useEffect` syncing state to other state (use derived values)

---

## Appendix: Quick Reference Card

### "I want to..."

| Task | Use |
|---|---|
| Fetch data for a page | Server Component + `await` |
| Add a search input | Tiny client component that updates URL |
| Add filters | URL search params + client `<select>` updating URL |
| Submit a form | Server Action via `<form action={...}>` |
| Show loading state | `loading.tsx` + skeleton component |
| Handle errors | `error.tsx` |
| Cache an expensive computation | `'use cache'` + `cacheLife()` (use `cacheTag()` if it should be revalidatable) |
| Cache a whole component's output | Mark the component `'use cache'` |
| Revalidate after a Server Action mutation | `updateTag('x')` (read-your-own-writes) |
| Revalidate from a webhook / cron | `revalidateTag('x', 'minutes')` (purge with TTL) |
| Revalidate by path | `revalidatePath('/x')` |
| Share auth/theme globally | Zustand store + client provider at root |
| Show modal | Client wrapper + Server content via `children` |
| Add tabs to a detail page | Nested layout + dynamic segment per tab |
| Real-time data | TanStack Query with refetch interval |
| SEO meta | `generateMetadata` in `page.tsx` (Server) |

### Reading List for the Team

1. [Next.js App Router Docs](https://nextjs.org/docs/app)
2. [React Server Components RFC](https://github.com/reactjs/rfcs/blob/main/text/0188-server-components.md)
3. [Composition Patterns](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)
4. [Data Fetching Patterns](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns)
5. [Cache Components (v16)](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)
6. [`use cache` directive](https://nextjs.org/docs/app/api-reference/directives/use-cache)
7. [Caching in Next.js — Getting Started](https://nextjs.org/docs/app/getting-started/caching)
8. [Migrating to Cache Components](https://nextjs.org/docs/app/guides/migrating-to-cache-components)
9. [Upgrading to Next.js 16](https://nextjs.org/docs/app/guides/upgrading/version-16)

---

## Final Word

This architecture isn't optional. It's the **only way to actually use Next.js to its potential**. Building a Next.js app like a React SPA throws away every benefit of the framework — fast initial loads, SEO, streaming, edge caching, Server Components — and leaves you with a slower, heavier, harder-to-maintain version of what React already gave you.

**Server-first. Split aggressively. Quarantine client code. URL is state. Skeleton everything. Cache deliberately.**

Follow the rules. Question deviations. Ship fast, scalable, smooth apps.
