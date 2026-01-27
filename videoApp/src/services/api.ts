import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

function getBaseURL(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.length > 0) {
    return envUrl;
  }

  if (Platform.OS === "web") {
    const host = (typeof window !== "undefined" ? window.location.hostname : "localhost");
    return `http://${host}:5000`;
  }

  const hostUri = Constants.expoConfig?.hostUri ?? "localhost:19000";
  let host = hostUri.split(":")[0] || "localhost";

  if (Platform.OS === "android" && (host === "localhost" || host === "127.0.0.1")) {
    host = "10.0.2.2";
  }

  return `http://${host}:5000`;
}

const API = axios.create({
  baseURL: getBaseURL(),
});

API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;