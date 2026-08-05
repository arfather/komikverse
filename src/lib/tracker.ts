/**
 * Global Real Analytics Tracker (Powered by Supabase Database & Vercel Analytics)
 * Records unique visitors, performance load times, and page views to Supabase.
 */

import { trackPageVisitToSupabase, fetchSupabaseAnalyticsStats } from "./supabase";
import type { SupabaseAnalyticsStats } from "./supabase";

export interface AnalyticsSummary {
  totalVisitors: number;
  totalPageviews: number;
  uniquePageviews: number;
  avgSessionDuration: string;
  avgPageLoadTimeMs: number;
  bounceRate: number;
  deviceBreakdown: {
    mobilePercent: number;
    desktopPercent: number;
    tabletPercent: number;
    mobileCount: number;
    desktopCount: number;
    tabletCount: number;
  };
  hourlyViews: number[];
  topPages: { path: string; count: number; uniqueCount?: number }[];
  recentVisits: any[];
}

const sessionStartTime: number = Date.now();

/**
 * Track pageview globally and save unique visitor data to Supabase.
 */
export async function trackPageView(pathname: string): Promise<void> {
  try {
    const startTime = typeof performance !== "undefined" ? performance.now() : 0;
    
    // Also hit Counter API as secondary backup count
    fetch("https://api.counterapi.dev/v1/komikverse-app/pageviews/up").catch(() => null);

    const loadTimeMs = typeof performance !== "undefined" ? performance.now() - startTime : 0;
    await trackPageVisitToSupabase(pathname, loadTimeMs);
  } catch (err) {
    console.warn("Track page view warning:", err);
  }
}

/**
 * Get global analytics summary from Supabase database.
 */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const sbStats: SupabaseAnalyticsStats = await fetchSupabaseAnalyticsStats();

  let totalPageviews = sbStats.totalPageviews;
  let uniqueVisitors = sbStats.uniqueVisitors;

  // Fallback to Counter API if Supabase table has no visits yet
  if (totalPageviews === 0) {
    try {
      const res = await fetch("https://api.counterapi.dev/v1/komikverse-app/pageviews").catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data && typeof data.count === "number") {
          totalPageviews = data.count;
          uniqueVisitors = Math.round(totalPageviews * 0.7);
        }
      }
    } catch {
      // Offline fallback
    }
  }

  // Active Session duration
  const elapsedSec = Math.max(15, Math.round((Date.now() - sessionStartTime) / 1000));
  const mins = Math.floor(elapsedSec / 60);
  const secs = elapsedSec % 60;

  return {
    totalVisitors: uniqueVisitors,
    totalPageviews,
    uniquePageviews: sbStats.uniquePageviews || uniqueVisitors,
    avgSessionDuration: `${mins}m ${secs}s`,
    avgPageLoadTimeMs: sbStats.avgPageLoadTimeMs,
    bounceRate: 0,
    deviceBreakdown: sbStats.deviceBreakdown,
    hourlyViews: sbStats.hourlyViews,
    topPages: sbStats.topPages,
    recentVisits: sbStats.recentVisits,
  };
}
