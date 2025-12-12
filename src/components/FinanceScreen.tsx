// Screen: FinanceScreen (screen_id: "finance")
//
// Назначение:
// - показывает список инвестиционных аккаунтов (IBKR, BINANCE, Revolut, Other и т.д.)
//   и их активов по 4 классам: Stocks, Crypto, Fiat, Other.
//
// API (домен Finance):
// - GET  /api/finance/accounts
//     Загрузка всех аккаунтов с их агрегированными суммами и списком активов.
// - POST /api/finance/accounts
//     Создание нового аккаунта (title + account_class + icon_id).
// - DELETE /api/finance/accounts/{account_id}
//     Удаление аккаунта.
//
// Связанные компоненты:
// - AccountAssetsSheet  → показывает активы аккаунта, использует домен Assets.
// - AddAccountSheet     → собирает данные нового аккаунта и вызывает POST /api/finance/accounts.
// - DeleteAccountSheet  → подтверждает удаление аккаунта и вызывает DELETE /api/finance/accounts/{account_id}.

import { ChevronDown, X, Plus } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useState, useRef } from "react";
import AddAccountSheet from "./AddAccountSheet";
import DeleteAccountSheet from "./DeleteAccountSheet";
import AccountAssetsSheet from "./AccountAssetsSheet";
import AssetEditCryptoScreen from "./AssetEditCryptoScreen";
import AssetEditStocksScreen from "./AssetEditStocksScreen";
import AssetEditFiatScreen from "./AssetEditFiatScreen";
import AssetEditOtherScreen from "./AssetEditOtherScreen";
import Toast from "./Toast";
import { useToast } from "../hooks/useToast";
import ibkrIcon from "figma:asset/9c8651036f3dcef8d0ac4b1deaa85616c61d3f1e.png";
import binanceIcon from "figma:asset/78562490230cf582684f6093b953e27a0cc1917a.png";
import revolutIcon from "figma:asset/46605736a2a1cb91dc7200f512ea53fb731d16cb.png";
import otherIcon from "figma:asset/fc9d3ec5c887aba4019bd3d33bb2729584966f12.png";

interface FinanceScreenProps {
  currentScreen: string;
}

const SCREENS = ["finance", "dashboard", "orders"];

interface Asset {
  name: string;
  amount: string;
  percent: string;
  change: string;
  isNegative?: boolean;
  type?: string;
  isEnabled?: boolean;
}

interface FinanceItem {
  id: string;
  title: string;
  subtitle: string;
  amount: string;
  icon: string;
  details: Asset[];
  accountType?: string; // Type of account: Crypto, Stocks, Fiat, Other
}

