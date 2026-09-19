"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  FileUp,
  CheckCircle,
  AlertCircle,
  FileCheck,
  Plus,
  Check,
  FolderUp,
  Folder,
  Files,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { FileCategory, PortalFile, DEFAULT_CATEGORIES } from "@/lib/types";
import {
  getFileExtension,
  detectMimeType,
  sanitizeAndFixFileName,
  formatFileSize,
} from "@/lib/formatUtils";

const BLOCKED_EXTENSIONS = new Set([
  ".exe", ".bat", ".cmd", ".sh", ".bash", ".ps1", ".vbs", ".js", ".mjs", ".cjs",
  ".php", ".phtml", ".py", ".rb", ".pl", ".com", ".scr", ".msi", ".dll", ".jar",
  ".html", ".htm", ".xhtml", ".jsp", ".asp", ".aspx", ".cgi", ".wsf", ".hta"
]);

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (file: PortalFile) => void;
  onFolderUploaded?: (folderName: string, count: number) => void;
  availableCategories?: string[];
  onCategoryAdded?: (newCat: string) => void;
  initialMode?: "file" | "folder";
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  onFolderUploaded,
  availableCategories = DEFAULT_CATEGORIES,
  onCategoryAdded,
  initialMode = "file",
}) => {
  const [mode, setMode] = useState<"file" | "folder">(initialMode);

  // Single file states
  const [file, setFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");

  // Folder states
  const [folderName, setFolderName] = useState("");
  const [folderFiles, setFolderFiles] = useState<File[]>([]);
  const [skippedFiles, setSkippedFiles] = useState<string[]>([]);
  const [totalFolderBytes, setTotalFolderBytes] = useState(0);

  // Common metadata states
  const [category, setCategory] = useState<FileCategory>("Immigration");
  const [categories, setCategories] = useState<string[]>(availableCategories);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [description, setDescription] = useState("");

  // Upload status states
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    percent: number;
    currentFileName: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Enable directory upload attributes on folder input
  useEffect(() => {
    if (folderInputRef.current) {
      folderInputRef.current.setAttribute("webkitdirectory", "");
      folderInputRef.current.setAttribute("directory", "");
      folderInputRef.current.setAttribute("multiple", "");
    }
  }, []);

  // Load categories from API / props
  useEffect(() => {
    fetch("/api/drive/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      })
      .catch(() => setCategories(availableCategories));
  }, [availableCategories]);

  // Reset or initialize form whenever modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setFile(null);
      setDisplayName("");
      setFolderName("");
      setFolderFiles([]);
      setSkippedFiles([]);
      setTotalFolderBytes(0);
      setCategory("Immigration");
      setTagsInput("");
      setDescription("");
      setError(null);
      setSuccessMessage(null);
      setUploadProgress(null);
      setIsAddingCategory(false);
      setNewCategoryInput("");
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Single file selection handler
  const handleFileSelect = (selected: File) => {
    const ext = getFileExtension(selected.name);
    if (BLOCKED_EXTENSIONS.has(ext.toLowerCase())) {
      setError(`Files with extension '${ext}' are blocked for security.`);
      return;
    }
    setFile(selected);
    setDisplayName(selected.name);
    setError(null);
  };

  // Helper to read directory entries recursively for HTML5 drag-and-drop
  const readDirectoryEntries = async (dirReader: any): Promise<any[]> => {
    const entries: any[] = [];
    return new Promise((resolve) => {
      const readBatch = () => {
        dirReader.readEntries((batch: any[]) => {
          if (!batch || batch.length === 0) {
            resolve(entries);
          } else {
            entries.push(...batch);
            readBatch();
          }
        });
      };
      readBatch();
    });
  };

  const scanEntry = async (entry: any): Promise<File[]> => {
    if (!entry) return [];
    if (entry.isFile) {
      return new Promise((resolve) => {
        entry.file(
          (f: File) => resolve([f]),
          () => resolve([])
        );
      });
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const children = await readDirectoryEntries(reader);
      const files: File[] = [];
      for (const child of children) {
        const childFiles = await scanEntry(child);
        files.push(...childFiles);
      }
      return files;
    }
    return [];
  };

  // Process files gathered from folder
  const processFolderFiles = (name: string, allFiles: File[]) => {
    const valid: File[] = [];
    const skipped: string[] = [];
    let bytes = 0;

    for (const f of allFiles) {
      const ext = getFileExtension(f.name);
      if (f.size === 0 || BLOCKED_EXTENSIONS.has(ext.toLowerCase())) {
        skipped.push(f.name);
      } else {
        valid.push(f);
        bytes += f.size;
      }
    }

    if (valid.length === 0) {
      setError("No valid documents or files found in this folder.");
      return;
    }

    const cleanFolder =
      name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim() || "Uploaded Folder";

    setFolderName(cleanFolder);
    setFolderFiles(valid);
    setSkippedFiles(skipped);
    setTotalFolderBytes(bytes);
    setError(null);
  };

  // Handle folder input from folder picker
  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const filesArray = Array.from(fileList);
    // Determine folder name from webkitRelativePath
    let detectedName = "Uploaded Folder";
    if (filesArray[0] && (filesArray[0] as any).webkitRelativePath) {
      const relPath = (filesArray[0] as any).webkitRelativePath as string;
      const parts = relPath.split("/");
      if (parts.length > 1 && parts[0]) {
        detectedName = parts[0];
      }
    }

    processFolderFiles(detectedName, filesArray);
  };

  // Drag and drop handler supporting both single files and dropped folders
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
      let isAnyDirectory = false;
      let primaryDirName = "";
      const collectedFiles: File[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (typeof item.webkitGetAsEntry === "function") {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            if (entry.isDirectory) {
              isAnyDirectory = true;
              if (!primaryDirName) primaryDirName = entry.name;
              const dirFiles = await scanEntry(entry);
              collectedFiles.push(...dirFiles);
            } else if (entry.isFile) {
              const fileEntries = await scanEntry(entry);
              collectedFiles.push(...fileEntries);
            }
          }
        }
      }

      if (isAnyDirectory || collectedFiles.length > 1) {
        setMode("folder");
        processFolderFiles(primaryDirName || "Uploaded Folder", collectedFiles);
        return;
      }
    }

    // Fallback: standard file drop
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (mode === "folder" || e.dataTransfer.files.length > 1) {
        setMode("folder");
        processFolderFiles("Uploaded Folder", Array.from(e.dataTransfer.files));
      } else {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    }
  };

  const fileExt = file ? getFileExtension(file.name) : "";
  const detectedMime = file ? detectMimeType(file.name, file.type) : "";

  const handleAddNewCategory = async () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;

    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCategory(trimmed);
      setIsAddingCategory(false);
      setNewCategoryInput("");
      return;
    }

    try {
      const res = await fetch("/api/drive/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || [...categories, trimmed]);
      } else {
        setCategories((prev) => [...prev, trimmed]);
      }
    } catch {
      setCategories((prev) => [...prev, trimmed]);
    }

    setCategory(trimmed);
    if (onCategoryAdded) {
      onCategoryAdded(trimmed);
    }
    setIsAddingCategory(false);
    setNewCategoryInput("");
  };

  // Submit handler: handles both single file and full folder upload
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "file") {
      if (!file) {
        setError("Please select a document or photo to upload.");
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const cleanName = sanitizeAndFixFileName(
          displayName || file.name,
          file.name,
          detectedMime
        );

        const formData = new FormData();
        formData.append("file", file);
        formData.append("displayName", cleanName);
        formData.append("category", category);
        formData.append("tags", tagsInput);
        formData.append("description", description);

        const res = await fetch("/api/drive/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Upload failed");
        }

        onUploadSuccess(data.file);
        onClose();
      } catch (err: any) {
        setError(err.message || "An error occurred during upload");
      } finally {
        setIsUploading(false);
      }
    } else {
      // Full Folder Upload
      if (folderFiles.length === 0) {
        setError("Please select or drop a folder to upload.");
        return;
      }

      const activeFolderName =
        folderName.trim() || "Uploaded Folder";

      setIsUploading(true);
      setError(null);
      setSuccessMessage(null);

      let successCount = 0;
      let lastUploadedFile: PortalFile | null = null;
      const failedFiles: string[] = [];

      for (let i = 0; i < folderFiles.length; i++) {
        const f = folderFiles[i];
        const percent = Math.round(((i + 1) / folderFiles.length) * 100);

        setUploadProgress({
          current: i + 1,
          total: folderFiles.length,
          percent,
          currentFileName: f.name,
        });

        try {
          const fMime = detectMimeType(f.name, f.type);
          const cleanName = sanitizeAndFixFileName(f.name, f.name, fMime);

          const formData = new FormData();
          formData.append("file", f);
          formData.append("displayName", cleanName);
          formData.append("category", category);
          formData.append("tags", tagsInput);
          formData.append("description", description);
          formData.append("folderName", activeFolderName);

          const res = await fetch("/api/drive/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Upload failed for ${f.name}`);
          }

          const resData = await res.json();
          lastUploadedFile = resData.file;
          successCount++;
        } catch (fileErr: any) {
          console.error(`Failed uploading ${f.name}:`, fileErr);
          failedFiles.push(f.name);
        }
      }

      setIsUploading(false);

      if (successCount > 0) {
        if (lastUploadedFile) {
          onUploadSuccess(lastUploadedFile);
        }
        if (onFolderUploaded) {
          onFolderUploaded(activeFolderName, successCount);
        }

        if (failedFiles.length === 0) {
          setSuccessMessage(
            `Successfully uploaded all ${successCount} files into folder "${activeFolderName}"!`
          );
          setTimeout(() => {
            onClose();
          }, 1200);
        } else {
          setSuccessMessage(
            `Uploaded ${successCount} files to "${activeFolderName}". (${failedFiles.length} failed)`
          );
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } else {
        setError("Failed to upload files from this folder. Please check your connection.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="relative w-full max-w-xl bg-[#111726] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden animate-modal flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0d1322]">
          <div className="flex items-center space-x-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                mode === "folder"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-indigo-600/20 text-indigo-400"
              }`}
            >
              {mode === "folder" ? (
                <FolderUp className="w-4 h-4" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </div>
            <h3 className="text-base font-bold text-white">
              {mode === "folder" ? "Upload Full Folder" : "Upload Private File"}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="w-8 h-8 rounded-lg bg-[#162032] hover:bg-[#233148] text-slate-400 hover:text-white flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs: Single File vs Full Folder */}
        <div className="flex border-b border-[#1e293b] bg-[#0c121e]">
          <button
            type="button"
            onClick={() => {
              if (!isUploading) setMode("file");
            }}
            disabled={isUploading}
            className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center space-x-2 transition-all border-b-2 ${
              mode === "file"
                ? "border-indigo-500 text-indigo-400 bg-indigo-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#111726]"
            }`}
          >
            <FileUp className="w-4 h-4" />
            <span>Single File</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isUploading) setMode("folder");
            }}
            disabled={isUploading}
            className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center space-x-2 transition-all border-b-2 ${
              mode === "folder"
                ? "border-amber-500 text-amber-400 bg-amber-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#111726]"
            }`}
          >
            <FolderUp className="w-4 h-4" />
            <span>Full Folder</span>
            <span className="ml-1 text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
              Batch
            </span>
          </button>
        </div>

        {/* Hidden File Inputs */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileSelect(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        <input
          type="file"
          ref={folderInputRef}
          onChange={handleFolderInputChange}
          className="hidden"
        />

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/60 text-xs text-emerald-300 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Upload Progress Bar (when uploading folder or file) */}
          {isUploading && uploadProgress && (
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  Uploading folder files...
                </span>
                <span className="font-bold text-indigo-300">
                  {uploadProgress.percent}% ({uploadProgress.current}/{uploadProgress.total})
                </span>
              </div>
              <div className="w-full h-2 bg-[#162032] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-amber-400 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress.percent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Current: <span className="text-slate-200">{uploadProgress.currentFileName}</span>
              </p>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODE 1: SINGLE FILE DROPZONE & DETAILS                                    */}
          {/* ========================================================================= */}
          {mode === "file" ? (
            <>
              {/* Drag & Drop Box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-950/20"
                    : file
                    ? "border-emerald-500/50 bg-emerald-950/10"
                    : "border-[#233148] hover:border-[#384c6e] bg-[#0d1322]/50"
                }`}
              >
                {file ? (
                  <div className="flex items-center justify-center space-x-3 text-emerald-400">
                    <CheckCircle className="w-6 h-6 flex-shrink-0" />
                    <div className="text-left min-w-0">
                      <p className="text-sm font-semibold text-white truncate max-w-xs">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatFileSize(file.size)} · {detectedMime} · Click to change
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-slate-400">
                    <FileUp className="w-8 h-8 mx-auto text-indigo-400" />
                    <p className="text-sm font-medium text-slate-200">
                      Drag & drop your file here, or{" "}
                      <span className="text-indigo-400 underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Supports PDF, DOCX, JPG, PNG, MOV, MP4 and all formats
                    </p>
                    <p className="text-[11px] text-amber-400/80">
                      Tip: You can also drop a full folder here anytime!
                    </p>
                  </div>
                )}
              </div>

              {/* Display Name with Format indicator */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Display Name
                  </label>
                  {fileExt && (
                    <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <FileCheck className="w-3 h-3" />
                      Format: {fileExt.toUpperCase()}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Passport - Russell Foyze.pdf"
                  disabled={isUploading}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0d1322] border border-[#233148] text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Original extension ({fileExt || ".pdf"}) is preserved automatically.
                </p>
              </div>
            </>
          ) : (
            /* ========================================================================= */
            /* MODE 2: FULL FOLDER SELECTION & BATCH DETAILS                             */
            /* ========================================================================= */
            <>
              {/* Folder Selector / Dropzone Box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => !isUploading && folderInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-amber-500 bg-amber-950/20"
                    : folderFiles.length > 0
                    ? "border-amber-500/50 bg-amber-950/10"
                    : "border-[#233148] hover:border-amber-500/40 bg-[#0d1322]/50"
                }`}
              >
                {folderFiles.length > 0 ? (
                  <div className="flex items-center justify-center space-x-3 text-amber-400">
                    <Folder className="w-7 h-7 flex-shrink-0 text-amber-400 fill-amber-400/20" />
                    <div className="text-left min-w-0">
                      <p className="text-sm font-semibold text-white truncate max-w-xs">
                        Folder: {folderName || "Selected Folder"}
                      </p>
                      <p className="text-xs text-amber-300/80">
                        {folderFiles.length} files found · {formatFileSize(totalFolderBytes)} · Click to change folder
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-slate-400">
                    <FolderUp className="w-8 h-8 mx-auto text-amber-400" />
                    <p className="text-sm font-medium text-slate-200">
                      Click to <span className="text-amber-400 underline font-semibold">select a folder</span>, or drag & drop a folder here
                    </p>
                    <p className="text-xs text-slate-400">
                      Uploads all documents, images, and files in the folder into MultiPortal
                    </p>
                  </div>
                )}
              </div>

              {/* Folder Name Input */}
              {folderFiles.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Folder / Subfolder Name in Vault
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-amber-400">
                      <Folder className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={folderName}
                      onChange={(e) => setFolderName(e.target.value)}
                      placeholder="e.g. University Certificates"
                      disabled={isUploading}
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#0d1322] border border-[#233148] text-sm text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Files will be organized inside this subfolder in your MultiPortal Google Drive vault.
                  </p>
                </div>
              )}

              {/* Preview of Files in Folder */}
              {folderFiles.length > 0 && (
                <div className="p-3 rounded-xl bg-[#0d1322] border border-[#1e293b] space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Files className="w-3.5 h-3.5 text-amber-400" />
                      Files to upload ({folderFiles.length})
                    </span>
                    <span>Total: {formatFileSize(totalFolderBytes)}</span>
                  </div>

                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1 text-xs">
                    {folderFiles.slice(0, 6).map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-1 px-2 rounded-lg bg-[#111726] border border-[#1e293b]/60 text-slate-300"
                      >
                        <span className="truncate max-w-[280px] font-medium flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                          {f.name}
                        </span>
                        <span className="text-[11px] text-slate-400 flex-shrink-0 ml-2">
                          {formatFileSize(f.size)}
                        </span>
                      </div>
                    ))}
                    {folderFiles.length > 6 && (
                      <p className="text-[11px] text-slate-400 text-center pt-1 font-medium">
                        + {folderFiles.length - 6} more files in folder
                      </p>
                    )}
                  </div>

                  {skippedFiles.length > 0 && (
                    <p className="text-[11px] text-amber-400/90 pt-1">
                      ℹ️ {skippedFiles.length} file(s) skipped (executable/empty): {skippedFiles.slice(0, 3).join(", ")}
                      {skippedFiles.length > 3 ? "..." : ""}
                    </p>
                  )}
                </div>
              )}
            </>
          )}

          {/* Category Selector with "+ Add New Category" feature */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Category {mode === "folder" && "(Applied to folder files)"}
              </label>
              {!isAddingCategory && !isUploading && (
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(true)}
                  className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add New Category</span>
                </button>
              )}
            </div>

            {isAddingCategory ? (
              <div className="p-2 rounded-xl bg-[#0d1322] border border-indigo-500/60 flex items-center gap-2">
                <input
                  type="text"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  placeholder="Type new category (e.g. Ethics, Taxes)..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#111726] text-xs text-white border border-[#233148] focus:border-indigo-500 focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddNewCategory();
                    } else if (e.key === "Escape") {
                      setIsAddingCategory(false);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddNewCategory}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCategoryInput("");
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#162032] hover:bg-[#233148] text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={category}
                  disabled={isUploading}
                  onChange={(e) => {
                    if (e.target.value === "__ADD_NEW__") {
                      setIsAddingCategory(true);
                    } else {
                      setCategory(e.target.value as FileCategory);
                    }
                  }}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0d1322] border border-[#233148] text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__ADD_NEW__" className="text-indigo-400 font-semibold">
                    ➕ + Add new category...
                  </option>
                </select>
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. passport, urgent, scan, 2026"
              disabled={isUploading}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0d1322] border border-[#233148] text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Description (optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Private notes about these documents..."
              disabled={isUploading}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0d1322] border border-[#233148] text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl bg-[#162032] hover:bg-[#233148] text-slate-300 hover:text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isUploading ||
                (mode === "file" ? !file : folderFiles.length === 0)
              }
              className={`px-5 py-2 rounded-xl text-white text-xs font-semibold shadow-lg flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === "folder"
                  ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/30"
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
              }`}
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    {mode === "folder"
                      ? `Uploading Folder (${uploadProgress?.current || 0}/${uploadProgress?.total || folderFiles.length})...`
                      : "Uploading to Vault..."}
                  </span>
                </>
              ) : mode === "folder" ? (
                <>
                  <FolderUp className="w-3.5 h-3.5" />
                  <span>Upload Full Folder ({folderFiles.length} files)</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Document</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
