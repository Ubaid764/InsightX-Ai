import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useDataset } from "@/lib/dataset-context";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  aggregateForCategoryChart,
  buildHistogram,
  buildLineSeries,
} from "@/lib/csv";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/visualizations")({
  component: () => (
    <RequireAuth>
      <AppShell>
        <VisualizationsPage />
      </AppShell>
    </RequireAuth>
  ),
});

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function VisualizationsPage() {
  const { dataset, fileName } = useDataset();
  const { user } = useAuth();

  const [catCol, setCatCol] = useState<string>("");
  const [valCol, setValCol] = useState<string>("__count__");
  const [lineX, setLineX] = useState<string>("");
  const [lineY, setLineY] = useState<string>("");
  const [histCol, setHistCol] = useState<string>("");
  const [reportName, setReportName] = useState("");
  const [saving, setSaving] = useState(false);

  // Set defaults
  useMemo(() => {
    if (!dataset) return;
    if (!catCol && dataset.categoricalColumns[0]) setCatCol(dataset.categoricalColumns[0]);
    if (!lineX && dataset.columns[0]) setLineX(dataset.columns[0]);
    if (!lineY && dataset.numericColumns[0]) setLineY(dataset.numericColumns[0]);
    if (!histCol && dataset.numericColumns[0]) setHistCol(dataset.numericColumns[0]);
  }, [dataset, catCol, lineX, lineY, histCol]);

  if (!dataset) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-border bg-card p-10 text-center shadow-card">
        <h2 className="text-lg font-semibold">No dataset loaded</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a CSV first to see visualizations.
        </p>
        <Link to="/upload" className="mt-4 inline-block">
          <Button className="bg-gradient-brand text-primary-foreground hover:opacity-90">
            Upload data
          </Button>
        </Link>
      </div>
    );
  }

  const barData = catCol
    ? aggregateForCategoryChart(
        dataset,
        catCol,
        valCol === "__count__" ? null : valCol,
      )
    : [];
  const lineData = lineX && lineY ? buildLineSeries(dataset, lineX, lineY) : [];
  const histData = histCol ? buildHistogram(dataset, histCol) : [];

  const saveReport = async () => {
    if (!user) return;
    if (!reportName.trim()) {
      toast.error("Give your report a name");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("reports").insert({
      user_id: user.id,
      name: reportName.trim(),
      dataset_name: fileName,
      row_count: dataset.rows.length,
      column_count: dataset.columns.length,
      columns: dataset.columns,
      config: { catCol, valCol, lineX, lineY, histCol },
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Report saved");
      setReportName("");
    }
  };

  const tooltipStyle = {
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--foreground)",
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Visualizations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            From <span className="text-foreground">{fileName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Report name…"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            className="w-44"
          />
          <Button onClick={saveReport} disabled={saving} variant="outline">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar */}
        <ChartCard title="Bar chart">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <Selector
              label="Category"
              value={catCol}
              onChange={setCatCol}
              options={dataset.columns}
            />
            <Selector
              label="Value"
              value={valCol}
              onChange={setValCol}
              options={["__count__", ...dataset.numericColumns]}
              labelMap={{ __count__: "Count of rows" }}
            />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
              <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Pie */}
        <ChartCard title="Pie chart">
          <div className="mb-3 text-xs text-muted-foreground">
            Top {Math.min(barData.length, 8)} categories of <strong>{catCol || "—"}</strong>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={barData.slice(0, 8)}
                dataKey="value"
                nameKey="name"
                outerRadius={90}
                label={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              >
                {barData.slice(0, 8).map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted-foreground)" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Line */}
        <ChartCard title="Line chart">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <Selector label="X axis" value={lineX} onChange={setLineX} options={dataset.columns} />
            <Selector
              label="Y axis"
              value={lineY}
              onChange={setLineY}
              options={dataset.numericColumns}
            />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Histogram */}
        <ChartCard title="Histogram">
          <div className="mb-3">
            <Selector
              label="Numeric column"
              value={histCol}
              onChange={setHistCol}
              options={dataset.numericColumns}
            />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={histData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
              <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--secondary)" }} />
              <Bar dataKey="value" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-2 text-sm font-semibold">{title}</div>
      {children}
    </div>
  );
}

function Selector({
  label,
  value,
  onChange,
  options,
  labelMap,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labelMap?: Record<string, string>;
}) {
  return (
    <div>
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 ? (
            <div className="p-2 text-xs text-muted-foreground">No options</div>
          ) : (
            options.map((o) => (
              <SelectItem key={o} value={o}>
                {labelMap?.[o] ?? o}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
