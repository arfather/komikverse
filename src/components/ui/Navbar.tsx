import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  Bookmark,
  Menu,
  X,
  BookOpen,
  Home,
  Grid,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useScrollPosition, useDebounce, useRateLimit } from "@/lib/hooks";
import { sanitizeSearchQuery } from "@/lib/sanitize";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const scrollY = useScrollPosition();
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pathnameRef = useRef(location.pathname);
  const { isAllowed, recordRequest } = useRateLimit(30, 60000);

  const debouncedSearch = useDebounce(searchValue, 300);

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    setIsScrolled(scrollY > 50);
  }, [scrollY]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);


  useEffect(() => {
    const sanitized = sanitizeSearchQuery(debouncedSearch);
    const rawSanitized = sanitizeSearchQuery(searchValue);
    if (sanitized.length > 0 && rawSanitized.length > 0) {
      setSearchQuery(sanitized);
      if (pathnameRef.current !== "/browse") {
        navigate(`/browse?search=${encodeURIComponent(sanitized)}`);
      }
    }
  }, [debouncedSearch, searchValue, setSearchQuery, navigate]);

  useEffect(() => {
    setMobileMenuOpen(false);
    if (location.pathname !== "/browse") {
      setSearchValue("");
      setSearchOpen(false);
      setSearchQuery("");
    } else {
      setSearchValue("");
      setSearchOpen(false);
    }
  }, [location.pathname, setSearchQuery]);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!isAllowed) return;

      const sanitized = sanitizeSearchQuery(searchValue);
      if (sanitized.length > 0) {
        recordRequest();
        setSearchQuery(sanitized);
        setSearchOpen(false);
        navigate(`/browse?search=${encodeURIComponent(sanitized)}`);
      }
    },
    [searchValue, isAllowed, recordRequest, setSearchQuery, navigate]
  );

  const navLinks = [
    { label: "Beranda", href: "/", icon: Home },
    { label: "Browse", href: "/browse", icon: Grid },
    { label: "Populer", href: "/browse?sort=popular", icon: TrendingUp },
    { label: "Terbaru", href: "/browse?sort=newest", icon: Clock },
  ];

  const isReader = location.pathname.includes("/chapter/");
  if (isReader) return null;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-void/95 backdrop-blur-md border-b border-border-subtle shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
            aria-label="KomikVerse Beranda"
          >
            <BookOpen className="w-7 h-7 text-fire group-hover:text-fire-glow transition-colors" />
            <span className="font-display text-2xl tracking-wider text-warm-white">
              KOMI<span className="text-fire">K</span>VERSE
            </span>
          </Link>

          {/* Desktop Nav Links */}
          {/* <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  location.pathname === link.href
                    ? "text-fire bg-fire/10"
                    : "text-text-muted hover:text-warm-white hover:bg-raised"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div> */}

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            {location.pathname !== "/browse" && (
              <div className="relative">
                {searchOpen ? (
                  <form
                    onSubmit={handleSearchSubmit}
                    className="flex items-center gap-2"
                  >
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      placeholder="Cari komik..."
                      maxLength={100}
                      className="w-48 lg:w-64 bg-raised border border-border-subtle rounded-lg px-3 py-1.5 text-sm text-warm-white placeholder:text-text-muted focus:outline-none focus:border-fire transition-colors"
                      aria-label="Cari komik"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchValue("");
                      }}
                      className="p-1.5 text-text-muted hover:text-warm-white transition-colors"
                      aria-label="Tutup pencarian"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="p-2 rounded-lg text-text-muted hover:text-warm-white hover:bg-raised transition-colors"
                    aria-label="Buka pencarian"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}

            {/* Bookmark */}
            <Link
              to="/browse?bookmarked=true"
              className="flex p-2 rounded-lg text-text-muted hover:text-warm-white hover:bg-raised transition-colors"
              aria-label="Bookmark"
            >
              <Bookmark className="w-5 h-5" />
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-text-muted hover:text-warm-white hover:bg-raised transition-colors"
              aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-16 left-0 right-0 bg-panel border-b border-border-subtle animate-fade-in-up">
            <div className="p-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    location.pathname === link.href
                      ? "text-fire bg-fire/10"
                      : "text-text-muted hover:text-warm-white hover:bg-raised"
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-semibold">{link.label}</span>
                </Link>
              ))}
              <Link
                to="/browse?bookmarked=true"
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-text-muted hover:text-warm-white hover:bg-raised transition-colors"
              >
                <Bookmark className="w-5 h-5" />
                <span className="font-semibold">Bookmark</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
