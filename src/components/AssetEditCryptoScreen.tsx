// Screen: AssetEditCryptoScreen
//
// Назначение:
// - добавление/редактирование одного актива класса "Crypto" (BTC, ETH, USDC и т.п.),
// - используется для аккаунтов типа Crypto, открывается из AccountAssetsSheet.
//
// API (домен Assets):
// - GET    /api/assets/{asset_id}
//     Загрузка деталей существующего актива в режиме редактирования.
// - POST   /api/accounts/{account_id}/assets
//     Создание нового актива в выбранном аккаунте (add mode).
// - PUT    /api/assets/{asset_id}
//     Обновление существующего актива (edit mode).
// - DELETE /api/assets/{asset_id}
//     Удаление актива.
// - GET    /api/assets/{asset_id}/history (опционально)
//     История/динамика актива для будущих графиков.
//
// Особенности UI:
// - "trading" вариант: есть Trading parameters (quoteAsset, timeframe1/2/3) и переключатель Sim/Live.
// - asset_class для этого экрана всегда "Crypto".

import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import SegmentedControl from './SegmentedControl';
import TradeModeToggle from './TradeModeToggle';

interface Asset {
  name: string;
  amount: string;
  percent: string;
  change: string;
  isNegative?: boolean;
  type?: string;
  isEnabled?: boolean;
  remarks?: string;
  riskLevel?: number;
  tradeMode?: 'Sim' | 'Live';
}

interface AssetEditCryptoScreenProps {
  isOpen: boolean;
  onBack: () => void;
  onSave: (asset: Asset) => void;
  onDelete?: () => void;
  asset?: Asset;
  isNewAsset?: boolean;
}

