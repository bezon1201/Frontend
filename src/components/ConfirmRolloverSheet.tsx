import { useTheme } from "../context/ThemeContext";

// Component: ConfirmRolloverSheet
//
// Назначение:
// - bottom-sheet подтверждения команды Rollover для кампании;
// - используется в CampaignScreen перед вызовом POST /api/campaigns/{id}/rollover.
//
// Пропсы:
// - isOpen   — управляет показом шторки;
// - onClose  — закрыть без выполнения команды;
// - onConfirm — вызвать в родителе команду ролловера
//   (там должен быть вызов API /api/campaigns/{id}/rollover и обработка toast'ов).

interface ConfirmRolloverSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmRolloverSheet({ 
  isOpen, 
  onClose, 
  onConfirm 
}: ConfirmRolloverSheetProps) {
  const { theme } = useTheme();

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
          height: '90%',
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
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </div>

            {/* Title */}
            <div className="text-[24px] font-bold text-black mb-2">
              Confirm rollover
            </div>

            {/* Description */}
            <div className="text-[20px] text-gray-600 mb-6">
              You are about to rollover campaign for BNBUSDC
            </div>

            {/* Info Rows */}
            <div className="w-full max-w-xs space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-[16px] text-gray-600">Current grid id:</span>
                <span className="text-[20px] font-bold text-black">2</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[16px] text-gray-600">Current trend:</span>
                <span className="text-[20px] font-bold text-black">RANGE</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[16px] text-gray-600">Set anchor type:</span>
                <span className="text-[20px] font-bold text-black">MA30</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[16px] text-gray-600">Set anchor price:</span>
                <span className="text-[20px] font-bold text-black">123 456$</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[16px] text-gray-600">Current price:</span>
                <span className="text-[20px] font-bold text-black">124 678$</span>
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