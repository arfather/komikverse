import { Link } from "react-router-dom";
import { BookOpen, Github, Twitter, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-panel border-t border-border-subtle mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <BookOpen className="w-6 h-6 text-fire" />
              <span className="font-display text-xl tracking-wider text-warm-white">
                KOMI<span className="text-fire">K</span>VERSE
              </span>
            </Link>
            <p className="text-sm text-text-muted leading-relaxed">
              Platform baca komik online terbaik dengan koleksi manga, manhwa,
              dan manhua berkualitas tinggi. Nikmati pengalaman membaca tanpa
              batas.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display text-lg tracking-wide text-warm-white mb-4">
              TENTANG
            </h3>
            <ul className="space-y-2">
              {["Tentang Kami", "Kebijakan Privasi", "Syarat Layanan", "FAQ"].map(
                (item) => (
                  <li key={item}>
                    <span className="text-sm text-text-muted hover:text-fire transition-colors cursor-pointer">
                      {item}
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Genres */}
          <div>
            <h3 className="font-display text-lg tracking-wide text-warm-white mb-4">
              GENRE POPULER
            </h3>
            <ul className="space-y-2">
              {["Action", "Romance", "Fantasy", "Horror", "Slice of Life"].map(
                (item) => (
                  <li key={item}>
                    <Link
                      to={`/browse?genre=${item}`}
                      className="text-sm text-text-muted hover:text-fire transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-display text-lg tracking-wide text-warm-white mb-4">
              IKUTI KAMI
            </h3>
            <div className="flex gap-3">
              <span className="w-9 h-9 rounded-lg bg-raised flex items-center justify-center text-text-muted hover:text-fire hover:bg-fire/10 transition-colors cursor-pointer">
                <Twitter className="w-4 h-4" />
              </span>
              <span className="w-9 h-9 rounded-lg bg-raised flex items-center justify-center text-text-muted hover:text-fire hover:bg-fire/10 transition-colors cursor-pointer">
                <Github className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            &copy; 2024 KomikVerse. Semua hak dilindungi.
          </p>
          <p className="flex items-center gap-1 text-xs text-text-muted">
            Dibuat dengan <Heart className="w-3 h-3 text-fire fill-fire" /> untuk
            para pembaca komik
          </p>
        </div>
      </div>
    </footer>
  );
}
