import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { FileText, FileCode, Upload, Moon, Sun } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAppSettings, useTheme } from "@/utils/useAppSettings";
import { useTranslation } from "@/utils/i18n";
import { cacheFileContent } from "@/utils/fileContentCache";
import { saveHistory } from "@/utils/historyStore";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const language = useAppSettings((s) => s.language);
  const darkMode = useAppSettings((s) => s.darkMode);
  const setLanguage = useAppSettings((s) => s.setLanguage);
  const toggleDarkMode = useAppSettings((s) => s.toggleDarkMode);
  const theme = useTheme();
  const t = useTranslation(language);

  const pickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/markdown", "text/html", "text/plain", "*/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const nameLower = file.name.toLowerCase();
        const fileType = nameLower.endsWith(".md") ? "md" : "html";

        // ── Web: blob URLs die after navigation → read content NOW ──────────
        // On web, assets[0].file is the native browser File object.
        // We read it immediately while the blob URL is still alive.
        if (Platform.OS === "web" && file.file) {
          try {
            const text = await file.file.text();
            cacheFileContent(file.uri, text);
          } catch (readErr) {
            console.warn("Pre-read failed, preview will retry:", readErr);
          }
        }

        saveHistory({
          fileName: file.name,
          uriString: file.uri,
          fileType,
        });

        router.push({
          pathname: "/preview",
          params: { uri: file.uri, name: file.name, type: fileType },
        });
      }
    } catch (error) {
      console.error("Pick file error:", error);
      Alert.alert(t.errorPick, String(error.message));
    }
  }, [router, t]);

  const otherLang = language === "zh" ? "en" : "zh";
  const otherLangLabel = language === "zh" ? "EN" : "中";

  return (
    <View
      style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}
    >
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Header row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
            marginTop: 8,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 32, fontWeight: "bold", color: theme.text }}
            >
              {t.homeTitle}
            </Text>
            <Text style={{ fontSize: 15, color: theme.subtext, marginTop: 6 }}>
              {t.homeSubtitle}
            </Text>
          </View>

          {/* Settings buttons */}
          <View style={{ flexDirection: "row", gap: 8, marginLeft: 12 }}>
            {/* Dark mode toggle */}
            <TouchableOpacity
              onPress={toggleDarkMode}
              style={{
                backgroundColor: theme.settingsBg,
                borderRadius: 20,
                width: 40,
                height: 40,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: theme.border,
              }}
              activeOpacity={0.7}
            >
              {darkMode ? (
                <Sun size={18} color={theme.primary} />
              ) : (
                <Moon size={18} color={theme.subtext} />
              )}
            </TouchableOpacity>

            {/* Language toggle */}
            <TouchableOpacity
              onPress={() => setLanguage(otherLang)}
              style={{
                backgroundColor: theme.settingsBg,
                borderRadius: 20,
                minWidth: 40,
                height: 40,
                paddingHorizontal: 10,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: theme.border,
              }}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: theme.primary,
                }}
              >
                {otherLangLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pick file card */}
        <TouchableOpacity
          onPress={pickFile}
          style={{
            backgroundColor: theme.card,
            borderRadius: 24,
            padding: 40,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: theme.border,
            borderStyle: "dashed",
            marginBottom: 24,
          }}
          activeOpacity={0.75}
        >
          <View
            style={{
              backgroundColor: theme.primaryBg,
              padding: 20,
              borderRadius: 50,
              marginBottom: 16,
            }}
          >
            <Upload size={32} color={theme.primary} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: "600", color: theme.text }}>
            {t.selectFile}
          </Text>
          <Text style={{ fontSize: 14, color: theme.muted, marginTop: 4 }}>
            {t.selectFileHint}
          </Text>
        </TouchableOpacity>

        {/* Format cards */}
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: theme.muted,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 12,
          }}
        >
          {t.supportedFormats}
        </Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: theme.card,
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View
              style={{
                backgroundColor: theme.mdBg,
                padding: 8,
                borderRadius: 10,
                alignSelf: "flex-start",
              }}
            >
              <FileText size={22} color={theme.mdColor} />
            </View>
            <Text
              style={{ fontWeight: "600", marginTop: 10, color: theme.text }}
            >
              {t.markdown}
            </Text>
            <Text style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
              {t.mdDesc}
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: theme.card,
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.border,
            }}
          >
            <View
              style={{
                backgroundColor: theme.htmlBg,
                padding: 8,
                borderRadius: 10,
                alignSelf: "flex-start",
              }}
            >
              <FileCode size={22} color={theme.htmlColor} />
            </View>
            <Text
              style={{ fontWeight: "600", marginTop: 10, color: theme.text }}
            >
              {t.html}
            </Text>
            <Text style={{ fontSize: 12, color: theme.muted, marginTop: 2 }}>
              {t.htmlDesc}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
