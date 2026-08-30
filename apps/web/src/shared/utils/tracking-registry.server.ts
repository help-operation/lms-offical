interface TrackingItemPublic {
  key: string;
  enabled: boolean;
}

// Same /tracking-items endpoint app/layout.tsx fetches for script injection — Next.js
// dedupes identical fetch() calls (same URL + cache tags) within a single request via
// its Data Cache, so calling this again from a nested server component does not cost a
// second network round trip in practice.
async function getTrackingItems(): Promise<TrackingItemPublic[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
    const res = await fetch(`${apiUrl}/tracking-items`, {
      signal: AbortSignal.timeout(8_000),
      next: { revalidate: 3600, tags: ["tracking-settings"] },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const arr = json?.data ?? json;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function isTrackingItemEnabled(key: string): Promise<boolean> {
  const items = await getTrackingItems();
  return !!items.find((i) => i.key === key)?.enabled;
}
