import { useEffect, useState } from "react";
import { toast } from "sonner@2.0.3";
import { resolveToastMessage } from "../../messages/messageResolver";
import { useTheme } from "../../context/ThemeContext";
import { useDataSource } from "../../context/DataSourceContext";
import { getGlobalConfig, GlobalConfigResponse, healthCheck } from "../../services/api";

interface ModeBlockProps {
  onConfigLoaded: (config: GlobalConfigResponse) => void;
}

export default function ModeBlock({ onConfigLoaded }: ModeBlockProps) {
  // Theme controls the visual indicator (green = API, red = MOCK)
  const { theme, setTheme } = useTheme();
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
      return true;
    } catch {
      setMode("MOCK");
      if (showToastOnFailure) {
        const msg = resolveToastMessage("API_UNAVAILABLE");
        toast.error(msg.title, { description: msg.description });
      }
      return false;
    } finally {
      setIsCheckingApi(false);
    }
  };

  // Handle toggle click - switch between API (green) and MOCK (red)
  const handleToggleClick = async () => {
    if (isCheckingApi) return;

    // Current state: green = API, red = MOCK
    const isCurrentlyApi = theme === "green";

    if (isCurrentlyApi) {
      // Switching to MOCK (red)
      setMode("MOCK");
      setTheme("red");
    } else {
      // Switching to API (green)
      const success = await checkApiAndLoad(true);
      if (success) {
        setTheme("green");
      }
      // If failed, stays red (MOCK)
    }
  };

  // On mount, check if mode is API and validate
  useEffect(() => {
    if (mode === "API") {
      setTheme("green");
      void checkApiAndLoad(true);
    } else {
      setTheme("red");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return (
    <div className="bg-white rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Data Source Mode</h2>
          <div className="text-gray-500 mt-1" style={{ fontSize: "14px" }}>
            {theme === "green" ? "API Mode (Live Data)" : "MOCK Mode (Test Data)"}
          </div>
        </div>

        {/* Toggle: Green = API, Red = MOCK */}
        <button onClick={handleToggleClick} className="relative inline-block w-14 h-8" disabled={isCheckingApi}>
          <div
            className="rounded-full w-full h-full flex items-center px-1 transition-all"
            style={{
              backgroundColor: theme === "green" ? "#10b981" : "#ef4444",
              justifyContent: theme === "green" ? "flex-end" : "flex-start",
              opacity: isCheckingApi ? 0.5 : 1,
            }}
          >
            <div className="w-6 h-6 bg-white rounded-full transition-all" />
          </div>
        </button>
      </div>

      {isCheckingApi && (
        <div className="text-gray-400 text-center" style={{ fontSize: "14px" }}>
          Checking API availability...
        </div>
      )}
    </div>
  );
}