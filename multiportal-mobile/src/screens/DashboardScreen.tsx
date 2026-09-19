import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { PortalFile, PortalStats, DEFAULT_CATEGORIES, FileTypeFilter } from "../types";
import { fetchFiles, setSessionCookie } from "../api";
import { UploadModal } from "../components/UploadModal";
import { FileViewerModal } from "../components/FileViewerModal";

interface DashboardScreenProps {
  onLogout: () => void;
  serverUrl: string;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onLogout,
  serverUrl,
}) => {
  const [files, setFiles] = useState<PortalFile[]>([]);
  const [stats, setStats] = useState<PortalStats>({
    totalFiles: 0,
    documentsCount: 0,
    photosCount: 0,
    favoritesCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modals
  const [selectedFile, setSelectedFile] = useState<PortalFile | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const loadFiles = useCallback(async () => {
    const res = await fetchFiles(
      searchQuery,
      selectedCategory,
      "All file types",
      serverUrl
    );
    if (res.error === "Unauthorized") {
      setSessionCookie(null);
      onLogout();
      return;
    }
    setFiles(res.files);
    setStats(res.stats);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [searchQuery, selectedCategory, serverUrl, onLogout]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadFiles();
  };

  const getBadgeInfo = (file: PortalFile) => {
    const lower = file.name.toLowerCase();
    const isPdf = file.mimeType === "application/pdf" || lower.endsWith(".pdf");
    const isImage = file.mimeType.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(lower);
    const isWord = file.mimeType.includes("word") || /\.(docx|doc)$/i.test(lower);
    const isVideo = file.mimeType.startsWith("video/") || /\.(mp4|mov|avi|mkv)$/i.test(lower);

    if (isPdf) return { icon: "picture-as-pdf" as const, color: "#EF4444", bg: "#2B151B" };
    if (isImage) return { icon: "image" as const, color: "#06B6D4", bg: "#0C2236" };
    if (isWord) return { icon: "description" as const, color: "#3B82F6", bg: "#0E1D32" };
    if (isVideo) return { icon: "play-circle" as const, color: "#A855F7", bg: "#221634" };
    return { icon: "insert-drive-file" as const, color: "#94A3B8", bg: "#162032" };
  };

  const renderGridItem = ({ item }: { item: PortalFile }) => {
    const badge = getBadgeInfo(item);
    const isImage = item.mimeType.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(item.name);
    const previewUrl = `${serverUrl.trim().replace(/\/+$/, "")}/api/drive/preview/${item.id}`;

    return (
      <TouchableOpacity
        style={styles.gridCard}
        onPress={() => setSelectedFile(item)}
        activeOpacity={0.8}
      >
        <View style={styles.gridThumbnailBox}>
          {isImage ? (
            <Image source={{ uri: previewUrl }} style={styles.gridThumbnailImage} resizeMode="cover" />
          ) : (
            <View style={[styles.gridIconFallback, { backgroundColor: badge.bg }]}>
              <MaterialIcons name={badge.icon} size={36} color={badge.color} />
            </View>
          )}

          {item.isFavorite && (
            <View style={styles.favoriteBadge}>
              <Ionicons name="star" size={12} color="#FBBF24" />
            </View>
          )}
        </View>

        <View style={styles.gridCardInfo}>
          <Text style={styles.gridCardName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.gridMetaRow}>
            <Text style={styles.gridCardSize}>{item.formattedSize}</Text>
            <Text style={styles.gridCardCategory} numberOfLines={1}>
              · {item.category}
            </Text>
          </View>

          {item.folderName && (
            <View style={styles.folderBadge}>
              <Text style={styles.folderBadgeText} numberOfLines={1}>
                📁 {item.folderName}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderListItem = ({ item }: { item: PortalFile }) => {
    const badge = getBadgeInfo(item);

    return (
      <TouchableOpacity
        style={styles.listCard}
        onPress={() => setSelectedFile(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.listIconBox, { backgroundColor: badge.bg }]}>
          <MaterialIcons name={badge.icon} size={22} color={badge.color} />
        </View>

        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={styles.listFileName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.isFavorite && <Ionicons name="star" size={13} color="#FBBF24" />}
          </View>
          <View style={styles.listMetaRow}>
            <Text style={styles.listMetaText}>{item.formattedSize}</Text>
            <Text style={styles.listMetaText}>·</Text>
            <Text style={styles.listMetaText}>{item.category}</Text>
            {item.folderName && (
              <>
                <Text style={styles.listMetaText}>·</Text>
                <View style={styles.folderBadgeSmall}>
                  <Text style={styles.folderBadgeSmallText}>📁 {item.folderName}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color="#64748B" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F19" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.brandRow}>
          <View style={styles.headerIcon}>
            <MaterialIcons name="shield" size={20} color="#6366F1" />
          </View>
          <Text style={styles.headerBrandTitle}>MultiPortal</Text>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Vault Live</Text>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>RF</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Bar (Upload File & Upload Folder) */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.uploadFileBtn}
          onPress={() => setIsUploadModalOpen(true)}
        >
          <Ionicons name="cloud-upload-outline" size={16} color="#FFF" />
          <Text style={styles.uploadBtnText}>Upload File</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.uploadFolderBtn}
          onPress={() => setIsUploadModalOpen(true)}
        >
          <MaterialIcons name="create-new-folder" size={16} color="#F59E0B" />
          <Text style={styles.uploadFolderBtnText}>Upload Folder</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.viewToggleBtn}
          onPress={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
        >
          <Ionicons
            name={viewMode === "grid" ? "list" : "grid"}
            size={18}
            color="#94A3B8"
          />
        </TouchableOpacity>
      </View>

      {/* Stats Metric Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statCount}>{stats.totalFiles}</Text>
          <Text style={styles.statLabel}>Total Files</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCount}>{stats.documentsCount}</Text>
          <Text style={styles.statLabel}>Docs</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCount}>{stats.photosCount}</Text>
          <Text style={styles.statLabel}>Photos</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCount}>{stats.favoritesCount}</Text>
          <Text style={styles.statLabel}>Starred</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color="#64748B" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search passport, visa, CV..."
          placeholderTextColor="#64748B"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={16} color="#64748B" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Category Chips Scroll */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={["All", ...DEFAULT_CATEGORIES]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            return (
              <TouchableOpacity
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Files List / Grid */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading vault documents...</Text>
        </View>
      ) : files.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="folder-open" size={48} color="#2A3854" />
          <Text style={styles.emptyTitle}>No documents found</Text>
          <Text style={styles.emptySub}>Upload files or folders to your vault</Text>
        </View>
      ) : (
        <FlatList
          key={viewMode}
          data={files}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === "grid" ? 2 : 1}
          renderItem={viewMode === "grid" ? renderGridItem : renderListItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#6366F1" />}
        />
      )}

      {/* Modals */}
      <UploadModal
        visible={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={loadFiles}
        serverUrl={serverUrl}
      />

      <FileViewerModal
        file={selectedFile}
        visible={Boolean(selectedFile)}
        onClose={() => setSelectedFile(null)}
        onRefresh={loadFiles}
        serverUrl={serverUrl}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F19",
  },
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  headerBrandTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F8FAFC",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginLeft: 10,
    marginRight: 4,
  },
  liveText: {
    fontSize: 11,
    color: "#10B981",
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#6366F1",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 11,
  },
  logoutButton: {
    padding: 6,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  uploadFileBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366F1",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  uploadBtnText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 13,
  },
  uploadFolderBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "#F59E0B",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  uploadFolderBtnText: {
    color: "#F59E0B",
    fontWeight: "600",
    fontSize: 13,
  },
  viewToggleBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#111726",
    borderWidth: 1,
    borderColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#111726",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  statCount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#F8FAFC",
  },
  statLabel: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111726",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    color: "#F8FAFC",
    fontSize: 13,
    padding: 0,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  categoryPill: {
    backgroundColor: "#111726",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  categoryPillActive: {
    backgroundColor: "rgba(99, 102, 241, 0.2)",
    borderColor: "#6366F1",
  },
  categoryPillText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  categoryPillTextActive: {
    color: "#818CF8",
    fontWeight: "bold",
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  gridCard: {
    flex: 1,
    margin: 4,
    backgroundColor: "#111726",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 8,
    maxWidth: "50%",
  },
  gridThumbnailBox: {
    aspectRatio: 1.2,
    backgroundColor: "#0B0F19",
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  gridThumbnailImage: {
    width: "100%",
    height: "100%",
  },
  gridIconFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 6,
    padding: 3,
  },
  gridCardInfo: {
    marginTop: 8,
  },
  gridCardName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E2E8F0",
    lineHeight: 16,
  },
  gridMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  gridCardSize: {
    fontSize: 10,
    color: "#64748B",
  },
  gridCardCategory: {
    fontSize: 10,
    color: "#94A3B8",
    marginLeft: 2,
    flex: 1,
  },
  folderBadge: {
    marginTop: 4,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.4)",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  folderBadgeText: {
    color: "#F59E0B",
    fontSize: 9,
    fontWeight: "bold",
  },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111726",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 10,
    marginVertical: 4,
  },
  listIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  listFileName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E2E8F0",
    flex: 1,
  },
  listMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  listMetaText: {
    fontSize: 11,
    color: "#64748B",
  },
  folderBadgeSmall: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  folderBadgeSmallText: {
    fontSize: 9,
    color: "#F59E0B",
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: "#94A3B8",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#64748B",
  },
  emptySub: {
    fontSize: 12,
    color: "#475569",
  },
});
