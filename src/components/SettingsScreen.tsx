import { useState } from "react";
import { X } from "lucide-react";
import ModeBlock from "./settings/ModeBlock";
import GlobalSettingsBlock from "./settings/GlobalSettingsBlock";
import AutomationsBlock from "./settings/AutomationsBlock";
import CsvImportBlock from "./settings/CsvImportBlock";
import { GlobalConfigResponse } from "../services/api";

interface SettingsScreenProps {
  onClose: () => void;
}

export default function SettingsScreen({ onClose }: SettingsScreenProps) {
  const [configFromApi, setConfigFromApi] = useState<GlobalConfigResponse>({});

  return (
    <div className="fixed inset-0 z-50 h-full w-full bg-black overflow-y-auto" data-scrollable="true">
      <div className="flex items-center justify-between px-6 pt-8 pb-6">
        <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "white" }}>Settings</h1>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X size={24} color="white" />
        </button>
      </div>

      <div className="px-6 pb-32">
        <ModeBlock
          onConfigLoaded={(cfg) =>
            setConfigFromApi({
              display_currency: cfg.display_currency,
              auto_refresh: cfg.auto_refresh,
              mock_api_enabled: cfg.mock_api_enabled,
            })
          }
        />
        <GlobalSettingsBlock initialConfig={configFromApi} />
        <AutomationsBlock />
        <CsvImportBlock />
      </div>
    </div>
  );
}
