import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Database, FileSpreadsheet, FolderOpen, Sparkles, Upload } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useDataset } from "@/lib/dataset-context";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <RequireAuth>
      <AppShell>
        <DashboardPage />
      </AppShell>
    </RequireAuth>
  ),
});

function DashboardPage() {
  const { dataset, fileName } = useDataset();
  const { user } = useAuth();
  const [reportCount, setReportCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => setReportCount(count ?? 0));
  }, [user]);

  const stats = [
    {
      label: "Active dataset",
      value: fileName ?? "None",
      icon: FileSpreadsheet,
      hint: dataset ? `${dataset.rows.length.toLocaleString()} rows` : "Upload a CSV to begin",
    },
    {
      label: "Columns",
      value: dataset ? String(dataset.columns.length) : "—",
      icon: Database,
      hint: dataset
        ? `${dataset.numericColumns.length} numeric · ${dataset.categoricalColumns.length} text`
        : "Detected automatically",
    },
    {
      label: "Saved reports",
      value: reportCount === null ? "…" : String(reportCount),
      icon: FolderOpen,
      hint: "From the Visualizations tab",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Overview of your latest dataset and saved reports.
        </p>
      </div>

      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-card transition hover:border-primary/30 sm:p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">
                {s.label}
              </div>
              <s.icon className="h-4 w-4 shrink-0 text-primary" />
            </div>
            <div className="mt-2 truncate text-lg font-semibold sm:mt-3 sm:text-2xl">{s.value}</div>
            <div className="mt-1 truncate text-xs text-muted-foreground">{s.hint}</div>
          </div>
        ))}
      </div>

      {!dataset && (
        <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center shadow-card sm:p-10">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-brand">
            <Upload className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="mt-4 text-base font-semibold sm:text-lg">No dataset loaded</h3>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground sm:text-sm">
            Upload a CSV to start exploring charts and AI-generated insights.
          </p>
          <Link to="/upload" className="mt-4 inline-block">
            <Button className="bg-gradient-brand text-primary-foreground hover:opacity-90">
              Upload data
            </Button>
          </Link>
        </div>
      )}

      {dataset && (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          <Link
            to="/visualizations"
            className="group rounded-2xl border border-border bg-card p-5 shadow-card transition hover:border-primary/40 sm:p-6"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Explore visualizations</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Bar, line, pie and histogram charts based on your columns.
            </p>
          </Link>
          <Link
            to="/insights"
            className="group rounded-2xl border border-border bg-card p-5 shadow-card transition hover:border-primary/40 sm:p-6"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Generate AI insights</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Plain-language summary, trends, and outliers from your data.
            </p>
          </Link>
        </div>
      )}
    </div>
  );
}
