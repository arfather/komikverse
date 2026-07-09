import { useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bookmark, Eye } from "lucide-react";
import type { Comic } from "@/lib/data";
import { useStore } from "@/lib/store";
import { useMousePosition } from "@/lib/hooks";
import StarRating from "./StarRating";

interface ComicCardProps {
  comic: Comic;
  variant?: "grid" | "list" | "featured" | "ranked";
  rank?: number;
  index?: number;
}

const statusColors = {
  Ongoing: "bg-status-ongoing/20 text-status-ongoing",
  Completed: "bg-status-completed/20 text-status-completed",
  Hiatus: "bg-status-hiatus/20 text-status-hiatus",
};

const rankBadges = [
  "bg-gradient-to-br from-yellow-400 to-yellow-600 text-black",
  "bg-gradient-to-br from-gray-300 to-gray-500 text-black",
  "bg-gradient-to-br from-orange-400 to-orange-600 text-black",
];

export default function ComicCard({
  comic,
  variant = "grid",
  rank,
  index = 0,
}: ComicCardProps) {
  const toggleBookmark = useStore((s) => s.toggleBookmark);
  const isBookmarked = useStore((s) => s.isBookmarked(comic.id));
  const cardRef = useRef<HTMLDivElement>(null);
  const mousePos = useMousePosition(cardRef);

  const handleBookmark = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toggleBookmark(comic.id);
    },
    [comic.id, toggleBookmark]
  );

  // 3D tilt calculation
  const tiltX = (mousePos.y - 0.5) * 5;
  const tiltY = (mousePos.x - 0.5) * -5;

  const isNewChapter =
    new Date(comic.updatedAt) >
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  if (variant === "list") {
    return (
      <Link to={`/comic/${comic.slug}`} className="block group">
        <div className="flex gap-4 p-3 rounded-xl bg-panel border border-border-subtle hover:border-fire/30 transition-all">
          <div className="relative w-24 h-32 flex-shrink-0 rounded-lg overflow-hidden">
            <img
              src={comic.coverUrl}
              alt={comic.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-warm-white truncate group-hover:text-fire transition-colors">
              {comic.title}
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {comic.type} · {comic.author}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {comic.genres.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-raised text-text-muted"
                >
                  {g}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
              <span className="flex items-center gap-1">
                <StarRating rating={Math.round(comic.rating) / 2} size="sm" />
                <span className="text-fire-gold ml-1">{comic.rating}</span>
              </span>
              <span>Ch. {comic.latestChapter}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link to={`/comic/${comic.slug}`} className="block group">
        <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-panel border border-border-subtle hover:border-fire/30 transition-all">
          <div className="relative w-full sm:w-40 h-48 sm:h-56 flex-shrink-0 rounded-lg overflow-hidden">
            <img
              src={comic.coverUrl}
              alt={comic.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-warm-white group-hover:text-fire transition-colors">
              {comic.title}
            </h3>
            <p className="text-xs text-text-muted mt-1">
              {comic.altTitle} · {comic.type} · {comic.status}
            </p>
            <p className="text-sm text-text-muted mt-3 line-clamp-3 leading-relaxed">
              {comic.synopsis}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {comic.genres.map((g) => (
                <span
                  key={g}
                  className="text-xs px-2 py-1 rounded-full bg-raised text-text-muted"
                >
                  {g}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4">
              <span className="flex items-center gap-1 text-sm text-fire-gold">
                <StarRating rating={Math.round(comic.rating) / 2} size="sm" />
                <span className="ml-1 font-bold">{comic.rating}</span>
              </span>
              <span className="text-xs text-text-muted">
                {comic.views} views
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "ranked") {
    return (
      <Link to={`/comic/${comic.slug}`} className="block group relative">
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="relative rounded-xl bg-panel border border-border-subtle hover:border-fire/30 transition-all overflow-hidden"
          style={{
            perspective: "1000px",
            transform:
              cardRef.current && cardRef.current.matches(":hover")
                ? `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`
                : undefined,
          }}
        >
          {/* Rank Badge */}
          {rank && rank <= 3 && (
            <div
              className={`absolute top-2 left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center font-display text-lg ${rankBadges[rank - 1]}`}
            >
              {rank}
            </div>
          )}
          {rank && rank > 3 && (
            <div className="absolute top-2 left-2 z-10 w-8 h-8 rounded-full flex items-center justify-center font-display text-lg bg-raised text-text-muted">
              {rank}
            </div>
          )}

          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
            aria-label={isBookmarked ? "Hapus bookmark" : "Tambah bookmark"}
          >
            <Bookmark
              className={`w-4 h-4 ${isBookmarked ? "text-fire fill-fire" : "text-warm-white"}`}
            />
          </button>

          {/* Cover */}
          <div className="relative aspect-[3/4] overflow-hidden">
            <img
              src={comic.coverUrl}
              alt={comic.title}
              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent opacity-60" />

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-fire/0 group-hover:bg-fire/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="px-4 py-2 bg-fire text-white text-sm font-bold rounded-lg flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Baca
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="p-3">
            <h3 className="font-bold text-sm text-warm-white truncate group-hover:text-fire transition-colors">
              {comic.title}
            </h3>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-text-muted">
                Ch. {comic.latestChapter}
              </span>
              {isNewChapter && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-fire/20 text-fire font-semibold">
                  NEW
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  // grid variant (default)
  return (
    <Link to={`/comic/${comic.slug}`} className="block group">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="rounded-xl bg-panel border border-border-subtle hover:border-fire/30 transition-all overflow-hidden hover:shadow-bloom"
      >
        {/* Cover */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={comic.coverUrl}
            alt={comic.title}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent opacity-60" />

          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-colors"
            aria-label={isBookmarked ? "Hapus bookmark" : "Tambah bookmark"}
          >
            <Bookmark
              className={`w-4 h-4 ${isBookmarked ? "text-fire fill-fire" : "text-warm-white"}`}
            />
          </button>

          {/* Status badge */}
          <div className="absolute top-2 left-2">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide ${statusColors[comic.status]}`}
            >
              {comic.status.toUpperCase()}
            </span>
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-fire/0 group-hover:bg-fire/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="px-4 py-2 bg-fire text-white text-sm font-bold rounded-lg flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
              <Eye className="w-4 h-4" />
              Baca
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-bold text-sm text-warm-white truncate group-hover:text-fire transition-colors">
            {comic.title}
          </h3>
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-text-muted">
              Ch. {comic.latestChapter}
            </span>
            <div className="flex items-center gap-1">
              <StarRating rating={Math.round(comic.rating) / 2} size="sm" />
              <span className="text-xs text-fire-gold ml-0.5 font-semibold">
                {comic.rating}
              </span>
            </div>
          </div>
          {isNewChapter && (
            <div className="mt-1.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-fire/20 text-fire font-semibold">
                BARU UPDATE
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
