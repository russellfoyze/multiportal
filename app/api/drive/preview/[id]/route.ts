import { NextRequest, NextResponse } from "next/server";
import { getDriveFileMedia } from "@/lib/googleDrive";
import { getCurrentUser } from "@/lib/auth";
import { Readable } from "stream";
import {
  sanitizeAndFixFileName,
  detectMimeType,
  buildContentDisposition,
} from "@/lib/formatUtils";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const fileId = params.id;
    if (!fileId) {
      return new NextResponse("File ID is required", { status: 400 });
    }

    const { stream, mimeType, name, size } = await getDriveFileMedia(fileId);

    const cleanFileName = sanitizeAndFixFileName(name, undefined, mimeType);
    const effectiveMime = detectMimeType(cleanFileName, mimeType);

    // Convert Node Readable to Web ReadableStream for Next.js Response
    const webStream = Readable.toWeb(stream);

    const headers = new Headers();
    headers.set("Content-Type", effectiveMime);
    headers.set(
      "Content-Disposition",
      buildContentDisposition(cleanFileName, "inline")
    );
    headers.set("Cache-Control", "private, max-age=3600");
    headers.set("X-Content-Type-Options", "nosniff");
    if (size) {
      headers.set("Content-Length", size.toString());
    }

    return new Response(webStream as any, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("API /api/drive/preview error:", error);
    return new NextResponse(error.message || "Failed to preview file", {
      status: 500,
    });
  }
}
