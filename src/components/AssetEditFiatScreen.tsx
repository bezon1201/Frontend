import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import SegmentedControl from './SegmentedControl';
import TradeModeToggle from './TradeModeToggle';

// Screen: AssetEditFiatScreen
//
// Редактирование/добавление одного актива класса "Fiat".
// Открывается из AccountAssetsSheet.
//
// API (Assets):
// - GET    /api/assets/{asset_id}
// - POST   /api/accounts/{account_id}/assets
// - PUT    /api/assets/{asset_id}
// - DELETE /api/assets/{asset_id}
//
// Для Fiat используется упрощённый UI (simple):
// - нет Trading parameters (tf1/2/3, quoteAsset),
// - нет переключателя Sim/Live (trade_mode может быть null).
//
// TODO API (Assets):
// В этом экране сохраняются только базовые поля:
// - name
// - invested_value (сумма вложений)
// - current_price (если используется)
// - quantity (если используется)
// - risk_level
// - remarks
// - is_enabled
//
// asset_class для этого экрана всегда "Fiat".
//
// POST /api/accounts/{account_id}/assets   (add)
// PUT  /api/assets/{asset_id}             (edit)
// Далее refetch списка активов и toast — аналогично Crypto/Stocks.

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

interface AssetEditFiatScreenProps {
  isOpen: boolean;
  onBack: () => void;
  onSave: (asset: Asset) => void;
  onDelete?: () => void;
  asset?: Asset;
  isNewAsset?: boolean;
}

export default function AssetEditFiatScreen({ 
  isOpen, 
  onBack, 
  onSave, 
  onDelete,
  asset,
  isNewAsset = false
}: AssetEditFiatScreenProps) {
  const { theme } = useTheme();
  
  const [name, setName] = useState('');
  const [amountMode, setAmountMode] = useState('SET');
  const [amountInput, setAmountInput] = useState('');
  const [currentAmount, setCurrentAmount] = useState(0);
  const [isEnabled, setIsEnabled] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [riskLevel, setRiskLevel] = useState(3);
  // Fiat always in Live mode
  const tradeMode = 'Live';
  
  // Current price & quantity states
  const [currentPriceMode, setCurrentPriceMode] = useState('SET');
  const [currentPriceInput, setCurrentPriceInput] = useState('');
  const [quantityMode, setQuantityMode] = useState('SET');
  const [quantityInput, setQuantityInput] = useState('');

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
    } else {
      setName('');
      setCurrentAmount(0);
      setAmountInput('');
      setAmountMode('SET');
      setIsEnabled(true);
      setRemarks('');
      setRiskLevel(3);
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

  const handleSave = () => {
    if (amountInput) {
      const formattedAmount = Math.round(finalAmount).toLocaleString('en-US').replace(/,/g, ' ') + '$';
      
      onSave({
        name,
        amount: formattedAmount,
        percent: asset?.percent || '0%',
        change: asset?.change || '0%',
        isNegative: asset?.isNegative || false,
        type: 'Fiat',
        isEnabled: isEnabled,
        remarks: remarks,
        riskLevel: riskLevel,
        tradeMode: 'Live'
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
            {isNewAsset ? 'Add Fiat' : `Edit ${name}`}
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

        {/* Risk & Trade Mode Card */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }} className="mb-4">Risk & trade mode</h2>

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