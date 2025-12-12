// Screen: DashboardScreen (screen_id: "dashboard")
//
// Назначение:
// - показывает сводку портфеля (Total holdings, Crypto, Stocks),
// - отображает торговую статистику (CAMPAIGNS / ORDERS / USDC),
// - содержит большой график с настройками (ChartSettingsSheet).
//
// API (домен Dashboard):
// - GET /api/dashboard/summary
//     Данные для блоков Total holdings, Crypto, Stocks.
// - GET /api/dashboard/trading_stats
//     Счётчики CAMPAIGNS / ORDERS и значения USDC free/locked.
// - GET /api/dashboard/chart
//     Точки для большого графика с учётом сохранённых настроек.
//
// Связанные компоненты:
// - ChartSettingsSheet → позволяет менять настройки графика и сохранять их через /api/chart/settings,
//   после чего DashboardScreen обновляет график через GET /api/dashboard/chart.

import { ChevronDown, MoreHorizontal } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useState } from "react";
import ChartSettingsSheet from "./ChartSettingsSheet";

interface DashboardScreenProps {
  currentScreen: string;
}

const SCREENS = ["finance", "dashboard", "orders"];

export default function DashboardScreen({ currentScreen }: DashboardScreenProps) {
  const { colors, theme, toggleTheme } = useTheme();
  const [expandedSections, setExpandedSections] = useState<{
    holdings: boolean;
    crypto: boolean;
    stocks: boolean;
  }>({
    holdings: false,
    crypto: false,
    stocks: false,
  });

  // Chart settings state
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  
  // Chart settings (локальное состояние):
  // - dataSource  → источник данных (Portfolio / Crypto / Stocks / конкретный аккаунт и т.п.)
  // - metric      → что показываем (Value / PnL / Balance и т.п.)
  // - timeRange   → диапазон (1m / 5m / 1h / 1d / и т.д.)
  //
  // TODO API (Chart settings + Dashboard chart):
  // Сейчас handleSaveChartSettings только сохраняет настройки локально
  // и закрывает шторку.
  //
  // После подключения API логика будет такой:
  // 1) ChartSettingsSheet вызывает PUT /api/chart/settings с newSettings.
  // 2) При успехе:
  //    - обновить локальный chartSettings,
  //    - перезапросить данные графика через GET /api/dashboard/chart,
  //    - при ошибках показать toast (error_code от /api/chart/settings).
  const [chartSettings, setChartSettings] = useState({
    dataSource: 'Portfolio',
    metric: 'Value',
    timeRange: '1m'
  });

  // NOTE: временный мок.
  // generateChartData() используется только до подключения реального бэкенда.
  // После интеграции данные для chartData должны приходить из GET /api/dashboard/chart.
  // Generate mock chart data based on settings
  const generateChartData = () => {
    const points = 40; // More points for smoother curve
    const data = [];
    const baseValue = 50;
    const trend = chartSettings.dataSource === 'Crypto' ? -0.6 : 1.0; // Crypto trending down, others up
    
    for (let i = 0; i < points; i++) {
      const randomVariation = (Math.random() - 0.5) * 6;
      const trendValue = trend * i;
      const sinWave = Math.sin(i / 5) * 3; // Add smooth wave
      const value = baseValue + trendValue + randomVariation + sinWave;
      data.push(Math.max(10, value)); // Ensure minimum value
    }
    
    return data;
  };

  const chartData = generateChartData();
  const isChartPositive = chartData[chartData.length - 1] > chartData[0];
  
  // Calculate chart metrics for axis labels
  const minValue = Math.min(...chartData);
  const maxValue = Math.max(...chartData);
  const yLabels = [
    Math.round(maxValue).toString(),
    Math.round((maxValue + minValue) / 2).toString(),
    Math.round(minValue).toString()
  ];
  
  // Create smooth curve path using Catmull-Rom spline for better smoothness
  const createSmoothPath = (data: number[]) => {
    if (data.length === 0) return '';
    
    const points = data.map((value, index) => {
      const x = 3 + (index / (data.length - 1)) * 94;
      const range = maxValue - minValue || 1;
      const y = 94 - ((value - minValue) / range) * 86;
      return { x, y };
    });

    if (points.length < 2) return `M ${points[0].x},${points[0].y}`;

    let path = `M ${points[0].x},${points[0].y}`;
    
    // Use Catmull-Rom spline for smoother curves
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];
      
      // Calculate control points for cubic bezier
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    
    return path;
  };
  
  const smoothPath = createSmoothPath(chartData);
  
  // X-axis labels based on time range
  const getXLabels = () => {
    const range = chartSettings.timeRange;
    
    // Minutes
    if (range === '1m') return ['0', '15s', '30s', '45s', '1m'];
    if (range === '5m') return ['0', '1', '2', '3', '4', '5'];
    if (range === '15m') return ['0', '3', '6', '9', '12', '15'];
    if (range === '30m') return ['0', '7.5', '15', '22.5', '30'];
    
    // Hours
    if (range === '1h') return ['0', '15', '30', '45', '60'];
    if (range === '2h') return ['0', '30m', '1h', '1.5h', '2h'];
    if (range === '4h') return ['0h', '1h', '2h', '3h', '4h'];
    if (range === '12h') return ['0h', '3h', '6h', '9h', '12h'];
    
    // Days
    if (range === '1d') return ['0', '6h', '12h', '18h', '24h'];
    if (range === '3d') return ['D1', 'D2', 'D3'];
    if (range === '7d') return ['Mon', 'Wed', 'Fri', 'Sun'];
    if (range === '14d') return ['W1', 'W2'];
    
    // Weeks
    if (range === '1w') return ['Mon', 'Wed', 'Fri', 'Sun'];
    if (range === '2w') return ['W1', 'W2'];
    if (range === '4w') return ['W1', 'W2', 'W3', 'W4'];
    if (range === '12w') return ['M1', 'M2', 'M3'];
    
    // Months
    if (range === '3m') return ['M1', 'M2', 'M3'];
    if (range === '6m') return ['M1', 'M3', 'M6'];
    if (range === '12m') return ['Q1', 'Q2', 'Q3', 'Q4'];
    
    // Years
    if (range === '1y') return ['Q1', 'Q2', 'Q3', 'Q4'];
    if (range === '3y') return ['Y1', 'Y2', 'Y3'];
    if (range === '5y') return ['Y1', 'Y2', 'Y3', 'Y4', 'Y5'];
    
    // All time
    if (range === 'All') return ['Start', 'Mid', 'End'];
    
    // Fallback
    return ['Start', 'Mid', 'End'];
  };
  
  const xLabels = getXLabels();

  // Get display name for time range
  const getTimeRangeDisplay = () => {
    const range = chartSettings.timeRange;
    const displayMap: Record<string, string> = {
      // Minutes
      '1m': '1 minute',
      '5m': '5 minutes',
      '15m': '15 minutes',
      '30m': '30 minutes',
      // Hours
      '1h': '1 hour',
      '2h': '2 hours',
      '4h': '4 hours',
      '12h': '12 hours',
      // Days
      '1d': '1 day',
      '3d': '3 days',
      '7d': '7 days',
      '14d': '14 days',
      // Weeks
      '1w': '1 week',
      '2w': '2 weeks',
      '4w': '4 weeks',
      '12w': '12 weeks',
      // Months
      '3m': '3 months',
      '6m': '6 months',
      '12m': '12 months',
      // Years
      '1y': '1 year',
      '3y': '3 years',
      '5y': '5 years',
      // All
      'All': 'All time'
    };
    return displayMap[range] || range;
  };

  const handleSaveChartSettings = (newSettings: { dataSource: string; metric: string; timeRange: string }) => {
    setChartSettings(newSettings);
    setIsChartModalOpen(false);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  
  // TODO API (Dashboard):
  // При первом монтировании DashboardScreen и при обновлении экрана:
  // - вызвать GET /api/dashboard/summary → обновить holdings/crypto/stocks,
  // - вызвать GET /api/dashboard/trading_stats → обновить блок CAMPAIGNS/ORDERS/USDC,
  // - вызвать GET /api/dashboard/chart → обновить chartData.
  // При ошибках запросов → показывать toast через useToast() с соответствующим error_code.
  
  // TODO API (Dashboard: summary):
  // Сейчас holdings/crypto/stocks — моковые данные.
  // Позже нужно подставлять реальный ответ GET /api/dashboard/summary.
  //
  // Ожидаемая структура (упрощённо):
  // {
  //   total_holdings: [
  //     { account_name, account_value, portfolio_share_pct, pnl_pct },
  //     ...
  //   ],
  //   crypto: [
  //     { asset_symbol, value, class_share_pct, trend },
  //     ...
  //   ],
  //   stocks: [
  //     { asset_symbol, value, class_share_pct, trend },
  //     ...
  //   ]
  // }
  //
  // Маппинг на локальные объекты:
  // - account_name      → holding.name
  // - account_value     → holding.amount
  // - portfolio_share_pct → holding.percent
  // - pnl_pct           → holding.change (+ isNegative по знаку)
  //
  // - asset_symbol      → crypto[i].name / stocks[i].name
  // - value             → .amount
  // - class_share_pct   → .percent
  // - trend             → .trend
  const holdings = [
    { name: "IBKR", amount: "1 500 000$", percent: "70%", change: "3%" },
    { name: "BINANCE", amount: "7 000$", percent: "70%", change: "-222%", isNegative: true },
    { name: "Revolut", amount: "50 500$", percent: "25%", change: "5%" },
    { name: "OTHER", amount: "-", percent: "-", change: "-" },
  ];

  const crypto = [
    { name: "USDC", amount: "450$", percent: "60%", trend: "⬆️" },
    { name: "BTC", amount: "333 605$", percent: "30%", trend: "↔️" },
    { name: "ETH", amount: "234 678$", percent: "35%", trend: "⬇️" },
    { name: "BNB", amount: "-", percent: "-", trend: "⬆️" },
    { name: "SOL", amount: "45 230$", percent: "15%", trend: "⬆️" },
    { name: "ADA", amount: "12 450$", percent: "8%", trend: "⬇️" },
    { name: "XRP", amount: "23 100$", percent: "12%", trend: "↔️" },
  ];

  const stocks = [
    { name: "VUAA", amount: "450$", percent: "60%", trend: "⬆️" },
    { name: "XUSE", amount: "333 605$", percent: "30%", trend: "↔️" },
    { name: "TR7A", amount: "234 678$", percent: "35%", trend: "⬇️" },
    { name: "IWDA", amount: "125 890$", percent: "22%", trend: "⬆️" },
    { name: "EQQQ", amount: "67 340$", percent: "18%", trend: "⬆️" },
    { name: "VWCE", amount: "89 120$", percent: "20%", trend: "↔️" },
  ];

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="pt-12 pb-2 px-4">
        {/* Screen Indicators */}
        <div className="flex justify-center items-center gap-2 mb-3">
          <div className="flex gap-2">
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
        </div>
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
        {/* Total Holdings Block */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="text-[20px] font-bold text-black">Total Holdings</div>
              <div className="text-[20px] font-bold text-black">1 500$</div>
            </div>
            <ChevronDown
              className="w-5 h-5 cursor-pointer text-black"
              onClick={() => toggleSection("holdings")}
            />
          </div>
          {expandedSections.holdings && (
            <div className="mt-3 flex justify-between">
              {/* Column 1: Names */}
              <div className="flex flex-col space-y-1">
                {holdings.map((holding) => (
                  <div key={holding.name} className="text-[20px] font-bold text-black">
                    {holding.name}
                  </div>
                ))}
              </div>
              
              {/* Column 2: Amounts */}
              <div className="flex flex-col space-y-1">
                {holdings.map((holding, index) => (
                  <div key={index} className="text-[20px] font-bold text-black font-normal">
                    {holding.amount}
                  </div>
                ))}
              </div>
              
              {/* Column 3: Percentages */}
              <div className="flex flex-col space-y-1">
                {holdings.map((holding, index) => (
                  <div key={index} className="text-[20px] font-bold text-black font-normal">
                    {holding.percent}
                  </div>
                ))}
              </div>
              
              {/* Column 4: Changes */}
              <div className="flex flex-col space-y-1">
                {holdings.map((holding, index) => (
                  <div
                    key={index}
                    className={`text-[20px] ${
                      holding.isNegative ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    {holding.change.replace('-', '')}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Crypto Summary Block */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="text-[20px] font-bold text-black">Crypto</div>
              <div className="text-[20px] font-bold text-black">649$</div>
            </div>
            <ChevronDown
              className="w-5 h-5 cursor-pointer text-black"
              onClick={() => toggleSection("crypto")}
            />
          </div>
          {expandedSections.crypto && (
            <div className="mt-3 flex justify-between">
              {/* Column 1: Names */}
              <div className="flex flex-col space-y-1">
                {crypto.map((coin) => (
                  <div key={coin.name} className="text-[20px] font-bold text-black">
                    {coin.name}
                  </div>
                ))}
              </div>
              
              {/* Column 2: Amounts */}
              <div className="flex flex-col space-y-1">
                {crypto.map((coin, index) => (
                  <div key={index} className="text-[20px] text-black">
                    {coin.amount}
                  </div>
                ))}
              </div>
              
              {/* Column 3: Percentages */}
              <div className="flex flex-col space-y-1">
                {crypto.map((coin, index) => (
                  <div key={index} className="text-[20px] text-black">
                    {coin.percent}
                  </div>
                ))}
              </div>
              
              {/* Column 4: Trends */}
              <div className="flex flex-col space-y-1">
                {crypto.map((coin, index) => (
                  <div key={index} className="text-[20px]">
                    {coin.trend}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stocks Summary Block */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="text-[20px] font-bold text-black">Stocks</div>
              <div className="text-[20px] font-bold text-black">850$</div>
            </div>
            <ChevronDown
              className="w-5 h-5 cursor-pointer text-black"
              onClick={() => toggleSection("stocks")}
            />
          </div>
          {expandedSections.stocks && (
            <div className="mt-3 flex justify-between">
              {/* Column 1: Names */}
              <div className="flex flex-col space-y-1">
                {stocks.map((stock) => (
                  <div key={stock.name} className="text-[20px] font-bold text-black">
                    {stock.name}
                  </div>
                ))}
              </div>
              
              {/* Column 2: Amounts */}
              <div className="flex flex-col space-y-1">
                {stocks.map((stock, index) => (
                  <div key={index} className="text-[20px] text-black">
                    {stock.amount}
                  </div>
                ))}
              </div>
              
              {/* Column 3: Percentages */}
              <div className="flex flex-col space-y-1">
                {stocks.map((stock, index) => (
                  <div key={index} className="text-[20px] text-black">
                    {stock.percent}
                  </div>
                ))}
              </div>
              
              {/* Column 4: Trends */}
              <div className="flex flex-col space-y-1">
                {stocks.map((stock, index) => (
                  <div key={index} className="text-[20px]">
                    {stock.trend}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Trading Stats Block */}
        {/* TODO API (Dashboard: trading_stats):
            Сейчас значения CAMPAIGNS/ORDERS/USDC захардкожены.
            Нужно будет подставлять данные из GET /api/dashboard/trading_stats.
            
            Ожидаемая структура (пример):
            {
              campaigns: { running, ready, stopped, draft },
              orders:    { filled, placed, cancelled, new },
              stablecoins: {
                usdc_free,
                usdc_locked
              }
            }
            
            Маппинг на UI:
            - CAMPAIGNS → campaigns.running / ready / stopped / draft
            - ORDERS    → orders.filled / placed / cancelled / new
            - USDC      → stablecoins.usdc_free (зелёный), stablecoins.usdc_locked (красный) */}
        <div className="bg-black rounded-lg p-4">
          <div className="grid" style={{ gridTemplateColumns: 'auto repeat(4, 1fr)', gap: '18px' }}>
            {/* Row 1: CAMPAIGNS */}
            <div className="text-[20px] text-[rgb(255,255,255)] font-bold">CAMPAIGNS</div>
            <div className="text-[20px] font-bold text-center" style={{ color: '#10b981' }}>2</div>
            <div className="text-[20px] font-bold text-center" style={{ color: '#3b82f6' }}>4</div>
            <div className="text-[20px] font-bold text-center" style={{ color: '#ef4444' }}>5</div>
            <div className="text-[20px] text-gray-400 font-bold text-center">0</div>
            
            {/* Row 2: ORDERS */}
            <div className="text-[20px] text-[rgb(255,255,255)] font-bold">ORDERS</div>
            <div className="text-[20px] font-bold text-center" style={{ color: '#10b981' }}>3</div>
            <div className="text-[20px] font-bold text-center" style={{ color: '#3b82f6' }}>5</div>
            <div className="text-[20px] font-bold text-center" style={{ color: '#ef4444' }}>6</div>
            <div className="text-[20px] text-gray-400 font-bold text-center">7</div>
            
            {/* Row 3: USDC */}
            <div className="text-[20px] text-[rgb(255,255,255)] font-bold">USDC</div>
            <div className="text-[20px] font-bold" style={{ color: '#10b981', gridColumn: 'span 2' }}>156$</div>
            <div className="text-[20px] font-bold" style={{ color: '#ef4444', gridColumn: 'span 2' }}>234$</div>
          </div>
        </div>

        {/* Main Chart Block */}
        <div className="mt-4 relative" style={{ paddingTop: '8px', paddingBottom: '24px' }}>
          {/* Chart Label and Chart Settings Button */}
          <div className="flex justify-between items-center mb-3">
            <div className="text-gray-400" style={{ fontSize: '14px' }}>
              {chartSettings.dataSource} · {chartSettings.metric} · {getTimeRangeDisplay()}
            </div>
            <button
              onClick={() => setIsChartModalOpen(true)}
              className="p-1.5 rounded-full hover:bg-gray-800 transition-colors"
              aria-label="Chart settings"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Chart SVG */}
          <div className="relative">
            {/* Y-axis labels (outside SVG for better positioning) */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between" style={{ width: '40px' }}>
              {yLabels.map((label, index) => (
                <div 
                  key={index} 
                  className="text-right pr-2"
                  style={{ 
                    fontSize: '10px', 
                    color: '#9A9A9A',
                    lineHeight: '10px'
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Main chart */}
            <svg 
              width="100%" 
              height="200" 
              viewBox="0 0 100 100" 
              preserveAspectRatio="none"
              style={{ display: 'block', paddingLeft: '45px' }}
            >
              {/* Y Axis */}
              <line x1="1" y1="2" x2="1" y2="96" stroke="white" strokeWidth="0.2" opacity="0.15" />
              
              {/* X Axis */}
              <line x1="1" y1="96" x2="99" y2="96" stroke="white" strokeWidth="0.2" opacity="0.15" />
              
              {/* Chart Line */}
              <path
                d={smoothPath}
                fill="none"
                stroke={isChartPositive ? '#10b981' : '#ef4444'}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* X-axis labels (outside SVG for better positioning) */}
            <div className="flex justify-around px-12 mt-1">
              {xLabels.map((label, index) => (
                <div 
                  key={index}
                  style={{ 
                    fontSize: '10px', 
                    color: '#9A9A9A'
                  }}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Settings Sheet */}
      <ChartSettingsSheet
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        currentSettings={chartSettings}
        onSave={handleSaveChartSettings}
      />
    </div>
  );
}