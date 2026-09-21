import { useState, useEffect, useCallback, useRef } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import type { Comic } from "@/lib/data";
import { useChapterPages } from "@/lib/hooks";

interface PageReaderProps {
  comic: Comic;
  chapter: number;
  onAllLoaded?: (allLoaded: boolean) => void;
}

export default function PageReader({ comic, chapter, onAllLoaded }: PageReaderProps) {
  const { pages, isLoading } = useChapterPages(comic, chapter);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isImageFailed, setIsImageFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [showFooter, setShowFooter] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const lastScrollY = useRef(0);
  const [, setLoadedPages] = useState<Set<number>>(new Set());

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 10) {
        setShowFooter(true);
      } else if (currentScrollY > lastScrollY.current + 5) {
        setShowFooter(false);
      } else if (currentScrollY < lastScrollY.current - 5) {
        setShowFooter(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Restore saved page position or reset
  useEffect(() => {
    let initialPage = 0;
    try {
      const key = `komikverse_read_page_${comic.slug}_${chapter}`;
      const savedPageStr = sessionStorage.getItem(key) || localStorage.getItem(key);
      if (savedPageStr) {
        const pageNum = parseInt(savedPageStr, 10);
        if (!isNaN(pageNum) && pageNum >= 1) {
          initialPage = Math.min(pageNum - 1, Math.max(0, pages.length - 1));
        }
      }
    } catch {
      // Ignore storage error
    }

    Promise.resolve().then(() => {
      setCurrentPage(initialPage);
      setIsLoaded(false);
      setIsImageFailed(false);
      setRetryKey(0);
      setLoadedPages(new Set());
      onAllLoaded?.(false);
    });
  }, [comic.slug, chapter, pages.length, onAllLoaded]);

  // Save current page position
  useEffect(() => {
    if (pages.length > 0) {
      try {
        const key = `komikverse_read_page_${comic.slug}_${chapter}`;
        sessionStorage.setItem(key, String(currentPage + 1));
        localStorage.setItem(key, String(currentPage + 1));
      } catch {
        // Ignore storage error
      }
    }
  }, [currentPage, comic.slug, chapter, pages.length]);

  // Reset loading state and error when changing page
  useEffect(() => {
    setIsLoaded(false);
    setIsImageFailed(false);
    setRetryKey(0);
  }, [currentPage]);

  // Disable context menu except on links
  useEffect(() => {
    const preventDefault = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest("a")) return;
      e.preventDefault();
    };
    document.addEventListener("contextmenu", preventDefault);
    return () => document.removeEventListener("contextmenu", preventDefault);
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, pages.length - 1));
  }, [pages.length]);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleRetry = useCallback(() => {
    setIsImageFailed(false);
    setIsLoaded(false);
    setRetryKey((prev) => prev + 1);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          prevPage();
          break;
        case "ArrowRight":
        case " ":
          e.preventDefault();
          nextPage();
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentPage, pages.length, nextPage, prevPage]);

  // Swipe gesture
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) nextPage();
        else prevPage();
      }
    },
    [nextPage, prevPage]
  );

  // Click navigation zones
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left) / rect.width;
      if (x > 0.65) nextPage();
      else if (x < 0.35) prevPage();
    },
    [nextPage, prevPage]
  );

  const handlePageLoaded = useCallback((pageIdx: number) => {
    setLoadedPages((prev) => {
      const next = new Set(prev);
      next.add(pageIdx);
      if (pages.length > 0 && next.size >= pages.length) {
        onAllLoaded?.(true);
      }
      return next;
    });
  }, [pages.length, onAllLoaded]);

  if (pages.length === 0) {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-text-muted gap-3">
          <div className="w-8 h-8 border-4 border-fire border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Memuat halaman...</p>
        </div>
      );
    }
    return null;
  }

  const currentImageSrc = pages[currentPage]
    ? retryKey > 0
      ? `${pages[currentPage]}${pages[currentPage].includes("?") ? "&" : "?"}_retry=${retryKey}_${Date.now()}`
      : pages[currentPage]
    : "";

  return (
    <div
      className="min-h-screen bg-void pt-14 flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      ref={containerRef}
    >
      {/* Main reading area */}
      <div
        className="flex-1 flex items-center justify-center relative cursor-pointer"
        onClick={handleClick}
      >
        {/* Prev zone indicator */}
        <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-gradient-to-r from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />

        {/* Next zone indicator */}
        <div className="absolute right-0 top-0 bottom-0 w-1/4 bg-gradient-to-l from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />

        {/* Page image */}
        <div className="relative max-w-2xl w-full px-4 md:px-0 mx-auto watermark-overlay">
          {!isLoaded && !isImageFailed && (
            <div className="w-full aspect-[2/3] shimmer rounded-lg animate-pulse" />
          )}

          {isImageFailed && (
            <div className="w-full aspect-[2/3] max-h-[calc(100vh-140px)] py-12 px-4 rounded-xl bg-raised/80 border border-border-subtle flex flex-col items-center justify-center gap-3 text-center shadow-lg my-2">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-warm-white">
                  Gagal Memuat Halaman {currentPage + 1}
                </p>
                <p className="text-xs text-text-muted mt-1 max-w-xs">
                  Koneksi internet bermasalah saat mengunduh gambar ini.
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRetry();
                }}
                className="flex items-center gap-2 px-4 py-2 mt-2 rounded-lg bg-fire hover:bg-fire-hover text-white text-xs font-semibold shadow-lg shadow-fire/20 active:scale-95 transition-all cursor-pointer z-20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Muat Ulang Halaman Ini</span>
              </button>
            </div>
          )}

          {!isImageFailed && currentImageSrc && (
            <img
              key={`${currentPage}-${retryKey}`}
              src={currentImageSrc}
              alt={`Halaman ${currentPage + 1}`}
              decoding="async"
              fetchPriority="high"
              className={`w-full max-h-[calc(100vh-140px)] object-contain reader-image select-none rounded-lg ${
                isLoaded ? "block" : "hidden"
              }`}
              onLoad={() => {
                setIsLoaded(true);
                handlePageLoaded(currentPage);
              }}
              onError={() => {
                setIsImageFailed(true);
              }}
              draggable={false}
              style={{ userSelect: "none" } as React.CSSProperties}
            />
          )}

          {/* Preload next page in background */}
          {currentPage < pages.length - 1 && (
            <img
              src={pages[currentPage + 1]}
              alt=""
              decoding="async"
              onLoad={() => handlePageLoaded(currentPage + 1)}
              className="hidden w-0 h-0 absolute pointer-events-none"
              aria-hidden="true"
            />
          )}
          {/* Preload previous page in background */}
          {currentPage > 0 && (
            <img
              src={pages[currentPage - 1]}
              alt=""
              decoding="async"
              onLoad={() => handlePageLoaded(currentPage - 1)}
              className="hidden w-0 h-0 absolute pointer-events-none"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Navigation arrows */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            prevPage();
          }}
          className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-all ${
            currentPage === 0 ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          aria-label="Halaman sebelumnya"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            nextPage();
          }}
          className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-all ${
            currentPage === pages.length - 1
              ? "opacity-0 pointer-events-none"
              : "opacity-100"
          }`}
          aria-label="Halaman berikutnya"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Bottom progress bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 bg-void/95 backdrop-blur-md border-t border-border-subtle transition-transform duration-300 ${
        showFooter ? "translate-y-0" : "translate-y-full"
      }`}>
        <div className="max-w-2xl mx-auto px-4 py-3">
          {/* Progress */}
          <div className="w-full h-1 bg-raised rounded-full mb-2">
            <div
              className="h-full bg-fire rounded-full transition-all duration-300"
              style={{
                width: `${((currentPage + 1) / pages.length) * 100}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>
              Hal. {currentPage + 1} / {pages.length}
            </span>
            <span>{Math.round(((currentPage + 1) / pages.length) * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
