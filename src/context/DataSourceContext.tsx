import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type DataSourceMode = "MOCK" | "API";

interface DataSourceContextValue {
  mode: DataSourceMode;
  setMode: (mode: DataSourceMode) => void;
}

const STORAGE_KEY = "dataSourceMode";

const DataSourceContext = createContext<DataSourceContextValue | undefined>(undefined);

const readInitialMode = (): DataSourceMode => {
  if (typeof window === "undefined") {
    return "MOCK";
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "API" ? "API" : "MOCK";
};

export function DataSourceProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<DataSourceMode>(readInitialMode);

  const setMode = (next: DataSourceMode) => {
    setModeState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "API" || stored === "MOCK") {
      setModeState(stored);
    }
  }, []);

  const value = useMemo(() => ({ mode, setMode }), [mode]);

  return <DataSourceContext.Provider value={value}>{children}</DataSourceContext.Provider>;
}

export function useDataSource(): DataSourceContextValue {
  const ctx = useContext(DataSourceContext);
  if (!ctx) {
    throw new Error("useDataSource must be used within DataSourceProvider");
  }
  return ctx;
}
