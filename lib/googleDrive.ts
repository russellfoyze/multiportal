import { google, drive_v3 } from "googleapis";
import { Readable } from "stream";
import fs from "fs";
import path from "path";
import {
  PortalFile,
  PortalStats,
  FileCategory,
  FileTypeFilter,
  DriveConfigStatus,
} from "./types";
import {
  getMockFiles,
  addMockFile,
  updateMockFile,
  deleteMockFile,
  setMockFileBuffer,
  getMockFileBuffer,
} from "./mockData";
import { sanitizeAndFixFileName, detectMimeType } from "./formatUtils";

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = bytes / Math.pow(k, i);
  return `${val >= 10 || i === 0 ? val.toFixed(0) : val.toFixed(1)} ${sizes[i]}`;
}

export function formatPortalDate(dateStr?: string | null): string {
  if (!dateStr) return "Just now";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Unknown date";
  const day = d.toLocaleDateString("en-GB", { day: "2-digit" });
  const month = d.toLocaleDateString("en-GB", { month: "short" });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function updateEnvFile(updates: Record<string, string>): void {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf-8") : "";

    for (const [key, val] of Object.entries(updates)) {
      process.env[key] = val;
      const regex = new RegExp(`^${key}=.*$`, "m");
      if (regex.test(content)) {
        content = content.replace(regex, `${key}="${val}"`);
      } else {
        content += `\n${key}="${val}"`;
      }
    }

    fs.writeFileSync(envPath, content.trim() + "\n", "utf-8");
  } catch (err) {
    console.error("Failed to update .env.local file:", err);
  }
}

export async function getOrCreateVaultFolder(drive: drive_v3.Drive): Promise<string> {
  const currentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  // 1. If we have a folder ID, check if it exists and is accessible by this authenticated drive client
  if (currentFolderId && currentFolderId !== "root") {
    try {
      const check = await drive.files.get({
        fileId: currentFolderId,
        fields: "id, name, trashed",
        supportsAllDrives: true,
      });
      if (check.data.id && !check.data.trashed) {
        return currentFolderId;
      }
    } catch {
      // The current folder does not exist or belongs to another Google account
      console.log(`Current folder ${currentFolderId} inaccessible for active account. Resolving account vault...`);
    }
  }

  // 2. Search for an existing "multiportal" folder in this Google account
  try {
    const listRes = await drive.files.list({
      q: "mimeType = 'application/vnd.google-apps.folder' and (name = 'multiportal' or name = 'MultiPortal') and trashed = false",
      fields: "files(id, name)",
      spaces: "drive",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 5,
    });

    if (listRes.data.files && listRes.data.files.length > 0) {
      const foundId = listRes.data.files[0].id!;
      updateEnvFile({ GOOGLE_DRIVE_FOLDER_ID: foundId });
      return foundId;
    }

    // 3. Not found: automatically create "multiportal" in this user's Google Drive
    const createRes = await drive.files.create({
      requestBody: {
        name: "multiportal",
        mimeType: "application/vnd.google-apps.folder",
        description: "MultiPortal Private Document Vault",
      },
      fields: "id, name",
      supportsAllDrives: true,
    });

    const newFolderId = createRes.data.id!;
    updateEnvFile({ GOOGLE_DRIVE_FOLDER_ID: newFolderId });
    return newFolderId;
  } catch (err) {
    console.error("Error finding or creating vault folder:", err);
    return currentFolderId || "root";
  }
}

export function syncEnvFromDisk(): void {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  } catch (e) {
    console.error("Error syncing env from disk:", e);
  }
}

export function isGoogleDriveConfigured(): boolean {
  syncEnvFromDisk();
  const hasServiceAccount = Boolean(
    (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL) &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_DRIVE_FOLDER_ID
  );
  const hasOAuth = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );
  return hasOAuth || hasServiceAccount;
}

