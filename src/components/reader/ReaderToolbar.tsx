import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Settings,
  Maximize,
  Minimize,
  ChevronDown,
  Bookmark,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useStore } from "@/lib/store";
import type { Comic } from "@/lib/data";

interface ReaderToolbarProps {
  comic: Comic;
  currentChapter: number;
  onSettingsToggle: () => void;
}

export default function ReaderToolbar({
  comic,
  currentChapter,
  onSettingsToggle,
}: ReaderToolbarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toggleBookmark = useStore((s) => s.toggleBookmark);
  const isBookmarked = useStore((s) => s.isBookmarked(comic.id));

  const resetIdleTimer = useCallback(() => {
    setIsVisible(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setIsVisible(false), 3000);
  }, []);

  useEffect(() => {
    const events = ["mousemove", "click", "touchstart", "scroll"];
    events.forEach((e) => document.addEventListener(e, resetIdleTimer));
    resetIdleTimer();

    return () => {
      events.forEach((e) => document.removeEventListener(e, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const chapter = comic.chapters.find((c) => c.number === currentChapter);

  return (
    <>
      {/* Top Toolbar */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-void/95 backdrop-blur-md border-b border-border-subtle transition-transform duration-300 ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left */}
          <div className="flex items-center gap-3">
            <Link
              to={`/comic/${comic.slug}`}
              className="p-2 rounded-lg hover:bg-raised transition-colors"
              aria-label="Kembali ke detail"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="hidden sm:block">
              <p className="text-sm font-bold truncate max-w-xs">
                {comic.title}
              </p>
            </div>
          </div>

          {/* Center */}
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span className="font-semibold text-warm-white">
              Ch. {currentChapter}
            </span>
            <ChevronDown className="w-4 h-4" />
            {chapter && (
              <span className="hidden md:inline">{chapter.title}</span>
            )}
          </div>

          {/* Right */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleBookmark(comic.id)}
              className="p-2 rounded-lg hover:bg-raised transition-colors"
              aria-label={isBookmarked ? "Hapus bookmark" : "Bookmark"}
            >
              <Bookmark
                className={`w-5 h-5 ${isBookmarked ? "text-fire fill-fire" : ""}`}
              />
            </button>
            <button
              onClick={onSettingsToggle}
              className="p-2 rounded-lg hover:bg-raised transition-colors"
              aria-label="Pengaturan"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-raised transition-colors"
              aria-label={isFullscreen ? "Keluar fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
