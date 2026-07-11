import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * TTL for authenticated in-app draft previews. 900s / 15 minutes matches the
 * previous implementation's design intent.
 */
const DRAFT_PREVIEW_TTL_SECONDS = 60 * 15;

/**
 * Auto-refresh interval. Chosen so a new URL is minted well before the
 * previous URL's 15-minute expiry. React Query runs this on a timer while
 * the query is active; a component staying mounted for hours will
 * transparently receive fresh URLs without a remount.
 *
 * `refetchIntervalInBackground: false` pauses the timer when the tab is
 * hidden; React Query resumes and refetches immediately when focus returns.
 */
const DRAFT_PREVIEW_REFETCH_MS = 12 * 60 * 1000;

async function signOne(
  bucket: "listing-media" | "company-logos",
  path: string,
  ttlSeconds: number,
): Promise<string | null> {
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, ttlSeconds);
  return data?.signedUrl ?? null;
}

/**
 * Client helper: given a private storage path, return a short-lived signed
 * URL suitable for authenticated in-app previews (listing form, company
 * settings). RLS on storage.objects will only return a URL if the caller's
 * profile.company_id matches the path's first folder segment.
 *
 * Automatically re-signs every ~12 minutes so a preview kept open across a
 * long editing session never renders an expired URL. No remount required.
 *
 * Public tour pages must NOT use this — they use the server-side
 * `signPublicTourMedia` function which runs as service role.
 *
 * Signed URLs and tokens are never logged from this module.
 */
export function useStorageSignedUrl(
  bucket: "listing-media" | "company-logos",
  path: string | null | undefined,
  ttlSeconds: number = DRAFT_PREVIEW_TTL_SECONDS,
): string | null {
  const { data } = useQuery({
    queryKey: ["draft-signed-url", bucket, path ?? null, ttlSeconds],
    enabled: !!path,
    queryFn: () => signOne(bucket, path as string, ttlSeconds),
    // Auto-refresh well before expiry.
    refetchInterval: DRAFT_PREVIEW_REFETCH_MS,
    refetchIntervalInBackground: false,
    // A cached URL is considered fresh for slightly less than the refetch
    // interval so `refetchOnMount`/`refetchOnWindowFocus` can top it up when
    // the user returns to a paused preview.
    staleTime: DRAFT_PREVIEW_REFETCH_MS - 60_000,
    // Never persist across tab reloads; a signed URL is disposable.
    gcTime: 0,
  });
  return data ?? null;
}

/** Batch variant used for gallery previews. Same auto-refresh behavior. */
export function useStorageSignedUrls(
  bucket: "listing-media" | "company-logos",
  paths: (string | null | undefined)[],
  ttlSeconds: number = DRAFT_PREVIEW_TTL_SECONDS,
): (string | null)[] {
  const key = paths.map((p) => p ?? "").join("|");
  const { data } = useQuery({
    queryKey: ["draft-signed-urls", bucket, key, ttlSeconds],
    enabled: paths.length > 0,
    queryFn: async () =>
      Promise.all(
        paths.map((p) =>
          p ? signOne(bucket, p, ttlSeconds) : Promise.resolve(null),
        ),
      ),
    refetchInterval: DRAFT_PREVIEW_REFETCH_MS,
    refetchIntervalInBackground: false,
    staleTime: DRAFT_PREVIEW_REFETCH_MS - 60_000,
    gcTime: 0,
  });
  return data ?? paths.map(() => null);
}

/** Exported for tests. */
export const __TESTING__ = {
  DRAFT_PREVIEW_TTL_SECONDS,
  DRAFT_PREVIEW_REFETCH_MS,
};
