"use client";

import { useEffect, useRef, useState } from "react";

// Sandbox iframe to render self-contained HTML documents (with their own
// <style>) without leaking styles into the parent page. Same logic as the
// React SPA version, ported as a Next.js client component.
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
        const next = Math.max(
          doc.documentElement.scrollHeight,
          doc.body ? doc.body.scrollHeight : 0
        );
        if (next && Math.abs(next - height) > 4) setHeight(next + 24);
      } catch {}
    };

    const onLoad = () => {
      resize();
      const doc = iframe.contentDocument;
      if (doc?.fonts?.ready) doc.fonts.ready.then(resize).catch(() => {});
    };
    iframe.addEventListener("load", onLoad);
    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    return () => {
      iframe.removeEventListener("load", onLoad);
      window.removeEventListener("resize", onResize);
    };
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      title={ariaLabel || "Study content"}
      srcDoc={html}
      sandbox="allow-same-origin"
      style={{ width: "100%", height: `${height}px`, border: "0", display: "block" }}
      loading="lazy"
    />
  );
}
