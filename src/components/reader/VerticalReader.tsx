import { useEffect, useRef, useState, useCallback } from "react";
import type { Comic } from "@/lib/data";
import { useChapterPages } from "@/lib/hooks";

interface VerticalReaderProps {
  comic: Comic;
  chapter: number;
  onAllLoaded?: (allLoaded: boolean) => void;
}

export default function VerticalReader({ comic, chapter, onAllLoaded }: VerticalReaderProps) {
  const { pages, isLoading } = useChapterPages(comic, chapter);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [showIndicator, setShowIndicator] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    Promise.resolve().then(() => {
      setLoadedPages(new Set());
      setCurrentPage(1);
      setShowIndicator(true);
      onAllLoaded?.(false);
    });
  }, [comic.slug, chapter, onAllLoaded]);

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
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Disable context menu except on links
  useEffect(() => {
    const preventDefault = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest("a")) return;
      e.preventDefault();
    };
    document.addEventListener("contextmenu", preventDefault);
    return () => document.removeEventListener("contextmenu", preventDefault);
  }, []);

  // IntersectionObserver for page tracking
  useEffect(() => {
    if (!containerRef.current) return;

    // Page tracking observer
    const trackObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(idx)) {
              setCurrentPage(idx + 1);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const elements = containerRef.current.querySelectorAll("[data-index]");
    elements.forEach((el) => {
      trackObserver.observe(el);
    });

    return () => {
      trackObserver.disconnect();
    };
  }, [pages]);

  const handleImageLoad = useCallback((index: number) => {
    setLoadedPages((prev) => {
      const next = new Set(prev);
      next.add(index);
      if (pages.length > 0 && next.size >= pages.length) {
        onAllLoaded?.(true);
      }
      return next;
    });
  }, [pages.length, onAllLoaded]);

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
      <div className="max-w-3xl mx-auto py-4 space-y-1">
        {pages.map((pageUrl, index) => {
          const isLoaded = loadedPages.has(index);

          return (
            <div
              key={index}
              data-index={index}
              className="relative w-full min-h-[200px] watermark-overlay"
            >
              {!isLoaded && (
                <div className="w-full aspect-[2/3] shimmer rounded-lg animate-pulse" />
              )}
              <img
                src={pageUrl}
                alt={`Halaman ${index + 1}`}
                loading={index < 3 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={index === 0 ? "high" : "auto"}
                className={`w-full reader-image select-none transition-opacity duration-300 ${
                  isLoaded ? "opacity-100 relative z-10" : "opacity-0 absolute inset-0 pointer-events-none"
                }`}
                onLoad={() => handleImageLoad(index)}
                onError={() => handleImageLoad(index)}
                draggable={false}
                style={{ userSelect: "none" } as React.CSSProperties}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
