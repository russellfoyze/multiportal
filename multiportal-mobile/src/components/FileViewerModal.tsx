import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { PortalFile } from "../types";
import { downloadAndShareFile, toggleFavorite, deleteFile } from "../api";

interface FileViewerModalProps {
  file: PortalFile | null;
  visible: boolean;
  onClose: () => void;
  onRefresh: () => void;
  serverUrl: string;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  file,
  visible,
  onClose,
  onRefresh,
  serverUrl,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!file) return null;

  const isImage =
    file.mimeType.startsWith("image/") ||
    /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);
  const isPdf = file.mimeType === "application/pdf" || file.name.endsWith(".pdf");

  const previewUrl = `${serverUrl.trim().replace(/\/+$/, "")}/api/drive/preview/${file.id}`;

  const handleShare = async () => {
    setIsProcessing(true);
    const success = await downloadAndShareFile(file.id, file.name, serverUrl);
    setIsProcessing(false);
    if (!success) {
      Alert.alert("Error", "Could not download or share file");
    }
  };

  const handleToggleFav = async () => {
    const ok = await toggleFavorite(file.id, !file.isFavorite, serverUrl);
    if (ok) {
      onRefresh();
      onClose();
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete File", `Are you sure you want to remove "${file.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setIsProcessing(true);
          const ok = await deleteFile(file.id, serverUrl);
          setIsProcessing(false);
          if (ok) {
            onRefresh();
            onClose();
          } else {
            Alert.alert("Error", "Failed to delete file");
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.titleText} numberOfLines={1}>
              {file.name}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Preview Box */}
          <View style={styles.previewBox}>
            {isImage ? (
              <Image source={{ uri: previewUrl }} style={styles.previewImage} resizeMode="contain" />
            ) : isPdf ? (
              <View style={styles.fallbackBox}>
                <MaterialIcons name="picture-as-pdf" size={64} color="#EF4444" />
                <Text style={styles.fallbackType}>PDF Document</Text>
              </View>
            ) : (
              <View style={styles.fallbackBox}>
                <MaterialIcons name="insert-drive-file" size={64} color="#6366F1" />
                <Text style={styles.fallbackType}>{file.category}</Text>
              </View>
            )}
          </View>

          {/* Details */}
          <View style={styles.detailsBox}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Size:</Text>
              <Text style={styles.metaValue}>{file.formattedSize}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Category:</Text>
              <Text style={styles.metaValue}>{file.category}</Text>
            </View>
            {file.folderName && (
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Vault Folder:</Text>
                <Text style={[styles.metaValue, { color: "#F59E0B" }]}>📁 {file.folderName}</Text>
              </View>
            )}
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Created:</Text>
              <Text style={styles.metaValue}>{file.formattedDate || "Recent"}</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare} disabled={isProcessing}>
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="share-outline" size={18} color="#FFF" />
                  <Text style={styles.actionButtonText}>Share / Save</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconActionButton} onPress={handleToggleFav}>
              <Ionicons
                name={file.isFavorite ? "star" : "star-outline"}
                size={20}
                color={file.isFavorite ? "#FBBF24" : "#94A3B8"}
              />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.iconActionButton, { borderColor: "#EF4444" }]} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#111726",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 18,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#F8FAFC",
    flex: 1,
    marginRight: 10,
  },
  previewBox: {
    height: 220,
    backgroundColor: "#0B0F19",
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  fallbackBox: {
    alignItems: "center",
    gap: 8,
  },
  fallbackType: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "500",
  },
  detailsBox: {
    backgroundColor: "#0D1322",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  metaValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E2E8F0",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#6366F1",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 13,
  },
  iconActionButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#162032",
    borderWidth: 1,
    borderColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
});
