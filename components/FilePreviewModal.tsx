"use client";

import React from "react";
import { PortalFile } from "@/lib/types";
import {
  X,
  Download,
  ExternalLink,
  FileText,
  FileCode,
  Image as ImageIcon,
  Video,
  Music,
  Tag,
  Calendar,
  HardDrive,
  Info,
} from "lucide-react";
import { sanitizeAndFixFileName } from "@/lib/formatUtils";

interface FilePreviewModalProps {
  file: PortalFile | null;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  onClose,
}) => {
  if (!file) return null;

  const isPdf =
    file.mimeType === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");

  const isImage =
    !isPdf &&
    (file.mimeType.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp|svg|gif|bmp)$/i.test(file.name));

  const isVideo =
    !isPdf &&
    (file.mimeType.startsWith("video/") ||
      /\.(mov|mp4|webm|mkv|avi)$/i.test(file.name));

  const isAudio =
    !isPdf &&
    (file.mimeType.startsWith("audio/") ||
      /\.(mp3|wav|ogg|m4a)$/i.test(file.name));

  const previewUrl = `/api/drive/preview/${file.id}`;
  const downloadUrl = `/api/drive/download/${file.id}`;

  const cleanName = sanitizeAndFixFileName(
    file.name,
    file.originalName,
    file.mimeType
  );

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = cleanName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div
        className="relative w-full max-w-5xl h-[90vh] bg-[#111726] border border-[#1e293b] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0d1322]">
          <div className="flex items-center space-x-3 min-w-0 flex-1 mr-4">
            <div className="w-10 h-10 rounded-xl bg-[#162032] border border-[#233148] flex items-center justify-center flex-shrink-0 text-indigo-400">
              {isPdf ? (
                <FileText className="w-5 h-5 text-red-400" />
              ) : isImage ? (
                <ImageIcon className="w-5 h-5 text-cyan-400" />
              ) : isVideo ? (
                <Video className="w-5 h-5 text-purple-400" />
              ) : isAudio ? (
                <Music className="w-5 h-5 text-emerald-400" />
              ) : (
                <FileCode className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-white truncate">
                {cleanName}
              </h3>
              <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                <span className="text-indigo-400 font-medium">
                  {file.category}
                </span>
                <span>·</span>
                <span>{file.formattedSize}</span>
                <span>·</span>
                <span>{file.formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center space-x-2">
            {file.driveViewLink && (
              <a
                href={file.driveViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#162032] hover:bg-[#1f2c44] border border-[#233148] text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                <span>Google Drive</span>
              </a>
            )}

            <button
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[#162032] hover:bg-[#233148] text-slate-400 hover:text-white flex items-center justify-center transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Main Preview Container */}
          <div className="flex-1 bg-[#090d16] flex items-center justify-center p-4 overflow-auto">
            {isPdf ? (
              <iframe
                src={previewUrl}
                title={cleanName}
                className="w-full h-full rounded-xl border border-[#1e293b] shadow-inner bg-slate-900"
              />
            ) : isImage ? (
              <div className="max-w-full max-h-full flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt={cleanName}
                  className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-2xl border border-[#1e293b]"
                />
              </div>
            ) : isVideo ? (
              <div className="max-w-full max-h-full flex items-center justify-center p-4">
                <video
                  controls
                  src={previewUrl}
                  className="max-h-[70vh] max-w-full rounded-xl shadow-2xl border border-[#1e293b] bg-black"
                >
                  Your browser does not support playing this video.
                </video>
              </div>
            ) : isAudio ? (
              <div className="text-center p-8 max-w-md bg-[#111726] border border-[#1e293b] rounded-2xl shadow-xl space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <Music className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-white">{cleanName}</h4>
                <audio controls src={previewUrl} className="w-full" />
              </div>
            ) : (
              <div className="text-center p-8 max-w-md bg-[#111726] border border-[#1e293b] rounded-2xl shadow-xl space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-950/50 border border-blue-800/40 text-blue-400 flex items-center justify-center mx-auto">
                  <FileCode className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white mb-1">
                    {cleanName}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Direct browser preview not supported for this document format.
                  </p>
                </div>
                <div className="text-xs text-slate-400 space-y-1 bg-[#0d1322] p-3 rounded-xl border border-[#1e293b] text-left">
                  <p>
                    <strong className="text-slate-300">Format:</strong>{" "}
                    {file.mimeType}
                  </p>
                  <p>
                    <strong className="text-slate-300">Size:</strong>{" "}
                    {file.formattedSize}
                  </p>
                  <p>
                    <strong className="text-slate-300">Category:</strong>{" "}
                    {file.category}
                  </p>
                </div>
                <button
                  onClick={handleDownload}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Document</span>
                </button>
              </div>
            )}
          </div>

          {/* Details Sidebar */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-[#1e293b] bg-[#0d1322] p-5 overflow-y-auto space-y-5">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Document Information
              </h4>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400">Display Name</span>
                  <p className="text-slate-200 font-medium mt-0.5 break-words">
                    {cleanName}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Original Filename</span>
                  <p className="text-slate-200 font-medium mt-0.5 break-words">
                    {file.originalName}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">File Format / MIME</span>
                  <p className="text-slate-200 font-mono text-[11px] mt-0.5 break-all">
                    {file.mimeType}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">File Size</span>
                  <p className="text-slate-200 font-medium mt-0.5">
                    {file.formattedSize} ({file.size.toLocaleString()} bytes)
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Category</span>
                  <p className="text-indigo-400 font-medium mt-0.5">
                    {file.category}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Uploaded At</span>
                  <p className="text-slate-200 font-medium mt-0.5">
                    {file.formattedDate}
                  </p>
                </div>
              </div>
            </div>

            {file.tags && file.tags.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Tags</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {file.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md bg-[#162032] border border-[#233148] text-slate-300 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {file.description && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>Description</span>
                </h4>
                <p className="text-xs text-slate-300 bg-[#162032]/60 p-3 rounded-xl border border-[#233148] leading-relaxed">
                  {file.description}
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-[#1e293b]">
              <button
                onClick={handleDownload}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download File</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
