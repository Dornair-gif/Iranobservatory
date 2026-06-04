import React, { useEffect, useRef, useState } from 'react';

// StudyHtmlFrame
// ---------------------------------------------------------------------------
// Renders a fully self-contained HTML document (with its own <style>, layout
// and typography) inside a sandboxed iframe so all the author's CSS is
// preserved instead of being stripped by DOMPurify.
//
// Why an iframe and not just dangerouslySetInnerHTML?
//   - Study/brief authors paste full <!DOCTYPE html>…</html> documents with
//     embedded <style> blocks. Inlining those styles into the article page
//     would leak CSS into the rest of the layout (resets, body styles, etc.).
//   - DOMPurify deliberately drops <html>, <head>, <body>, <style> for
//     security and isolation. That's correct — but it destroys the layout.
//   - Sandboxed iframe = best of both: visual fidelity + zero JS execution +
//     can't navigate the parent + auto-resizes to its own content height.
//
// Security
//   - `sandbox` allows only same-origin styling, no scripts, no top-nav, no
//     popups, no forms. Equivalent isolation to renderHtml() for scripts.
//   - The HTML is injected via srcDoc, so no extra network request and no
//     URL leak.
export default function StudyHtmlFrame({ html, ariaLabel }) {
  const iframeRef = useRef(null);
  const [height, setHeight] = useState(800);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const resize = () => {
      try {
        const doc = iframe.contentDocument;
        if (!doc) return;
        // Use scrollHeight on documentElement — most reliable cross-browser.
        const next = Math.max(
          doc.documentElement.scrollHeight,
          doc.body ? doc.body.scrollHeight : 0
        );
        if (next && Math.abs(next - height) > 4) {
          setHeight(next + 24); // tiny buffer for sub-pixel rounding
        }
      } catch (_) {
        /* cross-origin or detached — give up silently */
      }
    };

    const onLoad = () => {
      resize();
      // Late web fonts / images can grow the document after initial load.
      const doc = iframe.contentDocument;
      if (doc) {
        const imgs = Array.from(doc.images || []);
        imgs.forEach(img => {
          if (!img.complete) img.addEventListener('load', resize, { once: true });
        });
        if (doc.fonts && doc.fonts.ready) {
          doc.fonts.ready.then(resize).catch(() => {});
        }
      }
      // Observe future DOM mutations (rare on static studies but cheap)
      if (doc && doc.body && 'ResizeObserver' in window) {
        const ro = new ResizeObserver(resize);
        ro.observe(doc.body);
        // Cleanup tied to iframe lifecycle
        iframe.__io_ro__ = ro;
      }
    };

    iframe.addEventListener('load', onLoad);
    // Window resize → recompute (responsive studies may reflow)
    const onWinResize = () => resize();
    window.addEventListener('resize', onWinResize);

    return () => {
      iframe.removeEventListener('load', onLoad);
      window.removeEventListener('resize', onWinResize);
      if (iframe.__io_ro__) iframe.__io_ro__.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      title={ariaLabel || 'Study content'}
      srcDoc={html}
      // No allow-scripts → we strip any JS the document might contain.
      // allow-same-origin is needed so the iframe can read its own DOM for
      // height measurement (cross-origin would block it).
      sandbox="allow-same-origin"
      style={{
        width: '100%',
        height: `${height}px`,
        border: '0',
        display: 'block',
        background: 'transparent',
      }}
      loading="lazy"
      data-testid="study-html-frame"
    />
  );
}
