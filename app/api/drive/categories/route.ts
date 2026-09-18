import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { DEFAULT_CATEGORIES } from "@/lib/types";
import { getMockFiles } from "@/lib/mockData";

// Global in-memory set of custom categories across requests
declare global {
  var __portalCustomCategories: Set<string> | undefined;
}

if (!globalThis.__portalCustomCategories) {
  globalThis.__portalCustomCategories = new Set<string>();
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categoriesSet = new Set<string>(DEFAULT_CATEGORIES);

    // Add any categories from custom set
    if (globalThis.__portalCustomCategories) {
      globalThis.__portalCustomCategories.forEach((cat) => categoriesSet.add(cat));
    }

    // Add any categories already present on files
    const files = getMockFiles();
    files.forEach((f) => {
      if (f.category && f.category !== "All") {
        categoriesSet.add(f.category);
      }
    });

    return NextResponse.json({
      categories: Array.from(categoriesSet),
    });
  } catch (error: any) {
    console.error("GET /api/drive/categories error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const newCategory = (body.category || "").trim();

    if (!newCategory) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    if (!globalThis.__portalCustomCategories) {
      globalThis.__portalCustomCategories = new Set<string>();
    }

    globalThis.__portalCustomCategories.add(newCategory);

    const categoriesSet = new Set<string>(DEFAULT_CATEGORIES);
    globalThis.__portalCustomCategories.forEach((cat) => categoriesSet.add(cat));

    return NextResponse.json({
      success: true,
      category: newCategory,
      categories: Array.from(categoriesSet),
    });
  } catch (error: any) {
    console.error("POST /api/drive/categories error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
