/**
 * HTML helpers for CMS content blocks (galleries).
 *
 * Two things always have to happen before store HTML is injected:
 *  1. Sanitise it (scripts, iframes, inline event handlers, javascript: URLs).
 *  2. Resolve relative image paths against the store base URL — Vendre returns
 *     paths like "/image/397/receptionist.jpg" (.vendre/skills/cms-pages.md).
 */
import { resolveImageUrl } from "./api";

const BLOCKED_TAGS = /<\s*(script|style|iframe|object|embed|link|meta|form)\b[\s\S]*?(<\/\s*\1\s*>|>)/gi;
const SELF_CLOSING_BLOCKED = /<\s*\/?\s*(script|style|iframe|object|embed|link|meta|form)\b[^>]*>/gi;
const EVENT_ATTRS = /\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URLS = /\s(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi;

/** Strips executable markup from store-authored HTML. */
export function sanitizeHtml(html: string): string {
  return html
    .replace(BLOCKED_TAGS, "")
    .replace(SELF_CLOSING_BLOCKED, "")
    .replace(EVENT_ATTRS, "")
    .replace(JS_URLS, "");
}

/** Rewrites relative src/href image paths to absolute store URLs. */
export function resolveHtmlAssets(html: string): string {
  return html.replace(/(\ssrc\s*=\s*)("|')([^"']+)\2/gi, (match, prefix, quote, value) => {
    if (/^(https?:|data:|\/\/)/i.test(value)) return match;
    const resolved = resolveImageUrl(value);
    return resolved ? `${prefix}${quote}${resolved}${quote}` : match;
  });
}

/**
 * Lazy-loads every image in store HTML except the first, which loads first
 * (it is usually the campaign banner at the top).
 */
export function lazyHtmlImages(html: string): string {
  let index = 0;
  return html.replace(/<img\b([^>]*)>/gi, (match, attrs: string) => {
    const first = index++ === 0;
    if (/\sloading\s*=/i.test(attrs)) return match;
    const extra = first
      ? ' loading="eager" fetchpriority="high" decoding="async"'
      : ' loading="lazy" decoding="async"';
    return `<img${attrs.replace(/\s*\/$/, "")}${extra}>`;
  });
}

/** Sanitised, asset-resolved HTML ready for dangerouslySetInnerHTML. */
export function prepareCmsHtml(html: string | null | undefined): string {
  if (!html) return "";
  return lazyHtmlImages(resolveHtmlAssets(sanitizeHtml(html)));
}

/** Plain-text excerpt used for meta descriptions. */
export function htmlToText(html: string | null | undefined, max = 160): string {
  if (!html) return "";
  const text = sanitizeHtml(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
