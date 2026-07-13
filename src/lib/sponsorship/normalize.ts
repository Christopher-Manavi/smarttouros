/**
 * Shared normalization helpers for Sponsorship data ingest.
 * All CSV / paste / manual entry paths funnel through these before touching
 * the database, so the CHECK(email = lower(email)) constraints never trip.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_RE = /^\d{5}$/;
const NMLS_RE = /^\d{5,10}$/;

export function normalizeEmail(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim().toLowerCase();
  return trimmed.length === 0 ? null : trimmed;
}

export function isValidEmail(input: string | null | undefined): boolean {
  const e = normalizeEmail(input);
  return !!e && EMAIL_RE.test(e);
}

export function normalizeZip(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.trim().slice(0, 5);
  return ZIP_RE.test(digits) ? digits : null;
}

export function normalizeZipList(input: string | string[] | null | undefined): string[] {
  if (!input) return [];
  const arr = Array.isArray(input)
    ? input
    : input
        .split(/[,\s;]+/)
        .map((s) => s.trim())
        .filter(Boolean);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of arr) {
    const z = normalizeZip(raw);
    if (z && !seen.has(z)) {
      seen.add(z);
      out.push(z);
    }
  }
  return out;
}

export function isValidNmls(input: string | null | undefined): boolean {
  if (!input) return true; // nullable
  return NMLS_RE.test(input.trim());
}

export function normalizeString(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const t = input.trim();
  return t.length === 0 ? null : t;
}

export function normalizeInt(input: unknown): number | null {
  if (input === null || input === undefined || input === "") return null;
  const n = typeof input === "number" ? input : parseInt(String(input).trim(), 10);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}
