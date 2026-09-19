import { NextRequest, NextResponse } from "next/server";
import { listPortalFiles } from "@/lib/googleDrive";
import { getCurrentUser } from "@/lib/auth";
import { FileTypeFilter } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "All";
    const typeFilter = (searchParams.get("typeFilter") as FileTypeFilter) || "All file types";
    const tab = searchParams.get("tab") || "Dashboard";

    const result = await listPortalFiles({
      search,
      category,
      typeFilter,
      tab,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API /api/drive/files error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list files" },
      { status: 500 }
    );
  }
}
