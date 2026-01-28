import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

function getBaseURL(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.length > 0) {
    return envUrl;
  }

  // Production backend by default
  if (__DEV__ === false) {
    return "https://proxyplay.onrender.com";
  }

  // Development mode: use local network
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

// Request interceptor: attach access token
API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 and refresh token
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem("refresh_token");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Call refresh endpoint
        const response = await axios.post(`${API.defaults.baseURL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data;

        // Store new access token
        await AsyncStorage.setItem("access_token", access_token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return API(originalRequest);
      } catch (refreshError) {
        // Refresh failed: clear tokens and redirect to login
        await AsyncStorage.removeItem("access_token");
        await AsyncStorage.removeItem("refresh_token");
        // Optionally trigger navigation to login (depends on your router setup)
        console.error("Session expired, please log in again");
        throw refreshError;
      }
    }

    return Promise.reject(error);
  }
);

export default API;