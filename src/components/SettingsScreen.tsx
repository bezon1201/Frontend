import { X, Plus, Edit2, ChevronDown, Upload, File } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner@2.0.3";
import { useTheme } from "../context/ThemeContext";
import { useDataSource, DataSourceMode } from "../context/DataSourceContext";
import SegmentedControl from "./SegmentedControl";
import { getGlobalConfig, GlobalConfigResponse, healthCheck } from "../services/api";

interface SettingsScreenProps {
  onClose: () => void;
}

const CURRENCIES = ['USDC', 'USD', 'EUR'];
const REFRESH_INTERVALS = ['Off', '5 seconds', '15 seconds', '30 seconds', '60 seconds'];
const JOB_TYPES = [
  'Metrics Snapshot',
  'Market Trend Aggregator',
  'Symbol State Updater',
  'Candles Importer'
];
const SCHEDULE_OPTIONS = [
  'Every minute',
  'Every 5 minutes',
  'Every 15 minutes',
  'Hourly',
  'Daily'
];
const WINDOW_TYPES = ['Simple', 'Exponential', 'Weighted'];
const RETENTION_OPTIONS = ['7 days', '14 days', '30 days'];

const CSV_SOURCES = [
  'Binance (Trades / Orders)',
  'Binance (Funding)',
  'IBKR (Activity)',
  'Other (Generic CSV)'
];

interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: string;
  type: string;
  params?: any;
}

interface CSVImport {
  timestamp: string;
  source: string;
  filename: string;
  status: 'Pending' | 'Processed' | 'Failed';
}

