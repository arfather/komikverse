import { create } from "zustand";
import { persist } from "zustand/middleware";
import { sanitizeSearchQuery } from "./sanitize";
import { comics, getComicBySlug, mapApiMangaToComic, mapApiMangaListToComics } from "./data";
import type { Comic } from "./data";

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

  // Actions
  toggleBookmark: (comicId: string) => void;
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
        const wasBookmarked = get().bookmarks.has(comicId);
        get().addToast(
          wasBookmarked ? "Dihapus dari bookmark" : "Ditambahkan ke bookmark",
          wasBookmarked ? "info" : "success"
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

      fetchComic: async (slug: string) => {
        let comic = getComicBySlug(slug);
        
        if (!comic) {
          comic = get().homepageComics.find((c) => c.slug === slug);
        }

        if (!comic) {
          const fetchedList = await get().fetchHomepageComics();
          comic = fetchedList.find((c) => c.slug === slug);
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
          const detailUrl = apiConfig.detail?.urls?.url;
          
          // Substitute {id} in chapters list URL and set page_size to 200 to fetch all chapters
          const chaptersBaseUrl = apiConfig.chapters?.urls?.url || "";
          const chaptersId = apiConfig.chapters?.id || "";
          const substitutedUrl = chaptersBaseUrl.replace("{id}", chaptersId);
          const chaptersUrl = `${substitutedUrl}?page=1&page_size=200&sort_by=chapter_number&sort_order=desc`;

          if (!detailUrl || !chaptersBaseUrl) {
            throw new Error("Invalid API configuration");
          }

          // Fetch details and chapters in parallel
          const [detailRes, chaptersRes] = await Promise.all([
            fetch(detailUrl),
            fetch(chaptersUrl),
          ]);

          if (!detailRes.ok) {
            throw new Error(`Failed to fetch comic details: ${detailRes.statusText}`);
          }
          if (!chaptersRes.ok) {
            throw new Error(`Failed to fetch chapters: ${chaptersRes.statusText}`);
          }

          const detailJson = await detailRes.json();
          const chaptersJson = await chaptersRes.json();

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
        set({ isLoadingHomepage: true, homepageError: null });
        try {
          const res = await fetch("/api-proxy/v1/manga/list?type=project&page=1&page_size=24&is_update=true&sort=latest&sort_order=desc");
          if (!res.ok) {
            throw new Error(`Failed to fetch homepage comics: ${res.statusText}`);
          }
          const json = await res.json();
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
          const res = await fetch(`/api-proxy/v1/manga/list?page=1&page_size=24&q=${encodeURIComponent(query)}`);
          if (!res.ok) {
            throw new Error(`Search failed: ${res.statusText}`);
          }
          const json = await res.json();
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
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.bookmarks = createSet(state.bookmarks as unknown as string[]);
        }
      },
    }
  )
);
