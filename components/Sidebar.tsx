"use client";

import React from "react";
import {
  LayoutDashboard,
  Files,
  FileText,
  Image as ImageIcon,
  Star,
  HardDrive,
  Shield,
} from "lucide-react";

export type TabType = "Dashboard" | "All files" | "Documents" | "Photos" | "Favourites";

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  favoritesCount: number;
  documentsCount: number;
  photosCount: number;
  totalFiles: number;
  onOpenDriveModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  favoritesCount,
  documentsCount,
  photosCount,
  totalFiles,
  onOpenDriveModal,
}) => {
  const navItems = [
    {
      id: "Dashboard" as TabType,
      label: "Dashboard",
      icon: LayoutDashboard,
      count: null,
    },
    {
      id: "All files" as TabType,
      label: "All files",
      icon: Files,
      count: totalFiles,
    },
    {
      id: "Documents" as TabType,
      label: "Documents",
      icon: FileText,
      count: documentsCount,
    },
    {
      id: "Photos" as TabType,
      label: "Photos",
      icon: ImageIcon,
      count: photosCount,
    },
    {
      id: "Favourites" as TabType,
      label: "Favourites",
      icon: Star,
      count: favoritesCount > 0 ? favoritesCount : null,
    },
  ];

  return (
    <>
      {/* Mobile Top Horizontal Navigation (< md screens) */}
      <div className="md:hidden w-full overflow-x-auto pb-2 scrollbar-none flex items-center gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                isActive
                  ? "bg-[#182338] text-white border border-[#283750] shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#131b2c]/60 bg-[#111726]/60 border border-transparent"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
              <span>{item.label}</span>
              {item.count !== null && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-[#253755] text-indigo-200" : "bg-[#162033] text-slate-400"}`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Desktop Vertical Sidebar (md+ screens) */}
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col justify-between p-4 bg-transparent min-h-[calc(100vh-73px)]">
        {/* Navigation List */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#182338] text-white border border-[#283750] shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#131b2c]/60"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-indigo-400" : "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.count !== null && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive
                        ? "bg-[#253755] text-indigo-200"
                        : "bg-[#162033] text-slate-400"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Vault Status & Storage Card */}
        <div className="mt-8 space-y-3 pt-6 border-t border-[#1e293b]">
          <div className="p-3.5 rounded-xl bg-[#111726] border border-[#1e293b]">
            <div className="flex items-center space-x-2 text-indigo-400 mb-1.5">
              <Shield className="w-4 h-4" />
              <span className="text-xs font-semibold text-slate-200">
                Private Security
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Encrypted storage stream with Google Drive API and 2FA protection.
            </p>
            <button
              onClick={onOpenDriveModal}
              className="mt-3 w-full flex items-center justify-center space-x-1.5 py-1.5 px-2.5 rounded-lg bg-[#1a2335] hover:bg-[#223048] border border-[#283750] text-xs font-medium text-slate-300 transition-colors"
            >
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
              <span>Drive Configuration</span>
            </button>
          </div>

          <div className="flex items-center justify-between px-2 text-[11px] text-slate-400">
            <span>MultiPortal v1.0</span>
            <span className="text-indigo-400">Vercel Ready</span>
          </div>
        </div>
      </aside>
    </>
  );
};
