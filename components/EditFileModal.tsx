"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Star, Plus, Check } from "lucide-react";
import { FileCategory, PortalFile, DEFAULT_CATEGORIES } from "@/lib/types";
import { sanitizeAndFixFileName } from "@/lib/formatUtils";

interface EditFileModalProps {
  file: PortalFile | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSuccess: (updated: PortalFile) => void;
  availableCategories?: string[];
  onCategoryAdded?: (newCat: string) => void;
}

export const EditFileModal: React.FC<EditFileModalProps> = ({
  file,
  isOpen,
  onClose,
  onUpdateSuccess,
  availableCategories = DEFAULT_CATEGORIES,
  onCategoryAdded,
}) => {
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState<FileCategory>("Other");
  const [categories, setCategories] = useState<string[]>(availableCategories);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");

  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (file) {
      setDisplayName(file.name);
      setCategory(file.category);
      setTags(file.tags.join(", "));
      setDescription(file.description || "");
      setIsFavorite(file.isFavorite);
      setIsAddingCategory(false);
      setNewCategoryInput("");
    }
  }, [file]);

  if (!isOpen || !file) return null;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const cleanDisplayName = sanitizeAndFixFileName(
        displayName || file.name,
        file.originalName || file.name,
        file.mimeType
      );

      const res = await fetch(`/api/drive/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: cleanDisplayName,
          category,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          description,
          isFavorite,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update file");
      }

      onUpdateSuccess(data.file);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update metadata");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="relative w-full max-w-lg bg-[#111726] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden animate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0d1322]">
          <h3 className="text-base font-bold text-white">Edit Document Details</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#162032] hover:bg-[#233148] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-xs text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0d1322] border border-[#233148] text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

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
                  placeholder="Type new category (e.g. Ethics, Legal)..."
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
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__ADD_NEW__" className="text-indigo-400 font-semibold">
                  ➕ + Add new category...
                </option>
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. passport, identity, akter"
              className="w-full px-3.5 py-2 rounded-xl bg-[#0d1322] border border-[#233148] text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0d1322] border border-[#233148] text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                isFavorite
                  ? "bg-amber-950/40 border-amber-800 text-amber-300"
                  : "bg-[#162032] border-[#233148] text-slate-400 hover:text-white"
              }`}
            >
              <Star
                className={`w-4 h-4 ${
                  isFavorite ? "fill-amber-400 text-amber-400" : ""
                }`}
              />
              <span>{isFavorite ? "Favorited" : "Mark as Favorite"}</span>
            </button>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#162032] hover:bg-[#233148] text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
