import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, BarChart3, Sparkles, Upload, Zap } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/dashboard" });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link to="/signup">
            <Button size="sm" className="bg-gradient-brand text-primary-foreground hover:opacity-90">
              Get started
            </Button>
          </Link>
        </div>
      </header>

      <section className="container mx-auto max-w-6xl px-6 pt-16 pb-24 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          AI-powered analytics
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
          Turn data into{" "}
          <span className="text-gradient-brand">clarity</span>.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Upload a CSV, auto-generate beautiful charts, and let AI surface the trends, outliers and
          insights hiding in your data.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/signup">
            <Button size="lg" className="bg-gradient-brand text-primary-foreground hover:opacity-90 shadow-glow">
              Start free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline">
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      <section className="container mx-auto grid max-w-6xl gap-4 px-6 pb-24 sm:grid-cols-3">
        {[
          { icon: Upload, title: "Drop your CSV", desc: "Instant preview and column detection." },
          { icon: BarChart3, title: "Auto-charts", desc: "Bar, line, pie and histograms in one click." },
          { icon: Zap, title: "AI insights", desc: "Plain-language summaries of trends & outliers." },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-border bg-card p-6 shadow-card transition hover:border-primary/40"
          >
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-brand">
              <f.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="font-semibold">{f.title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{f.desc}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
