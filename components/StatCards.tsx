"use client";

import React from "react";
import { PortalStats } from "@/lib/types";

interface StatCardsProps {
  stats: PortalStats;
  onFilterChange?: (tab: "All files" | "Documents" | "Photos") => void;
}

export const StatCards: React.FC<StatCardsProps> = ({ stats, onFilterChange }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {/* Total files Card */}
      <div
        onClick={() => onFilterChange?.("All files")}
        className="p-6 rounded-2xl bg-[#111726] border border-[#1e293b] hover:border-[#2b3c56] transition-all cursor-pointer group shadow-sm"
      >
        <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors">
          {stats.totalFiles}
        </div>
        <div className="text-sm font-medium text-slate-400 mt-2">
          Total files
        </div>
      </div>

      {/* Documents Card */}
      <div
        onClick={() => onFilterChange?.("Documents")}
        className="p-6 rounded-2xl bg-[#111726] border border-[#1e293b] hover:border-[#2b3c56] transition-all cursor-pointer group shadow-sm"
      >
        <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors">
          {stats.documentsCount}
        </div>
        <div className="text-sm font-medium text-slate-400 mt-2">
          Documents
        </div>
      </div>

      {/* Photos Card */}
      <div
        onClick={() => onFilterChange?.("Photos")}
        className="p-6 rounded-2xl bg-[#111726] border border-[#1e293b] hover:border-[#2b3c56] transition-all cursor-pointer group shadow-sm"
      >
        <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight group-hover:text-indigo-400 transition-colors">
          {stats.photosCount}
        </div>
        <div className="text-sm font-medium text-slate-400 mt-2">
          Photos
        </div>
      </div>
    </div>
  );
};
