import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trash2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reports")({
  component: () => (
    <RequireAuth>
      <AppShell>
        <ReportsPage />
      </AppShell>
    </RequireAuth>
  ),
});

interface Report {
  id: string;
  name: string;
  dataset_name: string | null;
  row_count: number | null;
  column_count: number | null;
  created_at: string;
}

function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("reports")
      .select("id, name, dataset_name, row_count, column_count, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setReports((data ?? []) as Report[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const remove = async (id: string) => {
    const { error } = await supabase.from("reports").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      setReports((r) => r.filter((x) => x.id !== id));
      toast.success("Report deleted");
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-3xl">Saved Reports</h1>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Your saved dashboard configurations.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center shadow-card sm:p-10">
          <h3 className="font-semibold">No reports yet</h3>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Save a report from the Visualizations page.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {reports.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3 shadow-card transition hover:border-primary/30 sm:p-4"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary sm:h-10 sm:w-10">
                  <FileSpreadsheet className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium sm:text-base">{r.name}</div>
                  <div className="truncate text-[11px] text-muted-foreground sm:text-xs">
                    {r.dataset_name ?? "—"} · {r.row_count?.toLocaleString() ?? "?"} rows ·{" "}
                    {r.column_count ?? "?"} cols ·{" "}
                    {new Date(r.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0"
                onClick={() => remove(r.id)}
                aria-label="Delete report"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
