// API Configuration
const API_BASE_URL = "http://localhost:8000"; // Adjust as needed

// Types
export interface GlobalConfigResponse {
  display_currency: string;
  auto_refresh: string | number;
  mock_api_enabled: boolean;
}

export interface Message {
  code: string;
  kind: "toast" | "alert";
  text: string;
}

export interface MessageUpdate {
  kind: "toast" | "alert";
  text: string;
}

// Logs API Types
export interface LogEntry {
  id: string;
  timestamp: string;
  category: 'system' | 'orders' | 'campaigns' | 'cron' | 'errors';
  level: 'info' | 'warning' | 'error';
  message: string;
  context?: any;
}

export interface LogsFilters {
  category?: string;
  level?: string;
  search?: string;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
}

export interface LogsResponse {
  items: LogEntry[];
  next_cursor?: string | null;
  has_more: boolean;
}

// Reports API Types
export type ReportPeriod = 'today' | '7d' | '30d' | 'ytd' | 'all';

export interface ReportSummaryCard {
  card_key: string; // e.g. "total_pnl", "realized_pnl", "unrealized_pnl", "win_rate", "trades_count", "max_drawdown"
  title: string; // e.g. "Total PnL"
  value: string | number; // e.g. "+1234 USDC" or 1234
  value_formatted?: string; // e.g. "+1,234 USDC"
  delta_value?: string | number; // e.g. "+12.4" or 12.4
  delta_percent?: string | number; // e.g. "+12.4%" or 12.4
  trend?: 'up' | 'down' | 'neutral'; // arrow direction
  color?: 'green' | 'red' | 'gray'; // color hint
}

export interface ReportTopAsset {
  asset: string; // e.g. "BTCUSDT"
  pnl: number; // e.g. 1234.56
  pnl_formatted?: string; // e.g. "+1,234.56 USDC"
  pnl_percent?: number; // e.g. 12.4
  pnl_percent_formatted?: string; // e.g. "+12.4%"
}

export interface ReportTopCampaign {
  campaign_id: string; // e.g. "camp_123"
  campaign_name: string; // e.g. "BTCUSDT Grid #1"
  pnl: number; // e.g. 1234.56
  pnl_formatted?: string; // e.g. "+1,234.56 USDC"
  status: 'active' | 'stopped' | 'draft';
}

export interface ReportsSummaryResponse {
  summary_cards: ReportSummaryCard[];
  top_assets: ReportTopAsset[];
  top_campaigns: ReportTopCampaign[];
  generated_at: string; // ISO timestamp
}

// Health check
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Global config
export async function getGlobalConfig(): Promise<GlobalConfigResponse> {
  const response = await fetch(`${API_BASE_URL}/api/config/global`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch global config");
  }
  return response.json();
}

// Messages API
export async function getMessages(): Promise<Message[]> {
  const response = await fetch(`${API_BASE_URL}/api/messages`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch messages");
  }
  
  const json = await response.json();
  
  // Validate response format
  if (!json.ok) {
    throw new Error(json.error || "API returned error");
  }
  
  // Ensure we have an array
  if (!Array.isArray(json.data)) {
    return [];
  }
  
  return json.data;
}

export async function updateMessage(
  code: string,
  data: MessageUpdate
): Promise<Message> {
  const response = await fetch(`${API_BASE_URL}/api/messages/${code}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error("Failed to update message");
  }
  
  const json = await response.json();
  
  // Validate response format
  if (!json.ok) {
    throw new Error(json.error || "API returned error");
  }
  
  // Return the message data
  return json.data;
}

export async function deleteMessage(code: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/messages/${code}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  
  if (!response.ok) {
    throw new Error("Failed to delete message");
  }
  
  const json = await response.json();
  
  // Validate response format
  if (!json.ok) {
    throw new Error(json.error || "API returned error");
  }
}

// Logs API
export async function getLogs(filters?: LogsFilters): Promise<LogsResponse> {
  // Build query params
  const params = new URLSearchParams();
  
  if (filters?.category && filters.category !== 'all') {
    params.append('category', filters.category);
  }
  
  if (filters?.level && filters.level !== 'all') {
    params.append('level', filters.level);
  }
  
  if (filters?.search) {
    params.append('search', filters.search);
  }
  
  if (filters?.from) {
    params.append('from', filters.from);
  }
  
  if (filters?.to) {
    params.append('to', filters.to);
  }
  
  if (filters?.limit) {
    params.append('limit', filters.limit.toString());
  }
  
  if (filters?.cursor) {
    params.append('cursor', filters.cursor);
  }
  
  const url = `${API_BASE_URL}/api/logs${params.toString() ? '?' + params.toString() : ''}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch logs");
  }
  
  const json = await response.json();
  
  // Validate response format
  if (!json.ok) {
    throw new Error(json.error || "API returned error");
  }
  
  // Ensure we have valid data structure
  if (!json.data || !Array.isArray(json.data.items)) {
    return {
      items: [],
      next_cursor: null,
      has_more: false,
    };
  }
  
  return {
    items: json.data.items,
    next_cursor: json.data.next_cursor || null,
    has_more: json.data.has_more || false,
  };
}

// Reports API
export async function getReportsSummary(period: ReportPeriod): Promise<ReportsSummaryResponse> {
  const response = await fetch(`${API_BASE_URL}/api/reports/summary?period=${period}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch reports summary");
  }
  
  const json = await response.json();
  
  // Validate response format
  if (!json.ok) {
    throw new Error(json.error || "API returned error");
  }
  
  // Ensure we have valid data structure
  if (!json.data || !Array.isArray(json.data.summary_cards)) {
    return {
      summary_cards: [],
      top_assets: [],
      top_campaigns: [],
      generated_at: new Date().toISOString(),
    };
  }
  
  return {
    summary_cards: json.data.summary_cards,
    top_assets: json.data.top_assets || [],
    top_campaigns: json.data.top_campaigns || [],
    generated_at: json.data.generated_at,
  };
}