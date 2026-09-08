import { getSupabaseEnv } from "@/lib/env";

const JEDA_PING_MS = 15_000;
const TIMEOUT_PING_MS = 4_000;

export async function pingSupabase(): Promise<boolean> {
  const { url, anonKey: key } = getSupabaseEnv();
  if (!url || !key) return false;

  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), TIMEOUT_PING_MS);
  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      method: "GET",
      headers: { apikey: key },
      signal: ctrl.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

export { JEDA_PING_MS };
