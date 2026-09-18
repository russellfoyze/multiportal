"use client";

import React, { useState, useEffect } from "react";
import { Search, Upload, ChevronDown, X } from "lucide-react";
import { FileTypeFilter, FileCategory, DEFAULT_CATEGORIES } from "@/lib/types";

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedType: FileTypeFilter;
  onTypeChange: (type: FileTypeFilter) => void;
  selectedCategory: FileCategory;
  onCategoryChange: (cat: FileCategory) => void;
  onOpenUpload: () => void;
  availableCategories?: string[];
}

const FILE_TYPES: FileTypeFilter[] = [
  "All file types",
  "PDF",
  "Images",
  "Word Documents",
  "Videos",
  "Other",
];

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedCategory,
  onCategoryChange,
  onOpenUpload,
  availableCategories,
}) => {
  const [categories, setCategories] = useState<string[]>(
    availableCategories || ["All", ...DEFAULT_CATEGORIES]
  );

  useEffect(() => {
    if (availableCategories && availableCategories.length > 0) {
      setCategories(
        availableCategories.includes("All")
          ? availableCategories
          : ["All", ...availableCategories]
      );
    } else {
      fetch("/api/drive/categories")
        .then((res) => res.json())
        .then((data) => {
          if (data.categories) {
            setCategories(["All", ...data.categories]);
          }
        })
        .catch(() => setCategories(["All", ...DEFAULT_CATEGORIES]));
    }
  }, [availableCategories]);

  return (
    <div className="space-y-3 mb-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Bar with Focus Accent */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search passport, visa, CV, ethics, documents..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#111726] border border-[#233045] text-white placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* File Type Dropdown */}
        <div className="relative min-w-[170px]">
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value as FileTypeFilter)}
            className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl bg-[#111726] border border-[#233045] text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-all"
          >
            {FILE_TYPES.map((type) => (
              <option key={type} value={type} className="bg-[#111726] text-white">
                {type}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Upload className="w-4 h-4 stroke-[2.5]" />
          <span>Upload</span>
        </button>
      </div>

      {/* Dynamic Horizontal Category Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-slate-400 text-[11px] font-medium mr-1 uppercase tracking-wider">
          Category:
        </span>
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                isSelected
                  ? "bg-indigo-600/25 text-indigo-300 border border-indigo-500/50 shadow-sm"
                  : "bg-[#111726]/70 text-slate-400 hover:text-slate-200 hover:bg-[#182338] border border-transparent"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
};
