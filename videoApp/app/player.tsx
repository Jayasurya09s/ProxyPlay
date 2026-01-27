import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { WebView } from "react-native-webview";
import API from "../src/services/api";

export default function Player() {
  const { id, playback_token } = useLocalSearchParams();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    API.get(`/video/${id}/stream?token=${playback_token}`)
      .then((res) => {
        // Record watch event
        API.post(`/video/${id}/watch`).catch(() => {});
        setUrl(res.data.stream_url);
      });
  }, []);

  if (!url) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00BFFF" />
      </View>
    );
  }

  // Extract YouTube video ID from embed URL
  const videoId = url.match(/embed\/([a-zA-Z0-9_-]+)/)?.[1] || "";

  // Create full HTML with YouTube iframe API
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * { margin: 0; padding: 0; }
          body { background: #000; }
          #player { width: 100vw; height: 100vh; border: none; }
        </style>
      </head>
      <body>
        <iframe
          id="player"
          src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </body>
    </html>
  `;

  return (
    <WebView
      source={{ html }}
      style={styles.webview}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled
      domStorageEnabled
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  webview: {
    flex: 1,
    backgroundColor: "#000",
  },
});