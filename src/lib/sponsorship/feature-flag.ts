/**
 * Sponsorship Engine feature flag.
 *
 * Both flags default to disabled. When either the server or client flag is
 * unset or not exactly the string "true", the module is inert: no sidebar
 * entry, protected routes redirect, and server functions 404.
 */

export function isSponsorshipEnabledClient(): boolean {
  return import.meta.env.VITE_SPONSORSHIP_ENGINE_ENABLED === "true";
}

export function isSponsorshipEnabledServer(): boolean {
  // Read at call time, never at module scope — env is injected per request.
  return process.env.SPONSORSHIP_ENGINE_ENABLED === "true";
}

/**
 * Throw a 404-shaped Response when the flag is off. Called from every
 * sponsorship server function handler as defense-in-depth alongside the
 * super_admin role check.
 */
export function assertSponsorshipEnabled(): void {
  if (!isSponsorshipEnabledServer()) {
    throw new Response("Not found", { status: 404 });
  }
}
