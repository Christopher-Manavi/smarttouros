import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — SmartTourOS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function formatResetError(err: unknown): string {
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
  if (lower.includes("expired") || lower.includes("otp_expired")) {
    return "This reset link has expired. Please request a new one.";
  }
  if (
    lower.includes("invalid") ||
    lower.includes("not found") ||
    lower.includes("bad_jwt") ||
    lower.includes("token")
  ) {
    return "This reset link is invalid or has already been used. Please request a new one.";
  }
  if (
    lower.includes("password") &&
    (lower.includes("weak") || lower.includes("pwned") || lower.includes("breach"))
  ) {
    return "That password has appeared in a public breach. Please choose a unique password.";
  }
  if (lower.includes("password") && lower.includes("short")) {
    return "Password is too short. Use at least 8 characters.";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Network error. Please check your connection and try again.";
  }
  return "We couldn't update your password. Please try again.";
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [recoveryReady, setRecoveryReady] = useState<"checking" | "ok" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Supabase JS auto-processes the recovery token in the URL hash/query
    // and fires PASSWORD_RECOVERY. We listen first, then verify session.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setRecoveryReady("ok");
      }
    });

    // Fallback: if there's already a session (link processed) mark ready.
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) {
        setRecoveryReady((prev) => (prev === "ok" ? prev : "ok"));
      } else {
        // Give the auto-detect a brief moment before declaring invalid.
        setTimeout(() => {
          if (!mounted) return;
          setRecoveryReady((prev) => (prev === "checking" ? "invalid" : prev));
        }, 1500);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("The two passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      // Sign out so the user must sign in with the new password.
      await supabase.auth.signOut();
    } catch (err) {
      setErrorMsg(formatResetError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6">
          <h1 className="font-display text-3xl">
            {success ? "Password updated" : "Set a new password"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {success
              ? "You can now sign in with your new password."
              : "Choose a strong password you haven't used elsewhere."}
          </p>
        </div>

        {errorMsg && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Couldn't update password</AlertTitle>
            <AlertDescription className="break-words">{errorMsg}</AlertDescription>
          </Alert>
        )}

        {success ? (
          <>
            <Alert className="mb-4">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Your password has been updated.</AlertTitle>
              <AlertDescription>
                For security, you've been signed out. Please sign in again.
              </AlertDescription>
            </Alert>
            <Button className="w-full" onClick={() => navigate({ to: "/auth", replace: true })}>
              Continue to sign in
            </Button>
          </>
        ) : recoveryReady === "invalid" ? (
          <>
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Invalid or expired link</AlertTitle>
              <AlertDescription>
                This password reset link is invalid or has expired. Please request a new one from
                the sign-in page.
              </AlertDescription>
            </Alert>
            <Button className="w-full" onClick={() => navigate({ to: "/auth", replace: true })}>
              Back to sign in
            </Button>
          </>
        ) : recoveryReady === "checking" ? (
          <p className="text-sm text-muted-foreground">Verifying reset link…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="pw">New password</Label>
              <Input
                id="pw"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Min 8 characters. Common/breached passwords are rejected.
              </p>
            </div>
            <div>
              <Label htmlFor="pw2">Confirm new password</Label>
              <Input
                id="pw2"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Updating password..." : "Update password"}
            </Button>
            <button
              type="button"
              onClick={() => navigate({ to: "/auth", replace: true })}
              className="w-full text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
            >
              Back to sign in
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}
