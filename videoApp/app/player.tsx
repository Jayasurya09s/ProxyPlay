import { View, StyleSheet, ActivityIndicator, Text, Dimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import API from "../src/services/api";

export default function Player() {
  const { id, playback_token } = useLocalSearchParams();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    API.get(`/video/${id}/stream?token=${playback_token}`)
      .then((res) => {
        console.log('Stream URL received:', res.data.stream_url);
        // Record watch event
        API.post(`/video/${id}/watch`).catch(() => {});
        setUrl(res.data.stream_url);
      })
      .catch((err) => {
        console.error('Error fetching stream:', err);
        setError('Failed to load video');
      });
  }, []);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      if (status.didJustFinish) {
        console.log('Video finished playing');
      }
    } else if (status.error) {
      console.error('Video error:', status.error);
      setError(`Playback error: ${status.error}`);
    }
  };

  if (error) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!url) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00BFFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri: url }}
        style={styles.video}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        onPlaybackStatusUpdate={onPlaybackStatusUpdate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  video: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    padding: 20,
  },
});