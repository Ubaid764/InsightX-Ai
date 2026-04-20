import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useDataset } from "@/lib/dataset-context";
import { computeStats } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/insights")({
  component: () => (
    <RequireAuth>
      <AppShell>
        <InsightsPage />
      </AppShell>
    </RequireAuth>
  ),
});

function InsightsPage() {
  const { dataset, fileName } = useDataset();
  const [loading, setLoading] = useState(false);
  const [aiText, setAiText] = useState<string>("");

  const stats = useMemo(() => (dataset ? computeStats(dataset) : []), [dataset]);

  if (!dataset) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-border bg-card p-10 text-center shadow-card">
        <h2 className="text-lg font-semibold">No dataset loaded</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a CSV first to generate insights.
        </p>
        <Link to="/upload" className="mt-4 inline-block">
          <Button className="bg-gradient-brand text-primary-foreground hover:opacity-90">
            Upload data
          </Button>
        </Link>
      </div>
    );
  }

  const generate = async () => {
    setLoading(true);
    setAiText("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-insights", {
        body: {
          fileName,
          rowCount: dataset.rows.length,
          columns: dataset.columns,
          numericColumns: dataset.numericColumns,
          categoricalColumns: dataset.categoricalColumns,
          stats,
          sampleRows: dataset.rows.slice(0, 10),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiText(data?.insights ?? "");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Summary statistics and AI-generated analysis.
          </p>
        </div>
        <Button
          onClick={generate}
          disabled={loading}
          className="bg-gradient-brand text-primary-foreground hover:opacity-90 shadow-glow"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {loading ? "Analyzing…" : "Generate AI insights"}
        </Button>
      </div>

      {aiText && (
        <div className="rounded-2xl border border-primary/30 bg-card p-6 shadow-glow">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Analysis
          </div>
          <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {aiText}
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          Column statistics
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <div
              key={s.column}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <div className="truncate font-semibold">{s.column}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {s.count.toLocaleString()} values · {s.missing} missing
              </div>
              <dl className="mt-3 space-y-1 text-sm">
                {s.mean !== undefined && (
                  <Row label="Mean" value={fmt(s.mean)} />
                )}
                {s.median !== undefined && (
                  <Row label="Median" value={fmt(s.median)} />
                )}
                {s.min !== undefined && <Row label="Min" value={fmt(s.min)} />}
                {s.max !== undefined && <Row label="Max" value={fmt(s.max)} />}
                {s.stdev !== undefined && (
                  <Row label="Std dev" value={fmt(s.stdev)} />
                )}
                {s.uniqueCount !== undefined && (
                  <Row label="Unique" value={String(s.uniqueCount)} />
                )}
              </dl>
              {s.topValues && s.topValues.length > 0 && (
                <div className="mt-3 border-t border-border/60 pt-3">
                  <div className="mb-1 text-xs font-medium text-muted-foreground">
                    Top values
                  </div>
                  <ul className="space-y-1 text-xs">
                    {s.topValues.map((tv) => (
                      <li
                        key={tv.value}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="truncate">{tv.value}</span>
                        <span className="text-muted-foreground">{tv.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function fmt(n: number) {
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}
