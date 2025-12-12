import { X, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

// Screen: ReportsLogsScreen (screen_id: "reports_logs")
//
// Назначение:
// - единый экран с двумя табами: Reports и Logs;
// - Reports: сводные метрики по портфелю и кампаниям (карточки, топ-таблицы, PnL over time);
// - Logs: лента системных логов с фильтрами по категории/уровню и раскрытием деталей.
//
// API (согласно ApiOverview):
// - GET /api/reports/summary
//     Используется в табе Reports для загрузки:
//     * summary_cards (Total/Realized/Unrealized PnL, Win rate, ...),
//     * top_assets,
//     * top_campaigns.
// - GET /api/logs
//     Используется в табе Logs для загрузки ленты логов с фильтрами category/level/search.
// - GET /api/logs/{id}
//     Подробности одного лога (для LogDetailsSheet, связка с toasts и debug).
//
// В текущем прототипе:
// - все данные для Reports и Logs захардкожены (моки);
// - этот файл описывает тол��ко структуру UI и поведение фильтров;
// - интеграция с реальным API будет добавлена поверх через хуки (useReportsSummary/useLogsFeed).

interface ReportsLogsScreenProps {
  onClose: () => void;
}

type Tab = 'reports' | 'logs';
type LogLevel = 'all' | 'info' | 'warning' | 'error';
type LogCategory = 'all' | 'system' | 'orders' | 'campaigns' | 'cron' | 'errors';

// LogEntry:
// - тип одной строки ленты логов в табе Logs;
// - соответствует модели записи лога из GET /api/logs и GET /api/logs/{id}.
// Поля:
// - id         — уникальный идентификатор записи;
// - timestamp  — время события (ISO/строка, форматируется на фронте);
// - category   — домен события (system/orders/campaigns/cron/...);
// - level      — уровень (info/warning/error);
// - message    — короткое человекочитаемое описание;
// - context    — произвольный объект с деталями (payload, параметры ордера, и т.д.).
interface LogEntry {
  id: string;
  timestamp: string;
  category: Exclude<LogCategory, 'all'>;
  level: Exclude<LogLevel, 'all'>;
  message: string;
  context?: any;
}

// TODO API (Logs – mock data):
// Сейчас MOCK_LOGS — это локальный массив для отрисовки таба Logs без бэкенда.
// После интеграции с API:
// - список логов должен приходить из GET /api/logs с фильтрами (category/level/search);
// - LogEntry должен заполняться с сервера (id/timestamp/category/level/message/context);
// - для загрузки подробностей по записи нужно использовать GET /api/logs/{id},
//   а не хранить всё в одном массиве.
// Этот мок можно удалить после подключения реального источника.
const MOCK_LOGS: LogEntry[] = [
  {
    id: '1',
    timestamp: '2025-12-12 13:05',
    category: 'orders',
    level: 'info',
    message: 'BTC buy order executed at 42150',
    context: { amount: 0.05, price: 42150, total: 2107.5 }
  },
  {
    id: '2',
    timestamp: '2025-12-12 12:45',
    category: 'campaigns',
    level: 'warning',
    message: 'Campaign budget threshold reached (80%)',
    context: { campaignId: 'camp_123', budgetUsed: 48, budgetTotal: 60 }
  },
  {
    id: '3',
    timestamp: '2025-12-12 12:30',
    category: 'system',
    level: 'error',
    message: 'Failed to connect to exchange API',
    context: { exchange: 'Binance', error: 'Connection timeout' }
  },
  {
    id: '4',
    timestamp: '2025-12-12 12:15',
    category: 'cron',
    level: 'info',
    message: 'Metrics Snapshot job completed successfully',
    context: { duration: 1234, recordsProcessed: 456 }
  }
];

export default function ReportsLogsScreen({ onClose }: ReportsLogsScreenProps) {
  // activeTab:
  // - переключает между табами:
  //     'reports' → таб Reports (работает с GET /api/reports/summary),
  //     'logs'    → таб Logs (работает с GET /api/logs и GET /api/logs/{id}).
  const [activeTab, setActiveTab] = useState<Tab>('reports');

  // selectedRange:
  // - текущий выбранный диапазон для карточки "PnL over time" на табе Reports;
  // - в прототипе используется только для UI (подсветка кнопок);
  // - при интеграции с бэкендом должен быть замаплен на параметр ?period=
  //   в запросе GET /api/reports/summary (например, '1D' → 'today', '1W' → '7d', '1M' → '30d', 'ALL' → 'all').
  const [selectedRange, setSelectedRange] = useState<'1D' | '1W' | '1M' | 'ALL'>('1W');
  
  // Logs state:
  // - logCategory/logLevel — фильтры по категории и уровню для таба Logs;
  // - expandedLogId        — id раскрытой записи (для показа деталей);
  // - *_DropdownOpen       — локальное состояние дропдаунов фильтров.
  // В текущей реализации фильтры применяются к MOCK_LOGS на фронте.
  // После интеграции с API значения фильтров должны уходить в параметры GET /api/logs.
  const [logCategory, setLogCategory] = useState<LogCategory>('all');
  const [logLevel, setLogLevel] = useState<LogLevel>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [levelDropdownOpen, setLevelDropdownOpen] = useState(false);
  
  const categoryRef = useRef<HTMLDivElement>(null);
  const levelRef = useRef<HTMLDivElement>(null);

  // UI-only logic: закрытие дропдаунов фильтров по клику вне компонентов.
  // На API не влияет, используется только для UX таба Logs.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (levelRef.current && !levelRef.current.contains(event.target as Node)) {
        setLevelDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // TODO API (Logs – фильтры):
  // Сейчас фильтрация по категории/уровню выполняется только на фронте
  // поверх MOCK_LOGS. После подключения API логика должна быть такой:
  //
  // - при изменении logCategory/logLevel:
  //     * триггерить загрузку логов из GET /api/logs
  //       с параметрами ?category=&level=&search=...
  //     * сервер возвращает уже отфильтрованный список LogEntry;
  // - filteredLogs будет формироваться из данных, полученных с бэкенда;
  // - MOCK_LOGS уйдёт из кода.
  const filteredLogs = MOCK_LOGS.filter(log => {
    if (logCategory !== 'all' && log.category !== logCategory) return false;
    if (logLevel !== 'all' && log.level !== logLevel) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 h-full w-full bg-black overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-8 pb-4">
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
          Reports & Logs
        </h1>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X size={24} color="white" />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-6 pb-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('reports')}
            className="relative pb-3 transition-colors"
          >
            <span 
              style={{ 
                fontSize: '20px', 
                fontWeight: 'bold',
                color: activeTab === 'reports' ? 'white' : '#858585'
              }}
            >
              Reports
            </span>
            {activeTab === 'reports' && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"
                style={{ backgroundColor: '#10b981' }}
              />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('logs')}
            className="relative pb-3 transition-colors"
          >
            <span 
              style={{ 
                fontSize: '20px', 
                fontWeight: 'bold',
                color: activeTab === 'logs' ? 'white' : '#858585'
              }}
            >
              Logs
            </span>
            {activeTab === 'logs' && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-500"
                style={{ backgroundColor: '#10b981' }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="h-full overflow-y-auto pb-48" data-scrollable="true">
        {activeTab === 'reports' ? (
          <div className="px-6 pt-4 space-y-4">
            {/* Portfolio Summary */}
            <PortfolioSummaryCard />
            
            {/* Top Movers */}
            <TopMoversCard />
            
            {/* PnL over time */}
            <PnLOverTimeCard 
              selectedRange={selectedRange}
              onRangeChange={setSelectedRange}
            />
            
            {/* Asset Allocation */}
            <AssetAllocationCard />
            
            {/* Crypto vs Stocks */}
            <CryptoVsStocksCard />
          </div>
        ) : (
          <div className="px-6 pt-4">
            {/* Filters */}
            <div className="flex gap-3 mb-4">
              {/* Category Filter */}
              <div className="flex-1 relative" ref={categoryRef}>
                <button
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  className="w-full bg-white rounded-xl px-4 py-3 flex items-center justify-between border-2 border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <span style={{ fontSize: '16px', color: 'black' }}>
                    {logCategory === 'all' ? 'All Categories' : logCategory.charAt(0).toUpperCase() + logCategory.slice(1)}
                  </span>
                  <ChevronDown size={20} className={`transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {categoryDropdownOpen && (
                  <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
                    {(['all', 'system', 'orders', 'campaigns', 'cron', 'errors'] as LogCategory[]).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setLogCategory(cat);
                          setCategoryDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50"
                        style={{ fontSize: '16px' }}
                      >
                        {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Level Filter */}
              <div className="flex-1 relative" ref={levelRef}>
                <button
                  onClick={() => setLevelDropdownOpen(!levelDropdownOpen)}
                  className="w-full bg-white rounded-xl px-4 py-3 flex items-center justify-between border-2 border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <span style={{ fontSize: '16px', color: 'black' }}>
                    {logLevel === 'all' ? 'All Levels' : logLevel.charAt(0).toUpperCase() + logLevel.slice(1)}
                  </span>
                  <ChevronDown size={20} className={`transition-transform ${levelDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {levelDropdownOpen && (
                  <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
                    {(['all', 'info', 'warning', 'error'] as LogLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => {
                          setLogLevel(level);
                          setLevelDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50"
                        style={{ fontSize: '16px' }}
                      >
                        {level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Logs List */}
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-24">
                <div className="text-6xl mb-4">🗒️</div>
                <div style={{ fontSize: '16px', color: '#777' }}>
                  No logs yet
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <LogCard
                    key={log.id}
                    log={log}
                    isExpanded={expandedLogId === log.id}
                    onToggle={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Portfolio Summary Card
// - визуальная карточка сводных метрик портфеля (Total PnL, изменение за период и мини-график);
// - сейчас все значения захардкожены в UI;
// - после интеграции с API данные должны приходить из GET /api/reports/summary:
//     * одна из summary_cards с ключом, например "total_pnl" или "portfolio_summary"
//       → value, delta_value, trend и т.п.
// - этот компонент должен стать чистым отображением данных, без собственной логики.
function PortfolioSummaryCard() {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm">
      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>
        Portfolio Summary
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#000' }}>
            $12,458.32
          </div>
          <div style={{ fontSize: '14px', color: '#2ECC71', marginTop: '4px' }}>
            +$342.18 (+2.82%)
          </div>
        </div>
        <div className="w-24 h-16">
          <MiniSparkline positive />
        </div>
      </div>
    </div>
  );
}

// Top Movers Card
// - показывает список активов с наибольшим вкладом в результат за выбранный период;
// - сейчас список movers захардкожен (мок-данные);
// - после интеграции с API:
//     * данные должны приходить из секции top_assets в GET /api/reports/summary
//       (например, первые N записей);
//     * поля asset/change/contribution должны соответствовать ReportTopAsset.
function TopMoversCard() {
  const movers = [
    { asset: 'BTC', change: '+5%', contribution: '+3.2%', positive: true },
    { asset: 'ETH', change: '-2%', contribution: '-0.7%', positive: false },
    { asset: 'SOL', change: '+8%', contribution: '+1.5%', positive: true }
  ];

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm">
      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>
        Top Movers
      </div>
      <div className="space-y-2">
        {movers.map((mover) => (
          <div key={mover.asset} className="flex items-center justify-between py-2">
            <div style={{ fontSize: '16px', fontWeight: 'bold', width: '60px' }}>
              {mover.asset}
            </div>
            <div 
              style={{ 
                fontSize: '16px', 
                fontWeight: 'bold',
                color: mover.positive ? '#2ECC71' : '#E74C3C',
                width: '60px',
                textAlign: 'center'
              }}
            >
              {mover.change}
            </div>
            <div 
              style={{ 
                fontSize: '16px',
                color: mover.positive ? '#2ECC71' : '#E74C3C',
                width: '80px',
                textAlign: 'right'
              }}
            >
              {mover.contribution}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// PnL over Time Card
// - карточка с графиком PnL по времени для выбранного диапазона;
// - selectedRange / onRangeChange управляются на уровне ReportsLogsScreen;
// - сейчас график и значения — заглушка (LargeSparkline с фиксированными точками).
//
// TODO API (Reports – time series):
// - после интеграции с бэкендом данные для этой карточки должны приходить из
//   GET /api/reports/summary с параметром ?period=... или из отдельного эндпоинта
//   (например GET /api/reports/pnl_series);
// - selectedRange должен мапиться на период запроса (1D/1W/1M/ALL);
// - LargeSparkline должен строиться по реальной серии точек.
function PnLOverTimeCard({ selectedRange, onRangeChange }: { 
  selectedRange: '1D' | '1W' | '1M' | 'ALL';
  onRangeChange: (range: '1D' | '1W' | '1M' | 'ALL') => void;
}) {
  const ranges: ('1D' | '1W' | '1M' | 'ALL')[] = ['1D', '1W', '1M', 'ALL'];

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
          PnL over time
        </div>
        <div className="flex gap-2">
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => onRangeChange(range)}
              className="px-3 py-1 rounded-lg transition-colors"
              style={{
                fontSize: '12px',
                fontWeight: 'bold',
                backgroundColor: selectedRange === range ? '#10b981' : '#f3f4f6',
                color: selectedRange === range ? 'white' : '#6b7280'
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      <div className="h-32 mb-3">
        <LargeSparkline />
      </div>
      <div className="text-right" style={{ fontSize: '20px', fontWeight: 'bold', color: '#2ECC71' }}>
        +12.4%
      </div>
    </div>
  );
}

// Asset Allocation Card
// - показывает распределение портфеля по классам активов (Crypto / Stocks / Cash ...);
// - массив allocations сейчас захардкожен;
// - после интеграции с API значения должны приходить из GET /api/reports/summary
//   (например, отдельный блок allocation в ответе).
function AssetAllocationCard() {
  const allocations = [
    { name: 'Crypto', percentage: 65, color: '#10b981' },
    { name: 'Stocks', percentage: 30, color: '#3b82f6' },
    { name: 'Cash', percentage: 5, color: '#6b7280' }
  ];

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm">
      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>
        Asset Allocation
      </div>
      <div className="flex items-center gap-6">
        {/* Pie Chart Placeholder */}
        <div className="w-28 h-28 rounded-full border-8 flex-shrink-0" style={{
          borderColor: '#10b981',
          borderTopColor: '#3b82f6',
          borderRightColor: '#3b82f6',
          borderBottomColor: '#6b7280',
          transform: 'rotate(-90deg)'
        }} />
        
        {/* Legend */}
        <div className="space-y-3 flex-1">
          {allocations.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span style={{ fontSize: '16px', color: '#333' }}>
                  {item.name}
                </span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#000' }}>
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Crypto vs Stocks Card
// - сравнение динамики и результата по Crypto и Stocks за выбранный период;
// - сейчас проценты и графики — статические заглушки (MiniSparkline с фиксированными точками).
//
// TODO API (Reports – segment comparison):
// - после интеграции с API данные должны подтягиваться из GET /api/reports/summary
//   или отдельного эндпоинта (например /api/reports/segments);
// - компонент должен отображать реальные значения PnL/percent для crypto/stocks.
function CryptoVsStocksCard() {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm">
      <div className="grid grid-cols-2 gap-4">
        {/* Crypto */}
        <div className="pr-4 border-r border-gray-200">
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
            Crypto
          </div>
          <div className="h-16 mb-3">
            <MiniSparkline positive />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2ECC71' }}>
            +12%
          </div>
        </div>
        
        {/* Stocks */}
        <div className="pl-4">
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
            Stocks
          </div>
          <div className="h-16 mb-3">
            <MiniSparkline positive />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2ECC71' }}>
            +3%
          </div>
        </div>
      </div>
    </div>
  );
}

// Log Card Component
function LogCard({ log, isExpanded, onToggle }: { 
  log: LogEntry; 
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const getIconColor = () => {
    switch (log.level) {
      case 'info': return '#3498DB';
      case 'warning': return '#F39C12';
      case 'error': return '#E74C3C';
    }
  };

  const getIcon = () => {
    switch (log.level) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
    }
  };

  return (
    <div 
      className="bg-white rounded-2xl p-4 shadow-sm cursor-pointer transition-all"
      onClick={onToggle}
    >
      <div className="flex gap-3">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: getIconColor() + '20' }}
        >
          <span style={{ fontSize: '16px' }}>{getIcon()}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <span style={{ fontSize: '14px', color: '#666' }}>
              {log.timestamp}
            </span>
            <span 
              className="px-2 py-0.5 rounded text-xs"
              style={{ 
                backgroundColor: getIconColor() + '20',
                color: getIconColor(),
                fontSize: '12px'
              }}
            >
              {log.category}
            </span>
          </div>
          
          <div style={{ fontSize: '16px', color: '#000', marginBottom: '4px' }}>
            {log.message}
          </div>
          
          {isExpanded && log.context && (
            <div 
              className="mt-3 p-3 rounded-lg overflow-x-auto"
              style={{ 
                backgroundColor: '#f3f4f6',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#374151'
              }}
            >
              <pre>{JSON.stringify(log.context, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// MiniSparkline:
// - маленький декоративный график для карточек Summary/TopMovers;
// - сейчас использует фиксированный набор точек и только меняет цвет по флагу positive;
// - при желании в будущем можно подставлять реальную мини-серию из API.
function MiniSparkline({ positive }: { positive: boolean }) {
  const color = positive ? '#2ECC71' : '#E74C3C';
  
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="none">
      <polyline
        points="0,50 20,40 40,45 60,30 80,35 100,20"
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// Large Sparkline Component
// - декоративный "большой" график с градиентной заливкой;
// - используется внутри PnLOverTimeCard;
// - в прототипе точки захардкожены, позже должны строиться по данным отчёта.
function LargeSparkline() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="none">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <polyline
        points="0,50 10,45 20,40 30,42 40,35 50,30 60,28 70,25 80,22 90,20 100,15"
        fill="url(#gradient)"
        stroke="none"
      />
      <polyline
        points="0,50 10,45 20,40 30,42 40,35 50,30 60,28 70,25 80,22 90,20 100,15"
        fill="none"
        stroke="#10b981"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}