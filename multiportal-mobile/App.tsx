import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { LoginScreen } from "./src/screens/LoginScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { setSessionCookie } from "./src/api";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  // Default server url: 10.0.2.2 for Android emulator, or http://localhost:3000
  const [serverUrl, setServerUrl] = useState("http://10.0.2.2:3000");

  const handleLoginSuccess = (url: string) => {
    setServerUrl(url);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setSessionCookie(null);
    setIsLoggedIn(false);
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar style="light" />
      {isLoggedIn ? (
        <DashboardScreen onLogout={handleLogout} serverUrl={serverUrl} />
      ) : (
        <LoginScreen onLoginSuccess={handleLoginSuccess} defaultServerUrl={serverUrl} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#0B0F19",
  },
});
