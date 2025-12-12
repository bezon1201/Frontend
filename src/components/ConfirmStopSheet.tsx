import { useTheme } from "../context/ThemeContext";

// Component: ConfirmStopSheet
//
// Назначение:
// - bottom-sheet подтверждения полной остановки кампании;
// - используется в CampaignScreen перед вызовом POST /api/campaigns/{id}/stop.
//
// Пропсы:
// - isOpen   — управляет показом шторки;
// - onClose  — закрыть без выполнения команды;
// - onConfirm — вызвать в родителе команду остановки
//   (там должен быть вызов API /api/campaigns/{id}/stop и обработка toast'ов).

interface ConfirmStopSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmStopSheet({ 
  isOpen, 
  onClose, 
  onConfirm 
}: ConfirmStopSheetProps) {
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
                <circle cx="12" cy="12" r="10" />
                <rect x="9" y="9" width="6" height="6" />
              </svg>
            </div>

            {/* Title */}
            <div className="text-[24px] font-bold text-black mb-2">
              Confirm stop
            </div>

            {/* Description */}
            <div className="text-[20px] text-gray-600 mb-6">
              You are about to stop campaign for BNBUSDC
            </div>

            {/* Info Rows */}
            <div className="w-full max-w-xs space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-[16px] text-gray-600">Filled levels:</span>
                <span className="text-[20px] font-bold text-black">3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[16px] text-gray-600">Remaining levels:</span>
                <span className="text-[20px] font-bold text-black">5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[16px] text-gray-600">Average buy price:</span>
                <span className="text-[20px] font-bold text-black">123 445$</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[16px] text-gray-600">Current price:</span>
                <span className="text-[20px] font-bold text-black">124 567$</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[16px] text-gray-600">Total spent:</span>
                <span className="text-[20px] font-bold text-black">120$</span>
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