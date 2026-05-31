import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "@filepreview_history";
const MAX_ITEMS = 50;

export async function loadHistory() {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveHistory(item) {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({
      id: Date.now().toString(),
      file_name: item.fileName,
      uri_string: item.uriString,
      file_type: item.fileType,
      timestamp: new Date().toISOString(),
    });
    const trimmed = list.slice(0, MAX_ITEMS);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    // best effort
  }
}

export async function clearHistory() {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch {
    // best effort
  }
}
