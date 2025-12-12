import { X, Plus, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// Sheet: AccountAssetsSheet
//
// Открывается из FinanceScreen при тапе по аккаунту.
// Показывает список активов выбранного аккаунта.
//
// Основной API (домен Assets):
// - GET  /api/accounts/{account_id}/assets
//     Загрузка списка активов для конкретного аккаунта.
//
// Маппинг полей API → UI Asset:
// - API.name              → Asset.name
// - API.invested_value    → Asset.amount      (строка с валютой)
// - API.class_share_pct   → Asset.percent     (доля в классе, строка "%")
// - API.pnl_pct           → Asset.change      (PnL %, строка "%")
// - API.is_negative       → Asset.isNegative  (цвет/знак изменения)
//
// account_id передаётся сверху (из FinanceScreen) вместе с заголовком аккаунта.

interface Asset {
  name: string;
  amount: string;
  percent: string;
  change: string;
  isNegative?: boolean;
}

interface AccountAssetsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  accountTitle: string;
  accountType?: string;
  // TODO API (Assets):
  // Сейчас сюда приходят mock-активы из FinanceScreen.
  // Позже нужно подставлять реальные данные из GET /api/accounts/{account_id}/assets.
  assets: Asset[];
  onAssetClick: (asset: Asset, index: number) => void;
  onAddAsset: () => void;
}

export default function AccountAssetsSheet({ 
  isOpen, 
  onClose, 
  accountTitle, 
  accountType,
  assets,
  onAssetClick,
  onAddAsset
}: AccountAssetsSheetProps) {
  const { theme } = useTheme();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        style={{
          touchAction: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none'
        }}
      />
      
      {/* Sheet */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 animate-slide-up"
        style={{
          height: '80%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-200">
          <h2 className="text-[24px] font-bold text-black">
            {accountTitle}{accountType && ` - ${accountType} account`}
          </h2>
          <button onClick={onClose} className="p-2">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Assets List */}
        <div className="flex-1 overflow-y-auto">
          {assets.map((asset, index) => (
            // UX: тап по строке актива → открыть экран редактирования актива
            // (AssetEditCryptoScreen / AssetEditStocksScreen / AssetEditFiatScreen / AssetEditOtherScreen)
            // в зависимости от типа аккаунта / актива.
            //
            // Для режима редактирования:
            // - при входе в AssetEdit*Screen можно дополнительно загрузить детали через GET /api/assets/{asset_id}
            //   (если info из списка недостаточно).
            <button
              key={index}
              onClick={() => onAssetClick(asset, index)}
              className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex-1 text-left">
                <div className="text-[20px] font-bold text-black">{asset.name}</div>
                <div className="text-[16px] text-gray-500 mt-1">{asset.amount}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[16px] text-gray-600">{asset.percent}</div>
                  <div 
                    className={`text-[16px] font-bold ${
                      asset.isNegative ? 'text-red-500' : 'text-green-500'
                    }`}
                  >
                    {asset.change}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          ))}

          {/* Add Asset Button */}
          {/* UX: кнопка "+ Add Asset" → открыть экран добавления актива
              соответствующего типа (крипта/акции/фиат/other).
              
              Для нового актива будут вызываться POST /api/accounts/{account_id}/assets
              из AssetEdit*Screen после заполнения формы. */}
          <div className="px-6 py-6">
            <button
              onClick={() => {
                console.log('🟡 Add Asset button clicked in AccountAssetsSheet!');
                onAddAsset();
              }}
              className="w-full py-4 rounded-xl flex items-center justify-center gap-2"
              style={{
                backgroundColor: '#10b98110',
                color: '#10b981'
              }}
            >
              <Plus className="w-6 h-6" />
              <span className="text-[20px] font-bold">Add Asset</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}