import DOMPurify from "isomorphic-dompurify";

// Server-safe sanitizer. We are strict on tags/attrs because most content
// comes from the AI pipeline + admin editor. Self-contained HTML docs (with
// <html>/<style>) are detected upstream and rendered in a sandboxed iframe
// instead of going through this path.
const ALLOWED_TAGS = [
  "h1","h2","h3","h4","h5","h6",
  "p","br","hr","strong","em","b","i","u","s",
  "a","img","figure","figcaption",
  "ul","ol","li",
  "blockquote","cite",
  "code","pre",
  "table","thead","tbody","tr","th","td",
  "span","div","aside","section","header","small",
];
const ALLOWED_ATTRS = ["href","target","rel","src","alt","title","class","colspan","rowspan","style","lang","dir"];

export function sanitizeHtml(html) {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ALLOWED_ATTRS,
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
  });
}

export function renderHtml(html) {
  return { __html: sanitizeHtml(html) };
}

export function isFullHtmlDoc(html) {
  return /<\s*(html|!doctype|style)\b/i.test(html || "");
}
