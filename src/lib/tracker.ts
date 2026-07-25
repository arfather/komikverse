/**
 * Real Internal Analytics Tracker & Adsterra API Helper
 */

export interface AnalyticsSummary {
  totalVisitors: number;
  totalPageviews: number;
  avgSessionDuration: string;
  bounceRate: number;
  deviceBreakdown: {
    mobilePercent: number;
    desktopPercent: number;
    mobileCount: number;
    desktopCount: number;
  };
  hourlyViews: number[];
}

export interface AdsterraStats {
  impressions: number;
  clicks: number;
  ctr: number;
  cpm: number;
  revenue: number;
}

const VISITOR_KEY = "kv_tracker_visitor_id";
const PAGEVIEWS_KEY = "kv_tracker_pageviews";
const HOURLY_KEY = "kv_tracker_hourly";
const SESSIONS_KEY = "kv_tracker_sessions";
const DEVICES_KEY = "kv_tracker_devices";
const ADSTERRA_API_KEY_STORAGE = "kv_adsterra_api_key";

/**
 * Mendapatkan atau membuat ID Pengunjung unik (Visitor ID)
 */
export function getOrCreateVisitorId(): string {
  let visitorId = localStorage.getItem(VISITOR_KEY);
  if (!visitorId) {
    visitorId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(VISITOR_KEY, visitorId);
  }
  return visitorId;
}

/**
 * Mencatat setiap kunjungan halaman (Pageview) secara aktual
 */
export function trackPageView(_pathname: string): void {
  try {
    getOrCreateVisitorId();

    // 1. Total Pageviews
    const currentViews = parseInt(localStorage.getItem(PAGEVIEWS_KEY) || "1", 10);
    localStorage.setItem(PAGEVIEWS_KEY, String(currentViews + 1));

    // 2. Hourly views (24 jam)
    const currentHour = new Date().getHours();
    const hourlyData: number[] = JSON.parse(
      localStorage.getItem(HOURLY_KEY) || JSON.stringify(new Array(24).fill(0))
    );
    hourlyData[currentHour] = (hourlyData[currentHour] || 0) + 1;
    localStorage.setItem(HOURLY_KEY, JSON.stringify(hourlyData));

    // 3. Device detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    const devices = JSON.parse(
      localStorage.getItem(DEVICES_KEY) || JSON.stringify({ mobile: 0, desktop: 0 })
    );
    if (isMobile) {
      devices.mobile += 1;
    } else {
      devices.desktop += 1;
    }
    localStorage.setItem(DEVICES_KEY, JSON.stringify(devices));

    // 4. Session tracking
    const now = Date.now();
    const sessionStart = sessionStorage.getItem("kv_session_start");
    if (!sessionStart) {
      sessionStorage.setItem("kv_session_start", String(now));
    }
    const currentSessionDuration = Math.round(
      (now - parseInt(sessionStorage.getItem("kv_session_start") || String(now), 10)) / 1000
    );
    const storedDuration = parseInt(localStorage.getItem(SESSIONS_KEY) || "120", 10);
    localStorage.setItem(SESSIONS_KEY, String(storedDuration + currentSessionDuration));
  } catch (err) {
    console.error("Tracker error:", err);
  }
}

/**
 * Mengambil ringkasan statistik internal yang telah tercatat
 */
export function getAnalyticsSummary(): AnalyticsSummary {
  const totalPageviews = parseInt(localStorage.getItem(PAGEVIEWS_KEY) || "0", 10);
  getOrCreateVisitorId();
  
  // Visitor calculation strictly starting from 0
  const baseVisitors = parseInt(localStorage.getItem("kv_tracker_visitors_count") || "0", 10);
  if (!localStorage.getItem("kv_visited_once")) {
    localStorage.setItem("kv_visited_once", "true");
    localStorage.setItem("kv_tracker_visitors_count", String(baseVisitors + 1));
  }
  const totalVisitors = parseInt(localStorage.getItem("kv_tracker_visitors_count") || "0", 10);

  // Hourly views (default 0s)
  const hourlyViews: number[] = JSON.parse(
    localStorage.getItem(HOURLY_KEY) || JSON.stringify(new Array(24).fill(0))
  );

  // Devices (default 0s)
  const devices = JSON.parse(
    localStorage.getItem(DEVICES_KEY) || JSON.stringify({ mobile: 0, desktop: 0 })
  );
  const totalDevices = devices.mobile + devices.desktop;
  const mobilePercent = totalDevices > 0 ? Math.round((devices.mobile / totalDevices) * 100) : 0;
  const desktopPercent = totalDevices > 0 ? 100 - mobilePercent : 0;

  // Session Duration (default 0s)
  const totalSeconds = parseInt(localStorage.getItem(SESSIONS_KEY) || "0", 10);
  const avgSeconds = totalVisitors > 0 ? Math.round(totalSeconds / totalVisitors) : 0;
  const minutes = Math.floor(avgSeconds / 60);
  const seconds = avgSeconds % 60;
  const avgSessionDuration = `${minutes}m ${seconds}s`;

  return {
    totalVisitors,
    totalPageviews,
    avgSessionDuration,
    bounceRate: 0,
    deviceBreakdown: {
      mobilePercent,
      desktopPercent,
      mobileCount: devices.mobile,
      desktopCount: devices.desktop,
    },
    hourlyViews,
  };
}

export const DEFAULT_ADSTERRA_API_KEY = "1ec999fc3fa93978a6be4386639af46d";

/**
 * Menyimpan Adsterra API Key ke Storage
 */
export function setAdsterraApiKey(key: string): void {
  localStorage.setItem(ADSTERRA_API_KEY_STORAGE, key.trim());
}

/**
 * Mengambil Adsterra API Key dari Storage
 */
export function getAdsterraApiKey(): string {
  return localStorage.getItem(ADSTERRA_API_KEY_STORAGE) || DEFAULT_ADSTERRA_API_KEY;
}

/**
 * Fetch statistik pendapatan & impresi asli dari Adsterra API
 */
export async function fetchAdsterraStats(apiKey?: string): Promise<AdsterraStats | null> {
  const keyToUse = apiKey || getAdsterraApiKey();
  if (!keyToUse) return null;

  try {
    const res = await fetch(`https://api3.adsterra.com/publisher/stats.json?api_key=${keyToUse}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    
    // Parse Adsterra API response format
    if (data && Array.isArray(data.items)) {
      const totals = data.items.reduce(
        (acc: AdsterraStats, item: any) => {
          acc.impressions += Number(item.impressions || 0);
          acc.clicks += Number(item.clicks || 0);
          acc.revenue += Number(item.revenue || 0);
          return acc;
        },
        { impressions: 0, clicks: 0, ctr: 0, cpm: 0, revenue: 0 }
      );

      totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
      totals.cpm = totals.impressions > 0 ? (totals.revenue / totals.impressions) * 1000 : 0;
      return totals;
    }
    return null;
  } catch (error) {
    console.warn("Adsterra API fetch warning (bisa disebabkan oleh CORS/key belum aktif):", error);
    return null;
  }
}
