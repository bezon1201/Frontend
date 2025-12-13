import { useState, useEffect, useMemo } from "react";
import { X, Search, Plus } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { Message, getMessages } from "../services/api";
import { useDataSource } from "../context/DataSourceContext";
import { useMessages } from "../context/MessagesContext";
import MessageEditSheet from "./MessageEditSheet";

// Mock data for testing UI in MOCK mode
const MOCK_MESSAGES: Message[] = [
  {
    code: "ORDER_CREATED",
    kind: "toast",
    text: "Order successfully created",
  },
  {
    code: "ORDER_CANCELLED",
    kind: "toast",
    text: "Order has been cancelled",
  },
  {
    code: "CAMPAIGN_STARTED",
    kind: "alert",
    text: "Campaign started successfully. Monitor progress in Orders screen.",
  },
  {
    code: "API_ERROR",
    kind: "toast",
    text: "API error occurred. Please try again later.",
  },
  {
    code: "BALANCE_LOW",
    kind: "alert",
    text: "Warning: Your balance is running low. Please add funds to continue trading.",
  },
  {
    code: "POSITION_CLOSED",
    kind: "toast",
    text: "Position closed at market price",
  },
];

interface MessageCatalogScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MessageCatalogScreen({
  isOpen,
  onClose,
}: MessageCatalogScreenProps) {
  const { mode } = useDataSource();
  const messagesContext = useMessages();
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | "toast" | "alert">("all");
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Load messages on mount
  useEffect(() => {
    if (isOpen && mode === "API") {
      // ✅ Force refresh from API when opening Message Catalog
      messagesContext.refreshMessages({ force: true });
    }
  }, [isOpen, mode]);

  // Update local messages when context messages change
  useEffect(() => {
    if (isOpen) {
      if (mode === "API") {
        // Use messages from context
        setLocalMessages(messagesContext.messages);
      } else {
        // Load mock data in MOCK mode
        setLocalMessages(MOCK_MESSAGES);
      }
    }
  }, [isOpen, mode, messagesContext.messages]);

  const loadMessages = async () => {
    if (mode === "API") {
      // Reload from context
      await messagesContext.reload();
    }
  };

  // Filter messages locally
  const filteredMessages = useMemo(() => {
    let filtered = localMessages;

    // Filter by kind
    if (kindFilter !== "all") {
      filtered = filtered.filter((m) => m.kind === kindFilter);
    }

    // Filter by search query (code)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((m) => m.code.toLowerCase().includes(query));
    }

    return filtered;
  }, [localMessages, kindFilter, searchQuery]);

  const handleEdit = (message: Message) => {
    setEditingMessage(message);
    setIsAddingNew(false);
    setIsEditSheetOpen(true);
  };

  const handleAdd = () => {
    setEditingMessage(null);
    setIsAddingNew(true);
    setIsEditSheetOpen(true);
  };

  const handleSave = (updatedMessage: Message) => {
    setLocalMessages((prev) => {
      const index = prev.findIndex((m) => m.code === updatedMessage.code);
      if (index >= 0) {
        // Update existing
        const updated = [...prev];
        updated[index] = updatedMessage;
        return updated;
      } else {
        // Add new
        return [...prev, updatedMessage];
      }
    });
  };

  const handleDelete = (code: string) => {
    setLocalMessages((prev) => prev.filter((m) => m.code !== code));
  };

  if (!isOpen) return null;

  // Note: Now works in both API and MOCK modes (MOCK uses sample data)

  return (
    <>
      <div className="fixed inset-0 bg-white z-50">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 bg-white border-b border-gray-200"
            style={{ paddingTop: "60px", paddingBottom: "20px" }}
          >
            <div className="flex-1">
              <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>
                Message Catalog
              </h1>
              <p className="text-gray-500 mt-1" style={{ fontSize: "14px" }}>
                {mode === "API" 
                  ? "Edit toast/alert texts stored in DB"
                  : "📋 Sample messages (MOCK mode - changes won't be saved)"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 ml-4"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search & Filter */}
          <div className="px-6 py-4 bg-white border-b border-gray-200">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-100 border-none"
                style={{ fontSize: "16px" }}
              />
            </div>

            {/* Filter + Add */}
            <div className="flex gap-3">
              {/* Kind filter */}
              <select
                value={kindFilter}
                onChange={(e) =>
                  setKindFilter(e.target.value as "all" | "toast" | "alert")
                }
                className="flex-1 px-4 py-3 rounded-xl bg-gray-100 border-none"
                style={{ fontSize: "16px" }}
              >
                <option value="all">All Types</option>
                <option value="toast">Toast</option>
                <option value="alert">Alert</option>
              </select>

              {/* Add button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdd();
                }}
                className="px-6 py-3 rounded-xl text-white flex items-center gap-2"
                style={{ fontSize: "16px", fontWeight: "bold", backgroundColor: "#10b981" }}
              >
                <Plus className="w-5 h-5" />
                Add
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto" style={{ paddingBottom: "160px" }}>
            {filteredMessages.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="text-gray-400 mb-2" style={{ fontSize: "20px" }}>
                    📭
                  </div>
                  <div className="text-gray-400" style={{ fontSize: "16px" }}>
                    {searchQuery || kindFilter !== "all"
                      ? "No messages found"
                      : "No messages yet"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-6 pt-4 space-y-3">
                {filteredMessages.map((message) => (
                  <div
                    key={message.code}
                    className="bg-white border border-gray-200 rounded-2xl p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <code
                            className="text-gray-900"
                            style={{ fontSize: "16px", fontWeight: "bold" }}
                          >
                            {message.code}
                          </code>
                          <span
                            className="px-2 py-1 rounded text-xs uppercase"
                            style={{
                              fontSize: "12px",
                              fontWeight: "bold",
                              backgroundColor:
                                message.kind === "toast" ? "#dbeafe" : "#fef3c7",
                              color:
                                message.kind === "toast" ? "#1e40af" : "#92400e",
                            }}
                          >
                            {message.kind}
                          </span>
                        </div>
                        <p
                          className="text-gray-600 line-clamp-2"
                          style={{ fontSize: "14px" }}
                        >
                          {message.text}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEdit(message)}
                      className="w-full mt-3 py-2 rounded-xl border border-gray-300 text-gray-700"
                      style={{ fontSize: "16px", fontWeight: "bold" }}
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit/Add Sheet */}
      <MessageEditSheet
        message={editingMessage}
        isOpen={isEditSheetOpen}
        onClose={() => {
          setIsEditSheetOpen(false);
          setEditingMessage(null);
          setIsAddingNew(false);
        }}
        onSave={handleSave}
        onDelete={handleDelete}
        isNewMessage={isAddingNew}
      />
    </>
  );
}