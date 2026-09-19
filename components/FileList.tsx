"use client";

import React, { useState, useMemo } from "react";
import { PortalFile } from "@/lib/types";
import {
  FileText,
  FileCode,
  Image as ImageIcon,
  Video,
  Eye,
  Download,
  Star,
  MoreVertical,
  Trash2,
  Edit2,
  ExternalLink,
  List,
  LayoutGrid,
  ChevronDown,
  Play,
  File,
} from "lucide-react";
import clsx from "clsx";
import { sanitizeAndFixFileName } from "@/lib/formatUtils";

interface FileListProps {
  files: PortalFile[];
  onPreview: (file: PortalFile) => void;
  onEdit: (file: PortalFile) => void;
  onDelete: (file: PortalFile) => void;
  onToggleFavorite: (file: PortalFile) => void;
  isLoading?: boolean;
}

interface TypeSection {
  key: string;
  title: string;
  icon: any;
  color: string;
  files: PortalFile[];
}

export const FileList: React.FC<FileListProps> = ({
  files,
  onPreview,
  onEdit,
  onDelete,
  onToggleFavorite,
  isLoading = false,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  // View mode: 'explorer' (Windows style with live previews) or 'list' (clean rows)
  const [viewMode, setViewMode] = useState<"explorer" | "list">("explorer");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const handleDownload = (file: PortalFile) => {
    const safeName = sanitizeAndFixFileName(file.name, file.originalName, file.mimeType);
    const link = document.createElement("a");
    link.href = `/api/drive/download/${file.id}`;
    link.download = safeName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileBadge = (file: PortalFile) => {
    const lower = file.name.toLowerCase();
    const isPdf = file.mimeType === "application/pdf" || lower.endsWith(".pdf");
    const isImage =
      !isPdf &&
      (file.mimeType.startsWith("image/") ||
        /\.(jpg|jpeg|png|webp|svg|gif|bmp)$/i.test(lower));
    const isWord =
      !isPdf &&
      (file.mimeType.includes("word") ||
        file.mimeType.includes("officedocument") ||
        /\.(docx|doc|rtf|txt)$/i.test(lower));
    const isVideo =
      !isPdf &&
      (file.mimeType.startsWith("video/") ||
        /\.(mov|mp4|avi|mkv|webm|m4v)$/i.test(lower));

    if (isPdf) {
      return {
        bg: "bg-[#2b151b] border-[#441a24] text-red-400",
        icon: FileText,
        typeLabel: "PDF",
      };
    }
    if (isImage) {
      return {
        bg: "bg-[#0c2236] border-[#143758] text-cyan-400",
        icon: ImageIcon,
        typeLabel: "JPG",
      };
    }
    if (isWord) {
      return {
        bg: "bg-[#0e1d32] border-[#162e52] text-blue-400",
        icon: FileCode,
        typeLabel: "Word",
      };
    }
    if (isVideo) {
      return {
        bg: "bg-[#221634] border-[#371f54] text-purple-400",
        icon: Video,
        typeLabel: "Video",
      };
    }
    return {
      bg: "bg-[#1f1a30] border-[#31254a] text-purple-400",
      icon: File,
      typeLabel: "File",
    };
  };

  // Group files by type (Windows File Explorer style: JPG File, PDF Document, DOCX File, Videos, Other)
  const typeSections: TypeSection[] = useMemo(() => {
    const imageFiles: PortalFile[] = [];
    const pdfFiles: PortalFile[] = [];
    const wordFiles: PortalFile[] = [];
    const videoFiles: PortalFile[] = [];
    const otherFiles: PortalFile[] = [];

    for (const f of files) {
      const lower = f.name.toLowerCase();
      if (f.mimeType === "application/pdf" || lower.endsWith(".pdf")) {
        pdfFiles.push(f);
      } else if (
        f.mimeType.startsWith("image/") ||
        /\.(jpg|jpeg|png|webp|svg|gif|bmp)$/i.test(lower)
      ) {
        imageFiles.push(f);
      } else if (
        f.mimeType.includes("word") ||
        f.mimeType.includes("officedocument") ||
        /\.(docx|doc|rtf|txt)$/i.test(lower)
      ) {
        wordFiles.push(f);
      } else if (
        f.mimeType.startsWith("video/") ||
        /\.(mov|mp4|avi|mkv|webm|m4v)$/i.test(lower)
      ) {
        videoFiles.push(f);
      } else {
        otherFiles.push(f);
      }
    }

    const sections: TypeSection[] = [];
    if (imageFiles.length > 0) {
      sections.push({
        key: "images",
        title: "JPG & Image Files",
        icon: ImageIcon,
        color: "text-cyan-400",
        files: imageFiles,
      });
    }
    if (pdfFiles.length > 0) {
      sections.push({
        key: "pdf",
        title: "PDF Documents",
        icon: FileText,
        color: "text-red-400",
        files: pdfFiles,
      });
    }
    if (wordFiles.length > 0) {
      sections.push({
        key: "docx",
        title: "Word Documents",
        icon: FileCode,
        color: "text-blue-400",
        files: wordFiles,
      });
    }
    if (videoFiles.length > 0) {
      sections.push({
        key: "videos",
        title: "Videos",
        icon: Video,
        color: "text-purple-400",
        files: videoFiles,
      });
    }
    if (otherFiles.length > 0) {
      sections.push({
        key: "other",
        title: "Other Files",
        icon: File,
        color: "text-slate-400",
        files: otherFiles,
      });
    }

    return sections;
  }, [files]);

  return (
    <div className="space-y-4">
      {/* Section Header with View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white tracking-tight">Your files</h2>
          <span className="text-xs font-medium text-slate-400 bg-[#162032] border border-[#233148] px-2.5 py-0.5 rounded-full">
            {isLoading ? "Searching..." : `${files.length} results`}
          </span>
        </div>

        {/* View Mode Switcher: Explorer Grid Preview | List View */}
        <div className="flex items-center gap-1 bg-[#111726] p-1 rounded-xl border border-[#1e293b] self-start sm:self-auto shadow-sm">
          {/* Explorer / Grid Preview Mode (Windows Explorer Style with Thumbnails) */}
          <button
            onClick={() => setViewMode("explorer")}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
              viewMode === "explorer"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            )}
            title="Windows Explorer style grouped by file type with live thumbnails & previews"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Explorer Grid</span>
          </button>

          {/* List View */}
          <button
            onClick={() => setViewMode("list")}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
              viewMode === "list"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            )}
            title="Horizontal list cards"
          >
            <List className="w-3.5 h-3.5" />
            <span>List View</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="rounded-2xl border border-[#1e293b] bg-[#111726]/70 backdrop-blur-sm p-16 text-center text-slate-400 space-y-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium">Fetching files from Google Drive...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-2xl border border-[#1e293b] bg-[#111726]/70 backdrop-blur-sm p-16 text-center text-slate-400 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#162032] border border-[#233148] flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-300">No documents found</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search terms or filter criteria, or upload a new private document.
          </p>
        </div>
      ) : viewMode === "explorer" ? (
        /* ========================================================================= */
        /* MODE 1: EXPLORER VIEW (Windows File Explorer with Live Image Previews)     */
        /* ========================================================================= */
        <div className="space-y-6 pb-6">
          {typeSections.map((sec) => {
            const isCollapsed = !!collapsedSections[sec.key];
            const SecIcon = sec.icon;

            return (
              <div key={sec.key} className="space-y-3">
                {/* Windows Explorer Style Collapsible Header with Horizontal Divider Line */}
                <div
                  onClick={() => toggleSection(sec.key)}
                  className="flex items-center space-x-2 py-1 cursor-pointer select-none group/hdr"
                >
                  <button
                    type="button"
                    className="p-0.5 text-slate-400 group-hover/hdr:text-white transition-colors"
                  >
                    <ChevronDown
                      className={clsx(
                        "w-4 h-4 transition-transform duration-200",
                        isCollapsed && "-rotate-90"
                      )}
                    />
                  </button>

                  <div className="flex items-center space-x-2">
                    <SecIcon className={`w-4 h-4 ${sec.color}`} />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 group-hover/hdr:text-white transition-colors">
                      {sec.title}
                    </h3>
                    <span className="text-xs text-slate-500 font-medium">
                      ({sec.files.length})
                    </span>
                  </div>

                  {/* Horizontal dividing line spanning across like Windows Explorer */}
                  <div className="flex-1 border-t border-[#1e293b] ml-3" />
                </div>

                {/* Collapsible Grid of Items with Live Previews */}
                {!isCollapsed && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 pt-1">
                    {sec.files.map((file) => {
                      const isImage =
                        file.mimeType.startsWith("image/") ||
                        /\.(jpg|jpeg|png|webp|svg|gif|bmp)$/i.test(file.name);
                      const isPdf =
                        file.mimeType === "application/pdf" ||
                        file.name.toLowerCase().endsWith(".pdf");
                      const isWord =
                        file.mimeType.includes("word") ||
                        file.mimeType.includes("officedocument") ||
                        /\.(docx|doc)$/i.test(file.name);
                      const isVideo =
                        file.mimeType.startsWith("video/") ||
                        /\.(mov|mp4|avi|mkv|webm)$/i.test(file.name);

                      const isMenuOpen = activeMenuId === file.id;

                      return (
                        <div
                          key={file.id}
                          onClick={() => onPreview(file)}
                          className="group relative flex flex-col p-2.5 rounded-2xl bg-[#111726]/80 hover:bg-[#151e30] border border-[#1e293b] hover:border-indigo-500/50 transition-all duration-200 shadow-md hover:shadow-xl cursor-pointer"
                        >
                          {/* Top Thumbnail / Visual Preview Box */}
                          <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#090d16] border border-[#1e293b]/70 flex items-center justify-center relative">
                            {isImage ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={`/api/drive/preview/${file.id}`}
                                alt={file.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            ) : isPdf ? (
                              /* PDF Document Preview Card */
                              <div className="w-full h-full p-3 flex flex-col items-center justify-center bg-gradient-to-b from-[#1a0f14] to-[#0d070a] border border-red-950/50">
                                <div className="w-12 h-14 rounded-lg bg-[#2b141d] border border-red-500/30 flex flex-col items-center justify-center shadow-lg mb-1">
                                  <FileText className="w-6 h-6 text-red-400 mb-0.5" />
                                  <span className="text-[9px] font-extrabold text-red-400 tracking-wider">
                                    PDF
                                  </span>
                                </div>
                                <span className="text-[10px] text-red-300/80 font-medium truncate max-w-full">
                                  Document
                                </span>
                              </div>
                            ) : isWord ? (
                              /* Word Document Preview Card */
                              <div className="w-full h-full p-3 flex flex-col items-center justify-center bg-gradient-to-b from-[#0c1728] to-[#070c16] border border-blue-950/50">
                                <div className="w-12 h-14 rounded-lg bg-[#11233f] border border-blue-500/30 flex flex-col items-center justify-center shadow-lg mb-1">
                                  <FileCode className="w-6 h-6 text-blue-400 mb-0.5" />
                                  <span className="text-[9px] font-extrabold text-blue-400 tracking-wider">
                                    DOCX
                                  </span>
                                </div>
                                <span className="text-[10px] text-blue-300/80 font-medium truncate max-w-full">
                                  Word File
                                </span>
                              </div>
                            ) : isVideo ? (
                              /* Video Preview Card */
                              <div className="w-full h-full p-3 flex flex-col items-center justify-center bg-gradient-to-b from-[#1b1228] to-[#0e0a16] border border-purple-950/50">
                                <div className="w-12 h-12 rounded-full bg-purple-600/30 border border-purple-500/50 flex items-center justify-center shadow-lg mb-1 group-hover:scale-110 transition-transform">
                                  <Play className="w-5 h-5 text-purple-300 fill-purple-300 ml-0.5" />
                                </div>
                                <span className="text-[10px] text-purple-300/80 font-medium">
                                  Video
                                </span>
                              </div>
                            ) : (
                              /* Generic File Preview Card */
                              <div className="w-full h-full p-3 flex flex-col items-center justify-center bg-[#111726]">
                                <File className="w-10 h-10 text-slate-400 mb-1" />
                                <span className="text-[10px] text-slate-400">File</span>
                              </div>
                            )}

                            {/* Floating Action Overlay on Hover */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPreview(file);
                                }}
                                title="Preview full size"
                                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownload(file);
                                }}
                                title="Download file"
                                className="p-2 rounded-lg bg-[#162032] hover:bg-[#233148] text-white border border-[#233148] shadow-md transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Favorite badge indicator on thumbnail */}
                            {file.isFavorite && (
                              <div className="absolute top-1.5 left-1.5 p-1 rounded-md bg-black/60 backdrop-blur-sm">
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              </div>
                            )}
                          </div>

                          {/* File Details Below Thumbnail */}
                          <div className="mt-2 text-left w-full min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <p
                                className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug break-words flex-1"
                                title={file.name}
                              >
                                {file.name}
                              </p>

                              {/* Three-dots menu trigger */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(isMenuOpen ? null : file.id);
                                  }}
                                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#162032] transition-colors"
                                >
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>

                                {/* Dropdown Menu */}
                                {isMenuOpen && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute right-0 mt-1 w-44 rounded-xl bg-[#111726] border border-[#1e293b] shadow-2xl p-1.5 z-50 animate-modal"
                                  >
                                    <button
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        onToggleFavorite(file);
                                      }}
                                      className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#1a2335] rounded-lg transition-colors"
                                    >
                                      <Star
                                        className={`w-3.5 h-3.5 ${
                                          file.isFavorite
                                            ? "text-amber-400 fill-amber-400"
                                            : "text-slate-400"
                                        }`}
                                      />
                                      <span>
                                        {file.isFavorite ? "Unfavorite" : "Favorite"}
                                      </span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        onEdit(file);
                                      }}
                                      className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#1a2335] rounded-lg transition-colors"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                                      <span>Edit Details</span>
                                    </button>

                                    {file.driveViewLink && (
                                      <a
                                        href={file.driveViewLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={() => setActiveMenuId(null)}
                                        className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#1a2335] rounded-lg transition-colors"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Google Drive</span>
                                      </a>
                                    )}

                                    <div className="border-t border-[#1e293b] my-1" />

                                    <button
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        onDelete(file);
                                      }}
                                      className="w-full flex items-center space-x-2 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Subtitle: Size · Category · Folder */}
                            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-1 flex-wrap">
                              <span>{file.formattedSize}</span>
                              <span>·</span>
                              <span className="text-slate-300 truncate max-w-[75px]">
                                {file.category}
                              </span>
                              {file.folderName && (
                                <>
                                  <span>·</span>
                                  <span className="text-amber-400/90 font-medium truncate max-w-[85px]" title={`Folder: ${file.folderName}`}>
                                    📁 {file.folderName}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE 2: LIST VIEW (Clean discrete card rows)                              */
        /* ========================================================================= */
        <div className="space-y-3 pb-6">
          {files.map((file) => {
            const badge = getFileBadge(file);
            const BadgeIcon = badge.icon;
            const isMenuOpen = activeMenuId === file.id;

            return (
              <div
                key={file.id}
                className="relative rounded-2xl border border-[#1e293b] bg-[#111726]/80 hover:border-slate-700 hover:bg-[#151d30] transition-all duration-200 shadow-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
              >
                {/* Left: Icon Badge, Title, Category */}
                <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                  <div
                    className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${badge.bg}`}
                  >
                    <BadgeIcon className="w-5 h-5 stroke-[2]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <p
                        onClick={() => onPreview(file)}
                        className="text-sm font-semibold text-white hover:text-indigo-400 truncate cursor-pointer transition-colors"
                        title={file.name}
                      >
                        {file.name}
                      </p>

                      {file.isFavorite && (
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5 flex-wrap gap-y-1">
                      <span>{badge.typeLabel}</span>
                      <span>·</span>
                      <span className="text-slate-300 font-medium">
                        {file.category}
                      </span>
                      {file.folderName && (
                        <>
                          <span>·</span>
                          <span className="text-[11px] font-medium text-amber-400 bg-amber-950/40 border border-amber-800/50 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            📁 {file.folderName}
                          </span>
                        </>
                      )}
                      {file.tags.length > 0 && (
                        <>
                          <span>·</span>
                          <span className="hidden md:inline text-slate-400 truncate max-w-[160px]">
                            {file.tags.join(", ")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle: Date and Size */}
                <div className="flex items-center justify-between sm:justify-end sm:space-x-8 text-xs text-slate-400 px-1 sm:px-0">
                  <div className="text-slate-400 font-medium sm:text-right min-w-[80px]">
                    {file.formattedDate}
                  </div>
                  <div className="text-slate-400 sm:text-right min-w-[60px]">
                    {file.formattedSize}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onPreview(file)}
                      title="Preview document"
                      className="w-9 h-9 rounded-xl bg-[#162032]/80 hover:bg-[#22334f] border border-[#23334c] flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDownload(file)}
                      title="Download document"
                      className="w-9 h-9 rounded-xl bg-[#162032]/80 hover:bg-[#22334f] border border-[#23334c] flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {/* Options Menu */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActiveMenuId(isMenuOpen ? null : file.id)
                        }
                        className="w-9 h-9 rounded-xl bg-[#162032]/80 hover:bg-[#22334f] border border-[#23334c] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#111726] border border-[#1e293b] shadow-2xl p-1.5 z-40 animate-modal">
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onToggleFavorite(file);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-[#1a2335] rounded-lg transition-colors"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                file.isFavorite
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-slate-400"
                              }`}
                            />
                            <span>
                              {file.isFavorite ? "Unfavorite" : "Favorite"}
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onEdit(file);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-[#1a2335] rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Edit Details</span>
                          </button>

                          {file.driveViewLink && (
                            <a
                              href={file.driveViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => setActiveMenuId(null)}
                              className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-[#1a2335] rounded-lg transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                              <span>Google Drive</span>
                            </a>
                          )}

                          <div className="border-t border-[#1e293b] my-1" />

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onDelete(file);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
