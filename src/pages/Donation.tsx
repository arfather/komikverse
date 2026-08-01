import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart,
  Coffee,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowLeft,
  QrCode,
  CreditCard,
  Smartphone,
  Clock,
} from "lucide-react";
import SEO from "@/components/SEO";
import { useStore } from "@/lib/store";

interface PaymentAccount {
  id: string;
  name: string;
  category: "e-wallet" | "bank" | "platform";
  accountNumber?: string;
  accountName?: string;
  url?: string;
  icon?: string;
  color: string;
  isComingSoon?: boolean;
}

const PAYMENT_METHODS: PaymentAccount[] = [
  {
    id: "saweria",
    name: "Saweria",
    category: "platform",
    url: "https://saweria.co/1xx1xx1xx",
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "trakteer",
    name: "Trakteer",
    category: "platform",
    isComingSoon: true,
    color: "from-red-500 to-rose-600",
  },
  {
    id: "dana",
    name: "DANA",
    category: "e-wallet",
    accountNumber: "XXXXXX",
    accountName: "A.N. KomikVerse Admin",
    color: "from-blue-500 to-cyan-600",
  },
  {
    id: "gopay",
    name: "GoPay",
    category: "e-wallet",
    accountNumber: "XXXXXX",
    accountName: "A.N. KomikVerse Admin",
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "bca",
    name: "Bank BCA",
    category: "bank",
    accountNumber: "XXXXXX",
    accountName: "A.N. KomikVerse Official",
    color: "from-blue-600 to-indigo-700",
  },
  {
    id: "mandiri",
    name: "Bank Mandiri",
    category: "bank",
    accountNumber: "XXXXXX",
    accountName: "A.N. KomikVerse Official",
    color: "from-yellow-600 to-amber-700",
  },
];

export default function Donation() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const addToast = useStore((s) => s.addToast);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast("Nomor berhasil disalin!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const donationSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Donasi & Dukung KomikVerse",
    "description": "Bantu dukung operasional server KomikVerse agar baca komik online tetap gratis dan tanpa iklan mengganggu.",
  };

  return (
    <div className="min-h-screen bg-void pt-20 pb-16 px-4">
      <SEO
        title="Donasi & Dukung Server KomikVerse"
        description="Bantu dukung KomikVerse agar tetap online, gratis, dan kencang tanpa iklan mengganggu."
        schema={donationSchema}
      />

      <div className="max-w-4xl mx-auto space-y-10">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-warm-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-panel border border-border-subtle rounded-3xl p-6 md:p-10 text-center overflow-hidden shadow-2xl"
        >
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-fire/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-fire/10 border border-fire/30 text-fire text-xs font-bold uppercase tracking-wider">
              <Heart className="w-4 h-4 fill-fire" />
              <span>Dukungan Komunitas</span>
            </div>

            <h1 className="font-display text-3xl md:text-5xl text-warm-white tracking-wide uppercase">
              DUKUNG KOMIKVERSE
            </h1>

            <p className="text-sm md:text-base text-text-muted leading-relaxed">
              Seluruh komik di KomikVerse disajikan secara gratis. Dukunganmu sangat berarti untuk membayar biaya server, database, dan pemeliharaan domain agar layanan tetap stabil dan cepat!
            </p>

            {/* Server Target Progress */}
            <div className="bg-raised/70 border border-border-subtle rounded-2xl p-4 md:p-5 mt-6 text-left space-y-3">
              <div className="flex items-center justify-between text-xs md:text-sm">
                <span className="font-bold text-warm-white flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-fire" />
                  Target Server Bulan Ini
                </span>
                <span className="font-extrabold text-fire">75% Terkumpul</span>
              </div>
              <div className="w-full h-3 bg-void rounded-full overflow-hidden p-0.5 border border-border-subtle">
                <div className="h-full bg-gradient-fire rounded-full transition-all duration-500" style={{ width: "75%" }} />
              </div>
              <div className="flex justify-between text-xs text-text-muted">
                <span>Rp 1.500.000 / Rp 2.000.000</span>
                <span>Terima kasih untuk para donatur! ❤️</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Donation Platforms & Accounts */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-fire" />
            <h2 className="font-display text-xl md:text-2xl text-warm-white tracking-wide">
              PILIH METODE DONASI
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PAYMENT_METHODS.map((method) => (
              <motion.div
                key={method.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-panel border border-border-subtle hover:border-fire/40 rounded-2xl p-5 transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center text-white font-bold shadow-md`}>
                      {method.category === "platform" && <ExternalLink className="w-5 h-5" />}
                      {method.category === "e-wallet" && <Smartphone className="w-5 h-5" />}
                      {method.category === "bank" && <CreditCard className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-warm-white text-base">
                        {method.name}
                      </h3>
                      <span className="text-xs text-text-muted capitalize">
                        {method.category === "platform" ? "Instant Online Donation" : method.category}
                      </span>
                    </div>
                  </div>
                </div>

                {method.isComingSoon ? (
                  <div className="w-full py-2.5 px-4 bg-raised text-text-muted font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-border-subtle cursor-not-allowed">
                    <Clock className="w-3.5 h-3.5 text-fire" />
                    <span>Coming Soon</span>
                  </div>
                ) : method.url ? (
                  <a
                    href={method.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 bg-fire hover:bg-fire-glow text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-bloom"
                  >
                    <span>Buka Page {method.name}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <div className="bg-raised rounded-xl p-3 border border-border-subtle space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="text-[11px] text-text-muted uppercase tracking-wider font-semibold">
                          Nomor Rekening / HP
                        </p>
                        <p className="text-sm font-mono font-bold text-warm-white">
                          {method.accountNumber}
                        </p>
                        <p className="text-[11px] text-text-muted">
                          {method.accountName}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCopy(method.id, method.accountNumber || "")}
                        className="p-2 rounded-lg bg-void hover:bg-fire/20 text-text-muted hover:text-fire transition-colors border border-border-subtle"
                        aria-label="Salin nomor"
                      >
                        {copiedId === method.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Donator Perks / Benefits */}
        <div className="bg-panel border border-border-subtle rounded-3xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-border-subtle pb-4">
            <ShieldCheck className="w-6 h-6 text-fire" />
            <div>
              <h3 className="font-display text-lg md:text-xl text-warm-white tracking-wide">
                KEUNTUNGAN DUKUNGANMU
              </h3>
              <p className="text-xs text-text-muted">
                Dukunganmu langsung berdampak pada kualitas layanan platform KomikVerse
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-raised/50 p-4 rounded-2xl border border-border-subtle space-y-2">
              <Zap className="w-5 h-5 text-fire" />
              <h4 className="font-bold text-xs text-warm-white">Server Super Cepat</h4>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Menjaga server CDN tetap kencang & stabil saat me-load gambar chapter komik.
              </p>
            </div>
            <div className="bg-raised/50 p-4 rounded-2xl border border-border-subtle space-y-2">
              <ShieldCheck className="w-5 h-5 text-fire" />
              <h4 className="font-bold text-xs text-warm-white">Bebas Iklan Pop-up</h4>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Membantu kami tetap beroperasi tanpa perlu memasang iklan komersial yang mengganggu.
              </p>
            </div>
            <div className="bg-raised/50 p-4 rounded-2xl border border-border-subtle space-y-2">
              <Heart className="w-5 h-5 text-fire" />
              <h4 className="font-bold text-xs text-warm-white">Update Terus Berlanjut</h4>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Memastikan update komik baru setiap hari tanpa hambatan operasional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
