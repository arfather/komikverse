import { useState, useEffect, useCallback, useRef } from "react";
import type { Comic } from "@/lib/data";
import { useChapterPages } from "@/lib/hooks";

interface PageReaderProps {
  comic: Comic;
  chapter: number;
}

export default function PageReader({ comic, chapter }: PageReaderProps) {
  const { pages, isLoading } = useChapterPages(comic, chapter);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  useEffect(() => {
    Promise.resolve().then(() => {
      setCurrentPage(0);
      setIsLoaded(false);
    });
  }, [comic.slug, chapter]);

  // Disable context menu
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", preventDefault);
    return () => document.removeEventListener("contextmenu", preventDefault);
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, pages.length - 1));
  }, [pages.length]);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
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
        <div className="relative max-w-2xl w-full mx-4 watermark-overlay">
          {!isLoaded && <div className="w-full aspect-[2/3] shimmer rounded-lg" />}
          <img
            src={pages[currentPage]}
            alt={`Halaman ${currentPage + 1}`}
            className={`w-full max-h-[calc(100vh-140px)] object-contain reader-image select-none rounded-lg ${
              isLoaded ? "block" : "hidden"
            }`}
            onLoad={() => setIsLoaded(true)}
            draggable={false}
            style={{ userSelect: "none" } as React.CSSProperties}
          />
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
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-void/95 backdrop-blur-md border-t border-border-subtle">
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
