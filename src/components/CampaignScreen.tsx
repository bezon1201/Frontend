import { X, ChevronDown } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner@2.0.3";
import NumberInput from "./NumberInput";
import SegmentedControl from "./SegmentedControl";
import Slider from "./Slider";
import ConfirmRolloverSheet from "./ConfirmRolloverSheet";
import ConfirmStopSheet from "./ConfirmStopSheet";
import ConfirmStartCampaignSheet from "./ConfirmStartCampaignSheet";

// Screen: CampaignScreen (screen_id: "campaigns")
//
// Назначение:
// - экран Campaign setup для настройки одной DCA-кампании по конкретному Crypto-активу;
// - кампания всегда привязана к Crypto-активу (asset_id), symbol_code = ASSET.name + ASSET.quote_asset
//   (BTC + USDC → BTCUSDC);
// - режим Sim/Live читается из связанного актива (trade_mode) и здесь только отображается.
//
// Основные блоки:
// - Symbol          → выбор Crypto-актива и symbol_code кампании.
// - Budget & status → budget_value и is_enabled кампании.
// - Anchor settings → anchor_mode / anchor_price / anchor_offset_*.
// - Grid depth      → grid_depth_mode / grid_depth_value + coeff_up / coeff_range / coeff_down.
// - Levels          → num_levels (кол-во уровней сетки).
// - Allocation      → allocation_mode (Auto / Linear).
//
// API (домен Campaigns):
// - GET  /api/accounts/{account_id}/assets?asset_class=Crypto
//     Список Crypto-активов для дропдауна Symbol.
// - GET  /api/campaigns/{id}
//     Загрузка существующей кампании вместе с последней сеткой.
// - POST /api/campaigns
//     Создание новой кампании для выбранного asset_id.
// - PUT  /api/campaigns/{id}
//     Обновление конфигурации существующей кампании.
// - POST /api/campaigns/{id}/start
//     Старт кампании (создание первой сетки и постановка ордеров).
// - POST /api/campaigns/{id}/rollover
//     Rollover: закрыть текущую сетку, создать новую и выставить новые ордера.
// - POST /api/campaigns/{id}/stop
//     Полный стоп кампании и отмена активных ордеров.

interface CampaignScreenProps {
  onBack: () => void;
  isNew?: boolean;
}

// TODO API (Assets → Campaigns Symbol dropdown):
// Временный мок-список символов для прототипа UI.
// После подключения бэкенда список символов должен приходить из
// GET /api/accounts/{account_id}/assets?asset_class=Crypto
// с фильтрацией по is_enabled = true и маппингом:
// - ASSET.id              → asset_id кампании,
// - ASSET.name+quote_asset→ symbol_code (например BTC+USDC → BTCUSDC).
const CRYPTO_SYMBOLS = [
  { name: 'BTCUSDC', color: 'red' },
  { name: 'ETHUSDC', color: 'green' },
  { name: 'SOLUSDC', color: 'red' },
  { name: 'ADAUSDC', color: 'green' },
  { name: 'BNBUSDC', color: 'green' },
  { name: 'XRPUSDC', color: 'red' }
];

