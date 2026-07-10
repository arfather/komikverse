import HeroBanner from "@/components/hero/HeroBanner";
import ComicCard from "@/components/ui/ComicCard";
import SkeletonCard from "@/components/ui/SkeletonCard";
import { VALID_GENRES } from "@/lib/data";
import { ChevronLeft, ChevronRight, Clock, TrendingUp } from "lucide-react";
import { useCallback, useRef, useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";

export default function Home() {
  const homepageComics = useStore((s) => s.homepageComics);
  const fetchHomepageComics = useStore((s) => s.fetchHomepageComics);
  const isLoading = useStore((s) => s.isLoadingHomepage);

  useEffect(() => {
    fetchHomepageComics();
  }, [fetchHomepageComics]);

  const [activeGenre, setActiveGenre] = useState<string>("Semua");
  const popularScrollRef = useRef<HTMLDivElement>(null);

  const newest = homepageComics;
  const popular = useMemo(() => {
    return [...homepageComics].sort((a, b) => b.bookmarks - a.bookmarks);
  }, [homepageComics]);

  const featured = useMemo(() => {
    const list = homepageComics.filter((c) => c.isFeatured);
    return list.length > 0 ? list : homepageComics.slice(0, 5);
  }, [homepageComics]);

  const filteredByGenre = useMemo(() => {
    if (activeGenre === "Semua") return newest;
    return newest.filter((c) => c.genres.includes(activeGenre));
  }, [newest, activeGenre]);

  const scrollPopular = useCallback((dir: "left" | "right") => {
    if (popularScrollRef.current) {
      const scrollAmount = 300;
      popularScrollRef.current.scrollBy({
        left: dir === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  }, []);

  if (isLoading && homepageComics.length === 0) {
    return (
      <div className="min-h-screen bg-void pt-20 pb-10">
        {/* Hero Banner Skeleton */}
        <div className="max-w-7xl mx-auto px-4 mb-8 animate-pulse">
          <div className="w-full h-[350px] md:h-[450px] shimmer rounded-2xl" />
        </div>

        {/* Genre Filter Skeleton */}
        <div className="max-w-7xl mx-auto px-4 mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-9 w-20 shimmer rounded-full flex-shrink-0 animate-pulse" />
            ))}
          </div>
        </div>

        {/* Terbaru Diupdate Skeleton */}
        <section className="max-w-7xl mx-auto px-4 mt-10">
          <div className="h-8 w-60 shimmer rounded-lg mb-6 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={i} variant="grid" />
            ))}
          </div>
        </section>

        {/* Populer Skeleton */}
        <section className="max-w-7xl mx-auto px-4 mt-14">
          <div className="h-8 w-60 shimmer rounded-lg mb-6 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} variant="grid" />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void relative">
      {isLoading && (
        <div className="fixed top-16 left-0 right-0 h-1 bg-fire/20 z-50 overflow-hidden">
          <div className="h-[2px] bg-fire animate-pulse" style={{ width: "60%" }} />
        </div>
      )}
      {/* Hero */}
      <HeroBanner comics={featured} />

      {/* Genre Filter */}
      <section className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
          <button
            onClick={() => setActiveGenre("Semua")}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              activeGenre === "Semua"
                ? "bg-gradient-fire text-white shadow-bloom"
                : "bg-raised text-text-muted hover:text-warm-white"
            }`}
          >
            Semua
          </button>
          {VALID_GENRES.slice(0, 11).map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveGenre(genre)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeGenre === genre
                  ? "bg-gradient-fire text-white shadow-bloom"
                  : "bg-raised text-text-muted hover:text-warm-white"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </section>

      {/* Terbaru Diupdate */}
      <section className="max-w-7xl mx-auto px-4 mt-10">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-5 h-5 text-fire" />
          <h2 className="font-display text-2xl md:text-3xl tracking-wide text-warm-white">
            TERBARU DIUPDATE
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredByGenre.slice(0, 24).map((comic, i) => (
            <ComicCard key={comic.id} comic={comic} index={i} />
          ))}
        </div>
      </section>

      {/* Populer Minggu Ini - Horizontal Scroll */}
      <section className="max-w-7xl mx-auto px-4 mt-14">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-fire" />
            <h2 className="font-display text-2xl md:text-3xl tracking-wide text-warm-white">
              POPULER MINGGU INI
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => scrollPopular("left")}
              className="p-2 rounded-lg bg-raised hover:bg-fire/20 text-text-muted hover:text-fire transition-colors"
              aria-label="Scroll kiri"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollPopular("right")}
              className="p-2 rounded-lg bg-raised hover:bg-fire/20 text-text-muted hover:text-fire transition-colors"
              aria-label="Scroll kanan"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div
          ref={popularScrollRef}
          className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-4"
        >
          {popular.slice(0, 10).map((comic, i) => (
            <div key={comic.id} className="flex-shrink-0 w-44 snap-start">
              <ComicCard comic={comic} variant="ranked" rank={i + 1} index={i} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
