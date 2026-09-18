import { NextRequest, NextResponse } from "next/server";
import { updateDriveFileMetadata, deleteDriveFile } from "@/lib/googleDrive";
import { getCurrentUser } from "@/lib/auth";

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
    const body = await request.json();

    const updated = await updateDriveFileMetadata(fileId, body);
    if (!updated) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, file: updated });
  } catch (error: any) {
    console.error("API /api/drive/files/[id] PATCH error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update file metadata" },
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
    const success = await deleteDriveFile(fileId);

    if (!success) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API /api/drive/files/[id] DELETE error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete file" },
      { status: 500 }
    );
  }
}
