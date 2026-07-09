export interface Chapter {
  number: number;
  title: string;
  date: string;
  views: string;
  id?: string;
}

export interface ComicApiUrlConfig {
  url: string;
  params: Record<string, unknown> | null;
  response?: unknown;
}

export interface ApiChapterDetail {
  chapter_id: string;
  manga_id: string;
  chapter_number: number;
  chapter_title: string;
  base_url: string;
  base_url_low: string;
  chapter: {
    path: string;
    data: string[];
  };
  thumbnail_image_url: string;
  view_count: number;
  prev_chapter_id: string | null;
  prev_chapter_number: number | null;
  next_chapter_id: string | null;
  next_chapter_number: number | null;
  release_date: string;
  created_at: string;
  updated_at: string;
}

export interface ComicApiConfig {
  detail: {
    id: string;
    urls: ComicApiUrlConfig;
  };
  chapters: {
    id: string;
    urls: ComicApiUrlConfig;
  };
  chapterDetail?: {
    urls: ComicApiUrlConfig;
  };
}

export interface Comic {
  id: string;
  api?: ComicApiConfig;
  slug: string;
  title: string;
  altTitle: string;
  type: "Manga" | "Manhwa" | "Manhua";
  status: "Ongoing" | "Completed" | "Hiatus";
  author: string;
  artist: string;
  genres: string[];
  rating: number;
  totalVotes: number;
  views: string;
  bookmarks: number;
  synopsis: string;
  coverUrl: string;
  bannerUrl: string;
  latestChapter: number;
  totalChapters: number;
  updatedAt: string;
  isNew: boolean;
  isFeatured: boolean;
  chapters: Chapter[];
}

export const VALID_GENRES = [
  "Action",
  "Romance",
  "Fantasy",
  "Horror",
  "Slice of Life",
  "Isekai",
  "Martial Arts",
  "School",
  "Supernatural",
  "Sports",
  "Cooking",
  "Drama",
] as const;

export const VALID_TYPES = ["Manga", "Manhwa", "Manhua"] as const;
export const VALID_STATUSES = ["Ongoing", "Completed", "Hiatus"] as const;


