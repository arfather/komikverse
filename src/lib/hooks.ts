import { useState, useEffect, useRef, useCallback } from "react";
import { isValidStorageKey } from "./sanitize";
import type { Comic, ApiChapterDetail } from "./data";

/**
 * useLocalStorage - Persist state to localStorage with SSR safety
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Validate key
  if (!isValidStorageKey(key)) {
    console.warn(`Invalid localStorage key: ${key}`);
  }

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === "undefined") return initialValue;
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prev) => {
          const valueToStore = value instanceof Function ? value(prev) : value;
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          }
          return valueToStore;
        });
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}

/**
 * useDebounce - Debounce a value with configurable delay
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useIntersectionObserver - Lazy load trigger
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element | null>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, options]);

  return isIntersecting;
}

/**
 * useKeyboard - Register keyboard shortcuts with cleanup
 */
export function useKeyboard(
  keyMap: Record<string, (e: KeyboardEvent) => void>,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (keyMap[key]) {
        e.preventDefault();
        keyMap[key](e);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [keyMap, enabled]);
}

/**
 * useRateLimit - Client-side rate limiting
 */
export function useRateLimit(maxRequests = 30, windowMs = 60000) {
  const [state, setState] = useState<{
    isAllowed: boolean;
    remainingRequests: number;
    resetIn: number;
  }>({
    isAllowed: true,
    remainingRequests: maxRequests,
    resetIn: 0,
  });

  const timestampsRef = useRef<number[]>([]);

  const checkLimit = useCallback(() => {
    const now = Date.now();
    timestampsRef.current = timestampsRef.current.filter(
      (t) => now - t < windowMs
    );

    const remaining = Math.max(0, maxRequests - timestampsRef.current.length);
    const oldestTimestamp = timestampsRef.current[0];
    const resetIn = oldestTimestamp
      ? Math.ceil((oldestTimestamp + windowMs - now) / 1000)
      : 0;

    const isAllowed = timestampsRef.current.length < maxRequests;

    setState({ isAllowed, remainingRequests: remaining, resetIn });
    return isAllowed;
  }, [maxRequests, windowMs]);

  const recordRequest = useCallback(() => {
    timestampsRef.current.push(Date.now());
    checkLimit();
  }, [checkLimit]);

  return { ...state, checkLimit, recordRequest };
}

/**
 * useMediaQuery - Detect responsive breakpoints
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

/**
 * usePageVisibility - Detect if tab is active
 */
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handler = () => setIsVisible(!document.hidden);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  return isVisible;
}

/**
 * useScrollPosition - Track scroll position
 */
export function useScrollPosition() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return scrollY;
}

/**
 * useMousePosition - Track mouse position for 3D tilt effects
 */
export function useMousePosition(ref: React.RefObject<HTMLElement | null>) {
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handler = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      setPosition({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    };

    element.addEventListener("mousemove", handler);
    return () => element.removeEventListener("mousemove", handler);
  }, [ref]);

  return position;
}

/**
 * useChapterPages - Hook to fetch page images from the API or fallback to mock pages
 */
export function useChapterPages(comic: Comic, chapter: number) {
  const [pages, setPages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const chapterObj = comic.chapters.find((c) => c.number === chapter);
    const chapterId = chapterObj?.id;

    if (chapterId) {
      Promise.resolve().then(() => {
        setIsLoading(true);
        setError(null);
      });

      const urlTemplate = comic.api?.chapterDetail?.urls?.url || "https://api.shngm.io/v1/chapter/detail/{id_chapter}";
      const fetchUrl = urlTemplate.replace("{id_chapter}", chapterId);

      fetch(fetchUrl)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch pages: ${res.statusText}`);
          }
          return res.json();
        })
        .then((json) => {
          const data: ApiChapterDetail | null = json.data ? json.data : (json.chapter_id ? json : null);
          if (data) {
            const baseUrl = data.base_url || "https://assets.shngm.id";
            const path = data.chapter?.path || "";
            const fileList = data.chapter?.data || [];
            const mappedPages = fileList.map((filename: string) => `${baseUrl}${path}${filename}`);
            setPages(mappedPages);
          } else {
            setPages(getChapterPages(comic.slug, chapter));
          }
          setIsLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching chapter pages:", err);
          setPages(getChapterPages(comic.slug, chapter));
          setError(err.message || "Failed to fetch pages");
          setIsLoading(false);
        });
    } else {
      Promise.resolve().then(() => {
        setPages(getChapterPages(comic.slug, chapter));
      });
    }
  }, [comic.slug, chapter, comic.chapters, comic.api]);

  return { pages, isLoading, error };
}

// Helper to generate mock page images for local/fallback chapters
function getChapterPages(comicSlug: string, chapterNum: number): string[] {
  const pages: string[] = [];
  const seed = `${comicSlug}-${chapterNum}`;
  const pageCount = 8 + (chapterNum % 5);
  
  for (let i = 0; i < pageCount; i++) {
    pages.push(`https://picsum.photos/seed/${seed}-page-${i}/800/1200`);
  }
  return pages;
}

