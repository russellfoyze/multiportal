/**
 * MultiPortal - File Format & MIME Utilities
 * Ensures robust file extensions, prevents corruption between PDF/images/docs/videos,
 * and generates standard RFC 6266 Content-Disposition headers for proper downloads.
 */

export const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "image/gif": ".gif",
  "image/bmp": ".bmp",
  "image/tiff": ".tiff",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
  "video/x-msvideo": ".avi",
  "video/x-matroska": ".mkv",
  "audio/mpeg": ".mp3",
  "audio/wav": ".wav",
  "audio/ogg": ".ogg",
  "audio/mp4": ".m4a",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "application/vnd.ms-powerpoint": ".ppt",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "application/json": ".json",
  "application/zip": ".zip",
  "application/x-zip-compressed": ".zip",
};

export const EXT_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".tiff": "image/tiff",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".ppt": "application/vnd.ms-powerpoint",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".json": "application/json",
  ".zip": "application/zip",
};

/**
 * Extracts file extension including leading dot (e.g. '.pdf', '.jpg')
 */
export function getFileExtension(filename: string): string {
  if (!filename) return "";
  const clean = filename.trim();
  const lastDot = clean.lastIndexOf(".");
  if (lastDot === -1 || lastDot === 0 || lastDot === clean.length - 1) return "";
  return clean.slice(lastDot).toLowerCase();
}

/**
 * Strips file extension from filename (e.g. 'doc.pdf' -> 'doc')
 */
export function stripFileExtension(filename: string): string {
  if (!filename) return "";
  const clean = filename.trim();
  const lastDot = clean.lastIndexOf(".");
  if (lastDot === -1 || lastDot === 0) return clean;
  return clean.slice(0, lastDot);
}

/**
 * Accurately determines MIME type from filename and fallback
 */
export function detectMimeType(filename: string, fallbackMime?: string): string {
  const ext = getFileExtension(filename);
  if (ext && EXT_TO_MIME[ext]) {
    return EXT_TO_MIME[ext];
  }
  if (
    fallbackMime &&
    fallbackMime !== "application/octet-stream" &&
    fallbackMime !== ""
  ) {
    return fallbackMime;
  }
  return "application/octet-stream";
}

/**
 * Sanitizes and guarantees that the filename has the correct extension matching its true format.
 * Fixes cases where:
 * - A PDF has no extension (e.g. 'ethis' -> 'ethis.pdf')
 * - A PDF was given an image extension (e.g. 'my_doc.jpeg' -> 'my_doc.pdf')
 * - A file was renamed without extension
 */
export function sanitizeAndFixFileName(
  name: string,
  originalName?: string,
  mimeType?: string
): string {
  let baseName = (name || "").trim();
  const orig = (originalName || "").trim();
  const origExt = getFileExtension(orig);
  const nameExt = getFileExtension(baseName);
  const mimeExt = mimeType ? MIME_TO_EXT[mimeType] : "";

  // If baseName is empty, fall back to originalName
  if (!baseName && orig) {
    baseName = orig;
  }
  if (!baseName) {
    return `document${mimeExt || ".pdf"}`;
  }

  // 1. If mimeType is application/pdf, extension MUST be .pdf
  if (mimeType === "application/pdf") {
    if (nameExt !== ".pdf") {
      // If baseName had a uuid or wrong extension, check if originalName had .pdf
      if (orig && origExt === ".pdf" && /^[0-9a-fA-F-]{20,}/.test(baseName)) {
        return orig;
      }
      const stripped = stripFileExtension(baseName);
      return `${stripped}.pdf`;
    }
    return baseName;
  }

  // 2. If mimeType is an image
  if (mimeType?.startsWith("image/")) {
    const validImageExts = [".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif", ".bmp"];
    if (!validImageExts.includes(nameExt)) {
      const stripped = stripFileExtension(baseName);
      return `${stripped}${mimeExt || origExt || ".jpg"}`;
    }
    return baseName;
  }

  // 3. If mimeType is Word document
  if (
    mimeType?.includes("word") ||
    mimeType?.includes("officedocument.wordprocessingml")
  ) {
    if (nameExt !== ".docx" && nameExt !== ".doc") {
      const stripped = stripFileExtension(baseName);
      return `${stripped}${origExt || ".docx"}`;
    }
    return baseName;
  }

  // 4. If mimeType is Video
  if (mimeType?.startsWith("video/")) {
    const validVideoExts = [".mov", ".mp4", ".webm", ".avi", ".mkv"];
    if (!validVideoExts.includes(nameExt)) {
      const stripped = stripFileExtension(baseName);
      return `${stripped}${mimeExt || origExt || ".mp4"}`;
    }
    return baseName;
  }

  // 5. If no extension was present on name:
  if (!nameExt) {
    const targetExt = origExt || mimeExt;
    if (targetExt) {
      return `${baseName}${targetExt}`;
    }
  }

  return baseName;
}

/**
 * Builds RFC 6266 / RFC 5987 Content-Disposition header with both ascii and UTF-8 safe filename
 */
export function buildContentDisposition(
  filename: string,
  disposition: "attachment" | "inline" = "attachment"
): string {
  // Clean ASCII version for older clients
  const asciiName = filename
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/["\\]/g, "_");
  // Encoded UTF-8 version for modern browsers
  const utf8Name = encodeURIComponent(filename);

  return `${disposition}; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`;
}
