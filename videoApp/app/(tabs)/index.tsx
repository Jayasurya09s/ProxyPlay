import { View, Text, Image, TouchableOpacity, FlatList, Alert, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import API from "../../src/services/api";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Spacing, Shadows } from "../../constants/theme";
import { StatusBar } from "expo-status-bar";

export default function Dashboard() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await API.get("/dashboard");
        setVideos(res.data);
      } catch (e: any) {
        if (e?.response?.status === 401) {
          await AsyncStorage.removeItem("token");
          Alert.alert("Session expired", "Please log in again.");
          router.replace("/login");
        } else {
          Alert.alert("Error", e?.message || "Failed to load dashboard");
        }
      }
    };
    fetchDashboard();
  }, []);

  return (
    <LinearGradient colors={[Colors.background, "#0E1324"]} style={styles.container}>
      <StatusBar style="light" />
      <FlatList
        contentContainerStyle={{ padding: Spacing.lg }}
        data={videos}
        keyExtractor={(item: any) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        renderItem={({ item }: any) => (
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/player", params: item })}
            style={[styles.card, Shadows.soft]}
          >
            <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.75)"]}
              style={styles.overlay}
            />
            <View style={styles.textWrap}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.surface,
  },
  thumbnail: {
    width: "100%",
    height: 200,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  textWrap: {
    position: "absolute",
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  desc: {
    color: Colors.textSecondary,
    marginTop: 4,
    fontSize: 14,
  },
});