export default function FinanceScreen({ currentScreen }: FinanceScreenProps) {
  const { colors, theme } = useTheme();
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Assets modal state
  const [isAssetsSheetOpen, setIsAssetsSheetOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<FinanceItem | null>(null);
  
  // Asset edit screen state
  const [isAssetEditOpen, setIsAssetEditOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingAssetIndex, setEditingAssetIndex] = useState<number>(-1);
  const [isNewAsset, setIsNewAsset] = useState(false);
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    if (isEditMode) return; // Prevent expand/collapse in edit mode
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  
  // TODO API (Finance):
  // Сейчас используется моковый список аккаунтов.
  // Позже нужно заменить на данные из GET /api/finance/accounts.
  //
  // Ответ ожидается в формате (упрощённо):
  // [
  //   {
  //     id: string,
  //     title: string,          // IBKR / BINANCE / Revolut / Other
  //     account_class: string,  // "Stocks" | "Crypto" | "Fiat" | "Other"
  //     amount: string,         // общая стоимость аккаунта
  //     icon_url: string,
  //     assets: [
  //       {
  //         id: string,
  //         name: string,
  //         amount: string,
  //         class_share_pct: string,
  //         pnl_pct: string,
  //         is_negative: boolean
  //       }
  //     ]
  //   },
  //   ...
  // ]
  //
  // Маппинг на интерфейс FinanceItem:
  // - API.title          → FinanceItem.title
  // - API.account_class  → FinanceItem.accountType
  // - API.amount         → FinanceItem.amount
  // - API.icon_url       → FinanceItem.icon
  // - API.assets         → FinanceItem.details (Asset[]).
  //
  // TODO API (Finance):
  // При первом монтировании экрана и при pull-to-refresh
  // нужно вызывать GET /api/finance/accounts и обновлять стейт с аккаунтами.
  //
  // При ошибке запроса → показывать toast через useToast()
  // с message_code/error_code от бэкенда.
  const [financeItems, setFinanceItems] = useState<FinanceItem[]>([
    { 
      id: "ibkr",
      title: "IBKR", 
      subtitle: "IBKR...", 
      amount: "129 389$",
      icon: ibkrIcon,
      accountType: "Stocks",
      details: [
        { name: "VUAA", amount: "50 000$", percent: "40%", change: "5%", type: "Stocks" },
        { name: "XUSE", amount: "30 000$", percent: "23%", change: "3%", type: "Stocks" },
        { name: "TR7A", amount: "20 000$", percent: "15%", change: "1%", type: "Stocks" },
      ]
    },
    { 
      id: "binance",
      title: "BINANCE", 
      subtitle: "Binance...", 
      amount: "129 389$",
      icon: binanceIcon,
      accountType: "Crypto",
      details: [
        { name: "BTC", amount: "60 000$", percent: "46%", change: "8%", isNegative: false, type: "Crypto" },
        { name: "ETH", amount: "40 000$", percent: "31%", change: "-3%", isNegative: true, type: "Crypto" },
        { name: "USDC", amount: "20 000$", percent: "15%", change: "0%", type: "Crypto" },
        { name: "SOL", amount: "9 389$", percent: "8%", change: "12%", type: "Crypto" },
      ]
    },
    { 
      id: "bank",
      title: "Revolut", 
      subtitle: "Revolut", 
      amount: "129 389$",
      icon: revolutIcon,
      accountType: "Fiat",
      details: [
        { name: "Main", amount: "100 000$", percent: "77%", change: "2%", type: "Fiat" },
        { name: "Savings", amount: "20 000$", percent: "15%", change: "1%", type: "Fiat" },
        { name: "EUR", amount: "5 389$", percent: "4%", change: "-1%", isNegative: true, type: "Fiat" },
        { name: "GBP", amount: "4 000$", percent: "4%", change: "0%", type: "Fiat" },
      ]
    },
    { 
      id: "other",
      title: "Other", 
      subtitle: "Wallet1...", 
      amount: "129 389$",
      icon: otherIcon,
      accountType: "Other",
      details: [
        { name: "Wallet 1", amount: "80 000$", percent: "62%", change: "4%", type: "Other" },
        { name: "Wallet 2", amount: "30 000$", percent: "23%", change: "2%", type: "Other" },
        { name: "Wallet 3", amount: "15 000$", percent: "12%", change: "-2%", isNegative: true, type: "Other" },
        { name: "Other", amount: "4 389$", percent: "3%", change: "1%", type: "Other" },
      ]
    },
  ]);

  // Long press handlers
  // UX: долгий тап по аккаунту → включить режим редактирования аккаунтов.
  // В этом режиме доступны:
  // - удаление аккаунта (через DeleteAccountSheet),
  // - создание нового аккаунта (AddAccountSheet).
  // Здесь API не вызывается, только меняется режим UI.
  const handleTouchStart = (itemId: string) => {
    longPressTimer.current = setTimeout(() => {
      setIsEditMode(true);
    }, 500); // 500ms long press
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Account click handler (open assets sheet)
  // UX: короткий тап по аккаунту → открывает AccountAssetsSheet.
  //
  // Данных из GET /api/finance/accounts обычно достаточно,
  // доп. запрос к Finance API не требуется.
  // Детализация по активам уже грузится в AccountAssetsSheet (домен Assets).
  const handleAccountClick = (item: FinanceItem) => {
    if (isEditMode) return;
    setSelectedAccount(item);
    setIsAssetsSheetOpen(true);
  };

  // Asset click handler (open edit screen)
  const handleAssetClick = (asset: Asset, index: number) => {
    setEditingAsset(asset);
    setEditingAssetIndex(index);
    setIsNewAsset(false);
    setIsAssetsSheetOpen(false);
    setIsAssetEditOpen(true);
  };

  // Add asset handler
  const handleAddAssetClick = () => {
    console.log('🟢 Add Asset clicked!');
    console.log('Selected Account:', selectedAccount);
    console.log('Account Type:', selectedAccount?.accountType);
    setEditingAsset(null);
    setIsNewAsset(true);
    setIsAssetsSheetOpen(false);
    setIsAssetEditOpen(true);
    console.log('isAssetEditOpen set to true');
  };

  // Delete asset from edit screen
  const handleDeleteAssetFromEdit = () => {
    if (!selectedAccount) return;

    setFinanceItems(prev => prev.map(item => {
      if (item.id === selectedAccount.id) {
        const updatedDetails = item.details.filter((_, i) => i !== editingAssetIndex);
        
        // Recalculate total amount
        const totalAmount = updatedDetails.reduce((sum, detail) => {
          const amount = parseFloat(detail.amount.replace(/[$\s]/g, ''));
          return sum + amount;
        }, 0);
        
        return {
          ...item,
          details: updatedDetails,
          amount: totalAmount.toLocaleString('en-US').replace(/,/g, ' ') + '$'
        };
      }
      return item;
    }));

    setIsAssetEditOpen(false);
    setIsAssetsSheetOpen(true);
  };

  // Save asset handler
  const handleSaveAsset = (asset: Asset) => {
    if (!selectedAccount) return;

    setFinanceItems(prev => prev.map(item => {
      if (item.id === selectedAccount.id) {
        const updatedDetails = [...item.details];
        if (isNewAsset) {
          // For new assets, use default percent and change values
          updatedDetails.push({
            ...asset,
            percent: '0%',
            change: '0%',
            isNegative: false
          });
        } else {
          // For existing assets, preserve percent and change from original
          const originalAsset = item.details[editingAssetIndex];
          updatedDetails[editingAssetIndex] = {
            ...asset,
            percent: originalAsset.percent,
            change: originalAsset.change,
            isNegative: originalAsset.isNegative
          };
        }
        
        // Recalculate total amount
        const totalAmount = updatedDetails.reduce((sum, detail) => {
          const amount = parseFloat(detail.amount.replace(/[$\s]/g, ''));
          return sum + amount;
        }, 0);
        
        return {
          ...item,
          details: updatedDetails,
          amount: totalAmount.toLocaleString('en-US').replace(/,/g, ' ') + '$'
        };
      }
      return item;
    }));

    setIsAssetEditOpen(false);
    setIsAssetsSheetOpen(true);
  };

  // Delete handler
  const handleDeleteClick = (itemId: string, itemTitle: string) => {
    setAccountToDelete(itemId);
    setIsDeleteSheetOpen(true);
  };

  // TODO API (Finance):
  // При подтверждении удаления аккаунта:
  //
  // 1) Вызвать DELETE /api/finance/accounts/{account_id}.
  // 2) При успехе:
  //    - закрыть DeleteAccountSheet,
  //    - перезапросить список через GET /api/finance/accounts,
  //    - показать toast об успешном удалении.
  // 3) При ошибке (например, ACCOUNT_HAS_LINKED_OPERATIONS):
  //    - показать toast/alert по error_code (логика отображения сообщений будет отдельным слоем).
  const handleDeleteConfirm = () => {
    if (accountToDelete) {
      setFinanceItems(prev => prev.filter(item => item.id !== accountToDelete));
      setIsDeleteSheetOpen(false);
      setAccountToDelete(null);
    }
  };

  // Add account handler
  // AddAccountSheet:
  // - собирает данные нового аккаунта (title, account_class, icon_id).
  // - при сохранении будет вызывать POST /api/finance/accounts.
  // После успешного создания:
  // - перезапрашиваем список аккаунтов через GET /api/finance/accounts;
  // - показываем toast об успешном создании.
  const handleAddAccount = (account: { title: string; icon: string; accountClass: string }) => {
    const newId = `account_${Date.now()}`;
    setFinanceItems(prev => [...prev, {
      id: newId,
      title: account.title,
      subtitle: "",
      amount: "0$",
      icon: account.icon,
      accountType: account.accountClass,
      details: []
    }]);
  };

  // Back from asset edit
  const handleAssetEditBack = () => {
    setIsAssetEditOpen(false);
    setIsAssetsSheetOpen(true);
  };

  return (
    <>
      <div className="h-full flex flex-col bg-black">
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0) rotate(0deg); }
            25% { transform: translateX(-2px) rotate(-1deg); }
            75% { transform: translateX(2px) rotate(1deg); }
          }
          .shake-animation {
            animation: shake 0.3s ease-in-out infinite;
          }
        `}</style>

        {/* Header */}
        <div className="pt-12 pb-2 px-4">
          {!isEditMode ? (
            // Screen Indicators
            <div className="flex justify-center gap-2 mb-3">
              {SCREENS.map((screen) => (
                <div
                  key={screen}
                  className={`w-2 h-2 rounded-full transition-all ${
                    screen === currentScreen ? "w-6" : "opacity-30"
                  }`}
                  style={{ backgroundColor: theme === "green" ? "#10b981" : "#ef4444" }}
                />
              ))}
            </div>
          ) : (
            // Done Button
            <div className="flex justify-center mb-3">
              <button
                onClick={() => setIsEditMode(false)}
                className="px-6 py-2 rounded-xl text-white text-[20px] font-bold"
                style={{ backgroundColor: "#10b981" }}
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto px-4 pt-4 space-y-3 pb-20" 
          data-scrollable="true"
          style={{ 
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 'max(12rem, calc(env(safe-area-inset-bottom) + 10rem))'
          }}
        >
          {financeItems.map((item) => (
            <div 
              key={item.id} 
              className={`bg-white rounded-lg p-4 relative ${isEditMode ? 'shake-animation' : ''}`}
              onTouchStart={() => handleTouchStart(item.id)}
              onTouchEnd={handleTouchEnd}
              onMouseDown={() => handleTouchStart(item.id)}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
              onClick={() => handleAccountClick(item)}
              style={{ cursor: isEditMode ? 'default' : 'pointer' }}
            >
              {/* Delete button in edit mode */}
              {isEditMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(item.id, item.title);
                  }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center z-10 shadow-lg"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              )}

              <div className="flex items-center gap-4">
                <ImageWithFallback
                  src={item.icon}
                  alt={item.title}
                  className="w-16 h-16 bg-white/50 rounded-2xl object-cover"
                />
                <div className="flex-1">
                  <div className="text-[20px] font-bold text-black">{item.title}</div>
                  <div className="text-[13px] text-gray-400 mt-0.5" style={{ fontWeight: 'normal' }}>
                    {item.accountType}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[20px] font-bold text-black">{item.amount}</span>
                  {!isEditMode && (
                    <ChevronDown
                      className={`w-5 h-5 cursor-pointer text-black transition-transform ${
                        expandedSections[item.id] ? 'rotate-180' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection(item.id);
                      }}
                    />
                  )}
                </div>
              </div>
              
              {expandedSections[item.id] && !isEditMode && item.details.length > 0 && (
                <div className="mt-3 flex justify-between">
                  {/* Column 1: Names */}
                  <div className="flex flex-col space-y-1">
                    {item.details.map((detail) => (
                      <div key={detail.name} className="text-[20px] font-bold text-black">
                        {detail.name}
                      </div>
                    ))}
                  </div>
                  
                  {/* Column 2: Amounts */}
                  <div className="flex flex-col space-y-1">
                    {item.details.map((detail, index) => (
                      <div key={index} className="text-[20px] font-bold text-black font-normal">
                        {detail.amount}
                      </div>
                    ))}
                  </div>
                  
                  {/* Column 3: Percentages */}
                  <div className="flex flex-col space-y-1">
                    {item.details.map((detail, index) => (
                      <div key={index} className="text-[20px] font-bold text-black font-normal">
                        {detail.percent}
                      </div>
                    ))}
                  </div>
                  
                  {/* Column 4: Changes */}
                  <div className="flex flex-col space-y-1">
                    {item.details.map((detail, index) => (
                      <div
                        key={index}
                        className={`text-[20px] ${
                          detail.isNegative ? "text-red-500" : "text-green-500"
                        }`}
                        style={{ fontWeight: 'bold' }}
                      >
                        {detail.change}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add button in edit mode */}
          {isEditMode && (
            <button
              onClick={() => setIsAddSheetOpen(true)}
              className="w-full bg-white rounded-lg p-6 flex items-center justify-center gap-3 border-2 border-dashed"
              style={{ borderColor: "#10b981" }}
            >
              <Plus 
                className="w-8 h-8"
                style={{ color: "#10b981" }}
              />
              <span 
                className="text-[20px] font-bold"
                style={{ color: "#10b981" }}
              >
                Add Account
              </span>
            </button>
          )}
        </div>

        {/* Modals */}
        <AddAccountSheet
          isOpen={isAddSheetOpen}
          onClose={() => setIsAddSheetOpen(false)}
          onAdd={handleAddAccount}
        />
        <DeleteAccountSheet
          isOpen={isDeleteSheetOpen}
          onClose={() => setIsDeleteSheetOpen(false)}
          onConfirm={handleDeleteConfirm}
          accountName={financeItems.find(item => item.id === accountToDelete)?.title || ''}
        />
        <AccountAssetsSheet
          isOpen={isAssetsSheetOpen}
          onClose={() => setIsAssetsSheetOpen(false)}
          accountTitle={selectedAccount?.title || ''}
          accountType={selectedAccount?.accountType}
          assets={selectedAccount?.details || []}
          onAssetClick={handleAssetClick}
          onAddAsset={handleAddAssetClick}
        />
      </div>

      {/* Asset Edit Screen (Full screen overlay) */}
      {selectedAccount?.accountType === "Crypto" && (
        <AssetEditCryptoScreen
          isOpen={isAssetEditOpen}
          onBack={handleAssetEditBack}
          onSave={handleSaveAsset}
          asset={isNewAsset ? undefined : (editingAsset || undefined)}
          isNewAsset={isNewAsset}
          onDelete={handleDeleteAssetFromEdit}
        />
      )}
      {selectedAccount?.accountType === "Stocks" && (
        <AssetEditStocksScreen
          isOpen={isAssetEditOpen}
          onBack={handleAssetEditBack}
          onSave={handleSaveAsset}
          asset={isNewAsset ? undefined : (editingAsset || undefined)}
          isNewAsset={isNewAsset}
          onDelete={handleDeleteAssetFromEdit}
        />
      )}
      {selectedAccount?.accountType === "Fiat" && (
        <AssetEditFiatScreen
          isOpen={isAssetEditOpen}
          onBack={handleAssetEditBack}
          onSave={handleSaveAsset}
          asset={isNewAsset ? undefined : (editingAsset || undefined)}
          isNewAsset={isNewAsset}
          onDelete={handleDeleteAssetFromEdit}
        />
      )}
      {selectedAccount?.accountType === "Other" && (
        <AssetEditOtherScreen
          isOpen={isAssetEditOpen}
          onBack={handleAssetEditBack}
          onSave={handleSaveAsset}
          asset={isNewAsset ? undefined : (editingAsset || undefined)}
          isNewAsset={isNewAsset}
          onDelete={handleDeleteAssetFromEdit}
        />
      )}
    </>
  );
}