export default function AssetEditCryptoScreen({ 
  isOpen, 
  onBack, 
  onSave, 
  onDelete,
  asset,
  isNewAsset = false
}: AssetEditCryptoScreenProps) {
  const { theme } = useTheme();
  
  console.log('🔵 AssetEditCryptoScreen render:', { isOpen, isNewAsset, asset });
  
  const [name, setName] = useState('');
  const [amountMode, setAmountMode] = useState('SET');
  const [amountInput, setAmountInput] = useState('');
  const [currentAmount, setCurrentAmount] = useState(0);
  const [isEnabled, setIsEnabled] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [riskLevel, setRiskLevel] = useState(3);
  const [tradeMode, setTradeMode] = useState<'Sim' | 'Live'>('Sim');
  const [timeframe1, setTimeframe1] = useState('3d');
  const [timeframe2, setTimeframe2] = useState('1d');
  const [timeframe3, setTimeframe3] = useState('12h');
  const [quoteAsset, setQuoteAsset] = useState('USDT');

  // Current price & quantity states
  const [currentPriceMode, setCurrentPriceMode] = useState('SET');
  const [currentPriceInput, setCurrentPriceInput] = useState('');
  const [quantityMode, setQuantityMode] = useState('SET');
  const [quantityInput, setQuantityInput] = useState('');

  // TODO API (Assets):
  // При реальной интеграции:
  //
  // - если есть asset_id и isNewAsset === false:
  //   1) сначала можно загрузить актуальные данные актива через GET /api/assets/{asset_id}
  //   2) затем заполнить стейты из ответа (name, текущая сумма, isEnabled, remarks, riskLevel, tradeMode,
  //      quoteAsset, timeframe1/2/3, текущая цена, quantity и т.д.).
  //
  // - если isNewAsset === true:
  //   использовать только дефолтные значения (как сейчас).
  useEffect(() => {
    if (asset && !isNewAsset) {
      setName(asset.name);
      const current = parseFloat(asset.amount.replace(/[$\s]/g, ''));
      setCurrentAmount(current);
      setAmountInput('');
      setAmountMode('SET');
      setIsEnabled(asset.isEnabled !== undefined ? asset.isEnabled : true);
      setRemarks(asset.remarks || '');
      setRiskLevel(asset.riskLevel || 3);
      setTradeMode(asset.tradeMode || 'Sim');
    } else {
      setName('');
      setCurrentAmount(0);
      setAmountInput('');
      setAmountMode('SET');
      setIsEnabled(true);
      setRemarks('');
      setRiskLevel(3);
      setTradeMode('Sim');
    }
  }, [asset, isNewAsset, isOpen]);

  const calculateFinalAmount = () => {
    const inputValue = parseFloat(amountInput.replace(',', '.')) || 0;
    
    switch (amountMode) {
      case 'SET':
        return inputValue;
      case 'ADD':
        return currentAmount + inputValue;
      case 'SUBTRACT':
        return Math.max(0, currentAmount - inputValue);
      default:
        return inputValue;
    }
  };

  const finalAmount = calculateFinalAmount();

  // TODO API (Assets):
  // В режиме создания (isNewAsset === true):
  // - собрать данные формы и вызвать POST /api/accounts/{account_id}/assets.
  // В режиме редактирования (isNewAsset === false):
  // - собрать данные формы и вызвать PUT /api/assets/{asset_id}.
  //
  // Пример маппинга полей формы → тело запроса:
  // {
  //   name:           string,      // название актива
  //   asset_class:    "Crypto",
  //   invested_value: number,      // итоговая вложенная сумма
  //   current_price:  number,      // цена за единицу
  //   quantity:       number,      // количество
  //   quote_asset:    string,      // USDT / USDC / BUSD и т.п.
  //   tf1:            string,      // timeframe1
  //   tf2:            string,      // timeframe2
  //   tf3:            string,      // timeframe3
  //   trade_mode:     "Sim" | "Live",
  //   risk_level:     string,      // Low / Medium / High и т.п.
  //   remarks:        string,      // комментарий
  //   is_enabled:     boolean
  // }
  //
  // После успешного ответа:
  // - закрыть экран,
  // - обновить список активов в AccountAssetsSheet (GET /api/accounts/{account_id}/assets),
  // - показать toast об успешном сохранении.
  const handleSave = () => {
    if (amountInput) {
      const formattedAmount = Math.round(finalAmount).toLocaleString('en-US').replace(/,/g, ' ') + '$';
      
      // NOTE: данные пока уходят только в onSave (локальная логика UI).
      // Позже onSave будет вызывать реальный API (POST или PUT) и делать refetch списка активов.
      onSave({
        name,
        amount: formattedAmount,
        percent: asset?.percent || '0%',
        change: asset?.change || '0%',
        isNegative: asset?.isNegative || false,
        type: 'Crypto',
        isEnabled: isEnabled,
        remarks: remarks,
        riskLevel: riskLevel,
        tradeMode: tradeMode
      });
    }
  };

  const handleAmountInputChange = (value: string) => {
    // Allow only digits and comma
    const sanitized = value.replace(/[^\d,]/g, '');
    // Allow only one comma
    const parts = sanitized.split(',');
    if (parts.length > 2) {
      return;
    }
    setAmountInput(sanitized);
  };

  // Check if anything has changed
  const hasChanges = () => {
    if (isNewAsset) {
      // For new assets, require name and amount
      return name.trim() !== '' && amountInput !== '';
    }
    // For existing assets, only require amount change
    return amountInput !== '';
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black z-50 overflow-y-auto"
      style={{
        touchAction: 'pan-y',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <style>{`
        .asset-scrollable::-webkit-scrollbar {
          display: none;
        }
        .asset-scrollable {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>

      {/* Status indicator */}
      <div className="h-12 flex items-center justify-center">
        <div 
          className="w-2 h-2 rounded-full" 
          style={{ backgroundColor: theme === 'green' ? '#10b981' : '#ef4444' }}
        />
      </div>

      <div 
        className="min-h-full px-4 asset-scrollable"
        style={{
          paddingBottom: 'max(12rem, calc(env(safe-area-inset-bottom) + 10rem))'
        }}
      >
        {/* Fixed Back button header */}
        <div 
          className="sticky top-0 z-10 bg-black pb-4 mb-2"
          style={{
            marginLeft: '-1rem',
            marginRight: '-1rem',
            paddingLeft: '1rem',
            paddingRight: '1rem',
            paddingTop: '1rem'
          }}
        >
          <button 
            onClick={onBack}
            style={{ 
              fontSize: '20px', 
              fontWeight: 'bold',
              color: '#10b981'
            }}
          >
            ‹ Back
          </button>
        </div>

        {/* Title */}
        <div className="mb-6 flex items-center justify-between">
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }} className="text-white mb-1">
            {isNewAsset ? 'Add Crypto' : `Edit ${name}`}
          </h1>
          
          {/* Toggle with Status */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEnabled(!isEnabled)}
              className="relative w-12 h-7 rounded-full transition-colors"
              style={{
                backgroundColor: isEnabled 
                  ? '#10b981'
                  : '#6b7280'
              }}
            >
              <div
                className="absolute top-1 w-5 h-5 bg-white rounded-full transition-transform"
                style={{
                  transform: isEnabled ? 'translateX(26px)' : 'translateX(4px)'
                }}
              />
            </button>
            <span
              style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: isEnabled 
                  ? '#10b981'
                  : '#ef4444'
              }}
            >
              {isEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Name Field - Only for new assets */}
        {isNewAsset && (
          <div className="bg-white rounded-2xl p-6 mb-4">
            <label className="text-gray-500 mb-2 block" style={{ fontSize: '14px' }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter asset name"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl text-[16px] text-black"
              style={{ border: 'none', outline: 'none' }}
            />
          </div>
        )}

        {/* Combined Asset & Amount Card */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }} className="mb-3">Amount invested</h2>

          {/* Amount - Editable */}
          <div>
            {/* Show current amount for existing assets */}
            {!isNewAsset && (
              <div className="mb-3">
                <div className="text-gray-500 mb-1" style={{ fontSize: '14px' }}>
                  Current amount
                </div>
                <div className="text-gray-600" style={{ fontSize: '20px', fontWeight: 'bold' }}>
                  {currentAmount.toLocaleString('en-US').replace(/,/g, ' ')}$
                </div>
              </div>
            )}
            
            <SegmentedControl
              options={['SET', 'ADD', 'SUBTRACT']}
              value={amountMode}
              onChange={setAmountMode}
              className="mb-3"
            />

            <div className="relative mb-2">
              <input
                type="text"
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => handleAmountInputChange(e.target.value)}
                placeholder={
                  amountMode === 'SET' ? 'Enter new amount' :
                  amountMode === 'ADD' ? 'Amount to add' :
                  'Amount to subtract'
                }
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-[16px] text-black pr-12"
                style={{ border: 'none', outline: 'none' }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[16px] text-gray-400">
                $
              </span>
            </div>
          </div>
        </div>

        {/* Current price & quantity Card */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }} className="mb-4">Current price & quantity</h2>

          {/* Current Price */}
          <div className="mb-4">
            <label className="text-gray-500 mb-2 block" style={{ fontSize: '14px' }}>
              Current price
            </label>
            
            <SegmentedControl
              options={['SET', 'ADD', 'SUBTRACT']}
              value={currentPriceMode}
              onChange={setCurrentPriceMode}
              className="mb-3"
            />

            <div className="relative mb-2">
              <input
                type="text"
                inputMode="decimal"
                value={currentPriceInput}
                onChange={(e) => {
                  const sanitized = e.target.value.replace(/[^\d,]/g, '');
                  const parts = sanitized.split(',');
                  if (parts.length <= 2) {
                    setCurrentPriceInput(sanitized);
                  }
                }}
                placeholder={
                  currentPriceMode === 'SET' ? 'Enter price' :
                  currentPriceMode === 'ADD' ? 'Price to add' :
                  'Price to subtract'
                }
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-[16px] text-black pr-12"
                style={{ border: 'none', outline: 'none' }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[16px] text-gray-400">
                $
              </span>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="text-gray-500 mb-2 block" style={{ fontSize: '14px' }}>
              Quantity
            </label>
            
            <SegmentedControl
              options={['SET', 'ADD', 'SUBTRACT']}
              value={quantityMode}
              onChange={setQuantityMode}
              className="mb-3"
            />

            <div className="relative mb-2">
              <input
                type="text"
                inputMode="decimal"
                value={quantityInput}
                onChange={(e) => {
                  const sanitized = e.target.value.replace(/[^\d,]/g, '');
                  const parts = sanitized.split(',');
                  if (parts.length <= 2) {
                    setQuantityInput(sanitized);
                  }
                }}
                placeholder={
                  quantityMode === 'SET' ? 'Enter quantity' :
                  quantityMode === 'ADD' ? 'Quantity to add' :
                  'Quantity to subtract'
                }
                className="w-full px-4 py-3 bg-gray-50 rounded-xl text-[16px] text-black"
                style={{ border: 'none', outline: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* Trading Timeframes Card */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }} className="mb-4">Trading parameters</h2>

          {/* Quote Asset */}
          <div className="mb-4">
            <label className="text-gray-500 mb-2 block" style={{ fontSize: '14px' }}>
              Quote asset
            </label>
            <input
              type="text"
              value={quoteAsset}
              onChange={(e) => setQuoteAsset(e.target.value.toUpperCase())}
              placeholder="USDT"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl text-[16px] text-black"
              style={{ border: 'none', outline: 'none' }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Timeframe 1 */}
            <div>
              <label className="text-gray-500 mb-2 block" style={{ fontSize: '14px' }}>
                TF1
              </label>
              <select
                value={timeframe1}
                onChange={(e) => setTimeframe1(e.target.value)}
                className="w-full px-3 py-3 bg-gray-50 rounded-xl text-[16px] text-black appearance-none"
                style={{ 
                  border: 'none', 
                  outline: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  paddingRight: '2rem'
                }}
              >
                <option value="1w">1w</option>
                <option value="3d">3d</option>
                <option value="1d">1d</option>
                <option value="12h">12h</option>
                <option value="6h">6h</option>
                <option value="4h">4h</option>
                <option value="2h">2h</option>
                <option value="1h">1h</option>
                <option value="30m">30m</option>
                <option value="15m">15m</option>
                <option value="5m">5m</option>
                <option value="1m">1m</option>
              </select>
            </div>

            {/* Timeframe 2 */}
            <div>
              <label className="text-gray-500 mb-2 block" style={{ fontSize: '14px' }}>
                TF2
              </label>
              <select
                value={timeframe2}
                onChange={(e) => setTimeframe2(e.target.value)}
                className="w-full px-3 py-3 bg-gray-50 rounded-xl text-[16px] text-black appearance-none"
                style={{ 
                  border: 'none', 
                  outline: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  paddingRight: '2rem'
                }}
              >
                <option value="1w">1w</option>
                <option value="3d">3d</option>
                <option value="1d">1d</option>
                <option value="12h">12h</option>
                <option value="6h">6h</option>
                <option value="4h">4h</option>
                <option value="2h">2h</option>
                <option value="1h">1h</option>
                <option value="30m">30m</option>
                <option value="15m">15m</option>
                <option value="5m">5m</option>
                <option value="1m">1m</option>
              </select>
            </div>

            {/* Timeframe 3 */}
            <div>
              <label className="text-gray-500 mb-2 block" style={{ fontSize: '14px' }}>
                TF3
              </label>
              <select
                value={timeframe3}
                onChange={(e) => setTimeframe3(e.target.value)}
                className="w-full px-3 py-3 bg-gray-50 rounded-xl text-[16px] text-black appearance-none"
                style={{ 
                  border: 'none', 
                  outline: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center',
                  paddingRight: '2rem'
                }}
              >
                <option value="1w">1w</option>
                <option value="3d">3d</option>
                <option value="1d">1d</option>
                <option value="12h">12h</option>
                <option value="6h">6h</option>
                <option value="4h">4h</option>
                <option value="2h">2h</option>
                <option value="1h">1h</option>
                <option value="30m">30m</option>
                <option value="15m">15m</option>
                <option value="5m">5m</option>
                <option value="1m">1m</option>
              </select>
            </div>
          </div>
        </div>

        {/* Risk & Trade Mode Card */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Risk & trade mode</h2>
            
            {/* Trade Mode Toggle */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setTradeMode(tradeMode === 'Sim' ? 'Live' : 'Sim')}
                className="relative w-12 h-7 rounded-full transition-colors"
                style={{
                  backgroundColor: tradeMode === 'Live' ? '#10b981' : '#ef4444'
                }}
              >
                <div
                  className="absolute top-1 w-5 h-5 bg-white rounded-full transition-transform"
                  style={{
                    transform: tradeMode === 'Live' ? 'translateX(26px)' : 'translateX(4px)'
                  }}
                />
              </button>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: tradeMode === 'Live' ? '#10b981' : '#ef4444'
                }}
              >
                {tradeMode}
              </span>
            </div>
          </div>

          {/* Remarks */}
          <div className="mb-4">
            <label className="text-gray-500 mb-2 block" style={{ fontSize: '14px' }}>
              Remarks
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter remarks"
              className="w-full px-4 py-3 bg-gray-50 rounded-xl text-[16px] text-black"
              style={{ border: 'none', outline: 'none' }}
            />
          </div>

          {/* Risk Level Slider */}
          <div className="mb-0">
            <div className="flex justify-between items-center mb-2">
              <label className="text-gray-500" style={{ fontSize: '14px' }}>
                Risk level
              </label>
              <span className="text-black" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                {riskLevel}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={riskLevel}
              onChange={(e) => setRiskLevel(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${((riskLevel - 1) / 4) * 100}%, #e5e7eb ${((riskLevel - 1) / 4) * 100}%, #e5e7eb 100%)`,
              }}
            />
            <style>{`
              input[type="range"]::-webkit-slider-thumb {
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #10b981;
                cursor: pointer;
              }
              input[type="range"]::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #10b981;
                cursor: pointer;
                border: none;
              }
            `}</style>
            <div className="flex justify-between mt-1">
              <span className="text-gray-400" style={{ fontSize: '12px' }}>Low</span>
              <span className="text-gray-400" style={{ fontSize: '12px' }}>High</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!hasChanges()}
          className="w-full py-4 rounded-xl text-white text-[20px] font-bold transition-opacity disabled:opacity-50 mb-4"
          style={{
            backgroundColor: '#10b981'
          }}
        >
          {isNewAsset ? 'Add Asset' : 'Save Changes'}
        </button>

        {/* Delete Button (only for existing assets) */}
        {/* TODO API (Assets):
            При нажатии "Delete":
            - вызвать DELETE /api/assets/{asset_id} (через родительский callback onDelete, где есть контекст account_id/asset_id).
            - при успехе:
              - закрыть экран,
              - обновить список активов в AccountAssetsSheet,
              - показать toast об успешном удалении.
            - при ошибках (например, ASSET_IN_USE): показать понятный toast/alert по error_code. */}
        {!isNewAsset && onDelete && (
          <button
            onClick={onDelete}
            className="w-full py-4 rounded-xl text-white text-[20px] font-bold mb-8 bg-red-500"
          >
            Delete Asset
          </button>
        )}
      </div>
    </div>
  );
}