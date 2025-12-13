import { X, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { 
  getLogs, 
  LogEntry, 
  LogsResponse, 
  getGlobalConfig, 
  GlobalConfigResponse,
  getReportsSummary,
  ReportsSummaryResponse,
  ReportPeriod,
  ReportSummaryCard,
  ReportTopAsset,
  ReportTopCampaign
} from "../services/api";
import { useDataSource } from "../context/DataSourceContext";
import { formatLogTimestamp, formatUTC } from "../utils/dateFormatter";

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
// - этот файл описывает толко структуру UI и поведение фильтров;
// - интеграция с реальным API будет добавлена поверх через хуки (useReportsSummary/useLogsFeed).

interface ReportsLogsScreenProps {
  onClose: () => void;
}

type Tab = 'reports' | 'logs';
type LogLevel = 'all' | 'info' | 'warning' | 'error';
type LogCategory = 'all' | 'system' | 'orders' | 'campaigns' | 'cron' | 'errors';

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
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    category: 'orders',
    level: 'info',
    message: 'BTC buy order executed at 42150',
    context: { amount: 0.05, price: 42150, total: 2107.5 }
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    category: 'campaigns',
    level: 'warning',
    message: 'Campaign budget threshold reached (80%)',
    context: { campaignId: 'camp_123', budgetUsed: 48, budgetTotal: 60 }
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    category: 'system',
    level: 'error',
    message: 'Failed to connect to exchange API',
    context: { exchange: 'Binance', error: 'Connection timeout' }
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    category: 'cron',
    level: 'info',
    message: 'Metrics Snapshot job completed successfully',
    context: { duration: 1234, recordsProcessed: 456 }
  }
];

