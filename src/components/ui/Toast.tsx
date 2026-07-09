import { useStore } from "@/lib/store";
import { X, CheckCircle, Info, AlertTriangle } from "lucide-react";

const variantConfig = {
  success: {
    icon: CheckCircle,
    bg: "bg-green-500/10 border-green-500/30",
    iconColor: "text-green-400",
    progress: "bg-green-400",
  },
  info: {
    icon: Info,
    bg: "bg-blue-500/10 border-blue-500/30",
    iconColor: "text-blue-400",
    progress: "bg-blue-400",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-yellow-500/10 border-yellow-500/30",
    iconColor: "text-yellow-400",
    progress: "bg-yellow-400",
  },
};

export default function Toast() {
  const toasts = useStore((s) => s.toasts);
  const removeToast = useStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => {
        const config = variantConfig[toast.variant];
        const Icon = config.icon;

        return (
          <div
            key={toast.id}
            className={`relative flex items-center gap-3 px-4 py-3 rounded-lg border ${config.bg} min-w-[280px] max-w-sm shadow-lg animate-slide-in-right`}
          >
            <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0`} />
            <p className="text-sm text-warm-white flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-text-muted hover:text-warm-white transition-colors"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
            {/* Progress bar */}
            <div
              className={`absolute bottom-0 left-0 h-0.5 ${config.progress} animate-progress-bar rounded-full`}
            />
          </div>
        );
      })}
    </div>
  );
}
