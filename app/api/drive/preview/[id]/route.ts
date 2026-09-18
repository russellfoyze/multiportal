import { NextRequest, NextResponse } from "next/server";
import { getDriveFileMedia, isValidFileId } from "@/lib/googleDrive";
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
    if (!isValidFileId(fileId)) {
      return new NextResponse("Invalid file identifier format", { status: 400 });
    }

    const { stream, mimeType, name, size } = await getDriveFileMedia(fileId);

    const cleanFileName = sanitizeAndFixFileName(name, undefined, mimeType);
    let effectiveMime = detectMimeType(cleanFileName, mimeType);

    // Prevent Stored XSS: Never serve executable or HTML types inline
    let disposition: "inline" | "attachment" = "inline";
    if (
      effectiveMime === "text/html" ||
      effectiveMime.includes("javascript") ||
      effectiveMime.includes("script")
    ) {
      effectiveMime = "text/plain";
      disposition = "attachment";
    }

    // Convert Node Readable to Web ReadableStream for Next.js Response
    const webStream = Readable.toWeb(stream);

    const headers = new Headers();
    headers.set("Content-Type", effectiveMime);
    headers.set(
      "Content-Disposition",
      buildContentDisposition(cleanFileName, disposition)
    );
    headers.set("Cache-Control", "private, max-age=3600");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "SAMEORIGIN");

    // Strict CSP sandbox for SVG preview rendering
    if (effectiveMime === "image/svg+xml") {
      headers.set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'");
    }

    if (size) {
      headers.set("Content-Length", size.toString());
    }

    return new Response(webStream as any, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    const msg = error?.message || "Failed to preview file";
    if (msg.includes("not found") || msg.includes("access denied")) {
      return new NextResponse("File not found or access denied", { status: 404 });
    }
    if (msg.includes("Invalid file identifier")) {
      return new NextResponse("Invalid file identifier", { status: 400 });
    }
    console.error("API /api/drive/preview error:", error);
    return new NextResponse("An error occurred while preparing the preview", {
      status: 500,
    });
  }
}