export function getDriveConfigStatus(): DriveConfigStatus {
  syncEnvFromDisk();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const email =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const hasOAuth = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );
  const connectedUserEmail = process.env.GOOGLE_DRIVE_USER_EMAIL || "";

  if (!hasOAuth && (!folderId || !email || !privateKey)) {
    return {
      isConfigured: false,
      authMode: "demo_mock",
      error:
        "Google Drive API credentials not fully configured. Running in Local Demo Mode.",
    };
  }

  return {
    isConfigured: true,
    authMode: hasOAuth ? "oauth2" : "service_account",
    serviceAccountEmail: hasOAuth
      ? (connectedUserEmail ? `Connected: ${connectedUserEmail} (15GB Personal Quota)` : "Connected via Personal Google OAuth (15GB Quota)")
      : email,
    folderId,
    folderName: "multiportal",
  };
}

let cachedDriveClient: drive_v3.Drive | null = null;

export function resetCachedDriveClient(): void {
  cachedDriveClient = null;
}

export function getGoogleOAuthCredentials(): { clientId: string; clientSecret: string } {
  syncEnvFromDisk();
  let clientId = process.env.GOOGLE_CLIENT_ID || "";
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  return { clientId, clientSecret };
}

export function getDriveClient(): drive_v3.Drive {
  syncEnvFromDisk();
  if (cachedDriveClient) {
    return cachedDriveClient;
  }

  const { clientId, clientSecret } = getGoogleOAuthCredentials();
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  // 1. If personal OAuth2 credentials are present, use user's personal Google account (15GB+ storage quota)
  if (clientId && clientSecret && refreshToken) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    cachedDriveClient = google.drive({ version: "v3", auth: oauth2Client });
    return cachedDriveClient;
  }

  // 2. Otherwise fall back to Service Account
  const email =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !privateKey) {
    throw new Error(
      "Missing Google Drive credentials (OAuth refresh token or Service Account)."
    );
  }

  if (privateKey.includes("\\n")) {
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });

  cachedDriveClient = google.drive({ version: "v3", auth });
  return cachedDriveClient;
}

