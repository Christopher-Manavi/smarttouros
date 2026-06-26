// Canonical base URL for public tour links.
// Never use window.location.origin for MLS-safe URLs — the editor preview
// origin (lovableproject.com) can require auth and must not be shared.

export const DEFAULT_PUBLIC_BASE_URL = "https://smarttouros.com";
const LEGACY_DEFAULTS = new Set([
  "https://smarttouros.lovable.app",
  "https://www.smarttouros.lovable.app",
]);
const STORAGE_KEY = "smarttouros.public_base_url";

export function getPublicBaseUrl(): string {
  if (typeof window === "undefined") return DEFAULT_PUBLIC_BASE_URL;
  const stored = window.localStorage.getItem(STORAGE_KEY)?.trim();
  if (stored && LEGACY_DEFAULTS.has(stored.replace(/\/+$/, ""))) {
    window.localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_PUBLIC_BASE_URL;
  }
  const url = stored || DEFAULT_PUBLIC_BASE_URL;
  return url.replace(/\/+$/, "");
}

export function setPublicBaseUrl(url: string) {
  if (typeof window === "undefined") return;
  const trimmed = url.trim().replace(/\/+$/, "");
  if (trimmed) window.localStorage.setItem(STORAGE_KEY, trimmed);
  else window.localStorage.removeItem(STORAGE_KEY);
}

export function brandedTourUrl(slug: string) {
  return `${getPublicBaseUrl()}/tour/${slug}`;
}

export function unbrandedTourUrl(slug: string) {
  return `${getPublicBaseUrl()}/u/${slug}`;
}

export function isPreviewUrl(url: string): boolean {
  return /lovableproject\.com|id-preview--/i.test(url);
}
