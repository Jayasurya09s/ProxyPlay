import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ScrollView } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Colors, Spacing, Shadows } from "../constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://proxyplay.onrender.com";

export default function AdminAddVideo() {
  const [adminKey, setAdminKey] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeId, setYoutubeId] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const addVideo = async () => {
    if (!adminKey || !title || !description || !youtubeId || !thumbnailUrl) {
      Alert.alert("Missing info", "Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/video`,
        {
          title,
          description,
          youtube_id: youtubeId,
          thumbnail_url: thumbnailUrl,
          is_active: true,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Admin-Key": adminKey,
          },
        }
      );

      Alert.alert("Success", `Video added successfully! ID: ${response.data.id}`, [
        {
          text: "Add Another",
          onPress: () => {
            setTitle("");
            setDescription("");
            setYoutubeId("");
            setThumbnailUrl("");
          },
        },
        {
          text: "Go to Dashboard",
          onPress: () => router.replace("/(tabs)"),
        },
      ]);
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || "Failed to add video";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[Colors.background, "#0E1324"]} style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, Shadows.soft]}>
          <Text style={styles.title}>Admin: Add Video</Text>
          
          <Text style={styles.label}>Admin Key</Text>
          <TextInput
            placeholder="Enter admin key"
            placeholderTextColor={Colors.textSecondary}
            value={adminKey}
            onChangeText={setAdminKey}
            style={styles.input}
            secureTextEntry
          />

          <Text style={styles.label}>Video Title</Text>
          <TextInput
            placeholder="e.g., Sample Video Title"
            placeholderTextColor={Colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            placeholder="e.g., A great video about..."
            placeholderTextColor={Colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            style={[styles.input, styles.textArea]}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>YouTube Video ID</Text>
          <TextInput
            placeholder="e.g., dQw4w9WgXcQ"
            placeholderTextColor={Colors.textSecondary}
            value={youtubeId}
            onChangeText={setYoutubeId}
            style={styles.input}
          />

          <Text style={styles.label}>Thumbnail URL</Text>
          <TextInput
            placeholder="e.g., https://i.ytimg.com/vi/..."
            placeholderTextColor={Colors.textSecondary}
            value={thumbnailUrl}
            onChangeText={setThumbnailUrl}
            style={styles.input}
            autoCapitalize="none"
          />

          <TouchableOpacity onPress={addVideo} disabled={loading} style={styles.primaryButton}>
            <LinearGradient colors={[Colors.neonCyan, Colors.neonMagenta]} style={styles.buttonGradient}>
              <Text style={styles.buttonText}>{loading ? "Adding..." : "Add Video"}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} disabled={loading} style={styles.linkButton}>
            <Text style={styles.linkText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: 60,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  label: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  primaryButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: Spacing.lg,
  },
  buttonGradient: {
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  linkButton: {
    paddingVertical: Spacing.sm,
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  linkText: {
    color: Colors.neonCyan,
    fontSize: 14,
  },
});
