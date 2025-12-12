import { useEffect, useRef, useState } from "react";
import { Upload, File, X, ChevronDown } from "lucide-react";
import { toast } from "sonner@2.0.3";

const CSV_SOURCES = [
  "Binance (Trades / Orders)",
  "Binance (Funding)",
  "IBKR (Activity)",
  "Other (Generic CSV)",
];

type CSVImport = {
  timestamp: string;
  source: string;
  filename: string;
  status: "Pending" | "Processed" | "Failed";
};

export default function CsvImportBlock() {
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lastImport, setLastImport] = useState<CSVImport | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const sourceRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sourceRef.current && !sourceRef.current.contains(event.target as Node)) {
        setSourceDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !selectedSource) {
      toast.error("Please select a file and a source");
      return;
    }
    setIsUploading(true);
    setTimeout(() => {
      const newImport: CSVImport = {
        timestamp: new Date().toISOString(),
        source: selectedSource,
        filename: selectedFile.name,
        status: "Processed",
      };
      setLastImport(newImport);
      setIsUploading(false);
      toast.success("File uploaded successfully");
    }, 2000);
  };

  return (
    <div className="bg-white rounded-2xl p-6 mt-6">
      <h2 style={{ fontSize: "20px", fontWeight: "bold" }} className="mb-2">
        CSV Import
      </h2>
      <p style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "24px" }}>
        Upload CSV exports from exchanges or brokers. Files will be stored for later processing.
      </p>

      <div className="mb-4">
        <div className="text-gray-600 mb-2" style={{ fontSize: "16px" }}>
          Source
        </div>
        <div className="relative" ref={sourceRef}>
          <button
            onClick={() => setSourceDropdownOpen(!sourceDropdownOpen)}
            className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between hover:border-gray-300 transition-colors"
          >
            <span style={{ fontSize: "16px", color: selectedSource ? "black" : "#9ca3af" }}>
              {selectedSource || "Select source"}
            </span>
            <ChevronDown
              size={20}
              className={`transition-transform ${sourceDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {sourceDropdownOpen && (
            <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
              {CSV_SOURCES.map((source) => (
                <button
                  key={source}
                  onClick={() => {
                    setSelectedSource(source);
                    setSourceDropdownOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50"
                  style={{ fontSize: "16px" }}
                >
                  {source}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />

        {!selectedFile ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-6 py-8 flex flex-col items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <Upload size={32} color="#9ca3af" className="mb-2" />
            <div style={{ fontSize: "16px", color: "#000", marginBottom: "4px" }}>Tap to select CSV file</div>
            <div style={{ fontSize: "14px", color: "#9ca3af" }}>Max 10 MB</div>
          </button>
        ) : (
          <div className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <File size={20} color="#000" />
              <div>
                <div style={{ fontSize: "16px", color: "#000" }}>{selectedFile.name}</div>
                <div style={{ fontSize: "14px", color: "#9ca3af" }}>{(selectedFile.size / 1024).toFixed(0)} KB</div>
              </div>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="w-6 h-6 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center transition-colors"
            >
              <X size={14} color="white" />
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleUpload}
        disabled={!selectedFile || !selectedSource || isUploading}
        className="w-full bg-green-500 text-white rounded-full px-6 py-3.5 flex items-center justify-center hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        {isUploading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            <span style={{ fontSize: "16px", fontWeight: "bold" }}>Uploading...</span>
          </>
        ) : (
          <span style={{ fontSize: "16px", fontWeight: "bold" }}>Upload file</span>
        )}
      </button>

      {lastImport ? (
        <div>
          <div className="text-gray-400 mb-2" style={{ fontSize: "14px" }}>
            Last import
          </div>
          <div style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>
            {new Date(lastImport.timestamp).toLocaleString()} · {lastImport.source} · {lastImport.filename}
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor:
                  lastImport.status === "Processed"
                    ? "#2ECC71"
                    : lastImport.status === "Failed"
                    ? "#E74C3C"
                    : "#9ca3af",
              }}
            />
            <span
              style={{
                fontSize: "14px",
                color:
                  lastImport.status === "Processed"
                    ? "#2ECC71"
                    : lastImport.status === "Failed"
                    ? "#E74C3C"
                    : "#9ca3af",
              }}
            >
              Status: {lastImport.status}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-6" style={{ fontSize: "16px", color: "#9ca3af" }}>
          No files uploaded yet
        </div>
      )}
    </div>
  );
}
