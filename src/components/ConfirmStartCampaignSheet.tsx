import { useTheme } from "../context/ThemeContext";

// Component: ConfirmStartCampaignSheet
//
// Назначение:
// - bottom-sheet перед запуском кампании (Start campaign / Apply changes);
// - показывает сводку по символу, бюджету и основным параметрам сетки,
//   чтобы пользователь подтвердил старт или перестройку кампании.
//
// Связь с API:
// - используется в CampaignScreen перед вызовом POST /api/campaigns/{id}/start;
// - onConfirm в родителе должен запускать эту команду (см. TODO в CampaignScreen).
//
// Пропсы (данные приходят из CampaignScreen):
// - symbol          — строка-символ (BTCUSDC и т.п.), производная от asset.name + quote_asset;
// - budget          — budget_value кампании;
// - anchorMode      — anchor_mode;
// - anchorPrice     — anchor_price (для FIX/PRICE);
// - anchorOffset    — anchor_offset_value;
// - anchorDirection — anchor_offset_direction;
// - anchorOffsetMode— anchor_offset_mode;
// - gridDepthMode   — grid_depth_mode;
// - numLevels       — num_levels;
// - allocationMode  — allocation_mode.

interface ConfirmStartCampaignSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  symbol: string;
  budget: string;
  anchorMode: string;
  anchorPrice: string;
  anchorOffset: string;
  anchorDirection: string;
  anchorOffsetMode: string;
  gridDepthMode: string;
  numLevels: number;
  allocationMode: string;
}

export default function ConfirmStartCampaignSheet({ 
  isOpen, 
  onClose, 
  onConfirm,
  symbol,
  budget,
  anchorMode,
  anchorPrice,
  anchorOffset,
  anchorDirection,
  anchorOffsetMode,
  gridDepthMode,
  numLevels,
  allocationMode
}: ConfirmStartCampaignSheetProps) {
  const { theme } = useTheme();

  if (!isOpen) return null;

  // Format anchor display
  const anchorDisplay = () => {
    // For FIX mode, show the fixed anchor price
    if (anchorMode === 'FIX') {
      return anchorPrice ? `${anchorPrice}$` : 'FIX';
    }
    
    // For PRICE mode, show the price number with dollar sign
    if (anchorMode === 'PRICE') {
      return anchorPrice ? `${anchorPrice}$` : 'PRICE';
    }
    
    // For MA30 and MA90, combine mode + sign + offset + suffix
    const sign = anchorDirection === 'Below' ? '-' : '+';
    const suffix = anchorOffsetMode === 'Percent' ? '%' : '$';
    return `${anchorMode} ${sign}${anchorOffset}${suffix}`;
  };

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
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            </div>

            {/* Title */}
            <div className="text-[24px] font-bold text-black mb-2">
              Confirm start campaign
            </div>

            {/* Description */}
            <div className="text-[20px] text-gray-600 mb-6">
              You are about to start campaign for {symbol}
            </div>

            {/* Info Rows */}
            <div className="w-full max-w-xs space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-[16px] text-gray-600">Budget:</span>
                <span className="text-[20px] font-bold text-black">{budget}$</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[16px] text-gray-600">Anchor:</span>
                <span className="text-[20px] font-bold text-black">{anchorDisplay()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[16px] text-gray-600">Grid depth:</span>
                <span className="text-[20px] font-bold text-black">{gridDepthMode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[16px] text-gray-600">Levels:</span>
                <span className="text-[20px] font-bold text-black">{numLevels}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[16px] text-gray-600">Allocation:</span>
                <span className="text-[20px] font-bold text-black">{allocationMode}</span>
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