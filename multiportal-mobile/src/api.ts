import { PortalFile, PortalStats, FileTypeFilter } from "./types";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

// Global session cookie storage for React Native
let savedSessionCookie: string | null = null;

export function getSessionCookie(): string | null {
  return savedSessionCookie;
}

export function setSessionCookie(cookie: string | null): void {
  savedSessionCookie = cookie;
}

export async function login(
  email: string,
  password: string,
  totpCode: string,
  serverUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${serverUrl.trim().replace(/\/+$/, "")}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, totpCode }),
    });

    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/mah_portal_session=[^;]+/);
      if (match) {
        savedSessionCookie = match[0];
      }
    }

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true };
    }
    return { success: false, error: data.error || data.message || "Login failed" };
  } catch (err: any) {
    return { success: false, error: err.message || "Network connection error" };
  }
}

export async function fetchFiles(
  search: string = "",
  category: string = "All",
  typeFilter: FileTypeFilter = "All file types",
  serverUrl: string
): Promise<{ files: PortalFile[]; stats: PortalStats; isMock?: boolean; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category && category !== "All") params.set("category", category);
    if (typeFilter && typeFilter !== "All file types") params.set("typeFilter", typeFilter);

    const headers: Record<string, string> = {};
    if (savedSessionCookie) {
      headers["Cookie"] = savedSessionCookie;
    }

    const res = await fetch(
      `${serverUrl.trim().replace(/\/+$/, "")}/api/drive/files?${params.toString()}`,
      { headers }
    );

    if (res.status === 401) {
      return {
        files: [],
        stats: { totalFiles: 0, documentsCount: 0, photosCount: 0, favoritesCount: 0 },
        error: "Unauthorized",
      };
    }

    const data = await res.json();
    return {
      files: data.files || [],
      stats: data.stats || { totalFiles: 0, documentsCount: 0, photosCount: 0, favoritesCount: 0 },
      isMock: data.isMock,
    };
  } catch (err: any) {
    return {
      files: [],
      stats: { totalFiles: 0, documentsCount: 0, photosCount: 0, favoritesCount: 0 },
      error: err.message || "Network error",
    };
  }
}

export async function uploadFile(
  fileUri: string,
  fileName: string,
  mimeType: string,
  category: string,
  tags: string,
  description: string,
  folderName: string | undefined,
  serverUrl: string
): Promise<{ success: boolean; file?: PortalFile; error?: string }> {
  try {
    const uploadUrl = `${serverUrl.trim().replace(/\/+$/, "")}/api/drive/upload`;

    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      name: fileName,
      type: mimeType || "application/octet-stream",
    } as any);
    formData.append("displayName", fileName);
    formData.append("category", category || "Other");
    formData.append("tags", tags || "");
    formData.append("description", description || "");
    if (folderName) {
      formData.append("folderName", folderName);
    }

    const headers: Record<string, string> = {};
    if (savedSessionCookie) {
      headers["Cookie"] = savedSessionCookie;
    }

    const res = await fetch(uploadUrl, {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, file: data.file };
    } else {
      return { success: false, error: data.error || `Upload failed with status ${res.status}` };
    }
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to upload file" };
  }
}

export async function toggleFavorite(
  fileId: string,
  newStatus: boolean,
  serverUrl: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${serverUrl.trim().replace(/\/+$/, "")}/api/drive/files/${fileId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(savedSessionCookie ? { Cookie: savedSessionCookie } : {}),
        },
        body: JSON.stringify({ isFavorite: newStatus }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteFile(fileId: string, serverUrl: string): Promise<boolean> {
  try {
    const res = await fetch(
      `${serverUrl.trim().replace(/\/+$/, "")}/api/drive/files/${fileId}`,
      {
        method: "DELETE",
        headers: savedSessionCookie ? { Cookie: savedSessionCookie } : {},
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function downloadAndShareFile(
  fileId: string,
  fileName: string,
  serverUrl: string
): Promise<boolean> {
  try {
    const targetFile = new File(Paths.cache, fileName);
    const downloadUrl = `${serverUrl.trim().replace(/\/+$/, "")}/api/drive/download/${fileId}`;

    const headers: Record<string, string> = {};
    if (savedSessionCookie) {
      headers["Cookie"] = savedSessionCookie;
    }

    const downloaded = await File.downloadFileAsync(downloadUrl, targetFile, {
      headers,
      idempotent: true,
    });

    if (downloaded && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(downloaded.uri);
      return true;
    }
    return false;
  } catch (err) {
    console.error("Download and share error:", err);
    return false;
  }
}
