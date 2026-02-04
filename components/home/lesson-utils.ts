"use client";

import katex from "katex";

/**
 * Render LaTeX equations using KaTeX
 */
export function renderWithKaTeX(text: string): string {
  if (!text) return "";
  let rendered = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, eq) => {
    try {
      return katex.renderToString(eq.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return `$$${eq}$$`;
    }
  });
  rendered = rendered.replace(/\$([^$\n]+?)\$/g, (_, eq) => {
    try {
      return katex.renderToString(eq.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `$${eq}$`;
    }
  });
  return rendered;
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  ["script", "style", "iframe", "object", "embed", "link", "meta"].forEach((tag) =>
    doc.querySelectorAll(tag).forEach((el) => el.remove())
  );

  doc.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (
        name.startsWith("on") ||
        name === "src" ||
        name === "srcset" ||
        name === "href" ||
        name === "xlink:href"
      ) {
        el.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML;
}

export function renderHtml(text: string) {
  return { __html: sanitizeHtml(renderWithKaTeX(text)) };
}

/**
 * Strip Markdown/HTML for TTS
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return "";
  let clean = text.replace(/\$\$[\s\S]*?\$\$/g, " equation ");
  clean = clean.replace(/\$[^$]*?\$/g, " equation ");
  clean = clean.replace(/[*#_`]/g, "");
  const parser = new DOMParser();
  const doc = parser.parseFromString(clean, "text/html");
  return doc.body.textContent || "";
}
