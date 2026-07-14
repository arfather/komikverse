import { useState, useEffect } from "react";
import { Routes, Route, useLocation, useNavigationType } from "react-router-dom";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import Toast from "@/components/ui/Toast";
import Home from "@/pages/Home";
import ComicDetail from "@/pages/ComicDetail";
import ChapterReader from "@/pages/ChapterReader";
import Browse from "@/pages/Browse";

function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (navType !== "POP") {
      window.scrollTo(0, 0);
    }
  }, [pathname, navType]);

  return null;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-void">
      <Navbar />
      {children}
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
