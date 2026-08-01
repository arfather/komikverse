import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://dkhfikwxgmzglfkyzlxe.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_KIWfAMUwXLnd_dPySUwDdg_EbGWTFYk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export interface VisitRecord {
  id?: string;
  visitor_id: string;
  session_id: string;
  path: string;
  referrer: string;
  user_agent: string;
  ip_address?: string;
  browser_name?: string;
  device_type: "desktop" | "mobile" | "tablet";
  screen_resolution: string;
  language: string;
  page_load_time_ms: number;
  created_at?: string;
}

export interface SupabaseAnalyticsStats {
  totalPageviews: number;
  uniquePageviews: number;
  uniqueVisitors: number;
  avgPageLoadTimeMs: number;
  deviceBreakdown: {
    mobilePercent: number;
    desktopPercent: number;
    tabletPercent: number;
    mobileCount: number;
    desktopCount: number;
    tabletCount: number;
  };
  hourlyViews: number[];
  topPages: { path: string; count: number; uniqueCount: number }[];
  recentVisits: VisitRecord[];
}

/**
 * Generates or retrieves a persistent unique visitor ID stored in localStorage.
 */
export function getVisitorId(): string {
  if (typeof window === "undefined") return "server_visitor";
  let visitorId = localStorage.getItem("kv_visitor_uuid");
  if (!visitorId) {
    visitorId = "usr_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    try {
      localStorage.setItem("kv_visitor_uuid", visitorId);
    } catch {
      // Storage unavailable
    }
  }
  return visitorId;
}

/**
 * Generates or retrieves a session ID stored in sessionStorage.
 */
export function getSessionId(): string {
  if (typeof window === "undefined") return "server_session";
  let sessionId = sessionStorage.getItem("kv_session_uuid");
  if (!sessionId) {
    sessionId = "ses_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    try {
      sessionStorage.setItem("kv_session_uuid", sessionId);
    } catch {
      // Storage unavailable
    }
  }
  return sessionId;
}

/**
 * Detects device category (mobile, tablet, desktop).
 */
