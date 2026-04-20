import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload as UploadIcon, FileSpreadsheet, X } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useDataset } from "@/lib/dataset-context";
import { parseCsvFile } from "@/lib/csv";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/upload")({
  component: () => (
    <RequireAuth>
      <AppShell>
        <UploadPage />
      </AppShell>
    </RequireAuth>
  ),
});

function UploadPage() {
  const { dataset, fileName, setDataset } = useDataset();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }
    setLoading(true);
    try {
      const ds = await parseCsvFile(file);
      setDataset(ds, file.name);
      toast.success(`Loaded ${ds.rows.length.toLocaleString()} rows`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to parse CSV");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Upload Data</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Drop a CSV file. We'll detect numeric and categorical columns automatically.
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className={`rounded-2xl border-2 border-dashed p-10 text-center transition ${
          dragOver ? "border-primary bg-primary/5" : "border-border bg-card"
        }`}
      >
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-brand">
          <UploadIcon className="h-7 w-7 text-primary-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">
          {loading ? "Parsing…" : "Drag & drop a CSV"}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">or click to browse from your computer</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <Button
          onClick={() => inputRef.current?.click()}
          className="mt-4 bg-gradient-brand text-primary-foreground hover:opacity-90"
          disabled={loading}
        >
          Choose file
        </Button>
      </div>

      {dataset && (
        <div className="rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-3 min-w-0">
              <FileSpreadsheet className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0">
                <div className="truncate font-medium">{fileName}</div>
                <div className="text-xs text-muted-foreground">
                  {dataset.rows.length.toLocaleString()} rows · {dataset.columns.length} columns
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => navigate({ to: "/visualizations" })}
                className="bg-gradient-brand text-primary-foreground hover:opacity-90"
              >
                Visualize
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setDataset(null)}
                aria-label="Remove dataset"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  {dataset.columns.map((c) => (
                    <th key={c} className="whitespace-nowrap px-4 py-2.5 text-left font-medium">
                      {c}
                      <span className="ml-1 text-[10px] font-normal text-muted-foreground/70">
                        {dataset.numericColumns.includes(c) ? "num" : "txt"}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataset.rows.slice(0, 25).map((row, i) => (
                  <tr key={i} className="border-t border-border/60 hover:bg-secondary/30">
                    {dataset.columns.map((c) => (
                      <td key={c} className="whitespace-nowrap px-4 py-2 text-foreground/90">
                        {row[c] === null ? (
                          <span className="text-muted-foreground/50">—</span>
                        ) : (
                          String(row[c])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {dataset.rows.length > 25 && (
            <div className="border-t border-border p-3 text-center text-xs text-muted-foreground">
              Showing first 25 of {dataset.rows.length.toLocaleString()} rows
            </div>
          )}
        </div>
      )}
    </div>
  );
}
