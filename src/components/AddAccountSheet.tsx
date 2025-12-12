import { X, ChevronDown, Upload } from 'lucide-react';
import { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import ibkrIcon from "figma:asset/9c8651036f3dcef8d0ac4b1deaa85616c61d3f1e.png";
import binanceIcon from "figma:asset/78562490230cf582684f6093b953e27a0cc1917a.png";
import revolutIcon from "figma:asset/46605736a2a1cb91dc7200f512ea53fb731d16cb.png";
import otherIcon from "figma:asset/fc9d3ec5c887aba4019bd3d33bb2729584966f12.png";

// Sheet: AddAccountSheet
//
// Шторка добавления нового аккаунта.
//
// От пользователя:
// - title        — название аккаунта (IBKR, BINANCE, Revolut, Other и т.п.)
// - accountClass — один из четырёх классов (Stocks, Crypto, Fiat, Other)
// - iconId       — выбранная иконка (или null)
//
// API (Finance):
// - POST /api/finance/accounts
//   Тело запроса:
//   {
//     "title": string,
//     "account_class": "Stocks" | "Crypto" | "Fiat" | "Other",
//     "icon_id": string | null
//   }
//   Ответ при успехе: { "account_id": string }

interface AddAccountSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (account: { title: string; icon: string; accountClass: string }) => void;
}

const DEFAULT_ACCOUNT_ICONS = [
  { label: 'IBKR', icon: ibkrIcon },
  { label: 'Binance', icon: binanceIcon },
  { label: 'Revolut', icon: revolutIcon },
  { label: 'Other', icon: otherIcon },
];

const ACCOUNT_CLASSES = ['Crypto', 'Stocks', 'Fiat', 'Other'];

export default function AddAccountSheet({ isOpen, onClose, onAdd }: AddAccountSheetProps) {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(otherIcon);
  const [customIcon, setCustomIcon] = useState<string | null>(null);
  const [accountClass, setAccountClass] = useState('Crypto');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TODO API (Finance):
  // При нажатии "Save" в AddAccountSheet:
  // 1) Собрать форму в тело запроса для POST /api/finance/accounts.
  // 2) Отправить запрос.
  // 3) При успехе:
  //    - закрыть AddAccountSheet,
  //    - инициировать перезагрузку списка аккаунтов в FinanceScreen (GET /api/finance/accounts),
  //    - показать toast об успеш��ом создании (message_code вроде "ACCOUNT_CREATED").
  // 4) При ошибке (ACCOUNT_NAME_DUPLICATE, ACCOUNT_CLASS_INVALID и др.):
  //    - показать toast/alert по error_code (тексты будем подтягивать позже).
  const handleAdd = () => {
    if (title) {
      onAdd({ title, icon: selectedIcon, accountClass: accountClass });
      setTitle('');
      setSelectedIcon(otherIcon);
      setCustomIcon(null);
      setAccountClass('Crypto');
      onClose();
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) { // Max 5MB
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCustomIcon(result);
        setSelectedIcon(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCustomIcon = () => {
    setCustomIcon(null);
    setSelectedIcon(otherIcon);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
        className="fixed left-0 right-0 bg-white rounded-t-3xl z-50 animate-slide-up"
        style={{
          bottom: 0,
          height: '90%',
          touchAction: 'pan-y',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-200">
          <h2 className="text-[24px] font-bold text-black">Add Account</h2>
          <button onClick={onClose} className="p-2">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
          {/* Account Name */}
          <div>
            <label className="block text-[16px] font-bold text-gray-700 mb-2">
              Account Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My Wallet"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl text-[16px] text-black"
              style={{ border: 'none', outline: 'none' }}
            />
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-[16px] font-bold text-gray-700 mb-2">
              Account Type
            </label>
            <div className="relative">
              <button
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-[16px] text-black flex items-center justify-between"
                style={{ border: 'none', outline: 'none' }}
                onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              >
                <span>{accountClass}</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isTypeDropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-10">
                  {ACCOUNT_CLASSES.map((type) => (
                    <button
                      key={type}
                      className="w-full px-4 py-3 text-left text-[16px] text-black hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        setAccountClass(type);
                        setIsTypeDropdownOpen(false);
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-[16px] font-bold text-gray-700 mb-3">
              Select Icon
            </label>
            <div className="grid grid-cols-5 gap-3">
              {DEFAULT_ACCOUNT_ICONS.map((type) => (
                <button
                  key={type.label}
                  onClick={() => setSelectedIcon(type.icon)}
                  className={`aspect-square p-3 rounded-xl transition-all flex items-center justify-center ${
                    selectedIcon === type.icon && !customIcon
                      ? 'ring-2'
                      : 'bg-gray-50'
                  }`}
                  style={{
                    ringColor: '#10b981',
                    backgroundColor: selectedIcon === type.icon && !customIcon
                      ? '#10b98110'
                      : '#f9fafb'
                  }}
                >
                  <ImageWithFallback
                    src={type.icon}
                    alt={type.label}
                    className="w-full h-full rounded-xl object-contain"
                  />
                </button>
              ))}
              
              {/* Upload / Custom Icon Button */}
              {!customIcon ? (
                <button
                  className="aspect-square p-3 rounded-xl transition-all bg-gray-50 hover:bg-gray-100 flex items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400" />
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </button>
              ) : (
                <div
                  onClick={() => setSelectedIcon(customIcon)}
                  className={`aspect-square p-3 rounded-xl transition-all relative cursor-pointer flex items-center justify-center ${
                    selectedIcon === customIcon
                      ? 'ring-2'
                      : 'bg-gray-50'
                  }`}
                  style={{
                    ringColor: '#10b981',
                    backgroundColor: selectedIcon === customIcon
                      ? '#10b98110'
                      : '#f9fafb'
                  }}
                >
                  <img
                    src={customIcon}
                    alt="Custom"
                    className="w-full h-full rounded-xl object-cover"
                  />
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCustomIcon();
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Warning Text */}
          <div className="px-1">
            <p className="text-[13px] text-gray-500" style={{ fontWeight: 'normal' }}>
              Account name and type cannot be changed later.
            </p>
          </div>

          {/* Add Button */}
          <button
            onClick={handleAdd}
            disabled={!title}
            className="w-full py-4 rounded-xl text-white text-[20px] font-bold transition-all"
            style={{
              backgroundColor: !title ? '#9ca3af' : '#10b981',
              opacity: !title ? 0.6 : 1
            }}
          >
            Add Account
          </button>
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