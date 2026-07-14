import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info } from "lucide-react";
import type { Comic } from "@/lib/data";
import StarRating from "@/components/ui/StarRating";

interface HeroBannerProps {
  comics: Comic[];
}

export default function HeroBanner({ comics }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % comics.length);
  }, [comics.length]);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (isPaused || comics.length <= 1) return;
    const timer = setInterval(goNext, 5000);
    return () => clearInterval(timer);
  }, [isPaused, goNext, comics.length]);

  const current = comics[currentIndex];
  if (!current) return null;
  return (
    <div
      className="relative w-full h-[65vh] min-h-[450px] md:h-[85vh] md:min-h-[600px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Images */}
      <AnimatePresence mode="sync">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
          <img
            src={current.bannerUrl}
            alt={current.title}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-void via-void/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 flex items-center">
        <div className="max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Genre badge */}
              <div className="flex flex-wrap gap-2 mb-4">
                {current.genres.slice(0, 3).map((genre) => (
                  <span
                    key={genre}
                    className="text-[11px] font-bold tracking-[0.1em] uppercase px-3 py-1 rounded-full bg-fire/20 text-fire border border-fire/30"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h1 className="font-display text-3xl sm:text-4xl md:text-7xl lg:text-8xl text-warm-white leading-none tracking-wide uppercase mb-3 line-clamp-2">
                {current.title}
              </h1>

              {/* Alt title */}
              <p className="text-text-muted text-sm sm:text-base md:text-lg mb-4 line-clamp-1">{current.altTitle}</p>

              {/* Rating & Stats */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div className="flex items-center gap-1.5">
                  <StarRating
                    rating={Math.round(current.rating) / 2}
                    size="sm"
                  />
                  <span className="text-fire-gold font-bold text-base">
                    {current.rating}
                  </span>
                </div>
                <span className="text-text-muted text-xs sm:text-sm">
                  {current.totalVotes.toLocaleString()} votes
                </span>
                <span className="text-text-muted text-xs sm:text-sm">
                  {current.type}
                </span>
              </div>

              {/* Synopsis */}
              <p className="text-text-muted text-sm sm:text-base leading-relaxed line-clamp-2 sm:line-clamp-3 mb-6 sm:mb-8 max-w-lg">
                {current.synopsis}
              </p>

              {/* Buttons */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  to={`/comic/${current.slug}/${current.chapters[current.chapters.length - 1]?.number || 1}`}
                  className="px-6 py-3 bg-fire hover:bg-fire-glow text-white font-bold rounded-lg flex items-center gap-2 transition-colors shadow-bloom hover:shadow-bloom-lg"
                >
                  <Play className="w-5 h-5" />
                  Mulai Baca
                </Link>
                <Link
                  to={`/comic/${current.slug}`}
                  className="px-6 py-3 bg-transparent border-2 border-warm-white/30 hover:border-warm-white text-warm-white font-bold rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Info className="w-5 h-5" />
                  Detail
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Thumbnail Navigation */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 z-20">
        <div className="hidden md:flex gap-3">
          {comics.map((comic, index) => (
            <button
              key={comic.id}
              onClick={() => setCurrentIndex(index)}
              className={`relative w-16 h-20 md:w-20 md:h-28 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? "border-fire scale-105 shadow-bloom"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
              aria-label={`Lihat ${comic.title}`}
            >
              <img
                src={comic.coverUrl}
                alt={comic.title}
                className="w-full h-full object-cover"
              />
              {index === currentIndex && (
                <div className="absolute inset-0 bg-fire/20" />
              )}
            </button>
          ))}
        </div>

        {/* Dot Indicators */}
        <div className="flex justify-center gap-2 mt-0 md:mt-4">
          {comics.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === currentIndex
                  ? "w-6 bg-fire"
                  : "w-1.5 bg-warm-white/30 hover:bg-warm-white/50"
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-void to-transparent" />
    </div>
  );
}
