import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
// NOTE: Google OAuth intentionally disabled for white-label MVP. Only re-enable
// after configuring a custom Google OAuth app branded as SmartTourOS.
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

const IS_DEV = import.meta.env.DEV;

function formatAuthError(err: unknown, mode: "signin" | "signup"): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : typeof err === "object" && err !== null
          ? String(
              (err as { message?: unknown; error_description?: unknown }).message ??
                (err as { error_description?: unknown }).error_description ??
                "",
            )
          : "";
  const lower = raw.toLowerCase();

  if (
    lower.includes("already registered") ||
    lower.includes("already been registered") ||
    lower.includes("user already exists") ||
    lower.includes("duplicate key")
  ) {
    return "An account already exists with this email. Please sign in instead.";
  }
  if (lower.includes("invalid login credentials")) {
    return "That email and password don't match. Please try again.";
  }
  if (lower.includes("email not confirmed")) {
    return "Please confirm your email address before signing in. Check your inbox for the confirmation link.";
  }
  if (
    lower.includes("password") &&
    (lower.includes("weak") || lower.includes("pwned") || lower.includes("breach"))
  ) {
    return "That password has appeared in a public breach. Please choose a unique password.";
  }
  if (mode === "signup") {
    return "We couldn't create your account. Please try again in a moment.";
  }
  return "We couldn't sign you in. Please try again.";
}

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — SmartTourOS" },
      {
        name: "description",
        content:
          "Sign in to your SmartTourOS workspace to manage listings, smart tour pages, tracking, and analytics.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user.email ?? null);
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  function logDev(label: string, value: unknown) {
    if (IS_DEV) console.log(`[auth] ${label}`, value);
  }

  async function doSignup(em: string, pw: string, fn: string, co: string) {
    logDev("signup payload", { email: em, fullName: fn, companyName: co });
    const res = await supabase.auth.signUp({
      email: em,
      password: pw,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: { full_name: fn, company_name: co },
      },
    });
    logDev("auth signUp response", { data: res.data, error: res.error });
    if (res.error) throw res.error;

    // Profile/company/tracking rows are created by the handle_new_user trigger
    // (SECURITY DEFINER). If there's a session, we're auto-confirmed; redirect.
    if (res.data.session) {
      logDev("redirect", "/dashboard");
      navigate({ to: "/dashboard", replace: true });
      return { confirmed: true };
    }
    return { confirmed: false };
  }

  async function handleForgot(em: string) {
    try {
      await supabase.auth.resetPasswordForEmail(em, {
        redirectTo: window.location.origin + "/reset-password",
      });
    } catch (err) {
      logDev("resetPasswordForEmail error", err);
      // Swallow — always show generic response to prevent user enumeration.
    }
    setInfoMsg("If an account exists for that email, a password reset link has been sent.");
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      if (mode === "signup") {
        const { confirmed } = await doSignup(email, password, fullName, companyName);
        if (!confirmed) {
          setInfoMsg(
            "Account created. Please check your email to confirm your account before signing in.",
          );
        }
      } else if (mode === "forgot") {
        await handleForgot(email);
      } else {
        const res = await supabase.auth.signInWithPassword({ email, password });
        logDev("signIn response", { data: res.data, error: res.error });
        if (res.error) throw res.error;
        if (res.data.session) navigate({ to: "/dashboard", replace: true });
      }
    } catch (err) {
      logDev("error", err);
      setErrorMsg(formatAuthError(err, mode === "signup" ? "signup" : "signin"));
    } finally {
      setBusy(false);
    }
  }


  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-primary text-primary-foreground">
        <Link to="/" className="font-display text-2xl tracking-tight">
          SmartTour<span className="opacity-60">OS</span>
        </Link>
        <div className="max-w-md">
          <h2 className="font-display text-4xl leading-tight">
            Listing tours, branded and MLS-safe — in one place.
          </h2>
          <p className="mt-4 text-sm opacity-70">
            White-label virtual tour pages for photographers, media companies, and brokerages.
          </p>
        </div>
        <p className="text-xs opacity-50">© SmartTourOS</p>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-8">
          <div className="mb-6">
            <h1 className="font-display text-3xl">
              {mode === "signin" ? "Welcome back" : "Create your workspace"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "signin"
                ? "Sign in to manage your tours."
                : "Start hosting listing tours in minutes."}
            </p>
          </div>

          {errorMsg && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Authentication error</AlertTitle>
              <AlertDescription className="break-words">{errorMsg}</AlertDescription>
            </Alert>
          )}
          {infoMsg && (
            <Alert className="mb-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Check your email</AlertTitle>
              <AlertDescription>{infoMsg}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleEmail} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <Label htmlFor="fn">Full name</Label>
                  <Input
                    id="fn"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="co">Company name</Label>
                  <Input
                    id="co"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="em">Email</Label>
              <Input
                id="em"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="pw">Password</Label>
              <Input
                id="pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              {mode === "signup" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Min 8 characters. Common/breached passwords are rejected — use something unique.
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy
                ? mode === "signin"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>


          <p className="text-sm text-muted-foreground text-center mt-6">
            {mode === "signin" ? "Don't have an account? " : "Already have one? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setErrorMsg(null);
                setInfoMsg(null);
              }}
              className="text-foreground underline underline-offset-4"
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>

          {IS_DEV && (
            <div className="mt-6 p-3 rounded border bg-muted/40 text-xs font-mono space-y-1">
              <div className="font-semibold font-sans text-sm">Auth Debug (dev only)</div>
              <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? "✓ set" : "✗ missing"}</div>
              <div>
                Publishable key:{" "}
                {import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? "✓ set" : "✗ missing"}
              </div>
              <div>Session: {sessionEmail ? `✓ ${sessionEmail}` : "none"}</div>
              <div className="break-words">Last error: {errorMsg ?? "—"}</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