export default function CampaignScreen({ onBack, isNew = true }: CampaignScreenProps) {
  const { theme } = useTheme();
  
  // Symbol:
  // - в UI это выбранный символ кампании (BTCUSDC, ETHUSDC и т.п.);
  // - в данных кампании это пара полей:
  //     asset_id    — ссылка на Crypto-актив в таблице assets;
  //     symbol_code — строка для логов/отображения (ASSET.name + ASSET.quote_asset).
  //
  // Сейчас symbols/CRYPTO_SYMBOLS  мк-данные.
  // После интеграции с API:
  // - список символов нужно брать из GET /api/accounts/{account_id}/assets?asset_class=Crypto;
  // - selectedSymbol должен быть связан с выбранным asset_id и symbol_code кампании;
  // - при смене символа:
  //   * либо подгрузить существующую кампанию для этого asset_id (GET /api/campaigns/{id}),
  //   * либо подготовить пустой конфиг для создания новой кампании.
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDC');
  const [symbolDropdownOpen, setSymbolDropdownOpen] = useState(false);
  const symbols = ['BTCUSDC', 'ETHUSDC', 'SOLUSDC', 'ADAUSDC', 'BNBUSDC', 'XRPUSDC'];
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Budget & status:
  // - budget          → API: Campaign.budget_value (число в базовой валюте, например USDC);
  // - campaignEnabled → API: Campaign.is_enabled (ON/OFF как предохранитель).
  //
  // Логика на бэкенде:
  // - при Start/Rollover (POST /api/campaigns/{id}/start|rollover):
  //     если is_enabled = false → команда должна падать с ошибкой CAMPAIGN_DISABLED;
  // - при Stop (POST /api/campaigns/{id}/stop) можно автоматически сбрасывать is_enabled = false.
  const [budget, setBudget] = useState(isNew ? '' : '60');
  const [campaignEnabled, setCampaignEnabled] = useState(!isNew);

  // Anchor settings:
  // - anchorMode          → API: anchor_mode ("FIX" | "MA30" | "MA90" | "PRICE");
  // - anchorPrice         → API: anchor_price (используется для FIX; для PRICE цена берётся с рынка);
  // - anchorOffsetMode    → API: anchor_offset_mode ("Percent" | "Amount");
  // - anchorDirection     → API: anchor_offset_direction ("Below" | "Above");
  // - anchorOffset        → API: anchor_offset_value (число, передаётся строкой).
  //
  // currentPrice:
  // - текущее рыночное значение цены символа для режима anchor_mode = "PRICE";
  // - в реальной реализации должно приходить из отдельного рыночного API
  //   и использоваться только как подсказка; сама сетка считается на бэкенде.
  const [anchorMode, setAnchorMode] = useState('FIX');
  const [anchorPrice, setAnchorPrice] = useState(isNew ? '' : '87000');
  const [anchorOffsetMode, setAnchorOffsetMode] = useState('Percent');
  const [anchorDirection, setAnchorDirection] = useState('Below');
  const [anchorOffset, setAnchorOffset] = useState(isNew ? '' : '5');
  const [currentPrice] = useState('3 000'); // Current market price for PRICE mode

  // Grid depth & market profile:
  // - gridDepthMode → API: grid_depth_mode ("Auto" | "Manual");
  // - gridDepth     → API: grid_depth_value (строка, трактуется бэкендом как % или число шагов);
  // - coeffUp       → API: coeff_up    — коэффициент агрессивности для режима рынка "UP";
  // - coeffRange    → API: coeff_range — коэффициент для режима "RANGE";
  // - coeffDown     → API: coeff_down  — коэффициент для режима "DOWN".
  //
  // UI только отдаёт числовые строки; расчёт глубины сетки и распределения по режимам рынка лежит на бэкенде.
  const [gridDepthMode, setGridDepthMode] = useState('Auto');
  const [gridDepth, setGridDepth] = useState('10');
  const [coeffUp, setCoeffUp] = useState('4');
  const [coeffRange, setCoeffRange] = useState('2');
  const [coeffDown, setCoeffDown] = useState('1');

  // Levels:
  // - numLevels → API: num_levels — целое число уровней в сетке (и потенциальных лимит-ордеров).
  const [numLevels, setNumLevels] = useState(6);

  // Allocation:
  // - allocationMode → API: allocation_mode ("Auto" | "Linear"):
  //   * Auto   — бэкенд сам распределяет бюджет по уровням;
  //   * Linear — равные доли бюджета на каждый уровень.
  const [allocationMode, setAllocationMode] = useState('Auto');

  // Modals (bottom-sheets):
  // - isConfirmRolloverSheetOpen       → подтверждение команды Rollover (POST /api/campaigns/{id}/rollover);
  // - isConfirmStopSheetOpen           → подтверждение Stop (POST /api/campaigns/{id}/stop);
  // - isConfirmStartCampaignSheetOpen  → подтверждение Start/Apply changes (POST /api/campaigns/{id}/start).
  const [isConfirmRolloverSheetOpen, setIsConfirmRolloverSheetOpen] = useState(false);
  const [isConfirmStopSheetOpen, setIsConfirmStopSheetOpen] = useState(false);
  const [isConfirmStartCampaignSheetOpen, setIsConfirmStartCampaignSheetOpen] = useState(false);

  const showAnchorPrice = anchorMode === 'FIX' || anchorMode === 'PRICE';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSymbolDropdownOpen(false);
      }
    };

    if (symbolDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [symbolDropdownOpen]);

  // Handlers for Start / Rollover / Stop:
  //
  // TODO API (Campaigns – команды):
  // - handleConfirmStartCampaignAction:
  //     здесь нужно вызывать POST /api/campaigns/{campaign_id}/start,
  //     обрабатывать успешный ответ/ошибку (CAMPAIGN_DISABLED, CAMPAIGN_ALREADY_ACTIVE)
  //     и показывать toast по результату.
  // - handleConfirmRolloverAction:
  //     здесь нужно вызывать POST /api/campaigns/{campaign_id}/rollover,
  //     обновлять данные кампании/сеток и показывать toast по результату.
  // - handleConfirmStopAction:
  //     здесь нужно вызывать POST /api/campaigns/{campaign_id}/stop,
  //     обновлять статус кампании (Stopped) и показывать toast по результату.
  //
  // В текущей реализации хендлеры только показывают локальные toasts и не ходят в API.
  const handleRollover = () => {
    toast.success('Rollover кампании успешно выполнен!', {
      description: 'Кампания продлена на следующий период',
      duration: 2000,
    });
  };

  const handleStop = () => {
    toast.success('Кампания остановлена', {
      description: 'DCA кампания успешно остановлена',
      duration: 2000,
    });
  };

  const handleConfirmRolloverAction = () => {
    handleRollover();
    setIsConfirmRolloverSheetOpen(false);
  };

  const handleConfirmStopAction = () => {
    handleStop();
    setIsConfirmStopSheetOpen(false);
  };

  const handleStartCampaign = () => {
    toast.success('Кампания запущена', {
      description: 'DCA кампания успешно запущена',
      duration: 2000,
    });
  };

  const handleConfirmStartCampaignAction = () => {
    handleStartCampaign();
    setIsConfirmStartCampaignSheetOpen(false);
  };

  return (
    <div className="h-full w-full bg-black overflow-hidden flex flex-col">
      {/* Status bar */}
      <div className="h-12 flex items-center justify-center">
        <div 
          className="w-2 h-2 rounded-full" 
          style={{ backgroundColor: theme === 'green' ? '#10b981' : '#ef4444' }}
        />
      </div>

      {/* Scrollable content */}
      <div 
        className="flex-1 overflow-y-auto px-4 campaign-scrollable"
        data-scrollable="true"
        style={{ 
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'max(10rem, calc(env(safe-area-inset-bottom) + 8rem))'
        }}
      >
        <style>{`
          .campaign-scrollable::-webkit-scrollbar {
            display: none;
          }
          .campaign-scrollable {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
        `}</style>

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
        <div className="mb-6">
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }} className="text-white mb-1">
            Campaign setup
          </h1>
          <p className="text-gray-400" style={{ fontSize: '16px' }}>
            Configure and start a DCA campaign
          </p>
        </div>

        {/* Symbol Card */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }} className="mb-2">Symbol</h2>
          <p className="text-gray-600 mb-4" style={{ fontSize: '16px' }}>
            Select the trading pair for this campaign
          </p>
          <div className="flex items-center gap-3">
            <div className="relative flex-1" ref={dropdownRef}>
              <button
                onClick={() => setSymbolDropdownOpen(!symbolDropdownOpen)}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <span style={{ fontSize: '16px' }}>{selectedSymbol}</span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>
              {symbolDropdownOpen && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 z-10">
                  {symbols.map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => {
                        setSelectedSymbol(symbol);
                        setSymbolDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50"
                      style={{ fontSize: '16px' }}
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Color Indicator */}
            <div 
              className="w-6 h-6 rounded-full transition-all flex-shrink-0"
              style={{ 
                backgroundColor: CRYPTO_SYMBOLS.find(c => c.name === selectedSymbol)?.color === 'green' ? '#10b981' : '#ef4444' 
              }}
            />
          </div>
        </div>

        {/* Budget & Status Card */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }} className="mb-4">Budget & status</h2>
          
          <NumberInput
            label="Budget"
            value={budget}
            onChange={setBudget}
            placeholder="30"
            suffix="$"
            className="mb-6"
          />

          <div className="flex items-center justify-between">
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }} className="mb-1">
                Campaign enabled
              </div>
              <div className="text-gray-500" style={{ fontSize: '14px' }}>
                Enable or disable this campaign
              </div>
            </div>
            <button
              onClick={() => setCampaignEnabled(!campaignEnabled)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                campaignEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  campaignEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Anchor Settings Card */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }} className="mb-4">Anchor settings</h2>
          
          <div className="text-gray-600 mb-2" style={{ fontSize: '16px' }}>Anchor mode</div>
          <SegmentedControl
            options={['FIX', 'MA30', 'MA90', 'PRICE']}
            value={anchorMode}
            onChange={setAnchorMode}
            className="mb-4"
          />

          {anchorMode === 'FIX' && (
            <NumberInput
              label="Fixed anchor price"
              value={anchorPrice}
              onChange={setAnchorPrice}
              placeholder="e.g., 92000.00"
              suffix="$"
              className="mb-4"
            />
          )}

          {anchorMode === 'PRICE' && (
            <div className="mb-4">
              <div className="text-gray-600 mb-2" style={{ fontSize: '16px' }}>
                Current price
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={currentPrice}
                  disabled
                  className="w-full bg-gray-200 rounded-xl px-4 py-3 pr-12 outline-none text-gray-500 cursor-not-allowed"
                  style={{ fontSize: '16px' }}
                />
                <div 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  style={{ fontSize: '16px' }}
                >
                  $
                </div>
              </div>
            </div>
          )}

          {(anchorMode === 'MA30' || anchorMode === 'MA90' || anchorMode === 'PRICE') && (
            <>
              <div className="text-gray-600 mb-2" style={{ fontSize: '16px' }}>Anchor offset mode</div>
              <SegmentedControl
                options={['Percent', 'ABS']}
                value={anchorOffsetMode}
                onChange={setAnchorOffsetMode}
                className="mb-4"
              />

              <div className="text-gray-600 mb-2" style={{ fontSize: '16px' }}>Anchor offset</div>
              <div className="flex gap-2">
                <SegmentedControl
                  options={['Below', 'Above']}
                  value={anchorDirection}
                  onChange={setAnchorDirection}
                  className="flex-1"
                />
                <div className="flex-1 relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9.]*"
                    value={anchorOffset}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) {
                        setAnchorOffset(val);
                      }
                    }}
                    placeholder="5"
                    className="w-full bg-gray-50 rounded-xl px-4 py-3 pr-10 outline-none"
                    style={{ fontSize: '16px' }}
                  />
                  <div 
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                    style={{ fontSize: '16px' }}
                  >
                    {anchorOffsetMode === 'Percent' ? '%' : '$'}
                  </div>
                </div>
              </div>
              <p className="text-gray-500 mt-2" style={{ fontSize: '14px' }}>
                Offset from anchor price
              </p>
            </>
          )}
        </div>

        {/* Grid depth & market profile Card */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }} className="mb-4">
            Grid depth & market profile
          </h2>
          
          <div className="text-gray-600 mb-2" style={{ fontSize: '16px' }}>Grid depth mode</div>
          <SegmentedControl
            options={['Auto', 'Manual']}
            value={gridDepthMode}
            onChange={setGridDepthMode}
            className="mb-4"
          />

          {gridDepthMode === 'Manual' && (
            <NumberInput
              label="Depth"
              value={gridDepth}
              onChange={setGridDepth}
              placeholder="10"
              className="mb-4"
            />
          )}

          <div className="text-gray-600 mb-3" style={{ fontSize: '16px' }}>
            Market mode coefficients
          </div>
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <div className="text-center text-gray-500 mb-2" style={{ fontSize: '14px' }}>UP</div>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9.]*"
                value={coeffUp}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    setCoeffUp(val);
                  }
                }}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-center outline-none"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div className="flex-1">
              <div className="text-center text-gray-500 mb-2" style={{ fontSize: '14px' }}>RANGE</div>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9.]*"
                value={coeffRange}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    setCoeffRange(val);
                  }
                }}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-center outline-none"
                style={{ fontSize: '16px' }}
              />
            </div>
            <div className="flex-1">
              <div className="text-center text-gray-500 mb-2" style={{ fontSize: '14px' }}>DOWN</div>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9.]*"
                value={coeffDown}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    setCoeffDown(val);
                  }
                }}
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-center outline-none"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
          <p className="text-gray-500" style={{ fontSize: '14px' }}>
            Adjust aggressiveness for each market mode
          </p>
        </div>

        {/* Levels Card */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }} className="mb-4">Levels</h2>
          
          <div className="text-gray-600 mb-3" style={{ fontSize: '16px' }}>Number of levels</div>
          <div className="flex items-center gap-4 mb-2">
            <Slider
              value={numLevels}
              onChange={setNumLevels}
              min={2}
              max={15}
              className="flex-1"
            />
            <div style={{ fontSize: '20px', fontWeight: 'bold' }} className="w-8 text-right">
              {numLevels}
            </div>
          </div>
          <p className="text-gray-500" style={{ fontSize: '14px' }}>
            Choose how many grid levels to place
          </p>
        </div>

        {/* Allocation Card */}
        <div className="bg-white rounded-2xl p-6 mb-4">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }} className="mb-4">Allocation</h2>
          
          <div className="text-gray-600 mb-2" style={{ fontSize: '16px' }}>Allocation mode</div>
          <SegmentedControl
            options={['Auto', 'Linear']}
            value={allocationMode}
            onChange={setAllocationMode}
            className="mb-3"
          />
          <p className="text-gray-500" style={{ fontSize: '14px' }}>
            {allocationMode === 'Auto' 
              ? 'Auto: distribution based on strategy. Linear: equal allocation per level.'
              : 'Auto: distribution based on strategy. Linear: equal allocation per level.'}
          </p>
        </div>

        {/* Bottom buttons panel */}
        <div className="bg-black pb-8 pt-4">
          {/* TODO API (Campaigns – save config):
              Кнопка "Save changes" должна:
              - если кампания новая (isNew === true) →
                  вызвать POST /api/campaigns с телом:
                  {
                    asset_id,
                    budget_value,
                    is_enabled,
                    anchor_mode,
                    anchor_price,
                    anchor_offset_mode,
                    anchor_offset_direction,
                    anchor_offset_value,
                    grid_depth_mode,
                    grid_depth_value,
                    coeff_up,
                    coeff_range,
                    coeff_down,
                    num_levels,
                    allocation_mode
                  }
              - если кампания уже существует (isNew === false) →
                  вызвать PUT /api/campaigns/{campaign_id} с теми же полями (без asset_id).
              - по успешному ответу:
                  * обновить локальное состояние (например, снять флаг isNew),
                  * при необходимости сохранить/обновить campaign_id,
                  * показать toast об успешном сохранении.
              - при ошибке (VALIDATION_ERROR и др.):
                  * показать toast/alert по error_code.
          */}
          <button
            className="w-full text-white rounded-xl py-3 mb-3"
            style={{ 
              fontSize: '20px', 
              fontWeight: 'bold',
              backgroundColor: '#10b981'
            }}
            onClick={() => {
              toast.success('Изменения сохранены', {
                description: 'Настройки кампании успешно сохранены',
                duration: 2000,
              });
            }}
          >
            Save changes
          </button>
          <button
            className="w-full text-white rounded-xl py-3 mb-3"
            style={{ 
              fontSize: '20px', 
              fontWeight: 'bold',
              backgroundColor: '#3b82f6'
            }}
            onClick={() => setIsConfirmStartCampaignSheetOpen(true)}
          >
            {isNew ? 'Start campaign' : 'Apply changes'}
          </button>
          <div className="flex gap-3">
            <button
              className="flex-1 py-3 rounded-2xl bg-gray-400 text-white transition-all"
              style={{ fontSize: '16px', fontWeight: 'bold' }}
              onClick={() => setIsConfirmRolloverSheetOpen(true)}
            >
              Rollover
            </button>
            <button
              className="flex-1 py-3 rounded-2xl text-white transition-all"
              style={{ 
                fontSize: '16px', 
                fontWeight: 'bold',
                backgroundColor: '#ef4444'
              }}
              onClick={() => setIsConfirmStopSheetOpen(true)}
            >
              Stop
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Rollover Sheet */}
      <ConfirmRolloverSheet
        isOpen={isConfirmRolloverSheetOpen}
        onClose={() => setIsConfirmRolloverSheetOpen(false)}
        onConfirm={handleConfirmRolloverAction}
      />

      {/* Confirm Stop Sheet */}
      <ConfirmStopSheet
        isOpen={isConfirmStopSheetOpen}
        onClose={() => setIsConfirmStopSheetOpen(false)}
        onConfirm={handleConfirmStopAction}
      />

      {/* Confirm Start Campaign Sheet */}
      <ConfirmStartCampaignSheet
        isOpen={isConfirmStartCampaignSheetOpen}
        onClose={() => setIsConfirmStartCampaignSheetOpen(false)}
        onConfirm={handleConfirmStartCampaignAction}
        symbol={selectedSymbol}
        budget={budget}
        anchorMode={anchorMode}
        anchorPrice={anchorMode === 'PRICE' ? currentPrice : anchorPrice}
        anchorOffset={anchorOffset}
        anchorDirection={anchorDirection}
        anchorOffsetMode={anchorOffsetMode}
        gridDepthMode={gridDepthMode}
        numLevels={numLevels}
        allocationMode={allocationMode}
      />
    </div>
  );
}