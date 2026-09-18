import { NextRequest, NextResponse } from "next/server";
import { updateDriveFileMetadata, deleteDriveFile, isValidFileId } from "@/lib/googleDrive";
import { getCurrentUser } from "@/lib/auth";

function sanitizeString(str: unknown, maxLen = 255): string {
  if (typeof str !== "string") return "";
  return str.replace(/[<>]/g, "").slice(0, maxLen).trim();
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileId = params.id;
    if (!isValidFileId(fileId)) {
      return NextResponse.json(
        { error: "Invalid file identifier format" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const sanitizedUpdates: {
      displayName?: string;
      category?: any;
      tags?: string[];
      description?: string;
      isFavorite?: boolean;
    } = {};

    if (body.displayName !== undefined) {
      sanitizedUpdates.displayName = sanitizeString(body.displayName, 255);
    }
    if (body.category !== undefined) {
      sanitizedUpdates.category = sanitizeString(body.category, 50);
    }
    if (Array.isArray(body.tags)) {
      sanitizedUpdates.tags = body.tags
        .slice(0, 20)
        .map((t: unknown) => sanitizeString(t, 50))
        .filter(Boolean);
    }
    if (body.description !== undefined) {
      sanitizedUpdates.description = sanitizeString(body.description, 2000);
    }
    if (body.isFavorite !== undefined) {
      sanitizedUpdates.isFavorite = Boolean(body.isFavorite);
    }

    const updated = await updateDriveFileMetadata(fileId, sanitizedUpdates);
    if (!updated) {
      return NextResponse.json(
        { error: "File not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, file: updated });
  } catch (error: any) {
    console.error("API /api/drive/files/[id] PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update file metadata" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fileId = params.id;
    if (!isValidFileId(fileId)) {
      return NextResponse.json(
        { error: "Invalid file identifier format" },
        { status: 400 }
      );
    }

    const success = await deleteDriveFile(fileId);

    if (!success) {
      return NextResponse.json(
        { error: "File not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API /api/drive/files/[id] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}
