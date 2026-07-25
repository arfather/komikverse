import { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigationType } from "react-router-dom";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import Toast from "@/components/ui/Toast";
import AdSlot, { GlobalAdScripts } from "@/components/ads/AdSlot";
import Home from "@/pages/Home";
import ComicDetail from "@/pages/ComicDetail";
import ChapterReader from "@/pages/ChapterReader";
import Browse from "@/pages/Browse";
import { ShieldAlert } from "lucide-react";
import Audience from "@/pages/Audience";
import { trackPageView } from "@/lib/tracker";

const SENSITIVE_PATH_REGEX = /(\.env|\.git|\.config|\.htaccess|wp-config|wp-admin|phpmyadmin|\.aws)/i;

function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    trackPageView(pathname);
    if (navType !== "POP") {
      window.scrollTo(0, 0);
    }
  }, [pathname, navType]);

  return null;
}

const ADSTERRA_NATIVE_ID = "46b09ded0328b767c450d184ed63a2bd";
const ADSTERRA_NATIVE_SCRIPT = "https://pl30533662.effectivecpmnetwork.com/46b09ded0328b767c450d184ed63a2bd/invoke.js";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-void flex flex-col">
      <Navbar />
      <div className="pt-16">
        <AdSlot
          position="header"
          nativeBannerId={ADSTERRA_NATIVE_ID}
          nativeScriptUrl={ADSTERRA_NATIVE_SCRIPT}
          className="px-4"
        />
      </div>
      <main className="flex-1">{children}</main>
      <AdSlot
        position="footer"
        nativeBannerId={ADSTERRA_NATIVE_ID}
        nativeScriptUrl={ADSTERRA_NATIVE_SCRIPT}
        className="px-4"
      />
      <Footer />
      <Toast />
    </div>
  );
}

export default function App() {
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    const handleErr = (e: ErrorEvent) => {
      setGlobalError(e.message || "Unknown error occurred");
    };
    const handleRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      const msg = reason instanceof Error ? reason.message : String(reason);
      setGlobalError(msg || "Unhandled Promise Rejection");
    };
    window.addEventListener("error", handleErr);
    window.addEventListener("unhandledrejection", handleRejection);
    return () => {
      window.removeEventListener("error", handleErr);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  // Production Security Guard: Disable Right Click & Inspect Element on Production Only
  useEffect(() => {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "[::1]";

    if (!isLocalhost) {
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (
          e.key === "F12" ||
          (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j")) ||
          (e.ctrlKey && (e.key === "u" || e.key === "U")) ||
          (e.metaKey && e.altKey && (e.key === "i" || e.key === "I" || e.key === "j" || e.key === "J"))
        ) {
          e.preventDefault();
        }
      };

      window.addEventListener("contextmenu", handleContextMenu);
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("contextmenu", handleContextMenu);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, []);

  if (typeof window !== "undefined" && SENSITIVE_PATH_REGEX.test(window.location.pathname)) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-red-950/40 border border-red-800/80 rounded-2xl p-8 text-center space-y-4 shadow-2xl animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-red-900/40 border border-red-700 flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="font-display text-4xl text-red-400">403 FORBIDDEN</h1>
          <p className="text-xs text-red-200/80 leading-relaxed">
            Akses ke file konfigurasi atau jalur sensitif dilarang keras oleh sistem keamanan aplikasi.
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-bold text-xs transition-colors"
          >
            Kembali ke Beranda
          </a>
        </div>
      </div>
    );
  }

  if (globalError) {
    return (
      <div className="min-h-screen bg-red-950 text-red-100 p-8 font-mono flex items-center justify-center">
        <div className="max-w-2xl w-full bg-red-900/30 border border-red-800 p-6 rounded-xl shadow-2xl">
          <h1 className="text-2xl font-bold mb-4 text-red-400">🔴 Browser Runtime Error</h1>
          <p className="text-sm bg-red-950/80 p-4 rounded border border-red-900 overflow-auto max-h-60 mb-6">{globalError}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white font-sans font-bold rounded-lg transition-colors">
            Reload Halaman
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <GlobalAdScripts />
      <ScrollToTop />
      <Routes>
      <Route
        path="/"
        element={
          <Layout>
            <Home />
          </Layout>
        }
      />
      <Route
        path="/comic/:slug"
        element={
          <Layout>
            <ComicDetail />
          </Layout>
        }
      />
      <Route path="/comic/:slug/:chapter" element={<ChapterReader />} />
      <Route
        path="/browse"
        element={
          <Layout>
            <Browse />
          </Layout>
        }
      />
      <Route
        path="/audience"
        element={
          <Layout>
            <Audience />
          </Layout>
        }
      />
      <Route
        path="*"
        element={
          <Layout>
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="font-display text-6xl text-fire mb-4">404</h1>
                <p className="text-text-muted mb-6">
                  Halaman tidak ditemukan.
                </p>
                <a
                  href="/"
                  className="px-6 py-3 bg-fire hover:bg-fire-glow text-white font-bold rounded-lg transition-colors"
                >
                  Kembali ke Beranda
                </a>
              </div>
            </div>
          </Layout>
        }
      />
    </Routes>
  </>)
}
