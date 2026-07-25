import React, { useEffect, useRef } from "react";
import { ExternalLink, Sparkles } from "lucide-react";

interface AdSlotProps {
  position?: "header" | "footer" | "sidebar" | "reader";
  adsterraKey?: string;
  scriptUrl?: string;
  adClient?: string;
  adSlotId?: string;
  customBanner?: {
    imageUrl?: string;
    targetUrl?: string;
    title?: string;
    subtitle?: string;
  };
  className?: string;
}

export default function AdSlot({
  position = "header",
  adsterraKey,
  scriptUrl,
  adClient,
  adSlotId,
  customBanner,
  className = "",
}: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = "";

    // Adsterra Banner Script Injection
    if (adsterraKey) {
      const isMobile = window.innerWidth < 768;
      const width = position === "sidebar" ? 300 : isMobile ? 320 : 728;
      const height = position === "sidebar" ? 250 : 90;

      const confScript = document.createElement("script");
      confScript.type = "text/javascript";
      confScript.text = `
        atOptions = {
          'key' : '${adsterraKey}',
          'format' : 'iframe',
          'height' : ${height},
          'width' : ${width},
          'params' : {}
        };
      `;

      const invokeScript = document.createElement("script");
      invokeScript.type = "text/javascript";
      invokeScript.src = `//www.highperformanceformat.com/${adsterraKey}/invoke.js`;
      invokeScript.async = true;

      container.appendChild(confScript);
      container.appendChild(invokeScript);

      return () => {
        container.innerHTML = "";
      };
    }

    // Generic Third-Party Ad Script Injection
    if (scriptUrl) {
      const script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      script.setAttribute("crossorigin", "anonymous");
      if (adClient) script.setAttribute("data-ad-client", adClient);
      if (adSlotId) script.setAttribute("data-ad-slot", adSlotId);

      container.appendChild(script);

      return () => {
        container.innerHTML = "";
      };
    }
  }, [adsterraKey, scriptUrl, adClient, adSlotId, position]);

  // Size styling based on position
  const sizeClasses =
    position === "sidebar"
      ? "w-full max-w-[300px] min-h-[250px]"
      : "w-full max-w-7xl min-h-[90px]";

  const hasAdScript = Boolean(adsterraKey || scriptUrl);

  return (
    <div
      className={`relative mx-auto my-3 overflow-hidden rounded-xl border border-border-subtle bg-raised/60 backdrop-blur-sm p-3 text-center transition-all hover:border-fire/30 ${sizeClasses} ${className}`}
    >
      <div className="absolute top-1.5 right-2 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-text-muted/60 z-10">
        <Sparkles className="w-2.5 h-2.5 text-fire/70" />
        <span>Sponsor</span>
      </div>

      <div ref={containerRef} className="flex h-full w-full items-center justify-center overflow-auto">
        {hasAdScript ? (
          <div className="text-xs text-text-muted animate-pulse">
            Memuat Iklan...
          </div>
        ) : customBanner ? (
          <a
            href={customBanner.targetUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col sm:flex-row items-center justify-between w-full h-full gap-4 px-4 py-2"
          >
            {customBanner.imageUrl ? (
              <img
                src={customBanner.imageUrl}
                alt={customBanner.title || "Iklan Sponsor"}
                className="max-h-16 object-contain rounded"
              />
            ) : null}
            <div className="text-left flex-1">
              <p className="font-semibold text-sm text-warm-white group-hover:text-fire transition-colors flex items-center gap-1.5">
                {customBanner.title || "Ruang Iklan / Sponsor Website"}
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </p>
              <p className="text-xs text-text-muted">
                {customBanner.subtitle || "Dukung kami dengan memasang iklan atau klik penawaran menarik ini!"}
              </p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold rounded-lg bg-fire/10 text-fire border border-fire/20 group-hover:bg-fire group-hover:text-void transition-colors whitespace-nowrap">
              Cek Sekarang
            </span>
          </a>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between w-full h-full gap-3 px-4 py-2">
            <div className="text-left">
              <span className="text-xs font-semibold text-warm-white flex items-center gap-1.5">
                🔥 Pasang Iklan Produk / Website Anda di Sini!
              </span>
              <p className="text-[11px] text-text-muted mt-0.5">
                Jangkau ribuan pembaca komik aktif setiap harinya dengan eCPM terbaik.
              </p>
            </div>
            <a
              href="mailto:contact@komikverse.com?subject=Inquiry%20Pemasangan%20Iklan"
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-raised border border-border-subtle text-text-muted hover:text-warm-white hover:border-fire transition-colors whitespace-nowrap"
            >
              Hubungi Kami
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
