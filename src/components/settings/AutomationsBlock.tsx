import { useEffect, useRef, useState } from "react";
import { ChevronDown, Edit2, Plus } from "lucide-react";
import { toast } from "sonner@2.0.3";

const JOB_TYPES = [
  "Metrics Snapshot",
  "Market Trend Aggregator",
  "Symbol State Updater",
  "Candles Importer",
];
const SCHEDULE_OPTIONS = ["Every minute", "Every 5 minutes", "Every 15 minutes", "Hourly", "Daily"];
const WINDOW_TYPES = ["Simple", "Exponential", "Weighted"];
const RETENTION_OPTIONS = ["7 days", "14 days", "30 days"];

interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: string;
  type: string;
  params?: any;
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="border-2 border-gray-100 rounded-xl p-4 mb-4 last:mb-0">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onToggleExpand} className="text-left flex-1">
          <div style={{ fontSize: "16px", fontWeight: "bold" }}>{job.name}</div>
        </button>
        <div className="flex items-center" style={{ paddingRight: "4px" }}>
          <Edit2 size={20} className="text-gray-400 cursor-pointer hover:text-gray-600" />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div style={{ fontSize: "16px", fontWeight: "bold" }}>Enabled</div>
        <button
          onClick={() => onUpdate({ enabled: !job.enabled })}
          className={`relative w-14 h-8 rounded-full transition-colors ${
            job.enabled ? "bg-green-500" : "bg-gray-300"
          }`}
        >
          <div
            className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
              job.enabled ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <div className="mb-4">
        <div className="text-gray-600 mb-2" style={{ fontSize: "16px" }}>
          Schedule
        </div>
        <div className="relative" ref={scheduleRef}>
          <button
            onClick={() => setScheduleDropdownOpen(!scheduleDropdownOpen)}
            className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between hover:border-gray-300 transition-colors"
          >
            <span style={{ fontSize: "16px", color: "black" }}>{job.schedule}</span>
            <ChevronDown
              size={20}
              className={`transition-transform ${scheduleDropdownOpen ? "rotate-180" : ""}`}
            />
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
                  style={{ fontSize: "16px" }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="border-t-2 border-gray-100 pt-4 mt-4">
          {job.type === "Market Trend Aggregator" && (
            <MarketTrendParams params={job.params} onUpdateParams={onUpdateParams} />
          )}
          {job.type === "Metrics Snapshot" && (
            <MetricsSnapshotParams params={job.params} onUpdateParams={onUpdateParams} />
          )}
        </div>
      )}
    </div>
  );
}

