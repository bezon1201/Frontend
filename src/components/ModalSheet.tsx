import { useEffect, useRef, ReactNode } from "react";

interface ModalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

/**
 * ModalSheet - A modal component that slides up from the bottom.
 * Different from BottomSheet (navigation menu).
 */
export default function ModalSheet({ isOpen, onClose, children }: ModalSheetProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[60]"
        onClick={onClose}
        style={{ touchAction: "none" }}
      />

      {/* Modal Content */}
      <div
        ref={modalRef}
        className="fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto"
        style={{
          animation: "slideUp 0.3s ease-out",
          touchAction: "pan-y",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
