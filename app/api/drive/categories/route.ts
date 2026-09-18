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
    return NextResponse.json({ error: "Failed to list categories" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const rawCategory = typeof body.category === "string" ? body.category.trim() : "";

    // Sanitize and validate category string
    const cleanCategory = rawCategory.replace(/[<>]/g, "").slice(0, 40).trim();

    if (!cleanCategory) {
      return NextResponse.json(
        { error: "Valid category name is required" },
        { status: 400 }
      );
    }

    // Verify format (alphanumeric, spaces, basic punctuation)
    if (!/^[a-zA-Z0-9\s&/_.-]{1,40}$/.test(cleanCategory)) {
      return NextResponse.json(
        { error: "Category name contains invalid characters" },
        { status: 400 }
      );
    }

    if (!globalThis.__portalCustomCategories) {
      globalThis.__portalCustomCategories = new Set<string>();
    }

    // Limit maximum number of custom categories to prevent memory exhaustion
    if (globalThis.__portalCustomCategories.size >= 100) {
      return NextResponse.json(
        { error: "Maximum custom categories limit reached (100)" },
        { status: 400 }
      );
    }

    globalThis.__portalCustomCategories.add(cleanCategory);

    const categoriesSet = new Set<string>(DEFAULT_CATEGORIES);
    globalThis.__portalCustomCategories.forEach((cat) => categoriesSet.add(cat));

    return NextResponse.json({
      success: true,
      category: cleanCategory,
      categories: Array.from(categoriesSet),
    });
  } catch (error: any) {
    console.error("POST /api/drive/categories error:", error);
    return NextResponse.json({ error: "Failed to save category" }, { status: 500 });
  }
}
