import React, { useState, useEffect, useCallback } from "react";
import {
  Lock,
  ShieldCheck,
  Users,
  Eye,
  TrendingUp,
  DollarSign,
  Smartphone,
  Monitor,
  Globe,
  RefreshCw,
  LogOut,
  AlertCircle,
  ArrowUpRight,
  Clock,
  Key,
  CheckCircle2,
} from "lucide-react";
import {
  getAnalyticsSummary,
  getAdsterraApiKey,
  setAdsterraApiKey,
  fetchAdsterraStats,
} from "@/lib/tracker";
import type { AnalyticsSummary, AdsterraStats } from "@/lib/tracker";

// SHA-256 hash for password "guanteng"
const TARGET_PASSWORD_HASH = "870d06159ca2d5fcd580c850239cf2e4d2bfb264ee933a2ef33d596e1b8bdf71";

async function computeSHA256(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function Audience() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>(
    new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  );

  // Real Analytics & Adsterra States
  const [analyticsData, setAnalyticsData] = useState<AnalyticsSummary>({
    totalVisitors: 0,
    totalPageviews: 0,
    avgSessionDuration: "0m 0s",
    bounceRate: 0,
    deviceBreakdown: { mobilePercent: 0, desktopPercent: 0, mobileCount: 0, desktopCount: 0 },
    hourlyViews: new Array(24).fill(0),
  });
  const [adsterraKeyInput, setAdsterraKeyInput] = useState<string>(getAdsterraApiKey());
  const [adsterraStats, setAdsterraStats] = useState<AdsterraStats | null>(null);
  const [isSavingKey, setIsSavingKey] = useState<boolean>(false);
  const [keySavedNotice, setKeySavedNotice] = useState<boolean>(false);

  // Check existing session
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem("kv_aud_auth");
    if (sessionAuth === "true_authenticated_guanteng") {
      setIsAuthenticated(true);
    }
  }, []);

  const loadRealStats = useCallback(async () => {
    setIsRefreshing(true);

    const savedKey = getAdsterraApiKey();
    let stats: AdsterraStats | null = null;
    if (savedKey) {
      stats = await fetchAdsterraStats(savedKey);
      if (stats) setAdsterraStats(stats);
    }

    const internalSummary = await getAnalyticsSummary(stats);
    setAnalyticsData(internalSummary);

    setTimeout(() => {
      setLastRefreshed(
        new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
      setIsRefreshing(false);
    }, 400);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadRealStats();
    }
  }, [isAuthenticated, loadRealStats]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (attemptsLeft <= 0) {
      setErrorMessage("Terlalu banyak percobaan salah! Halaman terkunci.");
      return;
    }

    if (!passwordInput) {
      setErrorMessage("Masukkan key-password terlebih dahulu!");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const hashedInput = await computeSHA256(passwordInput);

      if (hashedInput === TARGET_PASSWORD_HASH || passwordInput.trim() === "guanteng") {
        setIsAuthenticated(true);
        sessionStorage.setItem("kv_aud_auth", "true_authenticated_guanteng");
        setPasswordInput("");
        setErrorMessage(null);
      } else {
        const nextAttempts = attemptsLeft - 1;
        setAttemptsLeft(nextAttempts);
        if (nextAttempts <= 0) {
          setErrorMessage("Akses Ditolak! Terlalu banyak percobaan salah.");
        } else {
          setErrorMessage(`Key-password salah! Sisa percobaan: ${nextAttempts}`);
        }
      }
    } catch {
      setErrorMessage("Terjadi kesalahan sistem verifikasi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAdsterraKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingKey(true);
    setAdsterraApiKey(adsterraKeyInput);
    setKeySavedNotice(true);

    const stats = await fetchAdsterraStats(adsterraKeyInput);
    if (stats) {
      setAdsterraStats(stats);
    }

    setTimeout(() => {
      setIsSavingKey(false);
      setTimeout(() => setKeySavedNotice(false), 3000);
    }, 500);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("kv_aud_auth");
    setIsAuthenticated(false);
    setAttemptsLeft(5);
    setPasswordInput("");
  };

  // Render Password Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-panel/80 backdrop-blur-xl border border-border-subtle rounded-2xl p-8 shadow-2xl relative overflow-hidden animate-fade-in-up">
          <div className="absolute top-0 right-0 p-8 w-32 h-32 bg-fire/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-fire/10 border border-fire/30 flex items-center justify-center mx-auto mb-4 text-fire shadow-lg shadow-fire/10">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="font-display text-2xl tracking-wide text-warm-white mb-2">
              AUDIENCE ANALYTICS
            </h1>
            <p className="text-xs text-text-muted">
              Masukkan key-password rahasia untuk mengakses dashboard analisa website.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider">
                Key-Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Masukkan password..."
                  disabled={attemptsLeft <= 0 || isSubmitting}
                  className="w-full bg-raised border border-border-subtle rounded-xl px-4 py-3 text-warm-white placeholder:text-text-muted/50 text-sm focus:outline-none focus:border-fire transition-colors disabled:opacity-50"
                  autoFocus
                />
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={attemptsLeft <= 0 || isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-fire hover:bg-fire-glow text-warm-white font-bold text-sm shadow-lg shadow-fire/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Buka Akses Dashboard</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-border-subtle/50 text-center">
            <p className="text-[11px] text-text-muted/60">
              Sistem Keamanan Terenkripsi KomikVerse Analytics
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate max view for chart scaling
  const maxHourlyView = Math.max(...analyticsData.hourlyViews, 1);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-panel/60 backdrop-blur-md border border-border-subtle rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-3xl tracking-wide text-warm-white">
              ANALISA AUDIENS & TRAFFIC
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
              REALTIME TRACKER
            </span>
          </div>
          <p className="text-xs text-text-muted">
            Memantau statistik pengunjung asli, aktivitas membaca komik, dan estimasi pendapatan Adsterra.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadRealStats}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-raised border border-border-subtle text-xs font-semibold text-text-muted hover:text-warm-white hover:border-fire transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-fire" : ""}`} />
            <span>Refreshed ({lastRefreshed})</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-950/40 border border-red-800/60 text-xs font-semibold text-red-300 hover:bg-red-900/60 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Kunci Kembali</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Real Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Visitors */}
        <div className="bg-raised/80 border border-border-subtle rounded-2xl p-5 hover:border-fire/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase text-text-muted tracking-wider">
              Pengunjung Unik (Real)
            </span>
            <div className="p-2 rounded-xl bg-fire/10 text-fire">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-warm-white">
              {analyticsData.totalVisitors.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-green-400 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> Live
            </span>
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            Pencatatan sesi pengunjung aktif
          </p>
        </div>

        {/* Total Pageviews */}
        <div className="bg-raised/80 border border-border-subtle rounded-2xl p-5 hover:border-fire/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase text-text-muted tracking-wider">
              Total Pageviews (Real)
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-warm-white">
              {analyticsData.totalPageviews.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-green-400 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> Live
            </span>
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            Impresi pembacaan halaman & chapter
          </p>
        </div>

        {/* Avg Session Duration */}
        <div className="bg-raised/80 border border-border-subtle rounded-2xl p-5 hover:border-fire/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase text-text-muted tracking-wider">
              Rata-rata Durasi (Real)
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-warm-white">
              {analyticsData.avgSessionDuration}
            </span>
            <span className="text-xs font-bold text-green-400 flex items-center">
              <ArrowUpRight className="w-3 h-3" /> Live
            </span>
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            Waktu rata-rata membaca aktual
          </p>
        </div>

        {/* Adsterra Revenue */}
        <div className="bg-raised/80 border border-border-subtle rounded-2xl p-5 hover:border-fire/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase text-text-muted tracking-wider">
              Pendapatan Adsterra ($)
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display text-amber-400">
              ${adsterraStats ? adsterraStats.revenue.toFixed(2) : "0.00"}
            </span>
            <span className="text-xs font-bold text-green-400 flex items-center">
              {adsterraStats ? `${adsterraStats.impressions} Views` : "Pending API"}
            </span>
          </div>
          <p className="text-[11px] text-text-muted mt-2">
            {adsterraStats ? `eCPM: $${adsterraStats.cpm.toFixed(2)}` : "Masukkan Adsterra API Key di bawah"}
          </p>
        </div>
      </div>

      {/* Adsterra API Key Setting Box */}
      <div className="bg-panel/80 border border-border-subtle rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-fire/10 text-fire mt-0.5">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg tracking-wide text-warm-white">
                KONEKSI ADSTERRA STATISTICS API
              </h2>
              <p className="text-xs text-text-muted">
                Masukkan Adsterra Statistics API Key dari dashboard Adsterra (Menu API ➔ Copy Key) untuk menampilkan pendapatan ($) & impresi asli.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveAdsterraKey} className="flex items-center gap-2">
            <input
              type="text"
              value={adsterraKeyInput}
              onChange={(e) => setAdsterraKeyInput(e.target.value)}
              placeholder="Paste Adsterra API Key..."
              className="bg-raised border border-border-subtle rounded-xl px-3 py-2 text-xs text-warm-white placeholder:text-text-muted/50 focus:outline-none focus:border-fire w-64"
            />
            <button
              type="submit"
              disabled={isSavingKey}
              className="px-4 py-2 rounded-xl bg-fire hover:bg-fire-glow text-white font-bold text-xs shadow-md shadow-fire/20 transition-all flex items-center gap-1.5 whitespace-nowrap"
            >
              {isSavingKey ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simpan API Key</span>
                </>
              )}
            </button>
          </form>
        </div>

        {keySavedNotice && (
          <div className="mt-3 text-xs text-green-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Adsterra API Key berhasil disimpan! Menghubungkan ke server Adsterra...</span>
          </div>
        )}
      </div>

      {/* Main Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real Hourly Traffic Visual Chart */}
        <div className="lg:col-span-2 bg-panel/60 border border-border-subtle rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl tracking-wide text-warm-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-fire" />
                Grafik Kunjungan Real-Time (24 Jam)
              </h2>
              <p className="text-xs text-text-muted">
                Jumlah pembacaan aktual yang tercatat per jam oleh internal tracker.
              </p>
            </div>
          </div>

          <div className="h-64 flex items-end gap-2 pt-8 pb-2 px-2 border-b border-border-subtle/40">
            {analyticsData.hourlyViews.map((val, idx) => {
              const heightPercent = Math.max(Math.round((val / maxHourlyView) * 100), 5);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-gradient-to-t from-fire/30 to-fire rounded-t group-hover:from-fire group-hover:to-fire-glow transition-all relative"
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-void text-warm-white text-[10px] py-0.5 px-1.5 rounded border border-border-subtle whitespace-nowrap pointer-events-none transition-opacity">
                      {val} pageviews
                    </div>
                  </div>
                  <span className="text-[9px] text-text-muted">
                    {idx % 4 === 0 ? `${String(idx).padStart(2, "0")}:00` : ""}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2 text-center text-xs">
            <div className="p-3 bg-raised/50 rounded-xl border border-border-subtle/50">
              <span className="text-text-muted block text-[11px]">Total Views Hari Ini</span>
              <span className="font-bold text-warm-white">{analyticsData.totalPageviews}</span>
            </div>
            <div className="p-3 bg-raised/50 rounded-xl border border-border-subtle/50">
              <span className="text-text-muted block text-[11px]">Total Visitors</span>
              <span className="font-bold text-warm-white">{analyticsData.totalVisitors}</span>
            </div>
            <div className="p-3 bg-raised/50 rounded-xl border border-border-subtle/50">
              <span className="text-text-muted block text-[11px]">Bounce Rate</span>
              <span className="font-bold text-green-400">{analyticsData.bounceRate}%</span>
            </div>
          </div>
        </div>

        {/* Device & Country Distribution */}
        <div className="bg-panel/60 border border-border-subtle rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="font-display text-xl tracking-wide text-warm-white flex items-center gap-2 mb-4">
              <Smartphone className="w-5 h-5 text-fire" />
              Perangkat Pengunjung (Real)
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-warm-white flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-fire" /> Mobile (Smartphone)
                  </span>
                  <span className="text-text-muted">
                    {analyticsData.deviceBreakdown.mobilePercent}% ({analyticsData.deviceBreakdown.mobileCount})
                  </span>
                </div>
                <div className="w-full bg-raised rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-fire h-full rounded-full transition-all"
                    style={{ width: `${analyticsData.deviceBreakdown.mobilePercent}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-warm-white flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-blue-400" /> Desktop & Laptop
                  </span>
                  <span className="text-text-muted">
                    {analyticsData.deviceBreakdown.desktopPercent}% ({analyticsData.deviceBreakdown.desktopCount})
                  </span>
                </div>
                <div className="w-full bg-raised rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-400 h-full rounded-full transition-all"
                    style={{ width: `${analyticsData.deviceBreakdown.desktopPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle/50">
            <h3 className="font-display text-lg tracking-wide text-warm-white flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-fire" />
              Negara Pembaca
            </h3>
            <div className="space-y-2.5 text-xs">
              {[
                { country: "🇮🇩 Indonesia", percent: analyticsData.totalVisitors > 0 ? 100 : 0 },
                { country: "🇲🇾 Malaysia", percent: 0 },
                { country: "🇸🇬 Singapura", percent: 0 },
                { country: "🌍 Lainnya", percent: 0 },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-raised/40">
                  <span className="font-medium text-warm-white">{item.country}</span>
                  <div className="flex items-center gap-2 text-text-muted">
                    <span className="font-bold text-fire">{item.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
