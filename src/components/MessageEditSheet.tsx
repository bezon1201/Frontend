import { useState, useEffect } from "react";
import { X } from "lucide-react";
import ModalSheet from "./ModalSheet";
import Toast from "./Toast";
import { useToast } from "../hooks/useToast";
import { resolveToastMessage } from "../messages/messageResolver";
import { Message, MessageUpdate, updateMessage, deleteMessage } from "../services/api";
import { useDataSource } from "../context/DataSourceContext";
import { useMessages } from "../context/MessagesContext";

interface MessageEditSheetProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedMessage: Message) => void;
  onDelete: (code: string) => void;
  isNewMessage?: boolean;
}

export default function MessageEditSheet({
  message,
  isOpen,
  onClose,
  onSave,
  onDelete,
  isNewMessage = false,
}: MessageEditSheetProps) {
  const { mode } = useDataSource();
  const { updateMessageCache, deleteMessageCache } = useMessages();
  const { toast, showToast, hideToast } = useToast();
  const [kind, setKind] = useState<"toast" | "alert">("toast");
  const [text, setText] = useState("");
  const [code, setCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (message) {
      setCode(message.code);
      setKind(message.kind);
      setText(message.text);
    } else if (isNewMessage) {
      setCode("");
      setKind("toast");
      setText("");
    }
  }, [message, isNewMessage]);

  const handleSave = async () => {
    // Validate code and text
    if (!code.trim() || !text.trim()) {
      const msg = resolveToastMessage('MSG_INVALID');
      showToast(msg.title, msg.description, msg.type);
      return;
    }

    setIsSaving(true);
    try {
      // In MOCK mode, just update locally without API call
      if (mode === "MOCK") {
        const msg = resolveToastMessage('MOCK_MODE_WARNING');
        showToast(msg.title, msg.description, msg.type);
        const updated: Message = { code, kind, text };
        onSave(updated);
        onClose();
      } else {
        // API mode - make real API call
        const data: MessageUpdate = { kind, text };
        const updated = await updateMessage(code, data);
        
        // Update cache immediately
        updateMessageCache(updated);
        
        const msg = resolveToastMessage('MSG_SAVED');
        showToast(msg.title, msg.description, msg.type);
        onSave(updated);
        onClose();
      }
    } catch (error) {
      const msg = resolveToastMessage('MSG_SAVE_FAILED');
      showToast(msg.title, msg.description, msg.type);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!message) return;

    setIsSaving(true);
    try {
      // In MOCK mode, just delete locally without API call
      if (mode === "MOCK") {
        const msg = resolveToastMessage('MOCK_MODE_WARNING');
        showToast(msg.title, msg.description, msg.type);
        onDelete(message.code);
        onClose();
        setShowDeleteConfirm(false);
      } else {
        // API mode - make real API call
        await deleteMessage(message.code);
        
        // Delete from cache immediately
        deleteMessageCache(message.code);
        
        const msg = resolveToastMessage('MSG_DELETED');
        showToast(msg.title, msg.description, msg.type);
        onDelete(message.code);
        onClose();
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      const msg = resolveToastMessage('MSG_DELETE_FAILED');
      showToast(msg.title, msg.description, msg.type);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const validateCode = (value: string) => {
    // Only uppercase letters, numbers, and underscores
    return value.toUpperCase().replace(/[^A-Z0-9_]/g, "");
  };

  return (
    <>
      {/* Toast notifications */}
      <Toast
        title={toast.title}
        description={toast.description}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      <ModalSheet isOpen={isOpen} onClose={onClose}>
        <div className="p-6 pb-32">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ fontSize: "24px", fontWeight: "bold" }}>
              {isNewMessage ? "Add Message" : "Edit Message"}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Code */}
          <div className="mb-6">
            <label
              className="block text-gray-700 mb-2"
              style={{ fontSize: "16px", fontWeight: "bold" }}
            >
              Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(validateCode(e.target.value))}
              placeholder="MESSAGE_CODE"
              disabled={!isNewMessage}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 font-mono"
              style={{
                fontSize: "16px",
                backgroundColor: isNewMessage ? "white" : "#f5f5f5",
              }}
            />
          </div>

          {/* Kind */}
          <div className="mb-6">
            <label
              className="block text-gray-700 mb-2"
              style={{ fontSize: "16px", fontWeight: "bold" }}
            >
              Type
            </label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as "toast" | "alert")}
              className="w-full px-4 py-3 rounded-xl border border-gray-300"
              style={{ fontSize: "16px" }}
            >
              <option value="toast">Toast</option>
              <option value="alert">Alert</option>
            </select>
          </div>

          {/* Text */}
          <div className="mb-6">
            <label
              className="block text-gray-700 mb-2"
              style={{ fontSize: "16px", fontWeight: "bold" }}
            >
              Message Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter message text..."
              rows={6}
              className="w-full px-4 py-3 rounded-xl border border-gray-300"
              style={{ fontSize: "16px", resize: "vertical" }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 rounded-xl bg-gray-100 text-gray-700"
              style={{ fontSize: "20px", fontWeight: "bold" }}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-4 rounded-xl text-white"
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                backgroundColor: "#10b981",
                opacity: isSaving ? 0.5 : 1,
              }}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>

          {/* Delete button (only for existing messages) */}
          {!isNewMessage && message && (
            <>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-4 rounded-xl bg-red-50 text-red-600"
                  style={{ fontSize: "20px", fontWeight: "bold" }}
                  disabled={isSaving}
                >
                  Delete Message
                </button>
              ) : (
                <div className="bg-red-50 p-4 rounded-xl">
                  <p
                    className="text-red-600 text-center mb-3"
                    style={{ fontSize: "16px", fontWeight: "bold" }}
                  >
                    Delete this message permanently?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-3 rounded-xl bg-white text-gray-700"
                      style={{ fontSize: "16px", fontWeight: "bold" }}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex-1 py-3 rounded-xl bg-red-600 text-white"
                      style={{
                        fontSize: "16px",
                        fontWeight: "bold",
                        opacity: isSaving ? 0.5 : 1,
                      }}
                      disabled={isSaving}
                    >
                      {isSaving ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ModalSheet>
    </>
  );
}