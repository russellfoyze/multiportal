"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Upload, FileUp, CheckCircle, AlertCircle, FileCheck, Plus, Check } from "lucide-react";
import { FileCategory, PortalFile, DEFAULT_CATEGORIES } from "@/lib/types";
import {
  getFileExtension,
  detectMimeType,
  sanitizeAndFixFileName,
} from "@/lib/formatUtils";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (file: PortalFile) => void;
  availableCategories?: string[];
  onCategoryAdded?: (newCat: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  availableCategories = DEFAULT_CATEGORIES,
  onCategoryAdded,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState<FileCategory>("Immigration");
  const [categories, setCategories] = useState<string[]>(availableCategories);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");

  const [tagsInput, setTagsInput] = useState("");
  const [description, setDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Reset form whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setDisplayName("");
      setCategory("Immigration");
      setTagsInput("");
      setDescription("");
      setError(null);
      setIsAddingCategory(false);
      setNewCategoryInput("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = (selected: File) => {
    setFile(selected);
    setDisplayName(selected.name);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const fileExt = file ? getFileExtension(file.name) : "";
  const detectedMime = file ? detectMimeType(file.name, file.type) : "";

  const handleAddNewCategory = async () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;

    // Check duplicate
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="relative w-full max-w-xl bg-[#111726] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden animate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0d1322]">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Upload Private File</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#162032] hover:bg-[#233148] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-indigo-500 bg-indigo-950/20"
                : file
                ? "border-emerald-500/50 bg-emerald-950/10"
                : "border-[#233148] hover:border-[#384c6e] bg-[#0d1322]/50"
            }`}
          >
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
            {file ? (
              <div className="flex items-center justify-center space-x-3 text-emerald-400">
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <div className="text-left min-w-0">
                  <p className="text-sm font-semibold text-white truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB · {detectedMime} · Click to change
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-slate-400">
                <FileUp className="w-8 h-8 mx-auto text-indigo-400" />
                <p className="text-sm font-medium text-slate-200">
                  Drag and drop your file here, or{" "}
                  <span className="text-indigo-400 underline">browse</span>
                </p>
                <p className="text-xs text-slate-400">
                  Supports PDF, DOCX, JPG, PNG, MOV, MP4 and all formats
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
              className="w-full px-3.5 py-2 rounded-xl bg-[#0d1322] border border-[#233148] text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              The original file extension ({fileExt || "e.g. .pdf"}) will be preserved automatically.
            </p>
          </div>

          {/* Category Selector with "+ Add New Category" feature */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                Category
              </label>
              {!isAddingCategory && (
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
              placeholder="Private notes about this document..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#0d1322] border border-[#233148] text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#162032] hover:bg-[#233148] text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || isUploading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading to Vault...</span>
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
