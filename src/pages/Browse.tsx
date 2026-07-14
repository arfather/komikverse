import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  SlidersHorizontal,
  LayoutGrid,
  List,
  X,
  Search,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { filterComics, VALID_GENRES, VALID_TYPES, VALID_STATUSES, comics } from "@/lib/data";
import type { Comic } from "@/lib/data";
import { sanitizeUrlParam } from "@/lib/sanitize";
import { useDebounce, useMediaQuery } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import ComicCard from "@/components/ui/ComicCard";
import SkeletonCard from "@/components/ui/SkeletonCard";

const SORT_OPTIONS = [
  { value: "popular", label: "Populer" },
  { value: "rating", label: "Rating" },
  { value: "newest", label: "Terbaru" },
  { value: "az", label: "A-Z" },
  { value: "za", label: "Z-A" },
] as const;

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  useMediaQuery("(max-width: 768px)");

  // Read filters from URL
  const urlGenre = searchParams.get("genre");
  const urlSearch = searchParams.get("search");
  const urlSort = searchParams.get("sort");
  const urlStatus = searchParams.get("status");
  const urlType = searchParams.get("type");

  // State
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    urlGenre ? [urlGenre] : []
  );
  const [statusFilter, setStatusFilter] = useState<string | null>(
    sanitizeUrlParam(urlStatus, VALID_STATUSES as unknown as readonly string[])
  );
  const [typeFilter, setTypeFilter] = useState<string | null>(
    sanitizeUrlParam(urlType, VALID_TYPES as unknown as readonly string[])
  );
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState<string>(
    sanitizeUrlParam(urlSort, ["popular", "rating", "newest", "az", "za"]) ||
      "popular"
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(urlSearch || "");
  const [visibleCount, setVisibleCount] = useState(24);

  const debouncedSearch = useDebounce(searchInput, 300);

  // Update search query in store
  useEffect(() => {
    if (debouncedSearch) {
      useStore.getState().setSearchQuery(debouncedSearch);
    }
  }, [debouncedSearch]);

  const searchResults = useStore((s) => s.searchResults);
  const searchComics = useStore((s) => s.searchComics);
  const isLoadingSearch = useStore((s) => s.isLoadingSearch);
  const bookmarks = useStore((s) => s.bookmarks);
  const loadedComics = useStore((s) => s.loadedComics);
  const homepageComics = useStore((s) => s.homepageComics);

  const urlBookmarked = searchParams.get("bookmarked") === "true";

  // Combine all known comics to resolve bookmarked ones
  const allKnownComics = useMemo(() => {
    const map = new Map<string, Comic>();
    comics.forEach((c) => map.set(c.id, c));
    homepageComics.forEach((c) => map.set(c.id, c));
    Object.values(loadedComics).forEach((c) => map.set(c.id, c));
    return Array.from(map.values());
  }, [homepageComics, loadedComics]);

  // Trigger search fetch
  useEffect(() => {
    if (debouncedSearch.trim() && !urlBookmarked) {
      searchComics(debouncedSearch);
    }
  }, [debouncedSearch, searchComics, urlBookmarked]);

  // Filter comics
  const filtered = useMemo(() => {
    let baseList: Comic[] = [];

    if (urlBookmarked) {
      // If we are on the bookmarked page, show bookmarked comics
      baseList = allKnownComics.filter((c) => bookmarks.has(c.id));
      
      // If there is a search query, filter client-side
      if (debouncedSearch.trim()) {
        const query = debouncedSearch.toLowerCase();
        baseList = baseList.filter((c) =>
          c.title.toLowerCase().includes(query) ||
          c.altTitle.toLowerCase().includes(query) ||
          c.genres.some((g) => g.toLowerCase().includes(query))
        );
      }
    } else if (debouncedSearch.trim()) {
      baseList = searchResults;
    } else {
      baseList = filterComics(
        selectedGenres,
        statusFilter,
        typeFilter,
        minRating,
        sortBy
      );
    }

    // Apply other filters client-side on the base list
    let result = [...baseList];

    // For bookmarked page or search results, we apply category filters client-side
    if (urlBookmarked || debouncedSearch.trim()) {
      if (selectedGenres.length > 0) {
        result = result.filter((c) =>
          selectedGenres.every((g) => c.genres.includes(g))
        );
      }
      if (statusFilter) {
        result = result.filter((c) => c.status === statusFilter);
      }
      if (typeFilter) {
        result = result.filter((c) => c.type === typeFilter);
      }
      if (minRating > 0) {
        result = result.filter((c) => c.rating >= minRating);
      }
      
      // Sort result
      if (sortBy === "rating") {
        result.sort((a, b) => b.rating - a.rating);
      } else if (sortBy === "newest") {
        result.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      } else if (sortBy === "az") {
        result.sort((a, b) => a.title.localeCompare(b.title));
      } else if (sortBy === "za") {
        result.sort((a, b) => b.title.localeCompare(a.title));
      } else if (sortBy === "popular") {
        result.sort((a, b) => b.bookmarks - a.bookmarks);
      }
    }

    return result;
  }, [
    urlBookmarked,
    allKnownComics,
    bookmarks,
    selectedGenres,
    statusFilter,
    typeFilter,
    minRating,
    sortBy,
    debouncedSearch,
    searchResults
  ]);

  const isCurrentlyLoading = !!debouncedSearch.trim() && isLoadingSearch;

  const visibleComics = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const activeFilterCount =
    selectedGenres.length +
    (statusFilter ? 1 : 0) +
    (typeFilter ? 1 : 0) +
    (minRating > 0 ? 1 : 0);

  // Reset filters
  const resetFilters = useCallback(() => {
    setSelectedGenres([]);
    setStatusFilter(null);
    setTypeFilter(null);
    setMinRating(0);
    setSortBy("popular");
    setSearchInput("");
    setSearchParams({});
  }, [
    setSelectedGenres,
    setStatusFilter,
    setTypeFilter,
    setMinRating,
    setSortBy,
    setSearchInput,
    setSearchParams,
  ]);

  // Toggle genre
  const toggleGenre = useCallback((genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
    setVisibleCount(24);
  }, [setSelectedGenres, setVisibleCount]);

  return (
    <div className="min-h-screen bg-void pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="font-display text-3xl tracking-wide text-warm-white">
            {urlBookmarked ? "BOOKMARK SAYA" : "JELAJAHI KOMIK"}
          </h1>

          {/* Search */}
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setVisibleCount(24);
              }}
              placeholder="Cari judul, genre..."
              maxLength={100}
              className="w-full bg-panel border border-border-subtle rounded-lg pl-10 pr-4 py-2.5 text-sm text-warm-white placeholder:text-text-muted focus:outline-none focus:border-fire transition-colors"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-warm-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                showFilters || activeFilterCount > 0
                  ? "border-fire bg-fire/10 text-fire"
                  : "border-border-subtle bg-panel text-text-muted hover:text-warm-white"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-sm font-semibold">Filter</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-fire text-white text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 text-sm text-text-muted hover:text-fire transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-panel border border-border-subtle rounded-lg px-4 py-2.5 pr-10 text-sm text-warm-white focus:outline-none focus:border-fire cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>

            {/* View Toggle */}
            <div className="flex bg-panel rounded-lg border border-border-subtle overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 transition-colors ${
                  viewMode === "grid"
                    ? "bg-fire text-white"
                    : "text-text-muted hover:text-warm-white"
                }`}
                aria-label="Tampilan grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 transition-colors ${
                  viewMode === "list"
                    ? "bg-fire text-white"
                    : "text-text-muted hover:text-warm-white"
                }`}
                aria-label="Tampilan list"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-panel rounded-xl border border-border-subtle p-6 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Genres */}
              <div>
                <label className="text-sm font-semibold text-warm-white mb-3 block">
                  Genre
                </label>
                <div className="flex flex-wrap gap-2">
                  {VALID_GENRES.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        selectedGenres.includes(genre)
                          ? "border-fire bg-fire/10 text-fire"
                          : "border-border-subtle text-text-muted hover:text-warm-white"
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-semibold text-warm-white mb-3 block">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Semua", ...VALID_STATUSES].map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        setStatusFilter(s === "Semua" ? null : s)
                      }
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        (s === "Semua" && !statusFilter) || statusFilter === s
                          ? "border-fire bg-fire/10 text-fire"
                          : "border-border-subtle text-text-muted hover:text-warm-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="text-sm font-semibold text-warm-white mb-3 block">
                  Tipe
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Semua", ...VALID_TYPES].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTypeFilter(t === "Semua" ? null : t)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        (t === "Semua" && !typeFilter) || typeFilter === t
                          ? "border-fire bg-fire/10 text-fire"
                          : "border-border-subtle text-text-muted hover:text-warm-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="text-sm font-semibold text-warm-white mb-3 block">
                  Minimum Rating: {minRating}
                </label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={0.5}
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full h-2 bg-raised rounded-full appearance-none cursor-pointer accent-fire"
                />
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>0</span>
                  <span>10</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-text-muted">
            Menampilkan {visibleComics.length} dari {filtered.length} komik
          </p>
        </div>

        {/* Results */}
        {isCurrentlyLoading ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
                : "space-y-3"
            }
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} variant={viewMode === "list" ? "list" : "grid"} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-raised flex items-center justify-center">
              <Search className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-warm-white mb-2">
              Tidak ada hasil
            </h3>
            <p className="text-sm text-text-muted">
              Coba ubah filter atau kata kunci pencarian
            </p>
          </div>
        ) : (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
                  : "space-y-3"
              }
            >
              {visibleComics.map((comic, i) => (
                <ComicCard
                  key={comic.id}
                  comic={comic}
                  variant={viewMode === "list" ? "list" : "grid"}
                  index={i}
                />
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setVisibleCount((v) => v + 24)}
                  className="px-8 py-3 bg-raised hover:bg-fire/20 text-warm-white font-semibold rounded-lg border border-border-subtle hover:border-fire/30 transition-all"
                >
                  Muat Lebih Banyak
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
