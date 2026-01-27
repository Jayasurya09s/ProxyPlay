import { View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { WebView } from "react-native-webview";
import API from "../src/services/api";

export default function Player() {
  const { id, playback_token } = useLocalSearchParams();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    API.get(`/video/${id}/stream?token=${playback_token}`)
      .then((res) => setUrl(res.data.stream_url));
  }, []);

  return url ? <WebView source={{ uri: url }} /> : <View />;
}