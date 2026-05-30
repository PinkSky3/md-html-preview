import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { FileText, FileCode, ChevronRight, Clock } from "lucide-react-native";
import { useRouter } from "expo-router";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useAppSettings, useTheme } from "@/utils/useAppSettings";
import { useTranslation } from "@/utils/i18n";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const language = useAppSettings((s) => s.language);
  const theme = useTheme();
  const t = useTranslation(language);

  const {
    data: history = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["history"],
    queryFn: async () => {
      const response = await fetch("/api/history");
      if (!response.ok) throw new Error("Failed to fetch history");
      return response.json();
    },
  });

  const renderItem = ({ item }) => {
    const isMd = item.file_type === "md";
    const Icon = isMd ? FileText : FileCode;
    const iconColor = isMd ? theme.mdColor : theme.htmlColor;
    const iconBg = isMd ? theme.mdBg : theme.htmlBg;

    let timeAgo = "";
    try {
      timeAgo = formatDistanceToNow(new Date(item.timestamp), {
        addSuffix: true,
        locale: language === "zh" ? zhCN : undefined,
      });
    } catch {
      timeAgo = item.timestamp;
    }

    return (
      <TouchableOpacity
        onPress={() => {
          router.push({
            pathname: "/preview",
            params: {
              uri: item.uri_string,
              name: item.file_name,
              type: item.file_type,
            },
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
            {item.file_name}
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
            onPress={refetch}
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
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 20, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
