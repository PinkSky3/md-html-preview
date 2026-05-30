import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SETTINGS_KEY = "@filepreview_settings";

export const useAppSettings = create((set, get) => ({
  language: "zh",
  darkMode: false,
  loaded: false,

  init: async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({
          language: parsed.language ?? "zh",
          darkMode: parsed.darkMode ?? false,
          loaded: true,
        });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  setLanguage: async (language) => {
    set({ language });
    try {
      const { darkMode } = get();
      await AsyncStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ language, darkMode }),
      );
    } catch {}
  },

  toggleDarkMode: async () => {
    const { darkMode, language } = get();
    const next = !darkMode;
    set({ darkMode: next });
    try {
      await AsyncStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ language, darkMode: next }),
      );
    } catch {}
  },
}));

export const lightTheme = {
  bg: "#f8fafc",
  card: "#ffffff",
  border: "#e2e8f0",
  text: "#1e293b",
  subtext: "#64748b",
  muted: "#94a3b8",
  tabBar: "#ffffff",
  tabBorder: "#e2e8f0",
  primary: "#3b82f6",
  primaryBg: "#eff6ff",
  mdBg: "#f0f9ff",
  htmlBg: "#fffbeb",
  mdColor: "#10b981",
  htmlColor: "#f59e0b",
  settingsBg: "#f1f5f9",
  headerBg: "#ffffff",
  headerText: "#1e293b",
};

export const darkTheme = {
  bg: "#0f172a",
  card: "#1e293b",
  border: "#334155",
  text: "#f1f5f9",
  subtext: "#94a3b8",
  muted: "#64748b",
  tabBar: "#1e293b",
  tabBorder: "#334155",
  primary: "#60a5fa",
  primaryBg: "#1e3a5f",
  mdBg: "#0d2d1f",
  htmlBg: "#2d1f00",
  mdColor: "#34d399",
  htmlColor: "#fbbf24",
  settingsBg: "#334155",
  headerBg: "#1e293b",
  headerText: "#f1f5f9",
};

export const useTheme = () => {
  const darkMode = useAppSettings((s) => s.darkMode);
  return darkMode ? darkTheme : lightTheme;
};
