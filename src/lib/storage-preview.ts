import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Client helper: given a private storage path, return a short-lived signed
 * URL suitable for authenticated in-app previews (listing form, company
 * settings). RLS on storage.objects will only return a URL if the caller's
 * profile.company_id matches the path's first folder segment.
 *
 * Public tour pages must NOT use this — they use the server-side
 * `signPublicTourMedia` function which runs as service role.
 */
export function useStorageSignedUrl(
  bucket: "listing-media" | "company-logos",
  path: string | null | undefined,
  ttlSeconds = 60 * 15,
) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!path) {
      setUrl(null);
      return;
    }
    supabase.storage
      .from(bucket)
      .createSignedUrl(path, ttlSeconds)
      .then(({ data }) => {
        if (!cancelled) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [bucket, path, ttlSeconds]);
  return url;
}

/** Batch variant used for gallery previews. */
export function useStorageSignedUrls(
  bucket: "listing-media" | "company-logos",
  paths: (string | null | undefined)[],
  ttlSeconds = 60 * 30,
) {
  const key = paths.join("|");
  const [urls, setUrls] = useState<(string | null)[]>(() => paths.map(() => null));
  useEffect(() => {
    let cancelled = false;
    if (paths.length === 0) {
      setUrls([]);
      return;
    }
    Promise.all(
      paths.map((p) =>
        p
          ? supabase.storage
              .from(bucket)
              .createSignedUrl(p, ttlSeconds)
              .then(({ data }) => data?.signedUrl ?? null)
          : Promise.resolve(null),
      ),
    ).then((resolved) => {
      if (!cancelled) setUrls(resolved);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket, key, ttlSeconds]);
  return urls;
}
