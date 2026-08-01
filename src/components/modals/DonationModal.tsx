import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, Sparkles, Coffee, ArrowRight } from "lucide-react";

const STORAGE_KEY = "komikverse_donation_popup_last_shown";
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export default function DonationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const lastShown = localStorage.getItem(STORAGE_KEY);
      const now = Date.now();

      if (!lastShown || now - Number(lastShown) >= TWO_HOURS_MS) {
        // Delay popup slightly for smooth UX after initial load
        const timer = setTimeout(() => {
          setIsOpen(true);
          localStorage.setItem(STORAGE_KEY, now.toString());
        }, 1500);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn("Failed to check donation popup timestamp:", e);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleDonateClick = () => {
    setIsOpen(false);
    navigate("/donation");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-void/80 backdrop-blur-md"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-panel border border-border-subtle rounded-2xl shadow-2xl p-6 md:p-8 overflow-hidden z-10"
          >
            {/* Background Glow */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-fire/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full text-text-muted hover:text-warm-white hover:bg-raised transition-colors z-20"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="text-center relative z-10 space-y-4">
              {/* Icon Badge */}
              <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-fire p-0.5 shadow-bloom mx-auto">
                <div className="w-full h-full bg-void rounded-[14px] flex items-center justify-center">
                  <Heart className="w-8 h-8 text-fire animate-pulse fill-fire/20" />
                </div>
                <div className="absolute -top-1 -right-1 bg-fire-gold text-void rounded-full p-1 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-fire/10 text-fire border border-fire/20">
                  Dukungan Server KomikVerse
                </span>
                <h3 className="font-display text-2xl md:text-3xl text-warm-white tracking-wide">
                  BANTU KAMI TETAP ONLINE!
                </h3>
                <p className="text-xs md:text-sm text-text-muted leading-relaxed">
                  KomikVerse butuh bantuanmu untuk membayar biaya server & bandwidth bulanan agar baca komik tetap gratis, kencang, dan bebas dari iklan mengganggu.
                </p>
              </div>

              {/* Perks snippet */}
              <div className="bg-raised/60 rounded-xl p-3.5 border border-border-subtle text-left space-y-2">
                <div className="flex items-center gap-2.5 text-xs text-warm-white font-semibold">
                  <Coffee className="w-4 h-4 text-fire" />
                  <span>Donasi sekecil apapun sangat berarti!</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDonateClick}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-fire hover:opacity-95 text-white font-bold text-sm transition-all shadow-bloom flex items-center justify-center gap-2 group"
                >
                  <span>Donasi Sekarang</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={handleClose}
                  className="w-full sm:w-auto py-3 px-5 rounded-xl bg-raised hover:bg-raised/80 text-text-muted hover:text-warm-white font-semibold text-sm transition-colors border border-border-subtle whitespace-nowrap"
                >
                  Nanti Saja
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
