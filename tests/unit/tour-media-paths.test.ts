import { describe, it, expect } from "vitest";
import { isListingMediaPath, isCompanyLogoPath, isSafeSegment } from "@/lib/tour-media-paths";

const COMPANY = "19786701-69e0-4d2d-a9c0-e9f5ef45af61";
const LISTING = "86884c42-d4f4-49fb-99cb-cc2b1f68e171";
const OTHER_COMPANY = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa";
const OTHER_LISTING = "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb";

describe("isSafeSegment", () => {
  it("rejects empty, dot, dotdot, backslash, slash", () => {
    expect(isSafeSegment("")).toBe(false);
    expect(isSafeSegment(".")).toBe(false);
    expect(isSafeSegment("..")).toBe(false);
    expect(isSafeSegment("a\\b")).toBe(false);
    expect(isSafeSegment("a/b")).toBe(false);
  });
  it("accepts normal filename segments", () => {
    expect(isSafeSegment("hero.png")).toBe(true);
    expect(isSafeSegment("f4d7e0ae01ae47febf5ba1294b734ccd.png")).toBe(true);
  });
});

describe("isListingMediaPath — valid", () => {
  it("accepts the canonical `${company}/${listing}/<file>` shape", () => {
    expect(
      isListingMediaPath(`${COMPANY}/${LISTING}/hero.png`, COMPANY, LISTING),
    ).toBe(true);
  });
  it("accepts a nested subpath under the listing folder", () => {
    expect(
      isListingMediaPath(`${COMPANY}/${LISTING}/2026/hero.png`, COMPANY, LISTING),
    ).toBe(true);
  });
});

describe("isListingMediaPath — wrong company", () => {
  it("rejects a path whose first segment is a different company", () => {
    expect(
      isListingMediaPath(`${OTHER_COMPANY}/${LISTING}/hero.png`, COMPANY, LISTING),
    ).toBe(false);
  });
});

describe("isListingMediaPath — wrong listing within same company", () => {
  it("rejects a path whose second segment is a sibling listing", () => {
    expect(
      isListingMediaPath(`${COMPANY}/${OTHER_LISTING}/hero.png`, COMPANY, LISTING),
    ).toBe(false);
  });
});

describe("isListingMediaPath — traversal and malformed", () => {
  it("rejects `..`", () => {
    expect(
      isListingMediaPath(`${COMPANY}/${LISTING}/../secret.png`, COMPANY, LISTING),
    ).toBe(false);
  });
  it("rejects leading slash", () => {
    expect(
      isListingMediaPath(`/${COMPANY}/${LISTING}/hero.png`, COMPANY, LISTING),
    ).toBe(false);
  });
  it("rejects trailing slash", () => {
    expect(
      isListingMediaPath(`${COMPANY}/${LISTING}/`, COMPANY, LISTING),
    ).toBe(false);
  });
  it("rejects empty and null and non-string", () => {
    expect(isListingMediaPath("", COMPANY, LISTING)).toBe(false);
    expect(isListingMediaPath(null, COMPANY, LISTING)).toBe(false);
    expect(isListingMediaPath(undefined, COMPANY, LISTING)).toBe(false);
    // @ts-expect-error - runtime guard
    expect(isListingMediaPath(42, COMPANY, LISTING)).toBe(false);
  });
  it("rejects backslashes", () => {
    expect(
      isListingMediaPath(`${COMPANY}\\${LISTING}\\hero.png`, COMPANY, LISTING),
    ).toBe(false);
  });
  it("rejects two-segment paths (missing filename)", () => {
    expect(
      isListingMediaPath(`${COMPANY}/${LISTING}`, COMPANY, LISTING),
    ).toBe(false);
  });
  it("rejects empty middle segment", () => {
    expect(
      isListingMediaPath(`${COMPANY}//hero.png`, COMPANY, LISTING),
    ).toBe(false);
  });
});

describe("isCompanyLogoPath", () => {
  it("accepts `${company}/<file>`", () => {
    expect(isCompanyLogoPath(`${COMPANY}/logo.svg`, COMPANY)).toBe(true);
  });
  it("rejects a different company prefix", () => {
    expect(isCompanyLogoPath(`${OTHER_COMPANY}/logo.svg`, COMPANY)).toBe(false);
  });
  it("rejects traversal", () => {
    expect(isCompanyLogoPath(`${COMPANY}/../evil.svg`, COMPANY)).toBe(false);
  });
  it("rejects leading and trailing slashes", () => {
    expect(isCompanyLogoPath(`/${COMPANY}/logo.svg`, COMPANY)).toBe(false);
    expect(isCompanyLogoPath(`${COMPANY}/`, COMPANY)).toBe(false);
  });
  it("rejects empty and null", () => {
    expect(isCompanyLogoPath("", COMPANY)).toBe(false);
    expect(isCompanyLogoPath(null, COMPANY)).toBe(false);
    expect(isCompanyLogoPath(undefined, COMPANY)).toBe(false);
  });
  it("rejects a single-segment path", () => {
    expect(isCompanyLogoPath(COMPANY, COMPANY)).toBe(false);
  });
});
