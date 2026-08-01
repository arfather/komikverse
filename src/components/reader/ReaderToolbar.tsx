import { useState, useEffect, useCallback, useRef } from "react";
import {
  ArrowLeft,
  Settings,
  Maximize,
  Minimize,
  ChevronDown,
  Bookmark,
  Play,
  Pause,
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
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState<1 | 2 | 3 | 4 | 5>(1);
  const animationFrameRef = useRef<number | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastScrollY = useRef(0);
  const toggleBookmark = useStore((s) => s.toggleBookmark);
  const isBookmarked = useStore((s) => s.isBookmarked(comic.id));

  // Auto scroll loop with 5 speed levels
  useEffect(() => {
    if (!isAutoScrolling) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const originalScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";

    const SPEED_STEPS: Record<number, number> = {
      1: 2,
      2: 4,
      3: 8,
      4: 10,
      5: 13,
    };

    const step = SPEED_STEPS[autoScrollSpeed] || 2;

    const scrollStep = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 15) {
        setIsAutoScrolling(false);
        return;
      }
      window.scrollBy({ top: step, behavior: "instant" as ScrollBehavior });
      animationFrameRef.current = requestAnimationFrame(scrollStep);
    };

    animationFrameRef.current = requestAnimationFrame(scrollStep);

    return () => {
      document.documentElement.style.scrollBehavior = originalScrollBehavior;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isAutoScrolling, autoScrollSpeed]);

  const resetIdleTimer = useCallback(() => {
    setIsVisible(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setIsVisible(false), 3000);
  }, []);

  useEffect(() => {
    if (isAutoScrolling) {
      setIsVisible(true);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      return;
    }

    const events = ["mousemove", "click", "touchstart"];
    events.forEach((e) => document.addEventListener(e, resetIdleTimer));
    
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setIsVisible(false), 3000);

    return () => {
      events.forEach((e) => document.removeEventListener(e, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer, isAutoScrolling]);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const handleScroll = () => {
      if (isAutoScrolling) {
        setIsVisible(true);
        return;
      }

      const currentScrollY = window.scrollY;

      if (currentScrollY <= 10) {
        setIsVisible(true);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      } else if (currentScrollY > lastScrollY.current + 5) {
        setIsVisible(false);
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      } else if (currentScrollY < lastScrollY.current - 5) {
        resetIdleTimer();
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [resetIdleTimer, isAutoScrolling]);

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
          <div className="flex items-center gap-1.5">
            {/* Auto Scroll Controls */}
            <div className="flex items-center gap-1 bg-raised/90 border border-border-subtle rounded-lg p-0.5">
              <button
                onClick={() => setIsAutoScrolling(!isAutoScrolling)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  isAutoScrolling
                    ? "bg-fire text-white shadow-bloom"
                    : "text-text-muted hover:text-warm-white hover:bg-panel"
                }`}
                aria-label={isAutoScrolling ? "Hentikan Auto Scroll" : "Mulai Auto Scroll"}
                title={isAutoScrolling ? "Pause Auto Scroll" : "Mulai Auto Scroll"}
              >
                {isAutoScrolling ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span className="hidden sm:inline">
                  {isAutoScrolling ? "Pause" : "Auto Scroll"}
                </span>
              </button>

              <button
                onClick={() =>
                  setAutoScrollSpeed((prev) => (prev >= 5 ? 1 : ((prev + 1) as 1 | 2 | 3 | 4 | 5)))
                }
                className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-void text-fire border border-fire/30 hover:bg-fire/10 transition-colors"
                title="Kecepatan Auto Scroll (1x - 5x)"
              >
                {autoScrollSpeed}x
              </button>
            </div>

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
