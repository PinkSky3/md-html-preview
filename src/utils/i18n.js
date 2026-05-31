export const translations = {
  zh: {
    // Tab names
    tabHome: "主页",
    tabHistory: "历史",

    // Home screen
    homeTitle: "文件预览",
    homeSubtitle: "在本地预览 Markdown 和 HTML 文件",
    selectFile: "选择文件",
    selectFileHint: "支持 Markdown 和 HTML 格式",
    markdown: "Markdown",
    html: "HTML",
    mdDesc: ".md 格式",
    htmlDesc: ".html 格式",
    errorPick: "无法选取文件",
    supportedFormats: "支持的格式",

    // History screen
    historyTitle: "历史记录",
    historySubtitle: "最近查看的文件",
    noHistory: "暂无记录",
    noHistoryHint: "在主页选择文件后将在此显示",
    failedLoad: "加载历史记录失败",
    retry: "重试",
    ago: "前",

    // Preview screen
    readingFile: "正在读取文件...",
    rendering: "正在渲染...",
    errorRead: "无法读取文件内容",
    errorRender: "页面渲染出错",
    previewTitle: "文件预览",

    // Settings
    darkMode: "夜间模式",
    lightMode: "日间模式",
    langZh: "中",
    langEn: "EN",
  },

  en: {
    // Tab names
    tabHome: "Home",
    tabHistory: "History",

    // Home screen
    homeTitle: "File Preview",
    homeSubtitle: "Preview Markdown and HTML files locally",
    selectFile: "Select a File",
    selectFileHint: "Markdown or HTML",
    markdown: "Markdown",
    html: "HTML",
    mdDesc: ".md files",
    htmlDesc: ".html files",
    errorPick: "Failed to pick file",
    supportedFormats: "Supported formats",

    // History screen
    historyTitle: "History",
    historySubtitle: "Your recently viewed files",
    noHistory: "No History Yet",
    noHistoryHint: "Pick a file from the Home tab to see it here",
    failedLoad: "Failed to load history",
    retry: "Retry",
    ago: "ago",

    // Preview screen
    readingFile: "Reading file...",
    rendering: "Rendering...",
    errorRead: "Could not read file content",
    errorRender: "Page render error",
    previewTitle: "File Preview",

    // Settings
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    langZh: "中",
    langEn: "EN",
  },
};

const fallbackCache = new Map();

export const useTranslation = (language) => {
  const lang = translations[language];
  if (!lang || lang === translations.zh) return translations.zh;
  const cacheKey = language;
  if (!fallbackCache.has(cacheKey)) {
    fallbackCache.set(cacheKey, { ...translations.zh, ...lang });
  }
  return fallbackCache.get(cacheKey);
};
