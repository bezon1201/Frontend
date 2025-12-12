export type GlobalConfigResponse = {
  display_currency?: string;
  auto_refresh?: string | number;
  mock_api_enabled?: boolean;
};

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch("/health");
    return res.ok;
  } catch {
    return false;
  }
}

export async function getGlobalConfig(): Promise<GlobalConfigResponse> {
  const res = await fetch("/api/config/global");
  if (!res.ok) {
    throw new Error("Failed to fetch global config");
  }
  return res.json();
}
