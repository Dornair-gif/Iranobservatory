// Normalize cross-environment file URLs to relative paths.
// Legacy articles in DB may have image_url like
// "https://iran-events-live.preview.emergentagent.com/api/files/<uuid>.png"
// while the actual file lives in the *current* environment's GridFS.
// Rewriting to a relative path makes the browser resolve it to the
// current origin, where the file actually exists.
export function normalizeFileUrl(url) {
  if (!url) return url;
  const m = String(url).match(/^https?:\/\/[^/]+(\/api\/files\/[^?#]+)/);
  return m ? m[1] : url;
}