export default function ReportsLogsScreen({ onClose }: ReportsLogsScreenProps) {
  const { mode } = useDataSource();
  
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
  const [logCategory, setLogCategory] = useState<LogCategory>('all');
  const [logLevel, setLogLevel] = useState<LogLevel>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [levelDropdownOpen, setLevelDropdownOpen] = useState(false);
  
  // API state for logs
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  
  // Global config for auto-refresh
  const [globalConfig, setGlobalConfig] = useState<GlobalConfigResponse>({});
  
  // API state for reports
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('30d');
  const [reportsData, setReportsData] = useState<ReportsSummaryResponse | null>(null);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  
  const categoryRef = useRef<HTMLDivElement>(null);
  const levelRef = useRef<HTMLDivElement>(null);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load global config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      if (mode === 'API') {
        try {
          const config = await getGlobalConfig();
          setGlobalConfig(config);
        } catch (error) {
          console.error('Failed to load global config:', error);
        }
      }
    };
    fetchConfig();
  }, [mode]);

  // Parse auto-refresh interval from config
  const getRefreshInterval = (): number | null => {
    if (!globalConfig.auto_refresh || globalConfig.auto_refresh === 'Off') {
      return null;
    }

    const value = globalConfig.auto_refresh;
    
    // Parse "5 seconds", "15 seconds", etc.
    if (typeof value === 'string') {
      const match = value.match(/(\d+)\s*second/i);
      if (match) {
        const seconds = parseInt(match[1]);
        // Minimum 30 seconds for Logs (requirement)
        return Math.max(seconds * 1000, 30000);
      }
    }
    
    // If numeric, treat as seconds
    if (typeof value === 'number') {
      // Minimum 30 seconds for Logs (requirement)
      return Math.max(value * 1000, 30000);
    }
    
    return null;
  };

  // Load logs from API or MOCK
  const loadLogs = async (options?: { append?: boolean; cursor?: string }) => {
    if (mode === 'MOCK') {
      // MOCK mode: use mock data
      setLogs(MOCK_LOGS);
      setNextCursor(null);
      setHasMore(false);
      return;
    }

    // API mode: fetch from API
    setIsLoadingLogs(true);
    try {
      const response = await getLogs({
        category: logCategory !== 'all' ? logCategory : undefined,
        level: logLevel !== 'all' ? logLevel : undefined,
        limit: 50,
        cursor: options?.cursor,
      });

      if (options?.append) {
        setLogs((prev) => [...prev, ...response.items]);
      } else {
        setLogs(response.items);
      }

      setNextCursor(response.next_cursor);
      setHasMore(response.has_more);
    } catch (error) {
      console.error('Failed to load logs:', error);
      setLogs([]);
      setNextCursor(null);
      setHasMore(false);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Load logs when tab opens or filters change
  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab, logCategory, logLevel, mode]);

  // Load more logs (pagination)
  const loadMore = () => {
    if (hasMore && nextCursor && !isLoadingLogs) {
      loadLogs({ append: true, cursor: nextCursor });
    }
  };

  // Force refresh logs
  const refreshLogs = () => {
    loadLogs();
  };

  // Load reports from API or MOCK
  const loadReports = async () => {
    if (mode === 'MOCK') {
      // MOCK mode: don't fetch, use hardcoded UI
      setReportsData(null);
      return;
    }

    // API mode: fetch from API
    setIsLoadingReports(true);
    try {
      const response = await getReportsSummary(selectedPeriod);
      setReportsData(response);
    } catch (error) {
      console.error('Failed to load reports:', error);
      setReportsData(null);
    } finally {
      setIsLoadingReports(false);
    }
  };

  // Load reports when tab opens or period changes
  useEffect(() => {
    if (activeTab === 'reports') {
      loadReports();
    }
  }, [activeTab, selectedPeriod, mode]);

  // Force refresh reports
  const refreshReports = () => {
    loadReports();
  };

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

  // Auto-refresh logs based on global config
  useEffect(() => {
    const interval = getRefreshInterval();
    if (interval && activeTab === 'logs') {
      const timer = setInterval(refreshLogs, interval);
      autoRefreshTimerRef.current = timer;
    } else {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
    }

    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
    };
  }, [activeTab, logCategory, logLevel, mode, globalConfig]);

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
          <div className="px-6 pt-4">
            {/* Period Selector + Update Button */}
            <div className="flex items-center justify-between mb-4">
              {/* Period Selector */}
              <div className="flex gap-2">
                {([
                  { key: 'today' as ReportPeriod, label: 'Today' },
                  { key: '7d' as ReportPeriod, label: '7d' },
                  { key: '30d' as ReportPeriod, label: '30d' },
                  { key: 'ytd' as ReportPeriod, label: 'YTD' },
                  { key: 'all' as ReportPeriod, label: 'All time' },
                ]).map((period) => (
                  <button
                    key={period.key}
                    onClick={() => setSelectedPeriod(period.key)}
                    className="px-4 py-2 rounded-xl transition-colors"
                    style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      backgroundColor: selectedPeriod === period.key ? '#10b981' : '#f3f4f6',
                      color: selectedPeriod === period.key ? 'white' : '#6b7280',
                    }}
                    disabled={isLoadingReports}
                  >
                    {period.label}
                  </button>
                ))}
              </div>

              {/* Update Button (только в API mode) */}
              {mode === 'API' && (
                <button
                  onClick={refreshReports}
                  disabled={isLoadingReports}
                  className="px-6 py-2 rounded-xl flex items-center justify-center transition-colors"
                  style={{
                    fontSize: '14px',
                    fontWeight: 'bold',
                    backgroundColor: isLoadingReports ? '#d1d5db' : '#10b981',
                    color: 'white',
                    cursor: isLoadingReports ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isLoadingReports ? '...' : 'Update'}
                </button>
              )}
            </div>

            {/* Updated timestamp (только если есть данные из API) */}
            {mode === 'API' && reportsData && reportsData.generated_at && (
              <div className="mb-4 text-center" style={{ fontSize: '12px', color: '#999' }}>
                Updated {formatLogTimestamp(reportsData.generated_at)}
              </div>
            )}

            {/* Loading State */}
            {isLoadingReports && !reportsData ? (
              <div className="flex flex-col items-center justify-center pt-24">
                <div className="text-6xl mb-4">⏳</div>
                <div style={{ fontSize: '16px', color: '#777' }}>
                  Loading reports...
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Cards (grid) */}
                {mode === 'API' && reportsData ? (
                  <SummaryCardsGrid cards={reportsData.summary_cards} />
                ) : (
                  /* MOCK mode - show placeholder */
                  <PortfolioSummaryCard />
                )}
                
                {/* Top Assets */}
                {mode === 'API' && reportsData ? (
                  <TopAssetsCard assets={reportsData.top_assets} />
                ) : (
                  /* MOCK mode - show placeholder */
                  <TopMoversCard />
                )}
                
                {/* Top Campaigns */}
                {mode === 'API' && reportsData && reportsData.top_campaigns.length > 0 && (
                  <TopCampaignsCard campaigns={reportsData.top_campaigns} />
                )}
                
                {/* MOCK mode only cards */}
                {mode === 'MOCK' && (
                  <>
                    <PnLOverTimeCard 
                      selectedRange={selectedRange}
                      onRangeChange={setSelectedRange}
                    />
                    <AssetAllocationCard />
                    <CryptoVsStocksCard />
                  </>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="px-6 pt-4">
            {/* Filters + Update Button */}
            <div className="flex gap-3 mb-4">
              {/* Category Filter */}
              <div className="flex-1 relative" ref={categoryRef}>
                <button
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  className="w-full bg-white rounded-xl px-4 py-3 flex items-center justify-between border-2 border-gray-200 hover:border-gray-300 transition-colors"
                  disabled={isLoadingLogs}
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
                  disabled={isLoadingLogs}
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

              {/* Update Button (только в API mode) */}
              {mode === 'API' && (
                <button
                  onClick={refreshLogs}
                  disabled={isLoadingLogs}
                  className="px-6 py-3 rounded-xl flex items-center justify-center transition-colors"
                  style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    backgroundColor: isLoadingLogs ? '#d1d5db' : '#10b981',
                    color: 'white',
                    cursor: isLoadingLogs ? 'not-allowed' : 'pointer',
                    minWidth: '100px'
                  }}
                >
                  {isLoadingLogs ? '...' : 'Update'}
                </button>
              )}
            </div>

            {/* Loading State */}
            {isLoadingLogs && logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center pt-24">
                <div className="text-6xl mb-4">⏳</div>
                <div style={{ fontSize: '16px', color: '#777' }}>
                  Loading logs...
                </div>
              </div>
            ) : logs.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center pt-24">
                <div className="text-6xl mb-4">🗒️</div>
                <div style={{ fontSize: '16px', color: '#777' }}>
                  No logs yet
                </div>
              </div>
            ) : (
              /* Logs List */
              <>
                <div className="space-y-4">
                  {logs.map((log) => (
                    <LogCard
                      key={log.id}
                      log={log}
                      isExpanded={expandedLogId === log.id}
                      onToggle={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                    />
                  ))}
                </div>

                {/* Load More Button (pagination) */}
                {hasMore && mode === 'API' && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={loadMore}
                      disabled={isLoadingLogs}
                      className="px-6 py-3 rounded-xl border-2 border-gray-200 transition-colors hover:border-gray-300"
                      style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: isLoadingLogs ? '#d1d5db' : '#333',
                        cursor: isLoadingLogs ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isLoadingLogs ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
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
              {formatLogTimestamp(log.timestamp)}
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
          
          {isExpanded && (
            <>
              {/* UTC Timestamp (in expanded state) */}
              <div 
                style={{ 
                  fontSize: '12px', 
                  color: '#999',
                  marginTop: '8px',
                  marginBottom: '8px'
                }}
              >
                {formatUTC(log.timestamp)}
              </div>

              {/* Context Details */}
              {log.context && (
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
            </>
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

// Summary Cards Grid Component
function SummaryCardsGrid({ cards }: { cards: ReportSummaryCard[] }) {
  if (cards.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-5 shadow-sm text-center" style={{ fontSize: '16px', color: '#999' }}>
        No data for selected period
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map((card) => {
        const isPositive = card.trend === 'up';
        const color = card.color === 'green' ? '#2ECC71' : card.color === 'red' ? '#E74C3C' : '#6b7280';
        
        return (
          <div key={card.card_key} className="bg-white rounded-3xl p-5 shadow-sm">
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#666', marginBottom: '8px' }}>
              {card.title}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#000' }}>
                  {card.value_formatted || card.value}
                </div>
                {card.delta_percent && (
                  <div style={{ fontSize: '12px', color: color, marginTop: '4px' }}>
                    {card.delta_percent}
                  </div>
                )}
              </div>
              {card.trend && (
                <div className="w-16 h-12">
                  <MiniSparkline positive={isPositive} />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Top Assets Card Component
function TopAssetsCard({ assets }: { assets: ReportTopAsset[] }) {
  if (assets.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-5 shadow-sm">
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>
          Top Assets
        </div>
        <div className="text-center py-8" style={{ fontSize: '14px', color: '#999' }}>
          No data for selected period
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm">
      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>
        Top Assets
      </div>
      <div className="space-y-2">
        {assets.map((asset) => {
          const isPositive = asset.pnl >= 0;
          const color = isPositive ? '#2ECC71' : '#E74C3C';
          
          return (
            <div key={asset.asset} className="flex items-center justify-between py-2">
              <div style={{ fontSize: '16px', fontWeight: 'bold', flex: 1 }}>
                {asset.asset}
              </div>
              <div 
                style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: color,
                  flex: 1,
                  textAlign: 'center'
                }}
              >
                {asset.pnl_formatted || `${isPositive ? '+' : ''}${asset.pnl.toFixed(2)}`}
              </div>
              {asset.pnl_percent !== undefined && (
                <div 
                  style={{ 
                    fontSize: '16px',
                    color: color,
                    flex: 1,
                    textAlign: 'right'
                  }}
                >
                  {asset.pnl_percent_formatted || `${isPositive ? '+' : ''}${asset.pnl_percent.toFixed(2)}%`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Top Campaigns Card Component
function TopCampaignsCard({ campaigns }: { campaigns: ReportTopCampaign[] }) {
  if (campaigns.length === 0) {
    return null; // Don't show if empty
  }

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm">
      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '12px' }}>
        Top Campaigns
      </div>
      <div className="space-y-2">
        {campaigns.map((campaign) => {
          const isPositive = campaign.pnl >= 0;
          const color = isPositive ? '#2ECC71' : '#E74C3C';
          const statusColor = campaign.status === 'active' ? '#10b981' : campaign.status === 'stopped' ? '#6b7280' : '#f59e0b';
          
          return (
            <div key={campaign.campaign_id} className="flex items-center justify-between py-2">
              <div className="flex flex-col flex-1">
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {campaign.campaign_name}
                </div>
                <div 
                  className="px-2 py-0.5 rounded inline-block mt-1"
                  style={{ 
                    fontSize: '12px',
                    backgroundColor: statusColor + '20',
                    color: statusColor,
                    width: 'fit-content'
                  }}
                >
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </div>
              </div>
              <div 
                style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: color,
                  textAlign: 'right'
                }}
              >
                {campaign.pnl_formatted || `${isPositive ? '+' : ''}${campaign.pnl.toFixed(2)}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}