export default function SettingsScreen({ onClose }: SettingsScreenProps) {
  const { theme, toggleTheme } = useTheme();
  const { mode, setMode } = useDataSource();
  
  // Global Settings
  const [displayCurrency, setDisplayCurrency] = useState('USDC');
  const [autoRefresh, setAutoRefresh] = useState('Off');
  const [isCheckingApi, setIsCheckingApi] = useState(false);
  
  // Cron Jobs
  const [selectedJobType, setSelectedJobType] = useState('');
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  
  // CSV Import
  const [selectedSource, setSelectedSource] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lastImport, setLastImport] = useState<CSVImport | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Dropdowns
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [refreshDropdownOpen, setRefreshDropdownOpen] = useState(false);
  const [jobTypeDropdownOpen, setJobTypeDropdownOpen] = useState(false);
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  
  const currencyRef = useRef<HTMLDivElement>(null);
  const refreshRef = useRef<HTMLDivElement>(null);
  const jobTypeRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setCurrencyDropdownOpen(false);
      }
      if (refreshRef.current && !refreshRef.current.contains(event.target as Node)) {
        setRefreshDropdownOpen(false);
      }
      if (jobTypeRef.current && !jobTypeRef.current.contains(event.target as Node)) {
        setJobTypeDropdownOpen(false);
      }
      if (sourceRef.current && !sourceRef.current.contains(event.target as Node)) {
        setSourceDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddJob = () => {
    if (!selectedJobType) {
      toast.error('Please select a job type');
      return;
    }

    const newJob: CronJob = {
      id: Date.now().toString(),
      name: selectedJobType,
      enabled: false,
      schedule: 'Every 5 minutes',
      type: selectedJobType,
      params: getDefaultParams(selectedJobType)
    };

    setCronJobs([...cronJobs, newJob]);
    setExpandedJobId(newJob.id);
    toast.success('Job added successfully');
  };

  const getDefaultParams = (jobType: string) => {
    switch (jobType) {
      case 'Market Trend Aggregator':
        return {
          windowType: 'Simple',
          windowValue: '20'
        };
      case 'Metrics Snapshot':
        return {
          storePortfolio: true,
          storeAccount: true,
          retention: '30 days'
        };
      default:
        return {};
    }
  };

  const updateJob = (id: string, updates: Partial<CronJob>) => {
    setCronJobs(cronJobs.map(job => 
      job.id === id ? { ...job, ...updates } : job
    ));
  };

  const updateJobParams = (id: string, paramKey: string, value: any) => {
    setCronJobs(cronJobs.map(job => 
      job.id === id 
        ? { ...job, params: { ...job.params, [paramKey]: value } } 
        : job
    ));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !selectedSource) {
      toast.error('Please select a file and a source');
      return;
    }

    setIsUploading(true);

    // Simulate file upload
    setTimeout(() => {
      const newImport: CSVImport = {
        timestamp: new Date().toISOString(),
        source: selectedSource,
        filename: selectedFile.name,
        status: 'Processed'
      };

      setLastImport(newImport);
      setIsUploading(false);
      toast.success('File uploaded successfully');
    }, 2000);
  };

  const normalizeAutoRefresh = (value: any): string => {
    if (typeof value === 'number') {
      return `${value} seconds`;
    }
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'off') return 'Off';
      const numeric = Number(value);
      if (!Number.isNaN(numeric) && numeric > 0) {
        return `${numeric} seconds`;
      }
      return value;
    }
    return 'Off';
  };

  const applyBackendConfig = (config: GlobalConfigResponse) => {
    if (config.display_currency) {
      setDisplayCurrency(config.display_currency);
    }
    if (config.auto_refresh !== undefined) {
      setAutoRefresh(normalizeAutoRefresh(config.auto_refresh));
    }
  };

  const checkApiAndLoad = async (showToastOnFailure: boolean) => {
    setIsCheckingApi(true);
    try {
      const ok = await healthCheck();
      if (!ok) {
        throw new Error('API unavailable');
      }
      const cfg = await getGlobalConfig();
      setMode('API');
      applyBackendConfig(cfg);
      return true;
    } catch (err) {
      setMode('MOCK');
      if (showToastOnFailure) {
        toast.error('API is not available — switched to MOCK');
      }
      return false;
    } finally {
      setIsCheckingApi(false);
    }
  };

  const handleModeChange = async (nextMode: DataSourceMode) => {
    if (nextMode === mode) return;
    if (nextMode === 'MOCK') {
      setMode('MOCK');
      return;
    }
    await checkApiAndLoad(true);
  };

  useEffect(() => {
    if (mode === 'API') {
      void checkApiAndLoad(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 h-full w-full bg-black overflow-y-auto" data-scrollable="true">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-8 pb-6">
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
          Settings
        </h1>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          <X size={24} color="white" />
        </button>
      </div>

      {/* Content */}
      <div className="px-6 pb-32">
        {/* BLOCK 1: MOC & API mode */}
        <div className="bg-white rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>
              MOC & API mode
            </h2>
            <button
              onClick={toggleTheme}
              className="relative inline-block w-14 h-8"
            >
              <div
                className="rounded-full w-full h-full flex items-center px-1 transition-all"
                style={{
                  backgroundColor: theme === "green" ? "#10b981" : "#ef4444",
                  justifyContent: theme === "green" ? "flex-end" : "flex-start",
                }}
              >
                <div className="w-6 h-6 bg-white rounded-full transition-all" />
              </div>
            </button>
          </div>

          <div className="space-y-2">
            <div className="text-gray-600" style={{ fontSize: '16px' }}>
              Data source
            </div>
            <SegmentedControl
              options={['MOCK', 'API']}
              value={mode}
              onChange={(val) => handleModeChange(val as DataSourceMode)}
              disabled={isCheckingApi}
            />
            {isCheckingApi && (
              <div className="text-gray-400" style={{ fontSize: '14px' }}>
                Checking API availability...
              </div>
            )}
          </div>
        </div>

        {/* BLOCK 2: Global Settings */}
        <div className="bg-white rounded-2xl p-6 mb-6">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }} className="mb-6">
            Global Settings
          </h2>

          {/* Display Currency */}
          <div className="mb-6">
            <div className="text-gray-600 mb-2" style={{ fontSize: '16px' }}>
              Display Currency
            </div>
            <div className="relative" ref={currencyRef}>
              <button
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between hover:border-gray-300 transition-colors"
              >
                <span style={{ fontSize: '16px', color: 'black' }}>
                  {displayCurrency}
                </span>
                <ChevronDown size={20} className={`transition-transform ${currencyDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {currencyDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
                  {CURRENCIES.map((currency) => (
                    <button
                      key={currency}
                      onClick={() => {
                        setDisplayCurrency(currency);
                        setCurrencyDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50"
                      style={{ fontSize: '16px' }}
                    >
                      {currency}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dashboard Auto-refresh */}
          <div>
            <div className="text-gray-600 mb-2" style={{ fontSize: '16px' }}>
              Dashboard auto-refresh
            </div>
            <div className="relative" ref={refreshRef}>
              <button
                onClick={() => setRefreshDropdownOpen(!refreshDropdownOpen)}
                className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between hover:border-gray-300 transition-colors"
              >
                <span style={{ fontSize: '16px', color: 'black' }}>
                  {autoRefresh}
                </span>
                <ChevronDown size={20} className={`transition-transform ${refreshDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {refreshDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
                  {REFRESH_INTERVALS.map((interval) => (
                    <button
                      key={interval}
                      onClick={() => {
                        setAutoRefresh(interval);
                        setRefreshDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50"
                      style={{ fontSize: '16px' }}
                    >
                      {interval}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="text-gray-400 mt-2" style={{ fontSize: '14px' }}>
              Controls how often dashboard fetches new data
            </div>
          </div>
        </div>

        {/* BLOCK 3: Automations / Cron Jobs */}
        <div className="bg-white rounded-2xl p-6 mb-6">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }} className="mb-6">
            Automations / Cron Jobs
          </h2>

          {/* Job Selection */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative" ref={jobTypeRef}>
              <button
                onClick={() => setJobTypeDropdownOpen(!jobTypeDropdownOpen)}
                className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between hover:border-gray-300 transition-colors"
              >
                <span style={{ fontSize: '16px', color: selectedJobType ? 'black' : '#9ca3af' }}>
                  {selectedJobType || 'Select job'}
                </span>
                <ChevronDown size={20} className={`transition-transform ${jobTypeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {jobTypeDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
                  {JOB_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedJobType(type);
                        setJobTypeDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50"
                      style={{ fontSize: '16px' }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={handleAddJob}
              className="w-12 h-12 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors flex-shrink-0"
            >
              <Plus size={24} color="black" />
            </button>
          </div>

          {/* Empty State */}
          {cronJobs.length === 0 && (
            <div className="text-center pt-4 pb-8" style={{ fontSize: '16px', color: '#9CA3AF' }}>
              No automations yet — tap + to create one
            </div>
          )}

          {/* Job Cards */}
          {cronJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isExpanded={expandedJobId === job.id}
              onToggleExpand={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
              onUpdate={(updates) => updateJob(job.id, updates)}
              onUpdateParams={(paramKey, value) => updateJobParams(job.id, paramKey, value)}
            />
          ))}
        </div>

        {/* BLOCK 4: CSV Import */}
        <div className="bg-white rounded-2xl p-6 mt-6">
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }} className="mb-2">
            CSV Import
          </h2>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '24px' }}>
            Upload CSV exports from exchanges or brokers. Files will be stored for later processing.
          </p>

          {/* Source Selection */}
          <div className="mb-4">
            <div className="text-gray-600 mb-2" style={{ fontSize: '16px' }}>
              Source
            </div>
            <div className="relative" ref={sourceRef}>
              <button
                onClick={() => setSourceDropdownOpen(!sourceDropdownOpen)}
                className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between hover:border-gray-300 transition-colors"
              >
                <span style={{ fontSize: '16px', color: selectedSource ? 'black' : '#9ca3af' }}>
                  {selectedSource || 'Select source'}
                </span>
                <ChevronDown size={20} className={`transition-transform ${sourceDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {sourceDropdownOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
                  {CSV_SOURCES.map((source) => (
                    <button
                      key={source}
                      onClick={() => {
                        setSelectedSource(source);
                        setSourceDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50"
                      style={{ fontSize: '16px' }}
                    >
                      {source}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* File Picker */}
          <div className="mb-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            
            {!selectedFile ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-6 py-8 flex flex-col items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <Upload size={32} color="#9ca3af" className="mb-2" />
                <div style={{ fontSize: '16px', color: '#000', marginBottom: '4px' }}>
                  Tap to select CSV file
                </div>
                <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                  Max 10 MB
                </div>
              </button>
            ) : (
              <div className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <File size={20} color="#000" />
                  <div>
                    <div style={{ fontSize: '16px', color: '#000' }}>
                      {selectedFile.name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                      {(selectedFile.size / 1024).toFixed(0)} KB
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="w-6 h-6 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center transition-colors"
                >
                  <X size={14} color="white" />
                </button>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !selectedSource || isUploading}
            className="w-full bg-green-500 text-white rounded-full px-6 py-3.5 flex items-center justify-center hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Uploading...</span>
              </>
            ) : (
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>Upload file</span>
            )}
          </button>

          {/* Last import */}
          {lastImport ? (
            <div>
              <div className="text-gray-400 mb-2" style={{ fontSize: '14px' }}>
                Last import
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                {new Date(lastImport.timestamp).toLocaleString()} · {lastImport.source} · {lastImport.filename}
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ 
                    backgroundColor: 
                      lastImport.status === 'Processed' ? '#2ECC71' : 
                      lastImport.status === 'Failed' ? '#E74C3C' : 
                      '#9ca3af'
                  }}
                />
                <span 
                  style={{ 
                    fontSize: '14px',
                    color: 
                      lastImport.status === 'Processed' ? '#2ECC71' : 
                      lastImport.status === 'Failed' ? '#E74C3C' : 
                      '#9ca3af'
                  }}
                >
                  Status: {lastImport.status}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-6" style={{ fontSize: '16px', color: '#9ca3af' }}>
              No files uploaded yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface JobCardProps {
  job: CronJob;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<CronJob>) => void;
  onUpdateParams: (paramKey: string, value: any) => void;
}

function JobCard({ job, isExpanded, onToggleExpand, onUpdate, onUpdateParams }: JobCardProps) {
  const [scheduleDropdownOpen, setScheduleDropdownOpen] = useState(false);
  const scheduleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (scheduleRef.current && !scheduleRef.current.contains(event.target as Node)) {
        setScheduleDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="border-2 border-gray-100 rounded-xl p-4 mb-4 last:mb-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onToggleExpand}
          className="text-left flex-1"
        >
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {job.name}
          </div>
        </button>
        <div className="flex items-center" style={{ paddingRight: '4px' }}>
          <Edit2 size={20} className="text-gray-400 cursor-pointer hover:text-gray-600" />
        </div>
      </div>

      {/* Enabled Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
          Enabled
        </div>
        <button
          onClick={() => onUpdate({ enabled: !job.enabled })}
          className={`relative w-14 h-8 rounded-full transition-colors ${
            job.enabled ? 'bg-green-500' : 'bg-gray-300'
          }`}
        >
          <div
            className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
              job.enabled ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Schedule */}
      <div className="mb-4">
        <div className="text-gray-600 mb-2" style={{ fontSize: '16px' }}>
          Schedule
        </div>
        <div className="relative" ref={scheduleRef}>
          <button
            onClick={() => setScheduleDropdownOpen(!scheduleDropdownOpen)}
            className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between hover:border-gray-300 transition-colors"
          >
            <span style={{ fontSize: '16px', color: 'black' }}>
              {job.schedule}
            </span>
            <ChevronDown size={20} className={`transition-transform ${scheduleDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {scheduleDropdownOpen && (
            <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border-2 border-gray-200 overflow-hidden">
              {SCHEDULE_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onUpdate({ schedule: option });
                    setScheduleDropdownOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50"
                  style={{ fontSize: '16px' }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Job-specific parameters */}
      {isExpanded && (
        <div className="border-t-2 border-gray-100 pt-4 mt-4">
          {job.type === 'Market Trend Aggregator' && (
            <MarketTrendParams 
              params={job.params} 
              onUpdateParams={onUpdateParams}
            />
          )}
          {job.type === 'Metrics Snapshot' && (
            <MetricsSnapshotParams 
              params={job.params} 
              onUpdateParams={onUpdateParams}
            />
          )}
        </div>
      )}
    </div>
  );
}

function MarketTrendParams({ params, onUpdateParams }: { params: any; onUpdateParams: (key: string, value: any) => void }) {
  const [windowTypeDropdownOpen, setWindowTypeDropdownOpen] = useState(false);
  const windowTypeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (windowTypeRef.current && !windowTypeRef.current.contains(event.target as Node)) {
        setWindowTypeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      {/* Window Type */}
      <div>
        <div className="text-gray-600 mb-2" style={{ fontSize: '14px' }}>
          Window type
        </div>
        <div className="relative" ref={windowTypeRef}>
          <button
            onClick={() => setWindowTypeDropdownOpen(!windowTypeDropdownOpen)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between hover:border-gray-300 transition-colors"
          >
            <span style={{ fontSize: '14px', color: 'black' }}>
              {params.windowType}
            </span>
            <ChevronDown size={16} className={`transition-transform ${windowTypeDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {windowTypeDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              {WINDOW_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    onUpdateParams('windowType', type);
                    setWindowTypeDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50"
                  style={{ fontSize: '14px' }}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Window Value */}
      <div>
        <div className="text-gray-600 mb-2" style={{ fontSize: '14px' }}>
          Window value
        </div>
        <input
          type="text"
          value={params.windowValue}
          onChange={(e) => onUpdateParams('windowValue', e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400"
          style={{ fontSize: '14px' }}
          placeholder="20"
        />
      </div>
    </div>
  );
}

function MetricsSnapshotParams({ params, onUpdateParams }: { params: any; onUpdateParams: (key: string, value: any) => void }) {
  const [retentionDropdownOpen, setRetentionDropdownOpen] = useState(false);
  const retentionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (retentionRef.current && !retentionRef.current.contains(event.target as Node)) {
        setRetentionDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      {/* Store Portfolio Snapshot */}
      <div className="flex items-center justify-between">
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
          Store portfolio snapshot
        </div>
        <button
          onClick={() => onUpdateParams('storePortfolio', !params.storePortfolio)}
          className={`relative w-12 h-7 rounded-full transition-colors ${
            params.storePortfolio ? 'bg-green-500' : 'bg-gray-300'
          }`}
        >
          <div
            className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
              params.storePortfolio ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Store Account Snapshots */}
      <div className="flex items-center justify-between">
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
          Store account snapshots
        </div>
        <button
          onClick={() => onUpdateParams('storeAccount', !params.storeAccount)}
          className={`relative w-12 h-7 rounded-full transition-colors ${
            params.storeAccount ? 'bg-green-500' : 'bg-gray-300'
          }`}
        >
          <div
            className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
              params.storeAccount ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Retention */}
      <div>
        <div className="text-gray-600 mb-2" style={{ fontSize: '14px' }}>
          Retention
        </div>
        <div className="relative" ref={retentionRef}>
          <button
            onClick={() => setRetentionDropdownOpen(!retentionDropdownOpen)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between hover:border-gray-300 transition-colors"
          >
            <span style={{ fontSize: '14px', color: 'black' }}>
              {params.retention}
            </span>
            <ChevronDown size={16} className={`transition-transform ${retentionDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {retentionDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              {RETENTION_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onUpdateParams('retention', option);
                    setRetentionDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50"
                  style={{ fontSize: '14px' }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
