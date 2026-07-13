/**
 * Minimal RFC-4180-ish CSV parser + row validators for Sponsorship imports.
 * Kept dependency-free and pure so it is unit-testable in isolation.
 */
import {
  isValidEmail,
  isValidNmls,
  normalizeEmail,
  normalizeInt,
  normalizeString,
  normalizeZip,
  normalizeZipList,
} from "./normalize";

export type CsvRow = Record<string, string>;

export function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  const src = text.replace(/\r\n?/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return rows.slice(1)
    .filter((r) => r.some((cell) => cell.trim().length > 0))
    .map((r) => {
      const obj: CsvRow = {};
      header.forEach((h, idx) => {
        obj[h] = (r[idx] ?? "").trim();
      });
      return obj;
    });
}

export type AgentImport = {
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  brokerage: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  listing_count: number | null;
  profile_url: string | null;
};

export type LenderImport = {
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  nmls_number: string | null;
  city: string | null;
  state: string | null;
  service_areas: string[];
  service_zip_codes: string[];
};

export type ImportResult<T> = {
  valid: T[];
  errors: { rowIndex: number; email: string | null; reason: string }[];
  duplicates: { rowIndex: number; email: string }[];
};

export function validateAgents(rows: CsvRow[]): ImportResult<AgentImport> {
  const valid: AgentImport[] = [];
  const errors: ImportResult<AgentImport>["errors"] = [];
  const duplicates: ImportResult<AgentImport>["duplicates"] = [];
  const seen = new Set<string>();

  rows.forEach((r, i) => {
    const email = normalizeEmail(r.email);
    if (!email || !isValidEmail(email)) {
      errors.push({ rowIndex: i, email, reason: "Invalid or missing email" });
      return;
    }
    if (seen.has(email)) {
      duplicates.push({ rowIndex: i, email });
      return;
    }
    const listingCountRaw = r.listing_count ?? r.listings ?? "";
    const listingCount = listingCountRaw === "" ? null : normalizeInt(listingCountRaw);
    if (listingCountRaw !== "" && listingCount === null) {
      errors.push({ rowIndex: i, email, reason: "Invalid listing_count" });
      return;
    }
    seen.add(email);
    valid.push({
      first_name: normalizeString(r.first_name),
      last_name: normalizeString(r.last_name),
      email,
      phone: normalizeString(r.phone),
      brokerage: normalizeString(r.brokerage),
      city: normalizeString(r.city),
      state: normalizeString(r.state),
      postal_code: normalizeZip(r.postal_code ?? r.zip ?? r.zipcode),
      listing_count: listingCount,
      profile_url: normalizeString(r.profile_url ?? r.url),
    });
  });

  return { valid, errors, duplicates };
}

export function validateLenders(rows: CsvRow[]): ImportResult<LenderImport> {
  const valid: LenderImport[] = [];
  const errors: ImportResult<LenderImport>["errors"] = [];
  const duplicates: ImportResult<LenderImport>["duplicates"] = [];
  const seen = new Set<string>();

  rows.forEach((r, i) => {
    const email = normalizeEmail(r.email);
    if (!email || !isValidEmail(email)) {
      errors.push({ rowIndex: i, email, reason: "Invalid or missing email" });
      return;
    }
    if (seen.has(email)) {
      duplicates.push({ rowIndex: i, email });
      return;
    }
    const nmls = normalizeString(r.nmls_number ?? r.nmls);
    if (nmls && !isValidNmls(nmls)) {
      errors.push({ rowIndex: i, email, reason: "Invalid NMLS format" });
      return;
    }
    seen.add(email);
    valid.push({
      first_name: normalizeString(r.first_name),
      last_name: normalizeString(r.last_name),
      email,
      phone: normalizeString(r.phone),
      company: normalizeString(r.company),
      nmls_number: nmls,
      city: normalizeString(r.city),
      state: normalizeString(r.state),
      service_areas: (r.service_areas ?? "")
        .split(/[;|]/)
        .map((s) => s.trim())
        .filter(Boolean),
      service_zip_codes: normalizeZipList(r.service_zip_codes ?? r.service_zips ?? ""),
    });
  });

  return { valid, errors, duplicates };
}
