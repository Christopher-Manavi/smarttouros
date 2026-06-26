// Default SmartTourOS compliance links + workspace override resolver.
// Used by public listing footers when a workspace has no custom URLs set.

export const DEFAULT_PRIVACY_URL = "https://smarttouros.com/privacy";
export const DEFAULT_COOKIES_URL = "https://smarttouros.com/cookies";
export const DEFAULT_PRIVACY_CHOICES_URL = "https://smarttouros.com/privacy-choices";
export const DEFAULT_TERMS_URL = "https://smarttouros.com/terms";

export const DEFAULT_PRIVACY_NOTICE_TEXT =
  "This page may use cookies and similar technologies for analytics, marketing attribution, and listing performance measurement.";

export function resolveCompliance(privacy: { privacy_policy_url?: string | null; terms_url?: string | null; privacy_notice_text?: string | null } | null) {
  const trim = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);
  return {
    privacyUrl: trim(privacy?.privacy_policy_url) ?? DEFAULT_PRIVACY_URL,
    cookiesUrl: DEFAULT_COOKIES_URL,
    privacyChoicesUrl: DEFAULT_PRIVACY_CHOICES_URL,
    termsUrl: trim(privacy?.terms_url) ?? DEFAULT_TERMS_URL,
    noticeText: trim(privacy?.privacy_notice_text) ?? DEFAULT_PRIVACY_NOTICE_TEXT,
  };
}
