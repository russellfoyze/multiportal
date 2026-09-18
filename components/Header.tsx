"use client";

import React, { useState, useRef, useEffect } from "react";
import { AuthUser } from "@/lib/types";
import { LogOut, ShieldCheck, HardDrive, User, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  user: AuthUser;
  isDriveConfigured?: boolean;
  onOpenDriveModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isDriveConfigured = false,
  onOpenDriveModal,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <header className="w-full border-b border-[#1e293b] bg-[#0b0f19]/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Brand Logo & Portal Name */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-bold text-sm tracking-wider">MAH</span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-white font-bold text-lg tracking-tight">
              MA HOSSAIN
            </span>
            <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              Vault
            </span>
          </div>
        </div>

        {/* Right: User Profile & Quick Actions */}
        <div className="flex items-center space-x-4" ref={menuRef}>
          {/* Drive Status Pill */}
          <button
            onClick={onOpenDriveModal}
            className={`hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              isDriveConfigured
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-950/60"
                : "bg-indigo-950/40 text-indigo-300 border-indigo-800/60 hover:bg-indigo-950/60"
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>{isDriveConfigured ? "Google Drive: Live" : "Google Drive: Demo Mode"}</span>
          </button>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center space-x-3 text-slate-200 hover:text-white transition-colors group p-1 rounded-lg hover:bg-slate-800/50"
            >
              <span className="text-sm font-medium text-slate-300 group-hover:text-white hidden sm:inline">
                {user.name}
              </span>
              <div className="w-9 h-9 rounded-full bg-[#162032] border border-[#283852] flex items-center justify-center text-xs font-semibold text-slate-200 group-hover:border-indigo-500 transition-colors">
                {user.avatarInitials}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-transform" />
            </button>

            {/* User Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#111726] border border-[#1e293b] shadow-2xl p-2 z-50 animate-modal">
                <div className="px-3 py-2 border-b border-[#1e293b]">
                  <p className="text-xs text-slate-400">Signed in as</p>
                  <p className="text-sm font-semibold text-white truncate">
                    {user.email}
                  </p>
                  <div className="mt-2 flex items-center space-x-1 text-emerald-400 text-xs font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>2FA Protected (TOTP)</span>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenDriveModal?.();
                    }}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-[#1a2335] rounded-lg transition-colors"
                  >
                    <HardDrive className="w-4 h-4 text-indigo-400" />
                    <span>Google Drive Settings</span>
                  </button>
                </div>

                <div className="border-t border-[#1e293b] pt-1 mt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out of Vault</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