export const comics: Comic[] = [
  {
    id: "star-embracing-swordmaster",
    slug: "star-embracing-swordmaster",
    title: "Star Embracing Swordmaster",
    altTitle: "Star Embracing Swordmaster",
    api: {
      detail: {
        id: "4bf6c017-842e-48a1-8a2a-f6160c1d8d44",
        urls: {
          url: "/api-proxy/v1/manga/detail/4bf6c017-842e-48a1-8a2a-f6160c1d8d44",
          params: null
        }
      },
      chapters: {
        id: "4bf6c017-842e-48a1-8a2a-f6160c1d8d44",
        urls: {
          url: "/api-proxy/v1/chapter/{id}/list",
          params: {
            page: 1,
            page_size: 24,
            sort_by: "chapter_number",
            sort_order: "desc",
          }
        }
      },
      chapterDetail: {
        urls: {
          url: "/api-proxy/v1/chapter/detail/{id_chapter}",
          params: null
        }
      }
    },
    type: "Manhwa",
    status: "Ongoing",
    author: "Hong Dae-Wui",
    artist: "Juno",
    genres: ["Action", "Advanture", "Fantasy"],
    rating: 8.5,
    totalVotes: 18420,
    views: "24.8M",
    bookmarks: 1,
    synopsis:
      "Setelah 10 tahun berjuang di menara yang misterius, Sung Min adalah satu-satunya yang berhasil mencapai puncak. Namun, bukan akhir yang menantinya melainkan kesempatan kedua. Diputar kembali ke 10 tahun yang lalu dengan pengetahuan dan kekuatan yang dimilikinya, ia berjanji akan mengubah takdirnya dan melindungi orang-orang yang dicintainya.",
    coverUrl: "/images/covers/solo-ascending.jpg",
    bannerUrl: "/images/banners/solo-ascending-wide.jpg",
    latestChapter: 187,
    totalChapters: 187,
    updatedAt: "2024-01-15",
    isNew: false,
    isFeatured: true,
    chapters: [
      { number: 187, title: "Kebangkitan Sang Penguasa", date: "2024-01-15", views: "1.2M" },
      { number: 186, title: "Pertarungan di Puncak", date: "2024-01-08", views: "1.5M" },
      { number: 185, title: "Kekuatan Tersembunyi", date: "2024-01-01", views: "1.3M" },
      { number: 184, title: "Aliansi Para Pembunuh", date: "2023-12-25", views: "1.1M" },
      { number: 183, title: "Jalan Menuju Puncak", date: "2023-12-18", views: "980K" },
    ],
  },
   {
    id: "nano-machine",
    slug: "nano-machine",
    title: "Nano Machine",
    altTitle: "Nano Machine",
    api: {
      detail: {
        id: "d3b05787-4c8e-42bb-ba9a-6b2fafd92f3c",
        urls: {
          url: "/api-proxy/v1/manga/detail/d3b05787-4c8e-42bb-ba9a-6b2fafd92f3c",
          params: null
        }
      },
      chapters: {
        id: "d3b05787-4c8e-42bb-ba9a-6b2fafd92f3c",
        urls: {
          url: "/api-proxy/v1/chapter/{id}/list",
          params: {
            page: 1,
            page_size: 24,
            sort_by: "chapter_number",
            sort_order: "desc",
          }
        }
      },
      chapterDetail: {
        urls: {
          url: "/api-proxy/v1/chapter/detail/{id_chapter}",
          params: null
        }
      }
    },
    type: "Manhwa",
    status: "Ongoing",
    author: "Hong Dae-Wui",
    artist: "Juno",
    genres: ["Action", "Advanture", "Fantasy"],
    rating: 8.5,
    totalVotes: 18420,
    views: "24.8M",
    bookmarks: 1,
    synopsis:
      "Setelah 10 tahun berjuang di menara yang misterius, Sung Min adalah satu-satunya yang berhasil mencapai puncak. Namun, bukan akhir yang menantinya melainkan kesempatan kedua. Diputar kembali ke 10 tahun yang lalu dengan pengetahuan dan kekuatan yang dimilikinya, ia berjanji akan mengubah takdirnya dan melindungi orang-orang yang dicintainya.",
    coverUrl: "/images/covers/solo-ascending.jpg",
    bannerUrl: "/images/banners/solo-ascending-wide.jpg",
    latestChapter: 187,
    totalChapters: 187,
    updatedAt: "2024-01-15",
    isNew: false,
    isFeatured: true,
    chapters: [
      { number: 187, title: "Kebangkitan Sang Penguasa", date: "2024-01-15", views: "1.2M" },
      { number: 186, title: "Pertarungan di Puncak", date: "2024-01-08", views: "1.5M" },
      { number: 185, title: "Kekuatan Tersembunyi", date: "2024-01-01", views: "1.3M" },
      { number: 184, title: "Aliansi Para Pembunuh", date: "2023-12-25", views: "1.1M" },
      { number: 183, title: "Jalan Menuju Puncak", date: "2023-12-18", views: "980K" },
    ],
  },
];

export function getComicBySlug(slug: string): Comic | undefined {
  return comics.find((c) => c.slug === slug);
}



export function getComicsByGenre(genre: string): Comic[] {
  return comics.filter((c) => c.genres.includes(genre));
}

export function searchComics(query: string): Comic[] {
  const lower = query.toLowerCase();
  return comics.filter(
    (c) =>
      c.title.toLowerCase().includes(lower) ||
      c.altTitle.toLowerCase().includes(lower) ||
      c.genres.some((g) => g.toLowerCase().includes(lower))
  );
}

export function filterComics(
  genres: string[],
  status: string | null,
  type: string | null,
  minRating: number,
  sortBy: string
): Comic[] {
  let result = [...comics];

  if (genres.length > 0) {
    result = result.filter((c) => genres.some((g) => c.genres.includes(g)));
  }

  if (status) {
    result = result.filter((c) => c.status === status);
  }

  if (type) {
    result = result.filter((c) => c.type === type);
  }

  result = result.filter((c) => c.rating >= minRating);

  switch (sortBy) {
    case "popular":
      result.sort((a, b) => b.bookmarks - a.bookmarks);
      break;
    case "rating":
      result.sort((a, b) => b.rating - a.rating);
      break;
    case "newest":
      result.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      break;
    case "az":
      result.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "za":
      result.sort((a, b) => b.title.localeCompare(a.title));
      break;
    default:
      result.sort((a, b) => b.bookmarks - a.bookmarks);
  }

  return result;
}

interface ApiTaxonomyItem {
  taxonomy_id: number;
  slug: string;
  name: string;
}