export async function listPortalFiles(params: {
  search?: string;
  category?: string;
  typeFilter?: FileTypeFilter;
  tab?: string;
}): Promise<{ files: PortalFile[]; stats: PortalStats; isMock: boolean }> {
  const { search = "", category = "All", typeFilter = "All file types", tab = "Dashboard" } = params;

  if (!isGoogleDriveConfigured()) {
    // Return mock data for instant preview and demo mode
    let list = getMockFiles();

    // Tab filter
    if (tab === "Documents") {
      list = list.filter(
        (f) =>
          f.mimeType === "application/pdf" ||
          f.mimeType.includes("word") ||
          f.mimeType.includes("text") ||
          f.mimeType.includes("document")
      );
    } else if (tab === "Photos") {
      list = list.filter((f) => f.mimeType.startsWith("image/"));
    } else if (tab === "Favourites") {
      list = list.filter((f) => f.isFavorite);
    }

    // Type filter
    if (typeFilter === "PDF") {
      list = list.filter((f) => f.mimeType === "application/pdf");
    } else if (typeFilter === "Images") {
      list = list.filter((f) => f.mimeType.startsWith("image/"));
    } else if (typeFilter === "Word Documents") {
      list = list.filter(
        (f) =>
          f.mimeType.includes("word") ||
          f.mimeType.includes("officedocument") ||
          f.name.endsWith(".docx") ||
          f.name.endsWith(".doc")
      );
    } else if (typeFilter === "Other") {
      list = list.filter(
        (f) =>
          f.mimeType !== "application/pdf" &&
          !f.mimeType.startsWith("image/") &&
          !f.mimeType.includes("word")
      );
    }

    // Category filter
    if (category && category !== "All") {
      list = list.filter(
        (f) => f.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          f.tags.some((t) => t.toLowerCase().includes(q)) ||
          (f.description && f.description.toLowerCase().includes(q))
      );
    }

    const allMock = getMockFiles();
    const stats: PortalStats = {
      totalFiles: 128, // Matches the reference screenshot default stats
      documentsCount: 46,
      photosCount: 82,
      favoritesCount: allMock.filter((f) => f.isFavorite).length,
    };

    return { files: list, stats, isMock: true };
  }

  // Real Google Drive API call
  try {
    const drive = getDriveClient();
    const folderId = await getOrCreateVaultFolder(drive);

    let q = `'${folderId}' in parents and trashed = false`;

    const response = await drive.files.list({
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      q,
      fields:
        "files(id, name, originalFilename, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, thumbnailLink, appProperties, description)",
      orderBy: "modifiedTime desc",
      pageSize: 200,
    });

    const googleFiles = response.data.files || [];

    const mappedFiles: PortalFile[] = googleFiles.map((file) => {
      const appProps = file.appProperties || {};
      const sizeBytes = file.size ? parseInt(file.size, 10) : 0;
      const tags = appProps.tags ? appProps.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
      const cat = (appProps.category as FileCategory) || "Other";
      const origName = file.originalFilename || file.name || "Untitled File";
      const trueMime = detectMimeType(origName, file.mimeType || undefined);
      const cleanName = sanitizeAndFixFileName(
        appProps.displayName || file.name || origName,
        origName,
        trueMime
      );

      return {
        id: file.id || "",
        name: cleanName,
        originalName: origName,
        mimeType: trueMime,
        size: sizeBytes,
        formattedSize: formatFileSize(sizeBytes),
        category: cat,
        tags,
        description: appProps.description || file.description || "",
        isFavorite: appProps.isFavorite === "true",
        createdAt: file.createdTime || new Date().toISOString(),
        formattedDate: formatPortalDate(file.createdTime),
        driveViewLink: file.webViewLink || undefined,
        thumbnailLink: file.thumbnailLink || undefined,
        isMock: false,
      };
    });

    // Include any session-uploaded files from dev/local vault
    const userUploadedMocks = getMockFiles().filter((f) => f.id.startsWith("mock-") && !f.id.match(/^mock-[1-6]$/));
    const allCombined = [...userUploadedMocks, ...mappedFiles];

    // Compute live stats
    const totalFiles = allCombined.length;
    const documentsCount = allCombined.filter(
      (f) =>
        f.mimeType === "application/pdf" ||
        f.mimeType.includes("word") ||
        f.mimeType.includes("text") ||
        f.mimeType.includes("document")
    ).length;
    const photosCount = allCombined.filter((f) =>
      f.mimeType.startsWith("image/")
    ).length;
    const favoritesCount = allCombined.filter((f) => f.isFavorite).length;

    let filtered = allCombined;

    // Tab filter
    if (tab === "Documents") {
      filtered = filtered.filter(
        (f) =>
          f.mimeType === "application/pdf" ||
          f.mimeType.includes("word") ||
          f.mimeType.includes("text") ||
          f.mimeType.includes("document")
      );
    } else if (tab === "Photos") {
      filtered = filtered.filter((f) => f.mimeType.startsWith("image/"));
    } else if (tab === "Favourites") {
      filtered = filtered.filter((f) => f.isFavorite);
    }

    // Type filter
    if (typeFilter === "PDF") {
      filtered = filtered.filter((f) => f.mimeType === "application/pdf");
    } else if (typeFilter === "Images") {
      filtered = filtered.filter((f) => f.mimeType.startsWith("image/"));
    } else if (typeFilter === "Word Documents") {
      filtered = filtered.filter(
        (f) =>
          f.mimeType.includes("word") ||
          f.mimeType.includes("officedocument") ||
          f.name.endsWith(".docx") ||
          f.name.endsWith(".doc")
      );
    } else if (typeFilter === "Other") {
      filtered = filtered.filter(
        (f) =>
          f.mimeType !== "application/pdf" &&
          !f.mimeType.startsWith("image/") &&
          !f.mimeType.includes("word")
      );
    }

    // Category filter
    if (category && category !== "All") {
      filtered = filtered.filter(
        (f) => f.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Search filter
    if (search.trim()) {
      const query = search.toLowerCase().trim();
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(query) ||
          f.category.toLowerCase().includes(query) ||
          f.tags.some((t) => t.toLowerCase().includes(query)) ||
          (f.description && f.description.toLowerCase().includes(query))
      );
    }

    return {
      files: filtered,
      stats: {
        totalFiles,
        documentsCount,
        photosCount,
        favoritesCount,
      },
      isMock: false,
    };
  } catch (error: any) {
    console.error("Error listing files from Google Drive:", error);
    const isDriveDisabled =
      error?.message?.includes("Google Drive API has not been used") ||
      error?.message?.includes("accessNotConfigured") ||
      error?.status === 403 ||
      error?.code === 403;
    // Fall back to mock files if Drive error occurs so user can still see interface
    return {
      files: getMockFiles(),
      stats: {
        totalFiles: 128,
        documentsCount: 46,
        photosCount: 82,
        favoritesCount: 3,
      },
      isMock: true,
      driveApiDisabled: isDriveDisabled,
      driveErrorMessage: error?.message || "Google Drive API error",
    };
  }
}

export async function uploadToDrive(params: {
  buffer: Buffer;
  fileName: string;
  displayName: string;
  mimeType: string;
  category: FileCategory;
  tags: string[];
  description?: string;
}): Promise<PortalFile> {
  const trueMime = detectMimeType(params.fileName, params.mimeType);
  const cleanName = sanitizeAndFixFileName(
    params.displayName || params.fileName,
    params.fileName,
    trueMime
  );

  if (!isGoogleDriveConfigured()) {
    // Add to mock store
    const newFile: PortalFile = {
      id: `mock-${Date.now()}`,
      name: cleanName,
      originalName: params.fileName,
      mimeType: trueMime,
      size: params.buffer.length,
      formattedSize: formatFileSize(params.buffer.length),
      category: params.category,
      tags: params.tags,
      description: params.description || "",
      isFavorite: false,
      createdAt: new Date().toISOString(),
      formattedDate: formatPortalDate(new Date().toISOString()),
      isMock: true,
    };
    addMockFile(newFile);
    return newFile;
  }

  try {
    const drive = getDriveClient();
    const folderId = await getOrCreateVaultFolder(drive);

    const readable = new Readable();
    readable.push(params.buffer);
    readable.push(null);

    const response = await drive.files.create({
      supportsAllDrives: true,
      requestBody: {
        name: cleanName,
        originalFilename: params.fileName,
        parents: [folderId],
        description: params.description || "",
        appProperties: {
          displayName: cleanName,
          category: params.category,
          tags: params.tags.join(","),
          description: params.description || "",
          isFavorite: "false",
        },
      },
      media: {
        mimeType: trueMime,
        body: readable,
      },
      fields:
        "id, name, originalFilename, mimeType, size, createdTime, webViewLink, thumbnailLink, appProperties, description",
    });

    const file = response.data;
    const sizeBytes = file.size ? parseInt(file.size, 10) : params.buffer.length;

    return {
      id: file.id || "",
      name: file.name || cleanName,
      originalName: file.originalFilename || params.fileName,
      mimeType: file.mimeType || trueMime,
      size: sizeBytes,
      formattedSize: formatFileSize(sizeBytes),
      category: params.category,
      tags: params.tags,
      description: params.description || "",
      isFavorite: false,
      createdAt: file.createdTime || new Date().toISOString(),
      formattedDate: formatPortalDate(file.createdTime),
      driveViewLink: file.webViewLink || undefined,
      thumbnailLink: file.thumbnailLink || undefined,
      isMock: false,
    };
  } catch (driveErr: any) {
    // If Service Account encounters quota limit on personal Gmail, fall back to local vault buffer for dev/testing
    if (
      driveErr.message?.includes("storage quota") ||
      driveErr.message?.includes("Service Accounts do not have storage quota")
    ) {
      console.warn(
        "Google Service Account has 0 quota on personal Google Drive folder. Storing in local vault session."
      );
      const newFile: PortalFile = {
        id: `mock-${Date.now()}`,
        name: cleanName,
        originalName: params.fileName,
        mimeType: trueMime,
        size: params.buffer.length,
        formattedSize: formatFileSize(params.buffer.length),
        category: params.category,
        tags: params.tags,
        description: params.description || "",
        isFavorite: false,
        createdAt: new Date().toISOString(),
        formattedDate: formatPortalDate(new Date().toISOString()),
        isMock: true,
      };
      addMockFile(newFile);
      setMockFileBuffer(newFile.id, params.buffer);
      return newFile;
    }
    throw driveErr;
  }
}

export const SAFE_FILE_ID_REGEX = /^(mock-[a-zA-Z0-9_-]+|[a-zA-Z0-9_-]{10,100})$/;

export function isValidFileId(fileId: string): boolean {
  if (!fileId || typeof fileId !== "string") return false;
  return SAFE_FILE_ID_REGEX.test(fileId);
}

export async function getDriveFileMedia(fileId: string): Promise<{
  stream: Readable;
  mimeType: string;
  name: string;
  size?: number;
}> {
  if (!isValidFileId(fileId)) {
    throw new Error("Invalid file identifier format");
  }

  // Check if buffer is in local cache first
  const cachedBuffer = getMockFileBuffer(fileId);
  if (cachedBuffer) {
    const mockFiles = getMockFiles();
    const mock = mockFiles.find((f) => f.id === fileId);
    if (!mock) {
      throw new Error("File not found or access denied");
    }
    const origName = mock.originalName || mock.name || "downloaded-file";
    const mime = detectMimeType(origName, mock.mimeType);
    const cleanName = sanitizeAndFixFileName(mock.name || origName, origName, mime);
    return {
      stream: Readable.from(cachedBuffer),
      mimeType: mime,
      name: cleanName,
      size: cachedBuffer.length,
    };
  }

  if (fileId.startsWith("mock-") || !isGoogleDriveConfigured()) {
    const mockFiles = getMockFiles();
    const mock = mockFiles.find((f) => f.id === fileId);
    if (!mock) {
      throw new Error("File not found or access denied");
    }
    const mime = mock.mimeType || "application/octet-stream";
    const name = mock.name || "document.pdf";

    // Generate lightweight mock content
    let content: Buffer;
    if (mime === "application/pdf") {
      const minimalPdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 124 >>
stream
BT
/F1 24 Tf
100 700 Td
(MultiPortal Private Document Vault) Tj
0 -40 Td
/F1 14 Tf
(File: ${name}) Tj
0 -25 Td
(Category: ${mock.category || "Personal"}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000418 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
498
%%EOF`;
      content = Buffer.from(minimalPdf);
    } else if (mime.startsWith("image/")) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="50%" stop-color="#312e81"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g)" rx="16"/>
  <rect x="50" y="50" width="700" height="500" fill="#111827" fill-opacity="0.6" rx="12" stroke="#6366f1" stroke-width="2"/>
  <circle cx="400" cy="240" r="70" fill="#6366f1" fill-opacity="0.2" stroke="#818cf8" stroke-width="3"/>
  <path d="M370 240 L395 265 L445 215" stroke="#a5b4fc" stroke-width="5" fill="none" stroke-linecap="round"/>
  <text x="400" y="360" fill="#f8fafc" font-family="sans-serif" font-size="26" font-weight="bold" text-anchor="middle">${name}</text>
  <text x="400" y="400" fill="#94a3b8" font-family="sans-serif" font-size="16" text-anchor="middle">MultiPortal Private Document Vault — Verified Secure</text>
  <text x="400" y="440" fill="#6366f1" font-family="sans-serif" font-size="14" text-anchor="middle">Demo File Preview</text>
</svg>`;
      content = Buffer.from(svg);
      return {
        stream: Readable.from(content),
        mimeType: "image/svg+xml",
        name,
        size: content.length,
      };
    } else {
      content = Buffer.from(`Document Content for ${name}\nMultiPortal Document Vault`);
    }

    return {
      stream: Readable.from(content),
      mimeType: mime,
      name,
      size: content.length,
    };
  }

  const drive = getDriveClient();
  const folderId = await getOrCreateVaultFolder(drive);

  // Strict folder boundary containment verification:
  // Must be directly inside active vault folder and not trashed
  let fileMeta;
  try {
    fileMeta = await drive.files.get({
      fileId,
      fields: "id, name, originalFilename, mimeType, size, parents, trashed",
      supportsAllDrives: true,
    });
  } catch {
    throw new Error("File not found or access denied");
  }

  const isParentValid =
    folderId &&
    Array.isArray(fileMeta.data.parents) &&
    fileMeta.data.parents.includes(folderId);

  if (!isParentValid || fileMeta.data.trashed) {
    throw new Error("File not found or access denied");
  }

  const response = await drive.files.get(
    { fileId, alt: "media", supportsAllDrives: true },
    { responseType: "stream" }
  );

  const rawName = fileMeta.data.name || "downloaded-file";
  const origName = fileMeta.data.originalFilename || rawName;
  const mime = detectMimeType(origName, fileMeta.data.mimeType || undefined);
  const cleanName = sanitizeAndFixFileName(rawName, origName, mime);

  return {
    stream: response.data,
    mimeType: mime,
    name: cleanName,
    size: fileMeta.data.size ? parseInt(fileMeta.data.size, 10) : undefined,
  };
}

export async function updateDriveFileMetadata(
  fileId: string,
  updates: {
    displayName?: string;
    category?: FileCategory;
    tags?: string[];
    description?: string;
    isFavorite?: boolean;
  }
): Promise<PortalFile | null> {
  if (!isValidFileId(fileId)) {
    return null;
  }

  if (fileId.startsWith("mock-") || !isGoogleDriveConfigured()) {
    const patch: Partial<PortalFile> = {};
    if (updates.displayName) patch.name = updates.displayName;
    if (updates.category) patch.category = updates.category;
    if (updates.tags) patch.tags = updates.tags;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.isFavorite !== undefined) patch.isFavorite = updates.isFavorite;

    return updateMockFile(fileId, patch);
  }

  const drive = getDriveClient();
  const folderId = await getOrCreateVaultFolder(drive);

  let current;
  try {
    current = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, size, createdTime, appProperties, description, parents, trashed",
      supportsAllDrives: true,
    });
  } catch {
    return null;
  }

  const isParentValid =
    folderId &&
    Array.isArray(current.data.parents) &&
    current.data.parents.includes(folderId);

  if (!isParentValid || current.data.trashed) {
    return null;
  }

  const existingAppProps = current.data.appProperties || {};
  const newAppProps: Record<string, string> = { ...existingAppProps };

  if (updates.displayName) {
    newAppProps.displayName = updates.displayName;
  }
  if (updates.category) {
    newAppProps.category = updates.category;
  }
  if (updates.tags) {
    newAppProps.tags = updates.tags.join(",");
  }
  if (updates.description !== undefined) {
    newAppProps.description = updates.description;
  }
  if (updates.isFavorite !== undefined) {
    newAppProps.isFavorite = updates.isFavorite ? "true" : "false";
  }

  const response = await drive.files.update({
    fileId,
    supportsAllDrives: true,
    requestBody: {
      name: updates.displayName || current.data.name,
      description: updates.description ?? current.data.description,
      appProperties: newAppProps,
    },
    fields:
      "id, name, originalFilename, mimeType, size, createdTime, webViewLink, thumbnailLink, appProperties, description, parents",
  });

  const f = response.data;
  const sizeBytes = f.size ? parseInt(f.size, 10) : 0;
  const tags = f.appProperties?.tags ? f.appProperties.tags.split(",").map((t) => t.trim()) : [];

  return {
    id: f.id || fileId,
    name: f.appProperties?.displayName || f.name || "Untitled",
    originalName: f.originalFilename || f.name || "Untitled",
    mimeType: f.mimeType || "application/octet-stream",
    size: sizeBytes,
    formattedSize: formatFileSize(sizeBytes),
    category: (f.appProperties?.category as FileCategory) || "Other",
    tags,
    description: f.appProperties?.description || f.description || "",
    isFavorite: f.appProperties?.isFavorite === "true",
    createdAt: f.createdTime || new Date().toISOString(),
    formattedDate: formatPortalDate(f.createdTime),
    driveViewLink: f.webViewLink || undefined,
    thumbnailLink: f.thumbnailLink || undefined,
    isMock: false,
  };
}

export async function deleteDriveFile(fileId: string): Promise<boolean> {
  if (!isValidFileId(fileId)) {
    return false;
  }

  if (fileId.startsWith("mock-") || !isGoogleDriveConfigured()) {
    return deleteMockFile(fileId);
  }

  const drive = getDriveClient();
  const folderId = await getOrCreateVaultFolder(drive);

  try {
    const current = await drive.files.get({
      fileId,
      fields: "id, parents, trashed",
      supportsAllDrives: true,
    });

    const isParentValid =
      folderId &&
      Array.isArray(current.data.parents) &&
      current.data.parents.includes(folderId);

    if (!isParentValid || current.data.trashed) {
      return false;
    }

    await drive.files.update({
      fileId,
      supportsAllDrives: true,
      requestBody: { trashed: true },
    });
    return true;
  } catch (err: any) {
    console.error("deleteDriveFile error:", err);
    return false;
  }
}
