import { useTheme } from "../context/ThemeContext";
import { useMemo } from "react";

// Component: ConfirmCancelSheet
//
// Назначение:
// - bottom-sheet для подтверждения массовой отмены лимитных ордеров
//   на OrdersScreen.
//
// Поток:
// - открывается при нажатии "Cancel Limit";
// - при Confirm вызывает onConfirm();
// - OrdersScreen внутри onConfirm должен вызвать
//   POST /api/campaigns/{campaign_id}/orders/cancel-limit
//   с нужным набором order_ids и обновить список ордеров.
//
// Sim/Live:
// - так же, как и в других командах, Sim/Live отрабатывается на бэкенде,
//   этот компонент только выводит текст и обрабатывает confirm/cancel.

interface ConfirmCancelSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  activeCount: number;
}

export default function ConfirmCancelSheet({ 
  isOpen, 
  onClose, 
  onConfirm,
  activeCount 
}: ConfirmCancelSheetProps) {
  const { theme } = useTheme();
  
  // Generate random number between 5 and 15 for display
  const randomTotalOrders = useMemo(() => {
    return Math.floor(Math.random() * 11) + 5; // 5-15
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 animate-slide-up"
        style={{ 
          height: '75%',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full flex flex-col p-6">
          {/* Content */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>

            {/* Title */}
            <div className="text-[24px] font-bold text-black mb-2">
              Confirm cancellation
            </div>

            {/* Description */}
            <div className="text-[20px] text-gray-600 mb-6">
              You are about to cancel {activeCount} open limit orders for BNBUSDC.
            </div>

            {/* Info Rows */}
            <div className="w-full max-w-xs space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-[16px] text-gray-600">Order type:</span>
                <span className="text-[20px] font-bold text-black">Limit</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[16px] text-gray-600">Total orders:</span>
                <span className="text-[20px] font-bold text-black">{randomTotalOrders}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="w-full max-w-xs space-y-3">
              <button
                onClick={onConfirm}
                className="w-full py-4 rounded-2xl text-white text-[20px] font-bold transition-all"
                style={{ backgroundColor: '#10b981' }}
              >
                Confirm
              </button>
              <button
                onClick={onClose}
                className="w-full py-4 rounded-2xl bg-[#ff6b6b] text-white text-[20px] font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}