import DOMPurify from 'dompurify';

// DOMPurify configuration tailored to Iran Observatory article content.
// Keeps formatting + media + links, blocks scripts, event handlers,
// and dangerous protocols (javascript:, data:text/html, vbscript:).
const ARTICLE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'sub', 'sup',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd',
    'blockquote', 'pre', 'code',
    'a', 'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
    'hr', 'div', 'span',
    'iframe' // for embedded videos — restricted by ALLOWED_URI_REGEXP below
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', 'title',
    'src', 'alt', 'width', 'height', 'loading',
    'class', 'style', 'id',
    'colspan', 'rowspan',
    'frameborder', 'allowfullscreen', 'allow'
  ],
  // Block dangerous protocols. Only http(s), mailto, tel, and relative paths
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ['target'],
  // Force rel="noopener noreferrer" on outbound links
  ADD_TAGS: [],
  KEEP_CONTENT: true
};

// Post-process: add safe rel on links + sandbox iframes
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('href')) {
    const href = node.getAttribute('href');
    if (/^https?:\/\//i.test(href)) {
      // External link → open in new tab with security rel
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer nofollow');
    }
  }
  if (node.tagName === 'IFRAME') {
    // Restrict iframes (YouTube embeds etc.) with sandbox
    const src = node.getAttribute('src') || '';
    const allowedHosts = ['youtube.com', 'youtube-nocookie.com', 'vimeo.com', 'player.vimeo.com', 'dailymotion.com'];
    let allowed = false;
    try {
      const u = new URL(src, window.location.origin);
      allowed = allowedHosts.some(h => u.hostname.endsWith(h));
    } catch { allowed = false; }
    if (!allowed) {
      node.parentNode && node.parentNode.removeChild(node);
    } else {
      node.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
      node.setAttribute('loading', 'lazy');
    }
  }
});

/**
 * Sanitize HTML for safe rendering with dangerouslySetInnerHTML.
 * Returns the original string sanitized — never trust raw HTML, especially
 * AI-generated, user-provided, or RSS-imported content.
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, ARTICLE_CONFIG);
}

/**
 * Returns a value ready to pass to dangerouslySetInnerHTML.
 * Usage: <div dangerouslySetInnerHTML={renderHtml(content)} />
 */
export function renderHtml(html) {
  return { __html: sanitizeHtml(html) };
}
