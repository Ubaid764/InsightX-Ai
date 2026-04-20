import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ParsedDataset } from "./csv";

interface DatasetCtx {
  dataset: ParsedDataset | null;
  fileName: string | null;
  setDataset: (d: ParsedDataset | null, name?: string) => void;
}

const Ctx = createContext<DatasetCtx | undefined>(undefined);

const STORAGE_KEY = "insightx:lastDatasetMeta";

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [dataset, setDatasetState] = useState<ParsedDataset | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setFileName(parsed.fileName ?? null);
      } catch {
        // ignore
      }
    }
  }, []);

  const setDataset = (d: ParsedDataset | null, name?: string) => {
    setDatasetState(d);
    if (name !== undefined) setFileName(name);
    if (typeof window !== "undefined") {
      if (d && name) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ fileName: name, columns: d.columns, rowCount: d.rows.length }),
        );
      } else if (d === null) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  };

  return (
    <Ctx.Provider value={{ dataset, fileName, setDataset }}>{children}</Ctx.Provider>
  );
}

export function useDataset() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDataset must be used inside DatasetProvider");
  return c;
}
