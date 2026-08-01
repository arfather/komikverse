import { create } from "zustand";
import { persist } from "zustand/middleware";
import { sanitizeSearchQuery } from "./sanitize";
import { comics, getComicBySlug, mapApiMangaToComic, mapApiMangaListToComics } from "./data";
import type { Comic } from "./data";
import { fetchEncrypted } from "./crypto";

interface ReadingProgress {
  comicId: string;
  chapterNum: number;
  lastReadAt: string;
  progress: number; // percentage 0-100
}

interface ReaderSettings {
  mode: "vertical" | "page" | "dual";
  contentWidth: "narrow" | "medium" | "wide";
  bgColor: "black" | "gray" | "white";
  autoScrollSpeed: number;
  brightness: number;
}

interface Toast {
  id: string;
  message: string;
  variant: "success" | "info" | "warning";
}

export interface FetchBrowseOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  genres?: string[];
  status?: string | null;
  type?: string | null;
  sortBy?: string;
}

interface AppState {
  // State
  bookmarks: Set<string>;
  readingHistory: ReadingProgress[];
  currentTheme: "dark" | "light";
  readerSettings: ReaderSettings;
  activeGenreFilter: string[];
  searchQuery: string;
  toasts: Toast[];
  loadedComics: Record<string, Comic>;
  isLoadingComic: boolean;
  comicError: string | null;
  genres: string[];
  isLoadingGenres: boolean;
  homepageComics: Comic[];
  isLoadingHomepage: boolean;
  homepageError: string | null;
  searchResults: Comic[];
  isLoadingSearch: boolean;
  searchError: string | null;
  browseComics: Comic[];
  isLoadingBrowse: boolean;
  browseError: string | null;
  readChapters: Record<string, number[]>;

  // Actions
  toggleBookmark: (comicId: string) => void;
  markChapterAsRead: (comicId: string, chapterNum: number) => void;
  isChapterRead: (comicId: string, chapterNum: number) => boolean;
  isBookmarked: (comicId: string) => boolean;
  updateReadingProgress: (
    comicId: string,
    chapter: number,
    progress: number
  ) => void;
  getReadingProgress: (comicId: string) => ReadingProgress | undefined;
  setReaderMode: (mode: "vertical" | "page" | "dual") => void;
  updateReaderSettings: (partial: Partial<ReaderSettings>) => void;
  setSearchQuery: (raw: string) => void;
  setActiveGenreFilter: (genres: string[]) => void;
  addToast: (message: string, variant?: "success" | "info" | "warning") => void;
  removeToast: (id: string) => void;
  fetchComic: (slug: string) => Promise<Comic | null>;
  fetchHomepageComics: (genre?: string) => Promise<Comic[]>;
  fetchGenres: () => Promise<string[]>;
  searchComics: (query: string) => Promise<Comic[]>;
  fetchBrowseComics: (options?: FetchBrowseOptions) => Promise<Comic[]>;
}

