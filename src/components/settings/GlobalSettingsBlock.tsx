import { useRef, useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { GlobalConfigResponse } from "../../services/api";

const CURRENCIES = ["USDC", "USD", "EUR"];
const REFRESH_INTERVALS = ["Off", "5 seconds", "15 seconds", "30 seconds", "60 seconds"];

interface GlobalSettingsBlockProps {
  initialConfig: GlobalConfigResponse;
}

export default function GlobalSettingsBlock({ initialConfig }: GlobalSettingsBlockProps) {
  const [displayCurrency, setDisplayCurrency] = useState(initialConfig.display_currency || "USDC");
  const [autoRefresh, setAutoRefresh] = useState(initialConfig.auto_refresh ?? "Off");

  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [refreshDropdownOpen, setRefreshDropdownOpen] = useState(false);
  const currencyRef = useRef<HTMLDivElement>(null);
  const refreshRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayCurrency(initialConfig.display_currency || "USDC");
    setAutoRefresh(initialConfig.auto_refresh ?? "Off");
  }, [initialConfig]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setCurrencyDropdownOpen(false);
      }
      if (refreshRef.current && !refreshRef.current.contains(event.target as Node)) {
        setRefreshDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-white rounded-2xl p-6 mb-6">
      <h2 style={{ fontSize: "20px", fontWeight: "bold" }} className="mb-6">
        Global Settings
      </h2>

      <div className="mb-6">
        <div className="text-gray-600 mb-2" style={{ fontSize: "16px" }}>
          Display Currency
        </div>
        <div className="relative" ref={currencyRef}>
          <button
            onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
            className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between hover:border-gray-300 transition-colors"
          >
            <span style={{ fontSize: "16px", color: "black" }}>{displayCurrency}</span>
            <ChevronDown
              size={20}
              className={`transition-transform ${currencyDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {currencyDropdownOpen && (
            <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
              {CURRENCIES.map((currency) => (
                <button
                  key={currency}
                  onClick={() => {
                    setDisplayCurrency(currency);
                    setCurrencyDropdownOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50"
                  style={{ fontSize: "16px" }}
                >
                  {currency}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="text-gray-600 mb-2" style={{ fontSize: "16px" }}>
          Dashboard auto-refresh
        </div>
        <div className="relative" ref={refreshRef}>
          <button
            onClick={() => setRefreshDropdownOpen(!refreshDropdownOpen)}
            className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between hover:border-gray-300 transition-colors"
          >
            <span style={{ fontSize: "16px", color: "black" }}>{autoRefresh}</span>
            <ChevronDown
              size={20}
              className={`transition-transform ${refreshDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {refreshDropdownOpen && (
            <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
              {REFRESH_INTERVALS.map((interval) => (
                <button
                  key={interval}
                  onClick={() => {
                    setAutoRefresh(interval);
                    setRefreshDropdownOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50"
                  style={{ fontSize: "16px" }}
                >
                  {interval}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="text-gray-400 mt-2" style={{ fontSize: "14px" }}>
          Controls how often dashboard fetches new data
        </div>
      </div>
    </div>
  );
}
