/**
 * Client-Side Anti-XSS Sanitizer Utility
 * Defense-in-depth protection for rich text HTML and user inputs.
 */

export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';

  // 1. Strip script, style, and iframe tags along with their inner contents
  let clean = html
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, '')
    .replace(/<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gi, '')
    .replace(/<object\b[^>]*>([\s\S]*?)<\/object>/gi, '')
    .replace(/<embed\b[^>]*>([\s\S]*?)<\/embed>/gi, '');

  // 2. Remove dangerous inline attributes (all on* event handlers and javascript: / data: URIs)
  clean = clean.replace(/<([a-z0-9]+)([^>]*)>/gi, (match, tag, attrs) => {
    // Strip on* attributes (onclick, onerror, onload, etc.)
    let safeAttrs = attrs.replace(/\s*on[a-z]+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '');

    // Strip javascript: / vbscript: / data: protocols
    safeAttrs = safeAttrs.replace(/\s*(href|src)\s*=\s*(["']?\s*(?:javascript|vbscript|data):[^"'\s>]*["']?)/gi, '');

    return `<${tag}${safeAttrs}>`;
  });

  return clean;
}

export function stripHtml(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/<[^>]*>/g, '').trim();
}