const createSet = <T>(arr: T[]): Set<T> => new Set(arr);
const setToArray = <T>(set: Set<T>): T[] => Array.from(set);

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      bookmarks: new Set<string>(),
      readingHistory: [],
      currentTheme: "dark",
      readerSettings: {
        mode: "vertical",
        contentWidth: "medium",
        bgColor: "black",
        autoScrollSpeed: 1,
        brightness: 0,
      },
      activeGenreFilter: [],
      searchQuery: "",
      toasts: [],
      loadedComics: {},
      readChapters: {},
      isLoadingComic: false,
      comicError: null,
      genres: [],
      isLoadingGenres: false,
      homepageComics: comics,
      isLoadingHomepage: false,
      homepageError: null,
      searchResults: [],
      isLoadingSearch: false,
      searchError: null,
      browseComics: [],
      isLoadingBrowse: false,
      browseError: null,

      // Actions
      toggleBookmark: (comicId: string) => {
        let isNowBookmarked = false;
        set((state) => {
          const newBookmarks = new Set(state.bookmarks);
          const wasBookmarked = newBookmarks.has(comicId);

          if (wasBookmarked) {
            newBookmarks.delete(comicId);
            isNowBookmarked = false;
          } else {
            newBookmarks.add(comicId);
            isNowBookmarked = true;
          }

          return { bookmarks: newBookmarks };
        });

        // Add toast
        get().addToast(
          isNowBookmarked ? "Ditambahkan ke bookmark" : "Dihapus dari bookmark",
          isNowBookmarked ? "success" : "info"
        );
      },

      isBookmarked: (comicId: string) => {
        return get().bookmarks.has(comicId);
      },

      updateReadingProgress: (
        comicId: string,
        chapter: number,
        progress: number
      ) => {
        set((state) => {
          const history = state.readingHistory.filter(
            (h) => h.comicId !== comicId
          );
          history.unshift({
            comicId,
            chapterNum: chapter,
            lastReadAt: new Date().toISOString(),
            progress,
          });
          return { readingHistory: history.slice(0, 100) };
        });
      },

      getReadingProgress: (comicId: string) => {
        return get().readingHistory.find((h) => h.comicId === comicId);
      },

      setReaderMode: (mode) => {
        set((state) => ({
          readerSettings: { ...state.readerSettings, mode },
        }));
      },

      updateReaderSettings: (partial) => {
        set((state) => ({
          readerSettings: { ...state.readerSettings, ...partial },
        }));
      },

      setSearchQuery: (raw: string) => {
        set({ searchQuery: sanitizeSearchQuery(raw) });
      },

      setActiveGenreFilter: (genres: string[]) => {
        set({ activeGenreFilter: genres });
      },

      addToast: (message, variant = "info") => {
        const id = Date.now().toString() + Math.random().toString(36).slice(2);
        set((state) => ({
          toasts: [...state.toasts, { id, message, variant }],
        }));

        // Auto remove after 3 seconds
        setTimeout(() => {
          get().removeToast(id);
        }, 3000);
      },

      removeToast: (id: string) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },

      markChapterAsRead: (comicId: string, chapterNum: number) => {
        set((state) => {
          const list = state.readChapters[comicId] || [];
          if (list.includes(chapterNum)) return {};
          return {
            readChapters: {
              ...state.readChapters,
              [comicId]: [...list, chapterNum],
            },
          };
        });
      },

      isChapterRead: (comicId: string, chapterNum: number) => {
        const list = get().readChapters[comicId] || [];
        return list.includes(chapterNum);
      },

      fetchComic: async (slug: string) => {
        // 1. Check if we already have the fully loaded comic in cache and it is up to date
        const cached = get().loadedComics[slug];
        if (
          cached &&
          cached.isFullyLoaded &&
          cached.chapters &&
          cached.chapters.length > 0 &&
          cached.api &&
          cached.chapters[0]?.number >= cached.latestChapter
        ) {
          return cached;
        }

        let comic = getComicBySlug(slug);
        
        if (!comic) {
          comic = cached;
        }

        if (!comic) {
          comic = get().searchResults.find((c) => c.slug === slug);
        }

        if (!comic) {
          comic = get().homepageComics.find((c) => c.slug === slug);
        }

        if (!comic) {
          const fetchedList = await get().fetchHomepageComics();
          comic = fetchedList.find((c) => c.slug === slug);
        }

        if (!comic) {
          // Fallback: If still not found (e.g. on direct page refresh), try searching by slug
          const searchQuery = slug.replace(/-/g, " ");
          const searchResults = await get().searchComics(searchQuery);
          comic = searchResults.find((c) => c.slug === slug);
        }

        if (!comic) return null;

        // If it doesn't have api configured, just cache and return the static one
        if (!comic.api) {
          set((state) => ({
            loadedComics: {
              ...state.loadedComics,
              [slug]: comic!,
            },
          }));
          return comic;
        }

        // It has api configured, let's fetch it
        set({ isLoadingComic: true, comicError: null });

        try {
          const apiConfig = comic.api;
          const cleanApiUrl = (url: string) => url.replace("https://api.shngm.io", "/api");
          const detailUrl = apiConfig.detail?.urls?.url ? cleanApiUrl(apiConfig.detail.urls.url) : "";
          
          // Substitute {id} in chapters list URL and set page_size to 1000 to fetch all chapters
          const chaptersBaseUrl = apiConfig.chapters?.urls?.url ? cleanApiUrl(apiConfig.chapters.urls.url) : "";
          const chaptersId = apiConfig.chapters?.id || "";
          const substitutedUrl = chaptersBaseUrl.replace("{id}", chaptersId);
          const chaptersUrl = `${substitutedUrl}?page=1&page_size=1000&sort_by=chapter_number&sort_order=desc`;

          if (!detailUrl || !chaptersBaseUrl) {
            throw new Error("Invalid API configuration");
          }

          // Fetch details and chapters in parallel
          const [detailJson, chaptersJson] = await Promise.all([
            fetchEncrypted(detailUrl),
            fetchEncrypted(chaptersUrl),
          ]);

          if (detailJson.retcode !== 0 || !detailJson.data) {
            throw new Error(detailJson.message || "Failed to fetch details data");
          }
          if (chaptersJson.retcode !== 0 || !chaptersJson.data) {
            throw new Error(chaptersJson.message || "Failed to fetch chapters data");
          }

          const mappedComic = mapApiMangaToComic(detailJson.data, chaptersJson.data, comic);

          set((state) => ({
            loadedComics: {
              ...state.loadedComics,
              [slug]: mappedComic,
            },
            isLoadingComic: false,
          }));

          return mappedComic;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Failed to fetch comic details";
          console.error("Error fetching comic from API:", err);
          set({
            comicError: errorMessage,
            isLoadingComic: false,
          });
          // Fallback to static comic in case of error
          return comic;
        }
      },

      fetchHomepageComics: async (genre?: string) => {
        set({ isLoadingHomepage: true, homepageError: null });
        try {
          let url = "/api/v1/manga/list?page=1&page_size=24&is_update=true&sort=latest&sort_order=desc";
          if (genre && genre !== "Semua") {
            const formattedGenre = genre
              .split(",")
              .map((g) => g.trim().toLowerCase())
              .filter(Boolean)
              .join(",");
            url += `&genre_include=${encodeURIComponent(formattedGenre)}&genre_include_mode=or`;
          }
          const json = await fetchEncrypted(url);
          if (json.retcode !== 0 || !json.data) {
            throw new Error(json.message || "Failed to fetch homepage data");
          }

          const mapped = mapApiMangaListToComics(json.data);

          set((state) => {
            const updatedLoaded = { ...state.loadedComics };
            mapped.forEach((c) => {
              const existing = updatedLoaded[c.slug];
              if (!existing || !existing.isFullyLoaded) {
                updatedLoaded[c.slug] = c;
              } else {
                updatedLoaded[c.slug] = {
                  ...existing,
                  latestChapter: Math.max(existing.latestChapter, c.latestChapter),
                  updatedAt: c.updatedAt || existing.updatedAt,
                  isNew: c.isNew,
                };
              }
            });
            return {
              homepageComics: mapped,
              loadedComics: updatedLoaded,
              isLoadingHomepage: false,
            };
          });

          return mapped;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Failed to fetch homepage data";
          console.error("Error fetching homepage:", err);
          set({
            homepageError: errorMessage,
            isLoadingHomepage: false,
          });
          return [];
        }
      },

      fetchGenres: async () => {
        const CACHE_KEY = "komikverse_genre_cache";
        const ONE_DAY_MS = 24 * 60 * 60 * 1000;

        // 1. Check valid cache from localStorage (valid for 24 hours)
        try {
          const cachedRaw = localStorage.getItem(CACHE_KEY);
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            if (
              cached &&
              Array.isArray(cached.genres) &&
              cached.genres.length > 0 &&
              typeof cached.timestamp === "number" &&
              Date.now() - cached.timestamp < ONE_DAY_MS
            ) {
              set({ genres: cached.genres, isLoadingGenres: false });
              return cached.genres;
            }
          }
        } catch (e) {
          console.warn("Failed to read genre cache from localStorage:", e);
        }

        // 2. Fetch from API if no valid cache or cache expired
        if (get().isLoadingGenres) return get().genres;
        set({ isLoadingGenres: true });
        try {
          const json = await fetchEncrypted("/api/v1/genre/list");
          if (json && json.retcode === 0 && Array.isArray(json.data)) {
            const extracted: string[] = json.data
              .map((item: any) => {
                if (typeof item === "string") return item;
                return item.name || item.title || item.genre || item.slug || "";
              })
              .filter(Boolean);

            if (extracted.length > 0) {
              set({ genres: extracted, isLoadingGenres: false });
              try {
                localStorage.setItem(
                  CACHE_KEY,
                  JSON.stringify({
                    genres: extracted,
                    timestamp: Date.now(),
                  })
                );
              } catch (e) {
                console.warn("Failed to save genre cache to localStorage:", e);
              }
              return extracted;
            }
          }
          set({ isLoadingGenres: false });
          return get().genres;
        } catch (err) {
          console.error("Error fetching genres from API:", err);
          set({ isLoadingGenres: false });
          return get().genres;
        }
      },

      searchComics: async (query: string) => {
        if (!query.trim()) {
          set({ searchResults: [], isLoadingSearch: false });
          return [];
        }
        set({ isLoadingSearch: true, searchError: null });
        try {
          const json = await fetchEncrypted(`/api/v1/manga/list?page=1&page_size=24&q=${encodeURIComponent(query)}`);
          if (json.retcode !== 0 || !json.data) {
            throw new Error(json.message || "Failed to parse search results");
          }

          const mapped = mapApiMangaListToComics(json.data);
          
          set((state) => {
            const updatedLoaded = { ...state.loadedComics };
            mapped.forEach((c) => {
              const existing = updatedLoaded[c.slug];
              if (!existing || !existing.isFullyLoaded) {
                updatedLoaded[c.slug] = c;
              } else {
                updatedLoaded[c.slug] = {
                  ...existing,
                  latestChapter: Math.max(existing.latestChapter, c.latestChapter),
                  updatedAt: c.updatedAt || existing.updatedAt,
                  isNew: c.isNew,
                };
              }
            });
            return {
              searchResults: mapped,
              loadedComics: updatedLoaded,
              isLoadingSearch: false,
            };
          });
          
          return mapped;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Failed to search comics";
          console.error("Error searching comics:", err);
          set({
            searchError: errorMessage,
            isLoadingSearch: false,
            searchResults: [],
          });
          return [];
        }
      },

      fetchBrowseComics: async (options: FetchBrowseOptions = {}) => {
        set({ isLoadingBrowse: true, browseError: null });
        try {
          const page = options.page || 1;
          const pageSize = options.pageSize || 36;
          let url = `/api/v1/manga/list?page=${page}&page_size=${pageSize}`;

          if (options.search?.trim()) {
            url += `&q=${encodeURIComponent(options.search.trim())}`;
          } else {
            if (options.genres && options.genres.length > 0) {
              const formatted = options.genres
                .map((g) => g.trim().toLowerCase())
                .filter(Boolean)
                .join(",");
              if (formatted) {
                url += `&genre_include=${encodeURIComponent(formatted)}&genre_include_mode=or`;
              }
            }

            if (options.sortBy === "popular") {
              url += `&sort=popular&sort_order=desc`;
            } else {
              url += `&is_update=true&sort=latest&sort_order=desc`;
            }
          }

          const json = await fetchEncrypted(url);
          if (json.retcode !== 0 || !json.data) {
            throw new Error(json.message || "Failed to fetch browse data");
          }

          const mapped = mapApiMangaListToComics(json.data);

          set((state) => {
            const updatedLoaded = { ...state.loadedComics };
            mapped.forEach((c) => {
              const existing = updatedLoaded[c.slug];
              if (!existing || !existing.isFullyLoaded) {
                updatedLoaded[c.slug] = c;
              }
            });
            return {
              browseComics: mapped,
              loadedComics: updatedLoaded,
              isLoadingBrowse: false,
            };
          });

          return mapped;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Failed to fetch browse data";
          console.error("Error fetching browse data:", err);
          set({
            browseError: errorMessage,
            isLoadingBrowse: false,
          });
          return [];
        }
      },
    }),
    {
      name: "komikverse-store",
      partialize: (state) => ({
        bookmarks: setToArray(state.bookmarks),
        readingHistory: state.readingHistory,
        currentTheme: state.currentTheme,
        readerSettings: state.readerSettings,
        readChapters: state.readChapters,
        loadedComics: state.loadedComics,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.bookmarks = createSet(state.bookmarks as unknown as string[]);
        }
      },
    }
  )
);