function MarketTrendParams({
  params,
  onUpdateParams,
}: {
  params: any;
  onUpdateParams: (key: string, value: any) => void;
}) {
  const [windowTypeDropdownOpen, setWindowTypeDropdownOpen] = useState(false);
  const windowTypeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (windowTypeRef.current && !windowTypeRef.current.contains(event.target as Node)) {
        setWindowTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-gray-600 mb-2" style={{ fontSize: "14px" }}>
          Window type
        </div>
        <div className="relative" ref={windowTypeRef}>
          <button
            onClick={() => setWindowTypeDropdownOpen(!windowTypeDropdownOpen)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between hover:border-gray-300 transition-colors"
          >
            <span style={{ fontSize: "14px", color: "black" }}>{params.windowType}</span>
            <ChevronDown
              size={16}
              className={`transition-transform ${windowTypeDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {windowTypeDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              {WINDOW_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    onUpdateParams("windowType", type);
                    setWindowTypeDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50"
                  style={{ fontSize: "14px" }}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="text-gray-600 mb-2" style={{ fontSize: "14px" }}>
          Window value
        </div>
        <input
          type="text"
          value={params.windowValue}
          onChange={(e) => onUpdateParams("windowValue", e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-gray-400"
          style={{ fontSize: "14px" }}
          placeholder="20"
        />
      </div>
    </div>
  );
}

function MetricsSnapshotParams({
  params,
  onUpdateParams,
}: {
  params: any;
  onUpdateParams: (key: string, value: any) => void;
}) {
  const [retentionDropdownOpen, setRetentionDropdownOpen] = useState(false);
  const retentionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (retentionRef.current && !retentionRef.current.contains(event.target as Node)) {
        setRetentionDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div style={{ fontSize: "14px", fontWeight: "bold" }}>Store portfolio snapshot</div>
        <button
          onClick={() => onUpdateParams("storePortfolio", !params.storePortfolio)}
          className={`relative w-12 h-7 rounded-full transition-colors ${
            params.storePortfolio ? "bg-green-500" : "bg-gray-300"
          }`}
        >
          <div
            className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
              params.storePortfolio ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div style={{ fontSize: "14px", fontWeight: "bold" }}>Store account snapshots</div>
        <button
          onClick={() => onUpdateParams("storeAccount", !params.storeAccount)}
          className={`relative w-12 h-7 rounded-full transition-colors ${
            params.storeAccount ? "bg-green-500" : "bg-gray-300"
          }`}
        >
          <div
            className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
              params.storeAccount ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      <div>
        <div className="text-gray-600 mb-2" style={{ fontSize: "14px" }}>
          Retention
        </div>
        <div className="relative" ref={retentionRef}>
          <button
            onClick={() => setRetentionDropdownOpen(!retentionDropdownOpen)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 flex items-center justify-between hover:border-gray-300 transition-colors"
          >
            <span style={{ fontSize: "14px", color: "black" }}>{params.retention}</span>
            <ChevronDown
              size={16}
              className={`transition-transform ${retentionDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {retentionDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              {RETENTION_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onUpdateParams("retention", option);
                    setRetentionDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50"
                  style={{ fontSize: "14px" }}
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

export default function AutomationsBlock() {
  const [selectedJobType, setSelectedJobType] = useState("");
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [jobTypeDropdownOpen, setJobTypeDropdownOpen] = useState(false);
  const jobTypeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (jobTypeRef.current && !jobTypeRef.current.contains(event.target as Node)) {
        setJobTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDefaultParams = (jobType: string) => {
    switch (jobType) {
      case "Market Trend Aggregator":
        return { windowType: "Simple", windowValue: "20" };
      case "Metrics Snapshot":
        return { storePortfolio: true, storeAccount: true, retention: "30 days" };
      default:
        return {};
    }
  };

  const handleAddJob = () => {
    if (!selectedJobType) {
      toast.error("Please select a job type");
      return;
    }
    const newJob: CronJob = {
      id: Date.now().toString(),
      name: selectedJobType,
      enabled: false,
      schedule: "Every 5 minutes",
      type: selectedJobType,
      params: getDefaultParams(selectedJobType),
    };
    setCronJobs([...cronJobs, newJob]);
    setExpandedJobId(newJob.id);
    toast.success("Job added successfully");
  };

  const updateJob = (id: string, updates: Partial<CronJob>) => {
    setCronJobs(cronJobs.map((job) => (job.id === id ? { ...job, ...updates } : job)));
  };

  const updateJobParams = (id: string, paramKey: string, value: any) => {
    setCronJobs(
      cronJobs.map((job) =>
        job.id === id ? { ...job, params: { ...job.params, [paramKey]: value } } : job,
      ),
    );
  };

  return (
    <div className="bg-white rounded-2xl p-6 mb-6">
      <h2 style={{ fontSize: "20px", fontWeight: "bold" }} className="mb-6">
        Automations / Cron Jobs
      </h2>

      <div className="flex gap-3 mb-6">
        <div className="flex-1 relative" ref={jobTypeRef}>
          <button
            onClick={() => setJobTypeDropdownOpen(!jobTypeDropdownOpen)}
            className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between hover:border-gray-300 transition-colors"
          >
            <span style={{ fontSize: "16px", color: selectedJobType ? "black" : "#9ca3af" }}>
              {selectedJobType || "Select job"}
            </span>
            <ChevronDown
              size={20}
              className={`transition-transform ${jobTypeDropdownOpen ? "rotate-180" : ""}`}
            />
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
                  style={{ fontSize: "16px" }}
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

      {cronJobs.length === 0 && (
        <div className="text-center pt-4 pb-8" style={{ fontSize: "16px", color: "#9CA3AF" }}>
          No automations yet ˘?" tap + to create one
        </div>
      )}

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
  );
}
