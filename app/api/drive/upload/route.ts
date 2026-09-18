import { NextRequest, NextResponse } from "next/server";
import { uploadToDrive } from "@/lib/googleDrive";
import { getCurrentUser } from "@/lib/auth";
import { FileCategory } from "@/lib/types";
import { detectMimeType, sanitizeAndFixFileName } from "@/lib/formatUtils";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const displayName = (formData.get("displayName") as string) || "";
    const category = ((formData.get("category") as string) || "Other") as FileCategory;
    const tagsString = (formData.get("tags") as string) || "";
    const description = (formData.get("description") as string) || "";

    if (!file) {
      return NextResponse.json(
        { error: "No file was provided in the upload request" },
        { status: 400 }
      );
    }

    const originalName = file.name;
    const detectedMimeType = detectMimeType(originalName, file.type);
    const cleanDisplayName = sanitizeAndFixFileName(
      displayName || originalName,
      originalName,
      detectedMimeType
    );

    const buffer = Buffer.from(await file.arrayBuffer());
    const tags = tagsString
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

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