export function detectDeviceType(): "desktop" | "mobile" | "tablet" {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

/**
 * Helper to parse browser name & OS from navigator.userAgent.
 */
export function parseBrowserAgent(ua: string): { browser: string; os: string } {
  let browser = "Browser";
  let os = "OS";

  if (!ua) return { browser, os };

  // OS detection
  if (ua.includes("Win")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad") || ua.includes("iPod")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";

  // Browser detection
  if (ua.includes("Edg/")) {
    const ver = ua.match(/Edg\/([\d.]+)/)?.[1] || "";
    browser = `Edge ${ver.split(".")[0]}`;
  } else if (ua.includes("Chrome/")) {
    const ver = ua.match(/Chrome\/([\d.]+)/)?.[1] || "";
    browser = `Chrome ${ver.split(".")[0]}`;
  } else if (ua.includes("Safari/") && !ua.includes("Chrome/")) {
    const ver = ua.match(/Version\/([\d.]+)/)?.[1] || "";
    browser = `Safari ${ver.split(".")[0]}`;
  } else if (ua.includes("Firefox/")) {
    const ver = ua.match(/Firefox\/([\d.]+)/)?.[1] || "";
    browser = `Firefox ${ver.split(".")[0]}`;
  } else if (ua.includes("Opera") || ua.includes("OPR/")) {
    browser = "Opera";
  }

  return { browser, os };
}

let cachedIpAddress: string | null = null;

/**
 * Asynchronously fetches client IP address.
 */
export async function getClientIpAddress(): Promise<string> {
  if (cachedIpAddress) return cachedIpAddress;
  try {
    const res = await fetch("https://api.ipify.org?format=json").catch(() => null);
    if (res && res.ok) {
      const data = await res.json().catch(() => null);
      if (data && data.ip) {
        cachedIpAddress = data.ip;
        return data.ip;
      }
    }
  } catch {
    // Fail gracefully
  }
  return "Unknown IP";
}

/**
 * Records a page visit to Supabase audience_analytics table.
 * Strictly deduplicates visits: the same visitor visiting the same path within 30 mins will NOT create duplicate view records.
 */
export async function trackPageVisitToSupabase(pathname: string, loadTimeMs: number = 0): Promise<void> {
  try {
    const visitor_id = getVisitorId();
    const session_id = getSessionId();

    // Client-side deduplication check: 30-minute window per path per session
    const DEDUP_WINDOW_MS = 30 * 60 * 1000;
    const cacheKey = `kv_tracked_${pathname}`;
    try {
      const lastTracked = sessionStorage.getItem(cacheKey);
      if (lastTracked && Date.now() - Number(lastTracked) < DEDUP_WINDOW_MS) {
        // Skip duplicate view insert for the same user on the same path
        return;
      }
      sessionStorage.setItem(cacheKey, Date.now().toString());
    } catch {
      // Storage fallback
    }

    const device_type = detectDeviceType();
    const referrer = typeof document !== "undefined" ? (document.referrer.substring(0, 255) || "Direct") : "Direct";
    const user_agent = typeof navigator !== "undefined" ? navigator.userAgent.substring(0, 255) : "";
    const screen_resolution = typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "";
    const language = typeof navigator !== "undefined" ? (navigator.language || "id-ID") : "id-ID";

    const { browser, os } = parseBrowserAgent(user_agent);
    const browser_name = `${browser} (${os})`;
    const ip_address = await getClientIpAddress();

    await supabase.from("audience_analytics").insert([
      {
        visitor_id,
        session_id,
        path: pathname,
        referrer,
        user_agent,
        device_type,
        screen_resolution,
        language,
        page_load_time_ms: Math.round(loadTimeMs),
        ip_address,
        browser_name,
      },
    ]);
  } catch (err) {
    console.warn("Supabase analytics track warning:", err);
  }
}

/**
 * Reads aggregated analytics stats from Supabase audience_analytics table with Unique View deduplication.
 */
export async function fetchSupabaseAnalyticsStats(): Promise<SupabaseAnalyticsStats> {
  try {
    const { data: rows, error } = await supabase
      .from("audience_analytics")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error || !rows) {
      throw error || new Error("No analytics data returned");
    }

    const totalPageviews = rows.length;

    // Deduplicated Unique Visitors (COUNT DISTINCT visitor_id)
    const uniqueVisitorSet = new Set(rows.map((r) => r.visitor_id));
    const uniqueVisitors = uniqueVisitorSet.size;

    // Deduplicated Unique Pageviews (COUNT DISTINCT visitor_id + path)
    const uniquePageviewSet = new Set(rows.map((r) => `${r.visitor_id}:${r.path}`));
    const uniquePageviews = uniquePageviewSet.size;

    // Load time avg
    const loadTimes = rows.map((r) => Number(r.page_load_time_ms) || 0).filter((t) => t > 0);
    const avgPageLoadTimeMs = loadTimes.length > 0 ? Math.round(loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length) : 0;

    // Device breakdown
    let mobileCount = 0;
    let desktopCount = 0;
    let tabletCount = 0;

    rows.forEach((r) => {
      if (r.device_type === "mobile") mobileCount++;
      else if (r.device_type === "tablet") tabletCount++;
      else desktopCount++;
    });

    const mobilePercent = totalPageviews > 0 ? Math.round((mobileCount / totalPageviews) * 100) : 0;
    const tabletPercent = totalPageviews > 0 ? Math.round((tabletCount / totalPageviews) * 100) : 0;
    const desktopPercent = totalPageviews > 0 ? Math.max(0, 100 - mobilePercent - tabletPercent) : 0;

    // Hourly views
    const hourlyViews = new Array(24).fill(0);
    rows.forEach((r) => {
      if (r.created_at) {
        const hour = new Date(r.created_at).getHours();
        hourlyViews[hour]++;
      }
    });

    // Top pages with Unique visitor count
    const pageCounts: Record<string, { total: number; visitors: Set<string> }> = {};
    rows.forEach((r) => {
      if (!pageCounts[r.path]) {
        pageCounts[r.path] = { total: 0, visitors: new Set() };
      }
      pageCounts[r.path].total++;
      pageCounts[r.path].visitors.add(r.visitor_id);
    });

    const topPages = Object.entries(pageCounts)
      .map(([path, info]) => ({
        path,
        count: info.total,
        uniqueCount: info.visitors.size,
      }))
      .sort((a, b) => b.uniqueCount - a.uniqueCount)
      .slice(0, 10);

    const recentVisits: VisitRecord[] = rows.slice(0, 30);

    return {
      totalPageviews,
      uniquePageviews,
      uniqueVisitors,
      avgPageLoadTimeMs,
      deviceBreakdown: {
        mobilePercent,
        desktopPercent,
        tabletPercent,
        mobileCount,
        desktopCount,
        tabletCount,
      },
      hourlyViews,
      topPages,
      recentVisits,
    };
  } catch (err) {
    console.warn("Failed to fetch Supabase analytics stats:", err);
    return {
      totalPageviews: 0,
      uniquePageviews: 0,
      uniqueVisitors: 0,
      avgPageLoadTimeMs: 0,
      deviceBreakdown: {
        mobilePercent: 0,
        desktopPercent: 0,
        tabletPercent: 0,
        mobileCount: 0,
        desktopCount: 0,
        tabletCount: 0,
      },
      hourlyViews: new Array(24).fill(0),
      topPages: [],
      recentVisits: [],
    };
  }
}
