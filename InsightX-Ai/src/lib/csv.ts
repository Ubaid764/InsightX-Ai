import Papa from "papaparse";
import * as ss from "simple-statistics";

export type DataRow = Record<string, string | number | null>;

export interface ParsedDataset {
  rows: DataRow[];
  columns: string[];
  numericColumns: string[];
  categoricalColumns: string[];
}

export function parseCsvFile(file: File): Promise<ParsedDataset> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        try {
          const rawRows = results.data.filter((r) => r && Object.keys(r).length > 0);
          const columns = results.meta.fields ?? Object.keys(rawRows[0] ?? {});

          // Detect numeric columns: >= 70% of non-empty cells parse as finite numbers
          const numericColumns: string[] = [];
          for (const col of columns) {
            let total = 0;
            let numeric = 0;
            for (const r of rawRows) {
              const v = r[col];
              if (v === undefined || v === null || v === "") continue;
              total++;
              const n = Number(String(v).replace(/,/g, ""));
              if (Number.isFinite(n)) numeric++;
            }
            if (total > 0 && numeric / total >= 0.7) numericColumns.push(col);
          }

          const rows: DataRow[] = rawRows.map((r) => {
            const out: DataRow = {};
            for (const col of columns) {
              const v = r[col];
              if (v === undefined || v === null || v === "") {
                out[col] = null;
              } else if (numericColumns.includes(col)) {
                const n = Number(String(v).replace(/,/g, ""));
                out[col] = Number.isFinite(n) ? n : null;
              } else {
                out[col] = String(v);
              }
            }
            return out;
          });

          const categoricalColumns = columns.filter((c) => !numericColumns.includes(c));
          resolve({ rows, columns, numericColumns, categoricalColumns });
        } catch (e) {
          reject(e);
        }
      },
      error: reject,
    });
  });
}

export interface ColumnStats {
  column: string;
  count: number;
  missing: number;
  mean?: number;
  median?: number;
  min?: number;
  max?: number;
  stdev?: number;
  uniqueCount?: number;
  topValues?: { value: string; count: number }[];
}

export function computeStats(ds: ParsedDataset): ColumnStats[] {
  return ds.columns.map((col) => {
    const isNum = ds.numericColumns.includes(col);
    const values = ds.rows.map((r) => r[col]);
    const missing = values.filter((v) => v === null).length;

    if (isNum) {
      const nums = values.filter((v): v is number => typeof v === "number");
      if (nums.length === 0) return { column: col, count: 0, missing };
      return {
        column: col,
        count: nums.length,
        missing,
        mean: ss.mean(nums),
        median: ss.median(nums),
        min: ss.min(nums),
        max: ss.max(nums),
        stdev: nums.length > 1 ? ss.standardDeviation(nums) : 0,
      };
    }

    const strs = values.filter((v): v is string => typeof v === "string");
    const counts = new Map<string, number>();
    for (const s of strs) counts.set(s, (counts.get(s) ?? 0) + 1);
    const topValues = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([value, count]) => ({ value, count }));
    return {
      column: col,
      count: strs.length,
      missing,
      uniqueCount: counts.size,
      topValues,
    };
  });
}

export function aggregateForCategoryChart(
  ds: ParsedDataset,
  categoryCol: string,
  valueCol: string | null,
  limit = 12,
) {
  const map = new Map<string, number>();
  for (const r of ds.rows) {
    const key = r[categoryCol];
    if (key === null) continue;
    const k = String(key);
    if (valueCol) {
      const v = r[valueCol];
      if (typeof v === "number") map.set(k, (map.get(k) ?? 0) + v);
    } else {
      map.set(k, (map.get(k) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function buildHistogram(ds: ParsedDataset, col: string, bins = 10) {
  const nums = ds.rows
    .map((r) => r[col])
    .filter((v): v is number => typeof v === "number");
  if (nums.length === 0) return [];
  const min = ss.min(nums);
  const max = ss.max(nums);
  if (min === max) return [{ name: String(min), value: nums.length }];
  const step = (max - min) / bins;
  const buckets = Array.from({ length: bins }, (_, i) => ({
    name: `${(min + i * step).toFixed(1)}`,
    value: 0,
  }));
  for (const n of nums) {
    let idx = Math.floor((n - min) / step);
    if (idx >= bins) idx = bins - 1;
    buckets[idx].value++;
  }
  return buckets;
}

export function buildLineSeries(ds: ParsedDataset, xCol: string, yCol: string, limit = 100) {
  const out: { name: string; value: number }[] = [];
  for (const r of ds.rows) {
    const x = r[xCol];
    const y = r[yCol];
    if (x === null || typeof y !== "number") continue;
    out.push({ name: String(x), value: y });
    if (out.length >= limit) break;
  }
  return out;
}
