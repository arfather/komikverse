import { useEffect, useRef, useState, useCallback } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import type { Comic } from "@/lib/data";
import { useChapterPages } from "@/lib/hooks";

interface VerticalReaderProps {
  comic: Comic;
  chapter: number;
  onAllLoaded?: (allLoaded: boolean) => void;
}

const getStorageKey = (slug: string, chapter: number) =>
  `komikverse_read_page_${slug}_${chapter}`;

export default function VerticalReader({ comic, chapter, onAllLoaded }: VerticalReaderProps) {
  const { pages, isLoading } = useChapterPages(comic, chapter);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [failedPages, setFailedPages] = useState<Set<number>>(new Set());
  const [retryTokens, setRetryTokens] = useState<Record<number, number>>({});
  
  const savedPageNumber = useRef<number>(1);
  const isRestoringRef = useRef<boolean>(false);
  const userInteractedRef = useRef<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showIndicator, setShowIndicator] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  // Set manual scroll restoration on browser
  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Listen for explicit user gestures to release auto-restoration lock
  useEffect(() => {
    const onUserInteraction = () => {
      userInteractedRef.current = true;
      isRestoringRef.current = false;
    };

    window.addEventListener("wheel", onUserInteraction, { passive: true });
    window.addEventListener("touchmove", onUserInteraction, { passive: true });
    window.addEventListener("keydown", onUserInteraction, { passive: true });
    window.addEventListener("mousedown", onUserInteraction, { passive: true });

    return () => {
      window.removeEventListener("wheel", onUserInteraction);
      window.removeEventListener("touchmove", onUserInteraction);
      window.removeEventListener("keydown", onUserInteraction);
      window.removeEventListener("mousedown", onUserInteraction);
    };
  }, []);

  // Initialize saved page from storage
  useEffect(() => {
    let saved = 1;
    try {
      const key = getStorageKey(comic.slug, chapter);
      const val = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (val) {
        const parsed = parseInt(val, 10);
        if (!isNaN(parsed) && parsed >= 1) {
          saved = parsed;
        }
      }
    } catch {
      // Ignore storage error
    }

    savedPageNumber.current = saved;
    isRestoringRef.current = saved > 1;
    userInteractedRef.current = false;
    setCurrentPage(saved);
    setLoadedPages(new Set());
    setFailedPages(new Set());
    setRetryTokens({});
    setShowIndicator(true);
    onAllLoaded?.(false);
  }, [comic.slug, chapter, onAllLoaded]);

  // Track active page from scroll position accurately for any image size
  const updateActivePageFromScroll = useCallback(() => {
    if (!containerRef.current || pages.length === 0) return;

    const elements = containerRef.current.querySelectorAll<HTMLElement>("[data-index]");
    if (elements.length === 0) return;

    const viewportMid = window.innerHeight * 0.4;
    let activeIndex = 0;

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const rect = el.getBoundingClientRect();
      if (rect.top <= viewportMid) {
        activeIndex = i;
      } else {
        break;
      }
    }

    const activePageNum = activeIndex + 1;
    setCurrentPage(activePageNum);

    // Save position if restoration is completed or user is actively reading/scrolling
    if (!isRestoringRef.current || userInteractedRef.current) {
      try {
        const key = getStorageKey(comic.slug, chapter);
        localStorage.setItem(key, String(activePageNum));
        sessionStorage.setItem(key, String(activePageNum));
      } catch {
        // Ignore storage error
      }
    }
  }, [pages.length, comic.slug, chapter]);

  // Handle scroll events
  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 10) {
        setShowIndicator(true);
      } else if (currentScrollY > lastScrollY.current + 5) {
        setShowIndicator(false);
      } else if (currentScrollY < lastScrollY.current - 5) {
        setShowIndicator(true);
      }

      lastScrollY.current = currentScrollY;
      updateActivePageFromScroll();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [updateActivePageFromScroll]);

  // Restore scroll to target page when pages are loaded
  useEffect(() => {
    if (pages.length === 0) return;

    const targetPage = savedPageNumber.current;
    if (targetPage > 1 && targetPage <= pages.length) {
      const scrollToTarget = () => {
        if (userInteractedRef.current) return;
        const targetEl = containerRef.current?.querySelector<HTMLElement>(
          `[data-index="${targetPage - 1}"]`
        );
        if (targetEl) {
          const top = targetEl.getBoundingClientRect().top + window.scrollY - 56;
          window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
        }
      };

      // Sequentially anchor scroll position to account for DOM insertion & reflow
      scrollToTarget();
      const t1 = setTimeout(scrollToTarget, 50);
      const t2 = setTimeout(scrollToTarget, 150);
      const t3 = setTimeout(scrollToTarget, 300);
      const t4 = setTimeout(scrollToTarget, 600);
      const t5 = setTimeout(() => {
        scrollToTarget();
        isRestoringRef.current = false;
      }, 1200);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(t5);
      };
    } else {
      isRestoringRef.current = false;
    }
  }, [pages.length, comic.slug, chapter]);

  // Disable context menu except on links
  useEffect(() => {
    const preventDefault = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest("a")) return;
      e.preventDefault();
    };
    document.addEventListener("contextmenu", preventDefault);
    return () => document.removeEventListener("contextmenu", preventDefault);
  }, []);

  const handleImageLoad = useCallback((index: number) => {
    setLoadedPages((prev) => {
      const next = new Set(prev);
      next.add(index);
      if (pages.length > 0 && next.size >= pages.length) {
        onAllLoaded?.(true);
      }
      return next;
    });
    setFailedPages((prev) => {
      if (!prev.has(index)) return prev;
      const next = new Set(prev);
      next.delete(index);
      return next;
    });

    // Re-anchor to target page when previous images load and expand height
    if (isRestoringRef.current && !userInteractedRef.current && savedPageNumber.current > 1) {
      const targetEl = containerRef.current?.querySelector<HTMLElement>(
        `[data-index="${savedPageNumber.current - 1}"]`
      );
      if (targetEl) {
        const top = targetEl.getBoundingClientRect().top + window.scrollY - 56;
        window.scrollTo({ top: Math.max(0, top), behavior: "instant" });
      }
    }
  }, [pages.length, onAllLoaded]);

  const handleImageError = useCallback((index: number) => {
    setFailedPages((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
    setLoadedPages((prev) => {
      if (!prev.has(index)) return prev;
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  }, []);

  const handleRetryImage = useCallback((index: number) => {
    setFailedPages((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    setRetryTokens((prev) => ({
      ...prev,
      [index]: (prev[index] || 0) + 1,
    }));
  }, []);

  return (
    <div className="min-h-screen bg-void pt-14" ref={containerRef}>
      {/* Page indicator */}
      <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-black/70 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm text-warm-white pointer-events-none transition-all duration-300 ${
        showIndicator ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}>
        Hal. {currentPage} / {pages.length}
      </div>

      {isLoading && pages.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-text-muted gap-3">
          <div className="w-8 h-8 border-4 border-fire border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Memuat halaman...</p>
        </div>
      )}

      {/* Pages */}
      <div className="max-w-3xl mx-auto py-4 space-y-2">
        {pages.map((pageUrl, index) => {
          const isLoaded = loadedPages.has(index);
          const isFailed = failedPages.has(index);
          const retryCount = retryTokens[index] || 0;
          const imageSrc = retryCount > 0
            ? `${pageUrl}${pageUrl.includes("?") ? "&" : "?"}_retry=${retryCount}_${Date.now()}`
            : pageUrl;

          return (
            <div
              key={index}
              data-index={index}
              className="relative w-full min-h-[200px] watermark-overlay"
            >
              {!isLoaded && !isFailed && (
                <div className="w-full aspect-[2/3] shimmer rounded-lg animate-pulse" />
              )}

              {isFailed && (
                <div className="w-full min-h-[280px] py-10 px-4 rounded-xl bg-raised/80 border border-border-subtle flex flex-col items-center justify-center gap-3 text-center shadow-lg my-2">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-warm-white">
                      Gagal Memuat Halaman {index + 1}
                    </p>
                    <p className="text-xs text-text-muted mt-1 max-w-xs">
                      Koneksi internet bermasalah saat mengunduh gambar ini.
                    </p>
                  </div>
                  <button
                    onClick={() => handleRetryImage(index)}
                    className="flex items-center gap-2 px-4 py-2 mt-2 rounded-lg bg-fire hover:bg-fire-hover text-white text-xs font-semibold shadow-lg shadow-fire/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Muat Ulang Halaman Ini</span>
                  </button>
                </div>
              )}

              {!isFailed && (
                <img
                  key={`${index}-${retryCount}`}
                  src={imageSrc}
                  alt={`Halaman ${index + 1}`}
                  loading={index < 3 ? "eager" : "lazy"}
                  decoding="async"
                  fetchPriority={index === 0 ? "high" : "auto"}
                  className={`w-full reader-image select-none transition-opacity duration-300 ${
                    isLoaded ? "opacity-100 relative z-10" : "opacity-0 absolute inset-0 pointer-events-none"
                  }`}
                  onLoad={() => handleImageLoad(index)}
                  onError={() => handleImageError(index)}
                  draggable={false}
                  style={{ userSelect: "none" } as React.CSSProperties}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
