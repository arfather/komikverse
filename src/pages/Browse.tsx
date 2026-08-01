import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  List,
  X,
  Search,
  ChevronDown,
} from "lucide-react";
import { filterComics, VALID_TYPES, VALID_STATUSES, comics } from "@/lib/data";
import type { Comic } from "@/lib/data";
import { sanitizeUrlParam } from "@/lib/sanitize";
import { useDebounce, useMediaQuery } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import ComicCard from "@/components/ui/ComicCard";
import SkeletonCard from "@/components/ui/SkeletonCard";
import SEO from "@/components/SEO";

const SORT_OPTIONS = [
  { value: "popular", label: "Populer" },
  { value: "rating", label: "Rating" },
  { value: "newest", label: "Terbaru" },
  { value: "az", label: "A-Z" },
  { value: "za", label: "Z-A" },
] as const;

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  useMediaQuery("(max-width: 768px)");

  // Read filters from URL
  const urlGenre = searchParams.get("genre");
  const urlSearch = searchParams.get("search");
  const urlSort = searchParams.get("sort");
  const urlStatus = searchParams.get("status");
  const urlType = searchParams.get("type");

  // State
  const [selectedGenres] = useState<string[]>(
    urlGenre ? [urlGenre] : []
  );
  const [statusFilter] = useState<string | null>(
    sanitizeUrlParam(urlStatus, VALID_STATUSES as unknown as readonly string[])
  );
  const [typeFilter] = useState<string | null>(
    sanitizeUrlParam(urlType, VALID_TYPES as unknown as readonly string[])
  );
  const [minRating] = useState(0);
  const [sortBy, setSortBy] = useState<string>(
    sanitizeUrlParam(urlSort, ["popular", "rating", "newest", "az", "za"]) ||
      "popular"
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const searchQuery = useStore((s) => s.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const [searchInput, setSearchInput] = useState(urlSearch || searchQuery || "");
  const [visibleCount, setVisibleCount] = useState(24);

  const debouncedSearch = useDebounce(searchInput, 300);

  // Sync searchInput when store searchQuery changes (e.g. from navbar search input)
  useEffect(() => {
    if (location.pathname !== "/browse") return;
    Promise.resolve().then(() => {
      setSearchInput((prev) => (prev !== searchQuery ? searchQuery : prev));
    });
  }, [searchQuery, location.pathname]);

  // Sync search query from URL to store
  useEffect(() => {
    if (location.pathname !== "/browse") return;
    const currentStoreQuery = useStore.getState().searchQuery;
    if (urlSearch !== null && urlSearch !== currentStoreQuery) {
      setSearchQuery(urlSearch);
    } else if (urlSearch === null && currentStoreQuery !== "") {
      setSearchQuery("");
    }
  }, [urlSearch, setSearchQuery, location.pathname]);

  // Update URL search parameter and store searchQuery when debouncedSearch changes
  useEffect(() => {
    if (location.pathname !== "/browse") return;

    const currentStoreQuery = useStore.getState().searchQuery;
    if (debouncedSearch !== currentStoreQuery) {
      setSearchQuery(debouncedSearch);
    }

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (debouncedSearch) {
        next.set("search", debouncedSearch);
      } else {
        next.delete("search");
      }
      return next;
    }, { replace: true });
  }, [debouncedSearch, setSearchParams, setSearchQuery, location.pathname]);

  const bookmarks = useStore((s) => s.bookmarks);
  const loadedComics = useStore((s) => s.loadedComics);
  const homepageComics = useStore((s) => s.homepageComics);
  const browseComics = useStore((s) => s.browseComics);
  const fetchBrowseComics = useStore((s) => s.fetchBrowseComics);
  const isLoadingBrowse = useStore((s) => s.isLoadingBrowse);

  const urlBookmarked = searchParams.get("bookmarked") === "true";

  // Combine all known comics to resolve bookmarked ones
  const allKnownComics = useMemo(() => {
    const map = new Map<string, Comic>();
    comics.forEach((c) => map.set(c.id, c));
    homepageComics.forEach((c) => map.set(c.id, c));
    browseComics.forEach((c) => map.set(c.id, c));
    Object.values(loadedComics).forEach((c) => map.set(c.id, c));
    return Array.from(map.values());
  }, [homepageComics, browseComics, loadedComics]);

  // Fetch API whenever browse parameters change
  useEffect(() => {
    if (urlBookmarked) return;

    fetchBrowseComics({
      search: debouncedSearch,
      genres: selectedGenres,
      status: statusFilter,
      type: typeFilter,
      sortBy: sortBy,
    });
  }, [
    urlBookmarked,
    debouncedSearch,
    selectedGenres,
    statusFilter,
    typeFilter,
    sortBy,
    fetchBrowseComics,
  ]);

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
    } else {
      // Use API browseComics results, fallback to filterComics
      baseList = browseComics.length > 0 ? browseComics : filterComics(
        selectedGenres,
        statusFilter,
        typeFilter,
        minRating,
        sortBy
      );
    }

    // Apply other filters client-side on the base list
    let result = [...baseList];

    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter);
    }
    if (typeFilter) {
      result = result.filter((c) => c.type === typeFilter);
    }
    if (minRating > 0) {
      result = result.filter((c) => c.rating >= minRating);
    }

    if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "az") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "za") {
      result.sort((a, b) => b.title.localeCompare(a.title));
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
    browseComics
  ]);

  const isCurrentlyLoading = !urlBookmarked && isLoadingBrowse;

  const visibleComics = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const browseTitle = urlSearch
    ? `Cari Komik "${urlSearch}" - KomikVerse`
    : urlGenre
    ? `Komik Genre ${urlGenre} Sub Indo - KomikVerse`
    : "Jelajahi & Cari Komik Online Bahasa Indonesia - KomikVerse";

  const browseDescription = urlSearch
    ? `Hasil pencarian komik untuk "${urlSearch}". Baca manga, manhwa, dan manhua gratis di KomikVerse.`
    : urlGenre
    ? `Daftar komik dengan genre ${urlGenre} sub Indo terlengkap dan gratis di KomikVerse.`
    : "Cari dan temukan ribuan komik, manga, manhwa, dan manhua Bahasa Indonesia terbaru gratis.";

  return (
    <div className="min-h-screen bg-void pt-20 pb-10">
      <SEO
        title={browseTitle}
        description={browseDescription}
        keywords="daftar komik, cari manga, genre komik, manhwa indonesia, manhua sub indo"
      />
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
        <div className="flex items-center justify-end mb-6">
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
