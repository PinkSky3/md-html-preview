/**
 * In-memory cache for file content.
 *
 * WHY THIS EXISTS:
 * On Expo Web, expo-document-picker returns a blob: URL.
 * Blob URLs are single-use — the browser revokes them after the
 * component that created them unmounts (i.e. after navigation).
 * So by the time PreviewScreen tries to fetch(uri), the URL is dead.
 *
 * Solution: read the file content IMMEDIATELY after picking (while the
 * blob URL is still alive), store it here, and read from here in preview.
 *
 * On native (Android/iOS), expo-file-system handles persistent URIs fine,
 * so the cache is just a nice-to-have speed boost there.
 */

const cache = new Map();

export function cacheFileContent(uri, content) {
  cache.set(uri, content);
}

export function getCachedContent(uri) {
  return cache.get(uri) ?? null;
}

export function clearCachedContent(uri) {
  cache.delete(uri);
}
