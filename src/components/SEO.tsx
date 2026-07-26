import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "book";
  schema?: Record<string, unknown> | Array<Record<string, unknown>>;
  noindex?: boolean;
}

const DEFAULT_TITLE = "KomikVerse - Baca Komik Online Bahasa Indonesia Gratis";
const DEFAULT_DESCRIPTION =
  "KomikVerse adalah platform tempat baca komik, manga, manhwa, dan manhua online Bahasa Indonesia gratis dengan koleksi terbaru, update cepat, dan kualitas terbaik.";
const DEFAULT_KEYWORDS =
  "baca komik, komik online, baca manga, baca manhwa, komik bahasa indonesia, komikverse, manga sub indo, manhwa sub indo";
const DEFAULT_IMAGE = "https://komikverse.app/images/og-cover.png";
const SITE_NAME = "KomikVerse";

export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  schema,
  noindex = false,
}: SEOProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} | KomikVerse` : DEFAULT_TITLE;
    document.title = fullTitle;

    const currentUrl = url || window.location.href;

    // Helper function to set or update meta tag
    const setMetaTag = (selector: string, attrName: string, attrValue: string, content: string) => {
      let element = document.querySelector(selector) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // Standard Meta Tags
    setMetaTag('meta[name="description"]', "name", "description", description);
    setMetaTag('meta[name="keywords"]', "name", "keywords", keywords);
    setMetaTag('meta[name="robots"]', "name", "robots", noindex ? "noindex, nofollow" : "index, follow");

    // Open Graph Tags
    setMetaTag('meta[property="og:title"]', "property", "og:title", fullTitle);
    setMetaTag('meta[property="og:description"]', "property", "og:description", description);
    setMetaTag('meta[property="og:image"]', "property", "og:image", image);
    setMetaTag('meta[property="og:url"]', "property", "og:url", currentUrl);
    setMetaTag('meta[property="og:type"]', "property", "og:type", type);
    setMetaTag('meta[property="og:site_name"]', "property", "og:site_name", SITE_NAME);

    // Twitter Card Tags
    setMetaTag('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMetaTag('meta[name="twitter:title"]', "name", "twitter:title", fullTitle);
    setMetaTag('meta[name="twitter:description"]', "name", "twitter:description", description);
    setMetaTag('meta[name="twitter:image"]', "name", "twitter:image", image);

    // Canonical Link
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", currentUrl);

    // JSON-LD Structured Data
    const scriptId = "json-ld-schema";
    let scriptElement = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (schema) {
      if (!scriptElement) {
        scriptElement = document.createElement("script");
        scriptElement.id = scriptId;
        scriptElement.type = "application/ld+json";
        document.head.appendChild(scriptElement);
      }
      scriptElement.text = JSON.stringify(schema);
    } else if (scriptElement) {
      scriptElement.remove();
    }
  }, [title, description, keywords, image, url, type, schema, noindex]);

  return null;
}
