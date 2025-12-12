import { useEffect, useState } from "react";
import { toast } from "sonner@2.0.3";
import { useTheme } from "../../context/ThemeContext";
import { DataSourceMode, useDataSource } from "../../context/DataSourceContext";
import SegmentedControl from "../SegmentedControl";
import { getGlobalConfig, GlobalConfigResponse, healthCheck } from "../../services/api";

interface ModeBlockProps {
  onConfigLoaded: (config: GlobalConfigResponse) => void;
}

export default function ModeBlock({ onConfigLoaded }: ModeBlockProps) {
  const { theme, toggleTheme } = useTheme();
  const { mode, setMode } = useDataSource();
  const [isCheckingApi, setIsCheckingApi] = useState(false);

  const normalizeAutoRefresh = (value: any): string => {
    if (typeof value === "number") {
      return `${value} seconds`;
    }
    if (typeof value === "string") {
      if (value.toLowerCase() === "off") return "Off";
      const numeric = Number(value);
      if (!Number.isNaN(numeric) && numeric > 0) {
        return `${numeric} seconds`;
      }
      return value;
    }
    return "Off";
  };

  const applyBackendConfig = (config: GlobalConfigResponse) => {
    onConfigLoaded({
      display_currency: config.display_currency,
      auto_refresh: normalizeAutoRefresh(config.auto_refresh),
      mock_api_enabled: config.mock_api_enabled,
    });
  };

  const checkApiAndLoad = async (showToastOnFailure: boolean) => {
    setIsCheckingApi(true);
    try {
      const ok = await healthCheck();
      if (!ok) {
        throw new Error("API unavailable");
      }
      const cfg = await getGlobalConfig();
      setMode("API");
      applyBackendConfig(cfg);
    } catch {
      setMode("MOCK");
      if (showToastOnFailure) {
        toast.error("API is not available — switched to MOCK");
      }
    } finally {
      setIsCheckingApi(false);
    }
  };

  const handleModeChange = async (nextMode: DataSourceMode) => {
    if (nextMode === mode) return;
    if (nextMode === "MOCK") {
      setMode("MOCK");
      return;
    }
    await checkApiAndLoad(true);
  };

  useEffect(() => {
    if (mode === "API") {
      void checkApiAndLoad(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>MOC & API mode</h2>
        <button onClick={toggleTheme} className="relative inline-block w-14 h-8">
          <div
            className="rounded-full w-full h-full flex items-center px-1 transition-all"
            style={{
              backgroundColor: theme === "green" ? "#10b981" : "#ef4444",
              justifyContent: theme === "green" ? "flex-end" : "flex-start",
            }}
          >
            <div className="w-6 h-6 bg-white rounded-full transition-all" />
          </div>
        </button>
      </div>

      <div className="space-y-2">
        <div className="text-gray-600" style={{ fontSize: "16px" }}>
          Data source
        </div>
        <SegmentedControl
          options={["MOCK", "API"]}
          value={mode}
          onChange={(val) => handleModeChange(val as DataSourceMode)}
          disabled={isCheckingApi}
        />
        {isCheckingApi && (
          <div className="text-gray-400" style={{ fontSize: "14px" }}>
            Checking API availability...
          </div>
        )}
      </div>
    </div>
  );
}
