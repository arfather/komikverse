import { useEffect } from "react";
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
