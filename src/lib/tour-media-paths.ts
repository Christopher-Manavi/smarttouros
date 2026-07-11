/**
 * Pure path validators used by signPublicTourMedia. Extracted so they can be
 * unit-tested without booting a server-function runtime.
 *
 * Invariants:
 * - Listing-media path MUST be `${company_id}/${listing_id}/<filename or subpath>`
 *   (at least 3 non-empty segments).
 * - Company-logo path MUST be `${company_id}/<filename>` (at least 2 non-empty segments).
 * - Any traversal (`..`), backslashes, empty segments, leading/trailing
 *   slashes, or wrong company/listing IDs must fail.
 */

export const isSafeSegment = (s: string): boolean =>
  s.length > 0 && s !== "." && s !== ".." && !s.includes("\\") && !s.includes("/");

export function isListingMediaPath(
  p: string | null | undefined,
  companyId: string,
  listingId: string,
): p is string {
  if (typeof p !== "string" || p.length === 0) return false;
  if (p.startsWith("/") || p.endsWith("/")) return false;
  if (p.includes("..") || p.includes("\\")) return false;
  const parts = p.split("/");
  if (parts.length < 3) return false;
  if (!parts.every(isSafeSegment)) return false;
  return parts[0] === companyId && parts[1] === listingId;
}

export function isCompanyLogoPath(
  p: string | null | undefined,
  companyId: string,
): p is string {
  if (typeof p !== "string" || p.length === 0) return false;
  if (p.startsWith("/") || p.endsWith("/")) return false;
  if (p.includes("..") || p.includes("\\")) return false;
  const parts = p.split("/");
  if (parts.length < 2) return false;
  if (!parts.every(isSafeSegment)) return false;
  return parts[0] === companyId;
}
