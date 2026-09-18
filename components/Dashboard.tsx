"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AuthUser,
  PortalFile,
  PortalStats,
  FileCategory,
  FileTypeFilter,
  DriveConfigStatus,
  DEFAULT_CATEGORIES,
} from "@/lib/types";
import { Header } from "./Header";
import { Sidebar, TabType } from "./Sidebar";
import { StatCards } from "./StatCards";
import { SearchFilterBar } from "./SearchFilterBar";
import { FileList } from "./FileList";
import { FilePreviewModal } from "./FilePreviewModal";
import { UploadModal } from "./UploadModal";
import { EditFileModal } from "./EditFileModal";
import { DriveConfigModal } from "./DriveConfigModal";

interface DashboardProps {
  initialUser: AuthUser;
}

export const Dashboard: React.FC<DashboardProps> = ({ initialUser }) => {
  const [files, setFiles] = useState<PortalFile[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [stats, setStats] = useState<PortalStats>({
    totalFiles: 128,
    documentsCount: 46,
    photosCount: 82,
    favoritesCount: 3,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Filters and navigation
  const [activeTab, setActiveTab] = useState<TabType>("Dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<FileTypeFilter>("All file types");
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>("All");

  // Modals state
  const [previewFile, setPreviewFile] = useState<PortalFile | null>(null);
  const [editingFile, setEditingFile] = useState<PortalFile | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDriveConfigOpen, setIsDriveConfigOpen] = useState(false);
  const [driveStatus, setDriveStatus] = useState<DriveConfigStatus | null>(null);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/drive/categories");
      if (res.ok) {
        const data = await res.json();
        if (data.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }, []);

  // Fetch drive status once
  useEffect(() => {
    fetch("/api/drive/status")
      .then((res) => res.json())
      .then((data) => setDriveStatus(data))
      .catch((err) => console.error("Failed to load drive status:", err));

    fetchCategories();
  }, [fetchCategories]);

  // Fetch files function
  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedCategory && selectedCategory !== "All") params.set("category", selectedCategory);
      if (selectedType && selectedType !== "All file types") params.set("typeFilter", selectedType);
      if (activeTab && activeTab !== "Dashboard") params.set("tab", activeTab);

      const res = await fetch(`/api/drive/files?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedType, activeTab]);

  // Debounced search / filter trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFiles();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchFiles]);

  // Actions
  const handleToggleFavorite = async (file: PortalFile) => {
    const newStatus = !file.isFavorite;
    // Optimistic update
    setFiles((prev) =>
      prev.map((f) => (f.id === file.id ? { ...f, isFavorite: newStatus } : f))
    );

    try {
      await fetch(`/api/drive/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: newStatus }),
      });
      fetchFiles();
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      fetchFiles();
    }
  };

  const handleDelete = async (file: PortalFile) => {
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return;

    try {
      const res = await fetch(`/api/drive/files/${file.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== file.id));
        fetchFiles();
      }
    } catch (err) {
      console.error("Failed to delete file:", err);
    }
  };

  const handleUploadSuccess = (newFile: PortalFile) => {
    setFiles((prev) => [newFile, ...prev]);
    fetchFiles();
    fetchCategories();
  };

  const handleUpdateSuccess = (updatedFile: PortalFile) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === updatedFile.id ? updatedFile : f))
    );
    fetchFiles();
    fetchCategories();
  };

  const handleCategoryAdded = (newCat: string) => {
    setCategories((prev) => (prev.includes(newCat) ? prev : [...prev, newCat]));
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        user={initialUser}
        isDriveConfigured={driveStatus?.isConfigured}
        onOpenDriveModal={() => setIsDriveConfigOpen(true)}
      />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col md:flex-row px-4 sm:px-6 py-6 gap-8">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          favoritesCount={stats.favoritesCount}
          documentsCount={stats.documentsCount}
          photosCount={stats.photosCount}
          totalFiles={stats.totalFiles}
          onOpenDriveModal={() => setIsDriveConfigOpen(true)}
        />

        {/* Right Main Portal Content */}
        <main className="flex-1 min-w-0">
          {/* Header Title & Subtitle */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Document Portal
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Search, preview and download your private files.
            </p>
          </div>

          {/* Search, Filter Dropdown & Upload Action */}
          <SearchFilterBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onOpenUpload={() => setIsUploadOpen(true)}
            availableCategories={categories}
          />

          {/* Statistics Metrics Cards */}
          <StatCards
            stats={stats}
            onFilterChange={(tab) => setActiveTab(tab)}
          />

          {/* Files List with Explorer Preview, Stack & List Views */}
          <FileList
            files={files}
            isLoading={isLoading}
            onPreview={setPreviewFile}
            onEdit={setEditingFile}
            onDelete={handleDelete}
            onToggleFavorite={handleToggleFavorite}
          />
        </main>
      </div>

      {/* Modals */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        availableCategories={categories}
        onCategoryAdded={handleCategoryAdded}
      />

      <EditFileModal
        file={editingFile}
        isOpen={Boolean(editingFile)}
        onClose={() => setEditingFile(null)}
        onUpdateSuccess={handleUpdateSuccess}
        availableCategories={categories}
        onCategoryAdded={handleCategoryAdded}
      />

      <DriveConfigModal
        isOpen={isDriveConfigOpen}
        onClose={() => setIsDriveConfigOpen(false)}
        status={driveStatus}
      />
    </div>
  );
};
