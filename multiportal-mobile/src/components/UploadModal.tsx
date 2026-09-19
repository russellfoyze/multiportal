import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { DEFAULT_CATEGORIES } from "../types";
import { uploadFile } from "../api";

interface UploadModalProps {
  visible: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
  serverUrl: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  visible,
  onClose,
  onUploadComplete,
  serverUrl,
}) => {
  const [mode, setMode] = useState<"file" | "folder">("file");

  // Single file state
  const [singleFile, setSingleFile] = useState<{
    uri: string;
    name: string;
    mimeType: string;
    size?: number;
  } | null>(null);

  // Folder batch state
  const [folderFiles, setFolderFiles] = useState<
    Array<{ uri: string; name: string; mimeType: string; size?: number }>
  >([]);
  const [folderName, setFolderName] = useState("");

  // Metadata
  const [category, setCategory] = useState("Immigration");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");

  // Progress
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; percent: number } | null>(null);

  const resetState = () => {
    setSingleFile(null);
    setFolderFiles([]);
    setFolderName("");
    setTags("");
    setDescription("");
    setIsUploading(false);
    setProgress(null);
  };

  const handlePickSingleFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setSingleFile({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType || "application/octet-stream",
          size: asset.size,
        });
      }
    } catch (err) {
      Alert.alert("Picker Error", "Failed to select file");
    }
  };

  const handlePickFolderFiles = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const assets = res.assets.map((a) => ({
          uri: a.uri,
          name: a.name,
          mimeType: a.mimeType || "application/octet-stream",
          size: a.size,
        }));
        setFolderFiles(assets);

        if (!folderName) {
          setFolderName("Uploaded Folder");
        }
      }
    } catch (err) {
      Alert.alert("Picker Error", "Failed to select folder files");
    }
  };

  const handleSubmit = async () => {
    if (mode === "file") {
      if (!singleFile) {
        Alert.alert("Required", "Please select a file to upload");
        return;
      }

      setIsUploading(true);
      const res = await uploadFile(
        singleFile.uri,
        singleFile.name,
        singleFile.mimeType,
        category,
        tags,
        description,
        undefined,
        serverUrl
      );
      setIsUploading(false);

      if (res.success) {
        Alert.alert("Success", "File uploaded to MultiPortal Vault!");
        resetState();
        onUploadComplete();
        onClose();
      } else {
        Alert.alert("Upload Failed", res.error || "Failed to upload file");
      }
    } else {
      // Folder upload
      if (folderFiles.length === 0) {
        Alert.alert("Required", "Please select files from your folder to upload");
        return;
      }

      const activeFolder = folderName.trim() || "Uploaded Folder";
      setIsUploading(true);

      let successCount = 0;
      for (let i = 0; i < folderFiles.length; i++) {
        const f = folderFiles[i];
        const percent = Math.round(((i + 1) / folderFiles.length) * 100);
        setProgress({ current: i + 1, total: folderFiles.length, percent });

        const res = await uploadFile(
          f.uri,
          f.name,
          f.mimeType,
          category,
          tags,
          description,
          activeFolder,
          serverUrl
        );

        if (res.success) {
          successCount++;
        }
      }

      setIsUploading(false);
      Alert.alert(
        "Folder Upload Complete",
        `Successfully uploaded ${successCount} of ${folderFiles.length} files into folder "${activeFolder}" in your vault!`
      );
      resetState();
      onUploadComplete();
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleBox}>
              <MaterialIcons
                name={mode === "folder" ? "create-new-folder" : "cloud-upload"}
                size={22}
                color={mode === "folder" ? "#F59E0B" : "#6366F1"}
              />
              <Text style={styles.modalTitle}>
                {mode === "folder" ? "Upload Full Folder" : "Upload Document"}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={isUploading}>
              <Ionicons name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Mode Switcher Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabButton, mode === "file" && styles.tabButtonActiveFile]}
              onPress={() => setMode("file")}
              disabled={isUploading}
            >
              <MaterialIcons name="insert-drive-file" size={16} color={mode === "file" ? "#6366F1" : "#94A3B8"} />
              <Text style={[styles.tabText, mode === "file" && styles.tabTextActiveFile]}>
                Single File
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, mode === "folder" && styles.tabButtonActiveFolder]}
              onPress={() => setMode("folder")}
              disabled={isUploading}
            >
              <MaterialIcons name="folder" size={16} color={mode === "folder" ? "#F59E0B" : "#94A3B8"} />
              <Text style={[styles.tabText, mode === "folder" && styles.tabTextActiveFolder]}>
                Full Folder
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {/* Progress bar if uploading */}
            {isUploading && progress && (
              <View style={styles.progressCard}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>Uploading folder files...</Text>
                  <Text style={styles.progressPercent}>
                    {progress.percent}% ({progress.current}/{progress.total})
                  </Text>
                </View>
                <View style={styles.progressBarTrack}>
                  <View style={[styles.progressBarFill, { width: `${progress.percent}%` }]} />
                </View>
              </View>
            )}

            {/* Picker section */}
            {mode === "file" ? (
              <TouchableOpacity
                style={styles.pickerBox}
                onPress={handlePickSingleFile}
                disabled={isUploading}
              >
                {singleFile ? (
                  <View style={styles.fileSelectedRow}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.fileNameText} numberOfLines={1}>
                        {singleFile.name}
                      </Text>
                      <Text style={styles.fileSubText}>Tap to change file</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.pickerEmptyContent}>
                    <Ionicons name="cloud-upload-outline" size={36} color="#6366F1" />
                    <Text style={styles.pickerPrompt}>Tap to browse document or photo</Text>
                    <Text style={styles.pickerSub}>PDF, DOCX, JPG, PNG, MP4 supported</Text>
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              <View style={{ gap: 10 }}>
                <TouchableOpacity
                  style={[styles.pickerBox, { borderColor: "#F59E0B" }]}
                  onPress={handlePickFolderFiles}
                  disabled={isUploading}
                >
                  {folderFiles.length > 0 ? (
                    <View style={styles.fileSelectedRow}>
                      <MaterialIcons name="folder" size={32} color="#F59E0B" />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.fileNameText}>
                          {folderFiles.length} file(s) selected
                        </Text>
                        <Text style={styles.fileSubText}>Tap to re-select folder files</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.pickerEmptyContent}>
                      <MaterialIcons name="create-new-folder" size={38} color="#F59E0B" />
                      <Text style={styles.pickerPrompt}>Tap to select folder files</Text>
                      <Text style={styles.pickerSub}>Select multi-file folder batch</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {folderFiles.length > 0 && (
                  <View>
                    <Text style={styles.inputLabel}>Folder Name in Vault</Text>
                    <TextInput
                      style={styles.inputField}
                      value={folderName}
                      onChangeText={setFolderName}
                      placeholder="e.g. University Certificates"
                      placeholderTextColor="#64748B"
                      editable={!isUploading}
                    />
                  </View>
                )}
              </View>
            )}

            {/* Category Selector */}
            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {DEFAULT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                  onPress={() => setCategory(cat)}
                  disabled={isUploading}
                >
                  <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Tags */}
            <Text style={styles.inputLabel}>Tags (comma separated)</Text>
            <TextInput
              style={styles.inputField}
              value={tags}
              onChangeText={setTags}
              placeholder="e.g. passport, urgent, 2026"
              placeholderTextColor="#64748B"
              editable={!isUploading}
            />

            {/* Description */}
            <Text style={styles.inputLabel}>Notes / Description (Optional)</Text>
            <TextInput
              style={[styles.inputField, { height: 60, textAlignVertical: "top" }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Private document notes..."
              placeholderTextColor="#64748B"
              multiline
              editable={!isUploading}
            />

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                mode === "folder" ? styles.submitButtonFolder : styles.submitButtonFile,
                isUploading && { opacity: 0.6 },
              ]}
              onPress={handleSubmit}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <View style={styles.buttonContentRow}>
                  <Ionicons name="cloud-upload" size={18} color="#FFF" />
                  <Text style={styles.submitButtonText}>
                    {mode === "folder"
                      ? `Upload Folder (${folderFiles.length} files)`
                      : "Upload to Vault"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#111726",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 20,
    maxHeight: "85%",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitleBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F8FAFC",
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#0B0F19",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabButtonActiveFile: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
  },
  tabButtonActiveFolder: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8",
  },
  tabTextActiveFile: {
    color: "#6366F1",
  },
  tabTextActiveFolder: {
    color: "#F59E0B",
  },
  bodyScroll: {
    marginBottom: 10,
  },
  pickerBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#2A3854",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0D1322",
    marginBottom: 14,
  },
  pickerEmptyContent: {
    alignItems: "center",
    gap: 6,
  },
  pickerPrompt: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F1F5F9",
  },
  pickerSub: {
    fontSize: 11,
    color: "#64748B",
  },
  fileSelectedRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  fileNameText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#F8FAFC",
  },
  fileSubText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 6,
    marginTop: 10,
  },
  inputField: {
    backgroundColor: "#0B0F19",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#F8FAFC",
  },
  categoryScroll: {
    flexDirection: "row",
    marginBottom: 6,
  },
  categoryChip: {
    backgroundColor: "#162032",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  categoryChipActive: {
    backgroundColor: "rgba(99, 102, 241, 0.25)",
    borderColor: "#6366F1",
  },
  categoryChipText: {
    fontSize: 12,
    color: "#94A3B8",
  },
  categoryChipTextActive: {
    color: "#818CF8",
    fontWeight: "bold",
  },
  progressCard: {
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    borderWidth: 1,
    borderColor: "#6366F1",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#F8FAFC",
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#818CF8",
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: "#1E293B",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#F59E0B",
    borderRadius: 3,
  },
  submitButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  submitButtonFile: {
    backgroundColor: "#6366F1",
  },
  submitButtonFolder: {
    backgroundColor: "#D97706",
  },
  buttonContentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  submitButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});
