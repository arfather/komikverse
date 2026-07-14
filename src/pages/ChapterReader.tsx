import { useState, useMemo, useEffect } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Type,
  Monitor,
  BookOpen,
  Sun,
  Moon,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { getComicBySlug } from "@/lib/data";
import { sanitizeSlug, sanitizeChapterNum } from "@/lib/sanitize";
import { useStore } from "@/lib/store";
import ReaderToolbar from "@/components/reader/ReaderToolbar";
import VerticalReader from "@/components/reader/VerticalReader";
import PageReader from "@/components/reader/PageReader";

export default function ChapterReader() {
  const { slug, chapter } = useParams<{ slug: string; chapter: string }>();
  const [showSettings, setShowSettings] = useState(false);
  const readerSettings = useStore((s) => s.readerSettings);
  const updateReaderSettings = useStore((s) => s.updateReaderSettings);

  // Security: validate both slug and chapter
  const validSlug = useMemo(() => sanitizeSlug(slug), [slug]);
  const validChapter = useMemo(
    () => sanitizeChapterNum(chapter),
    [chapter]
  );

  const loadedComics = useStore((s) => s.loadedComics);
  const fetchComic = useStore((s) => s.fetchComic);
  const isLoading = useStore((s) => s.isLoadingComic);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  useEffect(() => {
    if (validSlug) {
      fetchComic(validSlug).then(() => {
        setHasAttemptedFetch(true);
      });
    }
  }, [validSlug, fetchComic]);

  const comic = validSlug ? (loadedComics[validSlug] || getComicBySlug(validSlug)) : undefined;

  const chapterExists = useMemo(() => {
    return comic ? comic.chapters.some((c) => c.number === validChapter) : false;
  }, [comic, validChapter]);

  const markChapterAsRead = useStore((s) => s.markChapterAsRead);
  const updateReadingProgress = useStore((s) => s.updateReadingProgress);

  useEffect(() => {
    if (comic && chapterExists) {
      markChapterAsRead(comic.id, validChapter);
      updateReadingProgress(comic.id, validChapter, 100);
    }
  }, [comic, chapterExists, validChapter, markChapterAsRead, updateReadingProgress]);

  if (!validSlug || Number.isNaN(validChapter)) {
    return <Navigate to="/404" replace />;
  }

  if (!hasAttemptedFetch || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-fire border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">Memuat data komik...</p>
        </div>
      </div>
    );
  }

  if (!comic) {
    return <Navigate to="/404" replace />;
  }

  // Check if chapter exists
  if (!chapterExists) {
    return <Navigate to={`/comic/${validSlug}`} replace />;
  }

  const currentIndex = comic.chapters.findIndex(
    (c) => c.number === validChapter
  );
  const prevChapter =
    currentIndex < comic.chapters.length - 1
      ? comic.chapters[currentIndex + 1]
      : null;
  const nextChapter = currentIndex > 0 ? comic.chapters[currentIndex - 1] : null;

  const widthClasses = {
    narrow: "max-w-2xl",
    medium: "max-w-4xl",
    wide: "max-w-6xl",
  };

  const bgClasses = {
    black: "bg-void",
    gray: "bg-[#1a1a2e]",
    white: "bg-[#f0f0f0]",
  };

  return (
    <div
      className={`min-h-screen ${bgClasses[readerSettings.bgColor]} relative overflow-x-hidden`}
    >
      {/* Brightness overlay */}
      {readerSettings.brightness > 0 && (
        <div
          className="fixed inset-0 z-30 pointer-events-none bg-black transition-opacity"
          style={{ opacity: readerSettings.brightness / 100 }}
        />
      )}

      {/* Toolbar */}
      <ReaderToolbar
        comic={comic}
        currentChapter={validChapter}
        onSettingsToggle={() => setShowSettings(!showSettings)}
      />

      {/* Reader Content */}
      <div className={`mx-auto ${widthClasses[readerSettings.contentWidth]}`}>
        {readerSettings.mode === "vertical" && (
          <VerticalReader comic={comic} chapter={validChapter} />
        )}
        {(readerSettings.mode === "page" || readerSettings.mode === "dual") && (
          <PageReader comic={comic} chapter={validChapter} />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-void/95 backdrop-blur-md border-t border-border-subtle">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          {prevChapter ? (
            <Link
              to={`/comic/${comic.slug}/${prevChapter.number}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-raised hover:bg-fire/20 text-warm-white text-sm font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev</span>
            </Link>
          ) : (
            <div className="w-20" />
          )}

          <Link
            to={`/comic/${comic.slug}`}
            className="text-sm text-text-muted hover:text-warm-white transition-colors text-center"
          >
            Ch. {validChapter}
          </Link>

          {nextChapter ? (
            <Link
              to={`/comic/${comic.slug}/${nextChapter.number}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-raised hover:bg-fire/20 text-warm-white text-sm font-semibold transition-colors"
            >
              <span className="hidden sm:inline">Next</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="w-20" />
          )}
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <>
            <div
              className="fixed inset-0 z-50"
              onClick={() => setShowSettings(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-panel border-l border-border-subtle z-50 overflow-y-auto"
            >
              <div className="p-6">
                <h2 className="font-display text-xl text-warm-white mb-6">
                  PENGATURAN
                </h2>

                {/* Reading Mode */}
                <div className="mb-6">
                  <label className="text-sm text-text-muted mb-3 block">
                    Mode Baca
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "vertical" as const, icon: BookOpen, label: "Scroll" },
                      { value: "page" as const, icon: Type, label: "Halaman" },
                      { value: "dual" as const, icon: Monitor, label: "Dual" },
                    ].map((mode) => (
                      <button
                        key={mode.value}
                        onClick={() => updateReaderSettings({ mode: mode.value })}
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                          readerSettings.mode === mode.value
                            ? "border-fire bg-fire/10 text-fire"
                            : "border-border-subtle text-text-muted hover:text-warm-white"
                        }`}
                      >
                        <mode.icon className="w-5 h-5" />
                        <span className="text-xs">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Width */}
                <div className="mb-6">
                  <label className="text-sm text-text-muted mb-3 block">
                    Lebar Konten
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: "narrow" as const, label: "Sempit" },
                      { value: "medium" as const, label: "Sedang" },
                      { value: "wide" as const, label: "Lebar" },
                    ]).map((w) => (
                      <button
                        key={w.value}
                        onClick={() =>
                          updateReaderSettings({ contentWidth: w.value })
                        }
                        className={`p-2.5 rounded-lg border text-sm transition-all ${
                          readerSettings.contentWidth === w.value
                            ? "border-fire bg-fire/10 text-fire"
                            : "border-border-subtle text-text-muted hover:text-warm-white"
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Color */}
                <div className="mb-6">
                  <label className="text-sm text-text-muted mb-3 block">
                    Warna Latar
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: "black" as const, label: "Hitam", icon: Moon },
                      { value: "gray" as const, label: "Abu", icon: Moon },
                      { value: "white" as const, label: "Putih", icon: Sun },
                    ]).map((bg) => (
                      <button
                        key={bg.value}
                        onClick={() =>
                          updateReaderSettings({ bgColor: bg.value })
                        }
                        className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                          readerSettings.bgColor === bg.value
                            ? "border-fire bg-fire/10 text-fire"
                            : "border-border-subtle text-text-muted hover:text-warm-white"
                        }`}
                      >
                        <bg.icon className="w-5 h-5" />
                        <span className="text-xs">{bg.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Brightness */}
                <div className="mb-6">
                  <label className="text-sm text-text-muted mb-3 block">
                    Kecerahan Overlay: {readerSettings.brightness}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={readerSettings.brightness}
                    onChange={(e) =>
                      updateReaderSettings({
                        brightness: Number(e.target.value),
                      })
                    }
                    className="w-full h-2 bg-raised rounded-full appearance-none cursor-pointer accent-fire"
                  />
                </div>

                {/* Auto Scroll Speed */}
                <div className="mb-6">
                  <label className="text-sm text-text-muted mb-3 block">
                    Kecepatan Auto Scroll: {readerSettings.autoScrollSpeed}x
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={0.5}
                    value={readerSettings.autoScrollSpeed}
                    onChange={(e) =>
                      updateReaderSettings({
                        autoScrollSpeed: Number(e.target.value),
                      })
                    }
                    className="w-full h-2 bg-raised rounded-full appearance-none cursor-pointer accent-fire"
                  />
                </div>

                {/* Keyboard Shortcuts Info */}
                <div className="mt-8 pt-6 border-t border-border-subtle">
                  <h3 className="text-sm font-semibold text-warm-white mb-3">
                    Shortcut Keyboard
                  </h3>
                  <div className="space-y-2 text-xs text-text-muted">
                    <div className="flex justify-between">
                      <span>Prev/Next Page</span>
                      <span className="text-warm-white">← / →</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fullscreen</span>
                      <span className="text-warm-white">F</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Zoom</span>
                      <span className="text-warm-white">+ / -</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bookmark</span>
                      <span className="text-warm-white">B</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Scroll Down</span>
                      <span className="text-warm-white">Space</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
