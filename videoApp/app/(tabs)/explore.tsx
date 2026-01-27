import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import API from "../../src/services/api";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Spacing, Shadows } from "../../constants/theme";
import { StatusBar } from "expo-status-bar";

export default function Settings() {
  const [user, setUser] = useState({ name: "", email: "" });

  useEffect(() => {
    API.get("/auth/me").then((res) => setUser(res.data));
  }, []);

  const logout = async () => {
    try {
      await API.post("/auth/logout");
    } catch {}
    await AsyncStorage.removeItem("access_token");
    await AsyncStorage.removeItem("refresh_token");
    router.replace("/login");
  };

  return (
    <LinearGradient colors={[Colors.background, "#0E1324"]} style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.card, Shadows.soft]}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.row}><Text style={styles.label}>Name</Text><Text style={styles.value}>{user.name}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Email</Text><Text style={styles.value}>{user.email}</Text></View>

        <TouchableOpacity onPress={() => router.push("/admin")} style={styles.adminButton}>
          <LinearGradient colors={[Colors.neonPurple, Colors.neonCyan]} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>🔑 Admin: Add Video</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <LinearGradient colors={[Colors.neonMagenta, Colors.neonCyan]} style={styles.buttonGradient}>
            <Text style={styles.logoutText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  card: {
    width: "92%",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  label: {
    color: Colors.textSecondary,
  },
  value: {
    color: Colors.textPrimary,
    fontWeight: "600",
  },
  adminButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: Spacing.lg,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  logoutButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: Spacing.sm,
  },
  buttonGradient: {
    paddingVertical: Spacing.sm + 4,
    alignItems: "center",
  },
  logoutText: {
    color: "#081018",
    fontWeight: "700",
    fontSize: 16,
  },
});