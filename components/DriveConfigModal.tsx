"use client";

import React from "react";
import { X, HardDrive, CheckCircle2, AlertTriangle, ExternalLink, Copy, Check } from "lucide-react";
import { DriveConfigStatus } from "@/lib/types";

interface DriveConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: DriveConfigStatus | null;
}

export const DriveConfigModal: React.FC<DriveConfigModalProps> = ({
  isOpen,
  onClose,
  status,
}) => {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isConfigured = status?.isConfigured;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="relative w-full max-w-2xl bg-[#111726] border border-[#1e293b] rounded-2xl shadow-2xl overflow-hidden animate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b] bg-[#0d1322]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">
              Google Drive API Integration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#162032] hover:bg-[#233148] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status banner */}
          <div
            className={`p-4 rounded-xl border flex items-start space-x-3 ${
              isConfigured
                ? "bg-emerald-950/30 border-emerald-800 text-emerald-300"
                : "bg-indigo-950/40 border-indigo-800 text-indigo-200"
            }`}
          >
            {isConfigured ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-400 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <p className="font-semibold text-sm text-white">
                {isConfigured
                  ? "Google Drive API: Connected & Active"
                  : "Google Drive API: Demo & Mock Mode Active"}
              </p>
              <p className="text-slate-300 leading-relaxed">
                {isConfigured
                  ? `Authenticated through Google Cloud Service Account. Documents stream directly to/from your private Google Drive vault.`
                  : `Currently serving sample documents matching your design. To connect your live personal Google Drive, set the environment variables below in your .env.local or on Vercel.`}
              </p>
            </div>
          </div>

          {/* 1-Click Connect Google Account for 15GB Uploads */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div>
              <p className="text-xs font-bold text-white flex items-center space-x-1.5">
                <span>Personal Google Drive (15 GB Free Storage)</span>
              </p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Authorize your personal Google account in 1 click to unlock direct file uploads.
              </p>
            </div>
            <a
              href="/api/auth/google"
              className="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-all flex-shrink-0"
            >
              <HardDrive className="w-4 h-4" />
              <span>Connect Google Drive</span>
            </a>
          </div>

          {/* Current Config Info */}
          {isConfigured && (
            <div className="bg-[#0d1322] border border-[#1e293b] rounded-xl p-4 text-xs space-y-2.5">
              <div>
                <span className="text-slate-400 block mb-0.5">Service Account:</span>
                <span className="text-slate-200 font-mono bg-[#162032] px-2 py-1 rounded">
                  {status?.serviceAccountEmail}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Google Drive Vault Folder ID:</span>
                <span className="text-slate-200 font-mono bg-[#162032] px-2 py-1 rounded">
                  {status?.folderId}
                </span>
              </div>
            </div>
          )}

          {/* Setup Instructions for Vercel */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Vercel Deployment Variables
            </h4>
            <p className="text-xs text-slate-400">
              Add these environment variables to your <strong>Vercel Project Settings → Environment Variables</strong>:
            </p>

            <div className="space-y-2 text-xs font-mono">
              {[
                {
                  key: "GOOGLE_SERVICE_ACCOUNT_EMAIL",
                  sample: "mah-portal@your-project.iam.gserviceaccount.com",
                  desc: "Google Cloud Service Account Email",
                },
                {
                  key: "GOOGLE_PRIVATE_KEY",
                  sample: `"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"`,
                  desc: "Private Key from Service Account JSON",
                },
                {
                  key: "GOOGLE_DRIVE_FOLDER_ID",
                  sample: "1a2b3c4d5e6f7g8h9i0j",
                  desc: "Google Drive Folder ID (shared with service account)",
                },
                {
                  key: "PORTAL_ADMIN_EMAIL",
                  sample: "akter@mahossain.com",
                  desc: "Authorized Admin Email",
                },
                {
                  key: "PORTAL_ADMIN_PASSWORD",
                  sample: "YourSecurePassword2026!",
                  desc: "Admin login password",
                },
                {
                  key: "PORTAL_2FA_SECRET",
                  sample: "JBSWY3DPEHPK3PXP",
                  desc: "Base32 Authenticator 2FA Secret",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="bg-[#0d1322] border border-[#1e293b] p-2.5 rounded-xl flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <span className="text-indigo-400 font-bold block">
                      {item.key}
                    </span>
                    <span className="text-slate-400 text-[11px] font-sans block truncate">
                      {item.desc}
                    </span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(item.key, item.key)}
                    className="p-1.5 rounded-lg bg-[#162032] hover:bg-[#202e48] text-slate-400 hover:text-white transition-colors"
                    title="Copy variable name"
                  >
                    {copiedKey === item.key ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Steps */}
          <div className="bg-[#090d16] border border-[#1e293b] p-4 rounded-xl text-xs space-y-2 text-slate-300">
            <h5 className="font-semibold text-white">How to connect in 3 minutes:</h5>
            <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
              <li>Create a Google Cloud Project and enable Google Drive API.</li>
              <li>Create a Service Account, create a JSON key, and download it.</li>
              <li>In your personal Google Drive, create a folder (e.g. &quot;MA HOSSAIN Vault&quot;).</li>
              <li>Click Share on the folder and add your Service Account email as Editor.</li>
              <li>Copy the folder ID from the URL (the string after &apos;folders/&apos;).</li>
              <li>Add the credentials to Vercel or `.env.local`!</li>
            </ol>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-[#1e293b] bg-[#0d1322] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
