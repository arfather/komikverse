interface AdSlotProps {
  position?: "header" | "footer" | "sidebar" | "reader";
  nativeBannerId?: string;
  nativeScriptUrl?: string;
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

export default function AdSlot(_props: AdSlotProps) {
  // Ads disabled / commented out for now
  return null;
}

export function GlobalAdScripts() {
  // Ads disabled / commented out for now
  return null;
}
