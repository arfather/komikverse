import { useEffect, useRef, useState, useCallback } from "react";
import type { Comic } from "@/lib/data";
import { useChapterPages } from "@/lib/hooks";

interface VerticalReaderProps {
  comic: Comic;
  chapter: number;
}

export default function VerticalReader({ comic, chapter }: VerticalReaderProps) {
  const { pages, isLoading } = useChapterPages(comic, chapter);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.resolve().then(() => {
      setLoadedPages(new Set());
      setCurrentPage(1);
    });
  }, [comic.slug, chapter]);

  // Disable context menu and text selection
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", preventDefault);
    return () => document.removeEventListener("contextmenu", preventDefault);
  }, []);

  // IntersectionObserver for lazy loading and page tracking
  useEffect(() => {
    if (!containerRef.current) return;

    const observers: IntersectionObserver[] = [];

    // Lazy loading observer
    const loadObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(idx)) {
              setLoadedPages((prev) => new Set(prev).add(idx));
            }
          }
        });
      },
      { rootMargin: "200px" }
    );

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
      loadObserver.observe(el);
      trackObserver.observe(el);
    });

    observers.push(loadObserver, trackObserver);

    return () => {
      observers.forEach((o) => o.disconnect());
    };
  }, [pages]);

  const handleImageLoad = useCallback((index: number) => {
    setLoadedPages((prev) => new Set(prev).add(index));
  }, []);

  return (
    <div className="min-h-screen bg-void pt-14" ref={containerRef}>
      {/* Page indicator */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 bg-black/70 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm text-warm-white pointer-events-none">
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
        {pages.map((pageUrl, index) => (
          <div
            key={index}
            data-index={index}
            className="relative w-full watermark-overlay"
          >
            {!loadedPages.has(index) && (
              <div className="w-full aspect-[2/3] shimmer rounded-lg" />
            )}
            <img
              src={pageUrl}
              alt={`Halaman ${index + 1}`}
              className={`w-full reader-image select-none ${
                loadedPages.has(index) ? "block" : "hidden"
              }`}
              onLoad={() => handleImageLoad(index)}
              draggable={false}
              style={{ userSelect: "none" } as React.CSSProperties}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
