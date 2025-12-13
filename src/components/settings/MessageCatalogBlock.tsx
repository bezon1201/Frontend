import { MessageSquare } from "lucide-react";
import { useDataSource } from "../../context/DataSourceContext";

interface MessageCatalogBlockProps {
  onClick: () => void;
}

export default function MessageCatalogBlock({
  onClick,
}: MessageCatalogBlockProps) {
  const { mode } = useDataSource();

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl p-6 text-left"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#e0f2fe" }}
            >
              <MessageSquare className="w-6 h-6" style={{ color: "#0284c7" }} />
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>
              Message Catalog
            </h2>
          </div>
          <p className="text-gray-500 ml-15" style={{ fontSize: "14px" }}>
            {mode === "API" 
              ? "Edit toast/alert texts stored in DB" 
              : "View sample messages (MOCK mode)"}
          </p>
        </div>
        <div className="text-gray-400" style={{ fontSize: "24px" }}>
          →
        </div>
      </div>
    </button>
  );
}