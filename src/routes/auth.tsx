import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
// NOTE: Google OAuth intentionally disabled. The default Lovable broker shows
// a "Sign in to continue to Lovable" consent screen which is not acceptable
// for the white-label SmartTourOS product. Only re-enable after configuring a
// custom Google OAuth app branded as SmartTourOS (or the client's white-label
// domain) in Cloud → Users → Auth Settings → Google.
// import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — SmartTourOS" },
      { name: "description", content: "Sign in to your SmartTourOS workspace." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/dashboard",
            data: { full_name: fullName, company_name: companyName },
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your email if confirmation is required.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Google sign-in failed");
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/dashboard", replace: true });
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
            <h1 className="font-display text-3xl">{mode === "signin" ? "Welcome back" : "Create your workspace"}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "signin" ? "Sign in to manage your tours." : "Start hosting listing tours in minutes."}
            </p>
          </div>

          <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={handleGoogle}>
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-widest text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <Label htmlFor="fn">Full name</Label>
                  <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="co">Company name</Label>
                  <Input id="co" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="em">Email</Label>
              <Input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="pw">Password</Label>
              <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            {mode === "signin" ? "Don't have an account? " : "Already have one? "}
            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-foreground underline underline-offset-4"
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
}