interface ApiTaxonomy {
  Artist?: ApiTaxonomyItem[];
  Author?: ApiTaxonomyItem[];
  Format?: ApiTaxonomyItem[];
  Genre?: ApiTaxonomyItem[];
  Type?: ApiTaxonomyItem[];
}

interface ApiMangaDetail {
  id: number;
  manga_id: string;
  title: string;
  description: string;
  alternative_title: string;
  release_year: string;
  status: number;
  cover_image_url: string;
  view_count: number;
  user_rate: number;
  cover_portrait_url: string;
  latest_chapter_id: string;
  latest_chapter_number: number;
  latest_chapter_time: string;
  country_id: string;
  bookmark_count: number;
  rank: number;
  is_recommended: boolean;
  taxonomy: ApiTaxonomy;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface ApiChapterItem {
  chapter_id: string;
  manga_id: string;
  chapter_title: string;
  chapter_number: number;
  thumbnail_image_url: string;
  view_count: number;
  release_date: string;
}

export function mapApiMangaToComic(detail: ApiMangaDetail, chaptersList: ApiChapterItem[], staticComic: Comic): Comic {
  const mappedChapters: Chapter[] = (chaptersList || []).map((ch: ApiChapterItem) => {
    let viewsStr = "0";
    const vc = ch.view_count || 0;
    if (vc >= 1000000) {
      viewsStr = `${(vc / 1000000).toFixed(1)}M`;
    } else if (vc >= 1000) {
      viewsStr = `${(vc / 1000).toFixed(1)}K`;
    } else {
      viewsStr = vc.toString();
    }

    return {
      id: ch.chapter_id,
      number: ch.chapter_number,
      title: ch.chapter_title || `Chapter ${ch.chapter_number}`,
      date: ch.release_date ? ch.release_date.split("T")[0] : "",
      views: viewsStr,
    };
  });

  mappedChapters.sort((a, b) => b.number - a.number);

  const authorName = detail.taxonomy?.Author?.map((a: ApiTaxonomyItem) => a.name).join(", ") || staticComic.author;
  const artistName = detail.taxonomy?.Artist?.map((a: ApiTaxonomyItem) => a.name).join(", ") || staticComic.artist;
  const genres = detail.taxonomy?.Genre?.map((g: ApiTaxonomyItem) => g.name) || staticComic.genres;

  const rawType = detail.taxonomy?.Format?.[0]?.name || staticComic.type;
  let comicType: "Manga" | "Manhwa" | "Manhua" = "Manhwa";
  if (rawType === "Manga" || rawType === "Manhua" || rawType === "Manhwa") {
    comicType = rawType;
  }

  let status: "Ongoing" | "Completed" | "Hiatus" = "Ongoing";
  if (detail.status === 1) {
    status = "Ongoing";
  } else if (detail.status === 2) {
    status = "Completed";
  } else if (detail.status === 3) {
    status = "Hiatus";
  }

  let viewsStr = staticComic.views;
  const vc = detail.view_count || 0;
  if (vc >= 1000000) {
    viewsStr = `${(vc / 1000000).toFixed(1)}M`;
  } else if (vc >= 1000) {
    viewsStr = `${(vc / 1000).toFixed(1)}K`;
  } else if (vc > 0) {
    viewsStr = vc.toLocaleString();
  }

  const coverUrl = detail.cover_portrait_url || detail.cover_image_url || staticComic.coverUrl;
  const bannerUrl = detail.cover_image_url || staticComic.bannerUrl;

  return {
    ...staticComic,
    title: detail.title || staticComic.title,
    altTitle: detail.alternative_title || staticComic.altTitle,
    type: comicType,
    status,
    author: authorName,
    artist: artistName,
    genres,
    rating: detail.user_rate || staticComic.rating,
    views: viewsStr,
    bookmarks: detail.bookmark_count || staticComic.bookmarks,
    synopsis: detail.description || staticComic.synopsis,
    coverUrl,
    bannerUrl,
    latestChapter: detail.latest_chapter_number || staticComic.latestChapter,
    totalChapters: mappedChapters.length || staticComic.totalChapters,
    updatedAt: detail.latest_chapter_time ? detail.latest_chapter_time.split("T")[0] : staticComic.updatedAt,
    chapters: mappedChapters,
  };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9-\s]/g, "") // remove special characters except letters, numbers, spaces, and dashes
    .replace(/\s+/g, "-")         // replace spaces with dashes
    .replace(/-+/g, "-")          // merge multiple dashes
    .replace(/^-+|-+$/g, "");     // trim dashes from start/end
}

