import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FileText, FileCode, ChevronRight, Clock } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useAppSettings, useTheme } from "@/utils/useAppSettings";
import { useTranslation } from "@/utils/i18n";
import { loadHistory } from "@/utils/historyStore";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const language = useAppSettings((s) => s.language);
  const theme = useTheme();
  const t = useTranslation(language);

  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await loadHistory();
      setHistory(items);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  const renderItem = ({ item }) => {
    const isMd = item.fileType === "md" || item.file_type === "md";
    const Icon = isMd ? FileText : FileCode;
    const iconColor = isMd ? theme.mdColor : theme.htmlColor;
    const iconBg = isMd ? theme.mdBg : theme.htmlBg;

    const ts = item.timestamp ?? item.created_at;
    let timeAgo = "";
    try {
      timeAgo = formatDistanceToNow(new Date(ts), {
        addSuffix: true,
        locale: language === "zh" ? zhCN : undefined,
      });
    } catch {
      timeAgo = ts;
    }

    const uriString = item.uriString ?? item.uri_string;
    const fileName = item.fileName ?? item.file_name;
    const fileType = item.fileType ?? item.file_type;

    return (
      <TouchableOpacity
        onPress={() => {
          router.push({
            pathname: "/preview",
            params: { uri: uriString, name: fileName, type: fileType },
          });
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: theme.card,
          padding: 16,
          borderRadius: 14,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: theme.border,
        }}
        activeOpacity={0.7}
      >
        <View
          style={{
            backgroundColor: iconBg,
            padding: 10,
            borderRadius: 10,
          }}
        >
          <Icon size={22} color={iconColor} />
        </View>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={{ fontSize: 15, fontWeight: "600", color: theme.text }}
            numberOfLines={1}
          >
            {fileName}
          </Text>
          <View
            style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}
          >
            <Clock size={11} color={theme.muted} />
            <Text style={{ fontSize: 12, color: theme.muted, marginLeft: 4 }}>
              {timeAgo}
            </Text>
          </View>
        </View>

        <ChevronRight size={18} color={theme.border} />
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: theme.bg, paddingTop: insets.top }}
    >
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
        <Text style={{ fontSize: 28, fontWeight: "bold", color: theme.text }}>
          {t.historyTitle}
        </Text>
        <Text style={{ fontSize: 14, color: theme.subtext, marginTop: 4 }}>
          {t.historySubtitle}
        </Text>
      </View>

      {isLoading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : error ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Text
            style={{ color: "#ef4444", textAlign: "center", marginBottom: 12 }}
          >
            {t.failedLoad}
          </Text>
          <TouchableOpacity
            onPress={fetchHistory}
            style={{
              backgroundColor: theme.primary,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>{t.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : history.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 40,
          }}
        >
          <View
            style={{
              backgroundColor: theme.settingsBg,
              padding: 24,
              borderRadius: 50,
              marginBottom: 16,
            }}
          >
            <Clock size={40} color={theme.muted} />
          </View>
          <Text
            style={{ fontSize: 18, fontWeight: "600", color: theme.subtext }}
          >
            {t.noHistory}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.muted,
              textAlign: "center",
              marginTop: 8,
              lineHeight: 20,
            }}
          >
            {t.noHistoryHint}
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item, index) =>
            item.timestamp
              ? `${item.fileName ?? item.file_name ?? ''}-${item.timestamp}`
              : `${index}`
          }
          contentContainerStyle={{ padding: 20, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
