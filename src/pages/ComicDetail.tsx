import { useState, useMemo, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Eye,
  Bookmark,
  Star,
  Calendar,
  ChevronDown,
  ChevronUp,
  ArrowDownAZ,
  MessageCircle,
  ThumbsUp,
  Clock,
} from "lucide-react";
import { getComicBySlug, comics } from "@/lib/data";
import { sanitizeSlug } from "@/lib/sanitize";
import { useStore } from "@/lib/store";
import StarRating from "@/components/ui/StarRating";
import ComicCard from "@/components/ui/ComicCard";

const isNew = (date: string) => {
  return new Date(date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
};

export default function ComicDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [expandSynopsis, setExpandSynopsis] = useState(false);
  const [chapterSort, setChapterSort] = useState<"newest" | "oldest">("newest");
  const [visibleChapters, setVisibleChapters] = useState(20);
  const toggleBookmark = useStore((s) => s.toggleBookmark);
  const isBookmarked = useStore((s) => s.isBookmarked(slug || ""));

  // Security: validate slug
  const validSlug = useMemo(() => sanitizeSlug(slug), [slug]);

  const loadedComics = useStore((s) => s.loadedComics);
  const fetchComic = useStore((s) => s.fetchComic);
  const isLoading = useStore((s) => s.isLoadingComic);

  useEffect(() => {
    if (validSlug) {
      fetchComic(validSlug);
    }
  }, [validSlug, fetchComic]);

  const comic = validSlug ? (loadedComics[validSlug] || getComicBySlug(validSlug)) : undefined;

  const sortedChapters = useMemo(() => {
    if (!comic) return [];
    const chapters = [...comic.chapters];
    return chapterSort === "newest"
      ? chapters.sort((a, b) => b.number - a.number)
      : chapters.sort((a, b) => a.number - b.number);
  }, [comic, chapterSort]);

  if (!validSlug) {
    return <Navigate to="/404" replace />;
  }

  if (!comic) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-void">
        <div className="text-center">
          <h1 className="font-display text-4xl text-warm-white mb-4">
            KOMIK TIDAK DITEMUKAN
          </h1>
          <p className="text-text-muted mb-6">
            Komik yang kamu cari tidak tersedia.
          </p>
          <Link
            to="/"
            className="px-6 py-3 bg-fire hover:bg-fire-glow text-white font-bold rounded-lg transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const visibleChapterList = sortedChapters.slice(0, visibleChapters);
  const hasMoreChapters = visibleChapters < sortedChapters.length;

  // Related comics (same genres)
  const relatedComics = comics
    .filter((c) => c.id !== comic.id && c.genres.some((g) => comic.genres.includes(g)))
    .slice(0, 6);

  // Mock comments
  const comments = [
    {
      id: 1,
      user: "ComicLover99",
      avatar: "CL",
      time: "2 jam yang lalu",
      text: "Chapter terbaru sangat seru! Plot twistnya tidak terduga.",
      likes: 24,
    },
    {
      id: 2,
      user: "MangaReader",
      avatar: "MR",
      time: "5 jam yang lalu",
      text: "Gambarnya makin bagus aja, art improvementnya kelihatan banget.",
      likes: 18,
    },
    {
      id: 3,
      user: "WebtoonFan",
      avatar: "WF",
      time: "1 hari yang lalu",
      text: "Karakter developmentnya mantap! Tidak sabar nunggu chapter selanjutnya.",
      likes: 32,
    },
  ];

  const firstChapter = comic.chapters[comic.chapters.length - 1]?.number || 1;
  const latestChapter = comic.chapters[0]?.number || 1;

  return (
    <div className="min-h-screen bg-void pt-16">
      {isLoading && (
        <div className="fixed top-16 left-0 right-0 h-1 bg-fire/20 z-50 overflow-hidden">
          <div className="h-[2px] bg-fire animate-pulse" style={{ width: "60%" }} />
        </div>
      )}
      {/* Hero Detail */}
      <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src={comic.bannerUrl}
            alt={comic.title}
            className="w-full h-full object-cover blur-3xl opacity-40 scale-110"
          />
          <div className="absolute inset-0 bg-void/70" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 flex items-end pb-10">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            {/* Cover */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-40 md:w-52 flex-shrink-0 rounded-xl overflow-hidden shadow-2xl shadow-black/50"
            >
              <img
                src={comic.coverUrl}
                alt={comic.title}
                className="w-full h-auto object-cover"
              />
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1"
            >
              {/* Title */}
              <h1 className="font-display text-4xl md:text-6xl text-warm-white tracking-wide uppercase">
                {comic.title}
              </h1>
              <p className="text-text-muted text-lg mt-1">{comic.altTitle}</p>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <span className="text-sm text-text-muted">
                  {comic.author}
                </span>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    comic.status === "Ongoing"
                      ? "bg-status-ongoing/20 text-status-ongoing"
                      : comic.status === "Completed"
                        ? "bg-status-completed/20 text-status-completed"
                        : "bg-status-hiatus/20 text-status-hiatus"
                  }`}
                >
                  {comic.status}
                </span>
                <span className="text-sm text-text-muted flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Update: {new Date(comic.updatedAt).toLocaleDateString("id-ID")}
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-3 mt-4">
                <StarRating
                  rating={Math.round(comic.rating) / 2}
                  size="lg"
                  interactive
                />
                <span className="text-2xl font-bold text-fire-gold">
                  {comic.rating}
                </span>
                <span className="text-sm text-text-muted">
                  ({comic.totalVotes.toLocaleString()} votes)
                </span>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2 mt-4">
                {comic.genres.map((genre) => (
                  <Link
                    key={genre}
                    to={`/browse?genre=${genre}`}
                    className="text-xs px-3 py-1.5 rounded-full bg-raised text-text-muted hover:text-fire hover:bg-fire/10 transition-colors"
                  >
                    {genre}
                  </Link>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  to={`/comic/${comic.slug}/${firstChapter}`}
                  className="px-6 py-3 bg-fire hover:bg-fire-glow text-white font-bold rounded-lg transition-colors shadow-bloom"
                >
                  Baca Chapter 1
                </Link>
                <Link
                  to={`/comic/${comic.slug}/${latestChapter}`}
                  className="px-6 py-3 bg-raised hover:bg-fire/20 text-warm-white font-bold rounded-lg border border-border-subtle hover:border-fire/30 transition-all"
                >
                  Baca Chapter Terbaru
                </Link>
                <button
                  onClick={() => toggleBookmark(comic.id)}
                  className={`px-4 py-3 rounded-lg border transition-all font-bold flex items-center gap-2 ${
                    isBookmarked
                      ? "bg-fire/20 border-fire text-fire"
                      : "bg-raised border-border-subtle text-warm-white hover:bg-fire/10 hover:border-fire/30"
                  }`}
                >
                  <Bookmark
                    className={`w-5 h-5 ${isBookmarked ? "fill-fire" : ""}`}
                  />
                  {isBookmarked ? "Bookmarked" : "Bookmark"}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-panel border-y border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-fire mb-1">
                <Eye className="w-5 h-5" />
                <span className="text-2xl font-bold">{comic.views}</span>
              </div>
              <span className="text-xs text-text-muted uppercase tracking-wider">
                Views
              </span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-fire mb-1">
                <Bookmark className="w-5 h-5" />
                <span className="text-2xl font-bold">
                  {(comic.bookmarks / 1000).toFixed(0)}K
                </span>
              </div>
              <span className="text-xs text-text-muted uppercase tracking-wider">
                Bookmarks
              </span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-fire mb-1">
                <Star className="w-5 h-5" />
                <span className="text-2xl font-bold">{comic.rating}</span>
              </div>
              <span className="text-xs text-text-muted uppercase tracking-wider">
                Rating
              </span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-fire mb-1">
                <Clock className="w-5 h-5" />
                <span className="text-2xl font-bold">{comic.status}</span>
              </div>
              <span className="text-xs text-text-muted uppercase tracking-wider">
                Status
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Synopsis */}
            <section>
              <h2 className="font-display text-xl tracking-wide text-warm-white mb-3">
                SINOPSIS
              </h2>
              <div
                className={`relative ${
                  !expandSynopsis ? "max-h-24 overflow-hidden" : ""
                }`}
              >
                <p className="text-text-muted leading-relaxed">
                  {comic.synopsis}
                </p>
                {!expandSynopsis && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-void to-transparent" />
                )}
              </div>
              <button
                onClick={() => setExpandSynopsis(!expandSynopsis)}
                className="mt-2 text-fire text-sm font-semibold hover:text-fire-glow transition-colors flex items-center gap-1"
              >
                {expandSynopsis ? (
                  <>
                    Sembunyikan <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Baca Selengkapnya <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </section>

            {/* Chapter List */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl tracking-wide text-warm-white">
                  DAFTAR CHAPTER ({comic.totalChapters})
                </h2>
                <button
                  onClick={() =>
                    setChapterSort((s) =>
                      s === "newest" ? "oldest" : "newest"
                    )
                  }
                  className="flex items-center gap-2 text-sm text-text-muted hover:text-warm-white transition-colors"
                >
                  <ArrowDownAZ className="w-4 h-4" />
                  {chapterSort === "newest"
                    ? "Terbaru Dulu"
                    : "Terlama Dulu"}
                </button>
              </div>

              <div className="bg-panel rounded-xl border border-border-subtle overflow-hidden">
                {visibleChapterList.map((ch, i) => (
                  <Link
                    key={ch.number}
                    to={`/comic/${comic.slug}/${ch.number}`}
                    className={`flex items-center gap-4 px-4 py-3 hover:bg-raised transition-colors border-b border-border-subtle last:border-b-0 ${
                      i % 2 === 0 ? "bg-panel" : "bg-void/50"
                    }`}
                  >
                    <span className="text-sm text-text-muted w-12 flex-shrink-0">
                      Ch. {ch.number}
                    </span>
                    <span className="flex-1 text-sm text-warm-white truncate">
                      {ch.title}
                    </span>
                    <span className="text-xs text-text-muted hidden sm:block">
                      {new Date(ch.date).toLocaleDateString("id-ID")}
                    </span>
                    <span className="text-xs text-text-muted hidden md:block">
                      {ch.views}
                    </span>
                    {isNew(ch.date) && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-fire/20 text-fire font-semibold">
                        NEW
                      </span>
                    )}
                  </Link>
                ))}
              </div>

              {hasMoreChapters && (
                <button
                  onClick={() => setVisibleChapters((v) => v + 20)}
                  className="mt-4 w-full py-3 bg-raised hover:bg-fire/10 text-text-muted hover:text-warm-white rounded-lg border border-border-subtle hover:border-fire/30 transition-all font-semibold"
                >
                  Muat Lebih Banyak
                </button>
              )}
            </section>

            {/* Comments */}
            <section>
              <h2 className="font-display text-xl tracking-wide text-warm-white mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                KOMENTAR ({comments.length})
              </h2>

              {/* Comment Input */}
              <div className="bg-panel rounded-xl border border-border-subtle p-4 mb-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-fire/20 flex items-center justify-center text-fire font-bold text-sm flex-shrink-0">
                    KM
                  </div>
                  <div className="flex-1">
                    <textarea
                      placeholder="Tulis komentar..."
                      className="w-full bg-void rounded-lg px-4 py-2.5 text-sm text-warm-white placeholder:text-text-muted resize-none focus:outline-none focus:ring-1 focus:ring-fire border border-border-subtle"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button className="px-4 py-2 bg-fire hover:bg-fire-glow text-white text-sm font-bold rounded-lg transition-colors">
                        Kirim
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-panel rounded-xl border border-border-subtle p-4"
                  >
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-raised flex items-center justify-center text-text-muted font-bold text-sm flex-shrink-0">
                        {comment.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-warm-white">
                            {comment.user}
                          </span>
                          <span className="text-xs text-text-muted">
                            {comment.time}
                          </span>
                        </div>
                        <p className="text-sm text-text-muted leading-relaxed">
                          {comment.text}
                        </p>
                        <button className="flex items-center gap-1 mt-2 text-xs text-text-muted hover:text-fire transition-colors">
                          <ThumbsUp className="w-3.5 h-3.5" />
                          {comment.likes}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column - Related */}
          <div className="lg:col-span-1">
            <h3 className="font-display text-lg tracking-wide text-warm-white mb-4">
              KOMIK SERUPA
            </h3>
            <div className="space-y-3">
              {relatedComics.map((c) => (
                <ComicCard key={c.id} comic={c} variant="list" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
