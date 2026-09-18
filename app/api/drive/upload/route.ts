import { NextRequest, NextResponse } from "next/server";
import { uploadToDrive } from "@/lib/googleDrive";
import { getCurrentUser } from "@/lib/auth";
import { FileCategory } from "@/lib/types";
import { detectMimeType, sanitizeAndFixFileName, getFileExtension } from "@/lib/formatUtils";
import { checkRateLimit } from "@/lib/rateLimit";

const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB hard limit

// Strict blacklist of executable and active script extensions
const BLOCKED_EXTENSIONS = new Set([
  ".exe", ".bat", ".cmd", ".sh", ".bash", ".ps1", ".vbs", ".js", ".mjs", ".cjs",
  ".php", ".phtml", ".py", ".rb", ".pl", ".com", ".scr", ".msi", ".dll", ".jar",
  ".html", ".htm", ".xhtml", ".jsp", ".asp", ".aspx", ".cgi", ".wsf", ".hta"
]);

function sanitizeInput(str: unknown, maxLen = 255): string {
  if (typeof str !== "string") return "";
  return str.replace(/[<>]/g, "").slice(0, maxLen).trim();
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting: max 30 uploads per minute per user/IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
    const rateCheck = checkRateLimit(`upload_${user.id}_${ip}`, {
      limit: 30,
      windowMs: 60 * 1000,
    });

    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Upload rate limit exceeded. Please wait before uploading more files." },
        {
          status: 429,
          headers: { "Retry-After": rateCheck.retryAfterSeconds.toString() },
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const rawDisplayName = (formData.get("displayName") as string) || "";
    const rawCategory = (formData.get("category") as string) || "Other";
    const rawTags = (formData.get("tags") as string) || "";
    const rawDescription = (formData.get("description") as string) || "";

    if (!file) {
      return NextResponse.json(
        { error: "No file was provided in the upload request" },
        { status: 400 }
      );
    }

    // File size check: reject if empty or exceeds maximum payload limit
    if (file.size === 0) {
      return NextResponse.json(
        { error: "Cannot upload empty (0 byte) files" },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds the maximum permitted size limit of 50 MB" },
        { status: 413 }
      );
    }

    const originalName = file.name.replace(/[\0\r\n/\\]/g, "_").trim();
    const fileExt = getFileExtension(originalName);

    if (BLOCKED_EXTENSIONS.has(fileExt.toLowerCase())) {
      return NextResponse.json(
        { error: `Uploading files with extension '${fileExt}' is prohibited for security.` },
        { status: 400 }
      );
    }

    const detectedMimeType = detectMimeType(originalName, file.type);

    // Reject HTML/Executable MIME types
    if (
      detectedMimeType === "text/html" ||
      detectedMimeType === "application/x-msdownload" ||
      detectedMimeType === "application/x-sh" ||
      detectedMimeType === "application/javascript"
    ) {
      return NextResponse.json(
        { error: "File type is not permitted for upload in the private vault." },
        { status: 400 }
      );
    }

    const cleanDisplayName = sanitizeAndFixFileName(
      sanitizeInput(rawDisplayName, 200) || originalName,
      originalName,
      detectedMimeType
    );

    const buffer = Buffer.from(await file.arrayBuffer());

    const tags = rawTags
      .split(",")
      .slice(0, 15)
      .map((t) => sanitizeInput(t, 40))
      .filter(Boolean);

    const category = (sanitizeInput(rawCategory, 50) || "Other") as FileCategory;
    const description = sanitizeInput(rawDescription, 2000);

    const uploadedFile = await uploadToDrive({
      buffer,
      fileName: originalName,
      displayName: cleanDisplayName,
      mimeType: detectedMimeType,
      category,
      tags,
      description,
    });

    return NextResponse.json({ success: true, file: uploadedFile });
  } catch (error: any) {
    console.error("API /api/drive/upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file to Google Drive" },
      { status: 500 }
    );
  }
}
