import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { WebView } from "react-native-webview";
import * as FileSystem from "expo-file-system";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppSettings, useTheme } from "@/utils/useAppSettings";
import { useTranslation } from "@/utils/i18n";
import { getCachedContent } from "@/utils/fileContentCache";
import { marked } from "marked";

// ─── File reader ─────────────────────────────────────────────────────────────
// Priority: in-memory cache → native FileSystem → web fetch
//
// WHY THE CACHE:
// On Expo Web, expo-document-picker gives a blob: URL that is alive only while
// the picker component is mounted. Once we navigate to PreviewScreen, the blob
// URL is revoked by the browser → fetch(uri) throws "Failed to fetch".
//
// The home screen reads the file immediately after picking (using the native
// File.text() API) and stores it in the cache before navigating, so preview
// can always retrieve content regardless of platform.
async function readFileWithCache(uri) {
  // 1. In-memory cache — populated by home screen on web before navigation
  const cached = getCachedContent(uri);
  if (cached !== null) return cached;

  // 2. Native: expo-file-system handles content:// and file:// URIs
  if (Platform.OS !== "web") {
    return FileSystem.readAsStringAsync(uri);
  }

  // 3. Web: file:// URIs can't be fetched from an http origin
  if (uri.startsWith("file://")) {
    throw new Error("Cannot read local file on web via fetch.");
  }

  // 4. Web fallback: try fetch with 8s timeout
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(uri, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return res.text();
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Fetch timed out. The file URL may no longer be valid.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Dark-mode injector (runs AFTER page JS, never touches HTML source) ─────
function buildDarkModeJS(enabled) {
  if (!enabled) {
    // Remove any previously injected dark layer
    return `
      (function(){
        var el = document.getElementById('__dark_overlay__');
        if (el) el.remove();
        document.documentElement.style.filter = '';
      })();
      true;
    `;
  }
  // Strategy: inject a <style> tag — does NOT interfere with JS at all
  return `
    (function(){
      if (document.getElementById('__dark_overlay__')) return;
      var s = document.createElement('style');
      s.id = '__dark_overlay__';
      s.textContent = [
        'html { filter: invert(1) hue-rotate(180deg) !important; }',
        'img, video, canvas, [style*="background-image"] {',
        '  filter: invert(1) hue-rotate(180deg) !important; }',
      ].join('\\n');
      document.head.appendChild(s);
    })();
    true;
  `;
}

// ─── Markdown HTML template ─────────────────────────────────────────────────
// Takes pre-rendered HTML (parsed by `marked` in the RN JS layer) and wraps
// it in a full page with syntax‑highlight‑friendly CSS.
function buildMdHtml(htmlContent, darkMode) {
  const bg = darkMode ? "#0f172a" : "#ffffff";
  const fg = darkMode ? "#e2e8f0" : "#24292f";
  const codeBg = darkMode ? "#1e293b" : "#f6f8fa";
  const border = darkMode ? "#334155" : "#d0d7de";
  const link = darkMode ? "#60a5fa" : "#0969da";
  const bqBorder = darkMode ? "#475569" : "#d0d7de";
  const bqFg = darkMode ? "#94a3b8" : "#57606a";
  const tblAlt = darkMode ? "#1e293b" : "#f6f8fa";
  const inlineCode = darkMode ? "#f472b6" : "#d63384";

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html{overflow-x:hidden}
body{
  background:${bg};color:${fg};
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
  font-size:15px;line-height:1.75;padding:16px 18px;word-break:break-word;
}
h1,h2,h3,h4,h5,h6{color:${fg};margin:1.2em 0 .5em;line-height:1.3;font-weight:700}
h1{font-size:1.8em;border-bottom:2px solid ${border};padding-bottom:8px}
h2{font-size:1.4em;border-bottom:1px solid ${border};padding-bottom:6px}
h3{font-size:1.15em}
p{margin:.7em 0}
a{color:${link};text-decoration:none}
a:hover{text-decoration:underline}
ul,ol{padding-left:1.8em;margin:.5em 0}
li{margin:.25em 0}
pre{background:${codeBg};border:1px solid ${border};border-radius:8px;
    padding:14px;overflow-x:auto;margin:1em 0}
code{font-family:"SF Mono",Menlo,Consolas,monospace;font-size:.87em;
     background:${codeBg};border:1px solid ${border};border-radius:4px;
     padding:2px 5px;color:${inlineCode}}
pre code{border:none;padding:0;background:transparent;color:${fg};font-size:.85em}
blockquote{border-left:4px solid ${bqBorder};color:${bqFg};margin:1em 0;
           padding:8px 16px;background:${codeBg};border-radius:0 6px 6px 0}
table{width:100%;border-collapse:collapse;margin:1em 0;font-size:.9em}
th,td{border:1px solid ${border};padding:8px 12px;text-align:left}
th{background:${codeBg};font-weight:700}
tr:nth-child(even) td{background:${tblAlt}}
img{max-width:100%;border-radius:6px;margin:8px 0}
hr{border:none;border-top:2px solid ${border};margin:1.5em 0}
del{opacity:.6}
</style>
</head>
<body>
${htmlContent}
</body>
</html>`;
}

// ─── Screen ─────────────────────────────────────────────────────────────────
export default function PreviewScreen() {
  const { uri, name, type } = useLocalSearchParams();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const webviewRef = useRef(null);

  const language = useAppSettings((s) => s.language);
  const darkMode = useAppSettings((s) => s.darkMode);
  const theme = useTheme();
  const t = useTranslation(language);

  const [content, setContent] = useState(null); // null = not yet loaded
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [webviewKey, setWebviewKey] = useState(0); // force remount on reload

  // ── Header ───────────────────────────────────────────────────────────────
  useEffect(() => {
    navigation.setOptions({
      headerTitle: name || t.previewTitle,
      headerStyle: { backgroundColor: theme.headerBg },
      headerTitleStyle: {
        color: theme.headerText,
        fontWeight: "600",
        fontSize: 16,
      },
      headerTintColor: theme.primary,
    });
  }, [name, navigation, t, theme]);

  // ── File loading ─────────────────────────────────────────────────────────
  const loadFile = useCallback(async () => {
    if (!uri) return;
    try {
      setLoading(true);
      setError(null);
      const text = await readFileWithCache(uri);
      setContent(text);
      // Force WebView remount so new content renders cleanly
      setWebviewKey((k) => k + 1);
    } catch (err) {
      console.error("Error reading file:", err);
      setError(t.errorRead + "\n\n" + err.message);
    } finally {
      setLoading(false);
    }
  }, [uri, t.errorRead]);

  useEffect(() => {
    loadFile();
  }, [loadFile]);

  // ── Inject dark mode into HTML after page loads ──────────────────────────
  const onWebViewLoad = useCallback(() => {
    if (type !== "md") {
      webviewRef.current?.injectJavaScript(buildDarkModeJS(darkMode));
    }
  }, [type, darkMode]);

  // Re-inject when darkMode changes while page is open
  useEffect(() => {
    if (type !== "md" && !loading && content !== null) {
      webviewRef.current?.injectJavaScript(buildDarkModeJS(darkMode));
    }
  }, [darkMode, type, loading, content]);

  // ── WebView error handler ─────────────────────────────────────────────────
  const onWebViewError = useCallback((syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error("WebView error:", nativeEvent);
  }, []);

  // ── Determine WebView source ──────────────────────────────────────────────
  const renderedMdHtml = content && type === "md" ? marked.parse(content) : null;
  const webviewSource =
    content === null
      ? null
      : type === "md"
        ? { html: buildMdHtml(renderedMdHtml, darkMode) }
        : { html: content };

  const showWebView = !loading && !error && content !== null;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.bg,
        paddingBottom: insets.bottom,
      }}
    >
      {/* ── WebView — show immediately once content is ready ── */}
      {showWebView && (
        <WebView
          key={webviewKey}
          ref={webviewRef}
          originWhitelist={["*"]}
          source={webviewSource}
          style={{ flex: 1, backgroundColor: theme.bg }}
          // ── JS & DOM ──────────────────────────────────────────────────────
          javaScriptEnabled={true}
          domStorageEnabled={true}
          // ── Media / canvas ────────────────────────────────────────────────
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo={true}
          // ── Android specifics ─────────────────────────────────────────────
          mixedContentMode="always"
          androidHardwareAccelerationDisabled={false}
          overScrollMode="never"
          // ── iOS specifics ─────────────────────────────────────────────────
          allowsBackForwardNavigationGestures={false}
          bounces={false}
          // ── Misc ──────────────────────────────────────────────────────────
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          scalesPageToFit={false}
          startInLoadingState={false} // we handle loading ourselves
          // ── Callbacks ─────────────────────────────────────────────────────
          onLoad={onWebViewLoad}
          onError={onWebViewError}
          onHttpError={(e) =>
            console.warn("WebView HTTP error:", e.nativeEvent)
          }
        />
      )}

      {/* ── Loading spinner — only while reading the file ── */}
      {loading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: theme.bg,
          }}
        >
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ marginTop: 14, color: theme.subtext, fontSize: 15 }}>
            {t.readingFile}
          </Text>
        </View>
      )}

      {/* ── Error state ── */}
      {error && !loading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: theme.bg,
            padding: 24,
          }}
        >
          <Text
            style={{
              color: "#ef4444",
              fontSize: 15,
              textAlign: "center",
              lineHeight: 22,
              marginBottom: 20,
            }}
          >
            {error}
          </Text>
          <TouchableOpacity
            onPress={loadFile}
            style={{
              backgroundColor: theme.primary,
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>
              {t.retry}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
