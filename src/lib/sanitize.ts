/**
 * Input sanitization utilities for security
 */

const MAX_SEARCH_LENGTH = 100;
const MAX_SLUG_LENGTH = 100;

/**
 * Sanitize search query input
 * - Strip HTML tags
 * - Limit length
 * - Escape special characters
 * - Trim whitespace
 */
export function sanitizeSearchQuery(input: unknown): string {
  if (typeof input !== "string") return "";

  let sanitized = input
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/[<>"'&]/g, (match) => {
      const entities: Record<string, string> = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "&": "&amp;",
      };
      return entities[match] || match;
    })
    .trim()
    .slice(0, MAX_SEARCH_LENGTH);

  return sanitized;
}

/**
 * Sanitize slug parameter
 * - Only allow lowercase alphanum + dash
 * - Prevent path traversal
 * - Return null if invalid
 */
export function sanitizeSlug(slug: unknown): string | null {
  if (typeof slug !== "string") return null;

  // Prevent path traversal
  if (slug.includes("..") || slug.includes("/") || slug.includes("\\")) {
    return null;
  }

  // Only allow lowercase alphanumeric and dashes
  const validSlug = /^[a-z0-9-]+$/;
  if (!validSlug.test(slug)) return null;

  if (slug.length > MAX_SLUG_LENGTH) return null;

  return slug;
}

/**
 * Sanitize URL parameter against whitelist
 * Return null if not in allowed values
 */
export function sanitizeUrlParam(
  param: unknown,
  allowedValues: readonly string[]
): string | null {
  if (typeof param !== "string") return null;

  const normalized = param.trim();

  if (!allowedValues.includes(normalized)) return null;

  return normalized;
}

/**
 * Sanitize chapter number
 * - Must be positive integer
 * - Range 1-9999
 * - Return NaN if invalid
 */
export function sanitizeChapterNum(num: unknown): number {
  const parsed = Number(num);

  if (!Number.isInteger(parsed)) return NaN;
  if (parsed < 1 || parsed > 9999) return NaN;

  return parsed;
}

/**
 * Validate that a string is a safe key for localStorage
 */
export function isValidStorageKey(key: string): boolean {
  // Only allow alphanumeric, dashes, underscores, and dots
  return /^[a-zA-Z0-9_.-]+$/.test(key);
}
