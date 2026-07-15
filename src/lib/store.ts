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
  homepageComics: Comic[];
  isLoadingHomepage: boolean;
  homepageError: string | null;
  searchResults: Comic[];
  isLoadingSearch: boolean;
  searchError: string | null;
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
  fetchHomepageComics: () => Promise<Comic[]>;
  searchComics: (query: string) => Promise<Comic[]>;
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
      homepageComics: comics,
      isLoadingHomepage: false,
      homepageError: null,
      searchResults: [],
      isLoadingSearch: false,
      searchError: null,

      // Actions
      toggleBookmark: (comicId: string) => {
        set((state) => {
          const newBookmarks = new Set(state.bookmarks);
          const wasBookmarked = newBookmarks.has(comicId);

          if (wasBookmarked) {
            newBookmarks.delete(comicId);
          } else {
            newBookmarks.add(comicId);
          }

          return { bookmarks: newBookmarks };
        });

        // Add toast
        const isCurrentlyBookmarked = get().bookmarks.has(comicId);
        get().addToast(
          isCurrentlyBookmarked ? "Ditambahkan ke bookmark" : "Dihapus dari bookmark",
          isCurrentlyBookmarked ? "success" : "info"
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
        // 1. Check if we already have the fully loaded comic in cache
        const cached = get().loadedComics[slug];
        if (cached && cached.chapters && cached.chapters.length > 0 && cached.api) {
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
          
          // Substitute {id} in chapters list URL and set page_size to 200 to fetch all chapters
          const chaptersBaseUrl = apiConfig.chapters?.urls?.url ? cleanApiUrl(apiConfig.chapters.urls.url) : "";
          const chaptersId = apiConfig.chapters?.id || "";
          const substitutedUrl = chaptersBaseUrl.replace("{id}", chaptersId);
          const chaptersUrl = `${substitutedUrl}?page=1&page_size=200&sort_by=chapter_number&sort_order=desc`;

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

      fetchHomepageComics: async () => {
        if (get().isLoadingHomepage) return get().homepageComics;
        set({ isLoadingHomepage: true, homepageError: null });
        try {
          const json = await fetchEncrypted("/api/v1/manga/list?type=project&page=1&page_size=24&is_update=true&sort=latest&sort_order=desc");
          if (json.retcode !== 0 || !json.data) {
            throw new Error(json.message || "Failed to fetch homepage data");
          }

          const mapped = mapApiMangaListToComics(json.data);

          set({
            homepageComics: mapped,
            isLoadingHomepage: false,
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
              if (!updatedLoaded[c.slug] || !updatedLoaded[c.slug].chapters || updatedLoaded[c.slug].chapters.length <= 3) {
                updatedLoaded[c.slug] = c;
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