export interface ApiMangaListItem {
  alternative_title: string;
  bookmark_count: number;
  chapters?: {
    chapter_id: string;
    chapter_number: number;
    created_at: string;
  }[];
  country_id: string;
  cover_image_url: string;
  cover_portrait_url: string;
  created_at: string;
  deleted_at: string | null;
  description: string;
  is_recommended: boolean;
  latest_chapter_id: string;
  latest_chapter_number: number;
  latest_chapter_time: string;
  manga_id: string;
  rank: number;
  release_year: string;
  status: number;
  taxonomy: ApiTaxonomy;
  title: string;
  updated_at: string;
  user_rate: number;
  view_count: number;
}

export function mapApiMangaListToComics(dataList: ApiMangaListItem[]): Comic[] {
  return (dataList || []).map((item: ApiMangaListItem) => {
    const slug = slugify(item.title);
    const genres = item.taxonomy?.Genre?.map((g: ApiTaxonomyItem) => g.name) || [];

    const rawType = item.taxonomy?.Format?.[0]?.name || "Manhwa";
    let comicType: "Manga" | "Manhwa" | "Manhua" = "Manhwa";
    if (rawType === "Manga" || rawType === "Manhua" || rawType === "Manhwa") {
      comicType = rawType;
    }

    let status: "Ongoing" | "Completed" | "Hiatus" = "Ongoing";
    if (item.status === 1) {
      status = "Ongoing";
    } else if (item.status === 2) {
      status = "Completed";
    } else if (item.status === 3) {
      status = "Hiatus";
    }

    let viewsStr = "0";
    const vc = item.view_count || 0;
    if (vc >= 1000000) {
      viewsStr = `${(vc / 1000000).toFixed(1)}M`;
    } else if (vc >= 1000) {
      viewsStr = `${(vc / 1000).toFixed(1)}K`;
    } else if (vc > 0) {
      viewsStr = vc.toLocaleString();
    }

    const coverUrl = item.cover_portrait_url || item.cover_image_url || "/images/covers/placeholder.jpg";
    const bannerUrl = item.cover_image_url || "/images/banners/placeholder.jpg";

    const mappedChapters: Chapter[] = (item.chapters || []).map((ch) => ({
      id: ch.chapter_id,
      number: ch.chapter_number,
      title: `Chapter ${ch.chapter_number}`,
      date: ch.created_at ? ch.created_at.split("T")[0] : "",
      views: "0",
    }));

    const authorName = item.taxonomy?.Author?.map((a: ApiTaxonomyItem) => a.name).join(", ") || "Unknown";
    const artistName = item.taxonomy?.Artist?.map((a: ApiTaxonomyItem) => a.name).join(", ") || "Unknown";

    const apiConfig: ComicApiConfig = {
      detail: {
        id: item.manga_id,
        urls: {
          url: `/api-proxy/v1/manga/detail/${item.manga_id}`,
          params: null
        }
      },
      chapters: {
        id: item.manga_id,
        urls: {
          url: `/api-proxy/v1/chapter/${item.manga_id}/list`,
          params: {
            page: 1,
            page_size: 200,
            sort_by: "chapter_number",
            sort_order: "desc"
          }
        }
      },
      chapterDetail: {
        urls: {
          url: "/api-proxy/v1/chapter/detail/{id_chapter}",
          params: null
        }
      }
    };

    return {
      id: item.manga_id,
      api: apiConfig,
      slug,
      title: item.title,
      altTitle: item.alternative_title || item.title,
      type: comicType,
      status,
      author: authorName,
      artist: artistName,
      genres,
      rating: item.user_rate || 8.0,
      totalVotes: Math.round(item.bookmark_count / 3) || 1000,
      views: viewsStr,
      bookmarks: item.bookmark_count || 0,
      synopsis: item.description || "",
      coverUrl,
      bannerUrl,
      latestChapter: item.latest_chapter_number || 0,
      totalChapters: item.latest_chapter_number || 0,
      updatedAt: item.latest_chapter_time ? item.latest_chapter_time.split("T")[0] : "",
      isNew: item.latest_chapter_time ? new Date(item.latest_chapter_time) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : false,
      isFeatured: item.is_recommended || false,
      chapters: mappedChapters,
    };
  });
}

