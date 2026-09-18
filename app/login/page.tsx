"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  HardDrive,
  Info,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("akter@mahossain.com");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          totpCode: requires2FA ? totpCode : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (data.requires2FA) {
        setRequires2FA(true);
        setIsLoading(false);
        return;
      }

      // Success, redirect to dashboard
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Check your credentials.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 sm:p-6 text-slate-100">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-xl shadow-indigo-600/30 mb-4">
            <span className="text-white font-black text-xl tracking-wider">MAH</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            MA HOSSAIN
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Private Document Portal & Vault
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#111726] border border-[#1e293b] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Authorized Access Only</span>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/80 text-xs text-red-300 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!requires2FA ? (
              <>
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="akter@mahossain.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0d1322] border border-[#233148] text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Vault Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0d1322] border border-[#233148] text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </>
            ) : (
              /* 2FA TOTP Code Screen */
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-300">
                  <p className="font-semibold text-white">Two-Factor Authentication</p>
                  <p className="mt-0.5 text-slate-300 text-[11px]">
                    Enter the 6-digit verification code from your Authenticator app (or enter{" "}
                    <code className="text-indigo-400 font-bold">123456</code> for demo testing).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    6-Digit Security Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      required
                      autoFocus
                      placeholder="123456"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#0d1322] border border-[#233148] text-center font-mono text-lg tracking-widest text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>{requires2FA ? "Verify & Enter Vault" : "Sign In to Vault"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Guide */}
          <div className="p-3.5 rounded-xl bg-[#0d1322] border border-[#1e293b] text-xs text-slate-400 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-slate-300 font-medium text-[11px]">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              <span>Default Credentials (Customizable via .env)</span>
            </div>
            <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
              <p>
                Email: <span className="text-slate-200">akter@mahossain.com</span>
              </p>
              <p>
                Password: <span className="text-slate-200">PortalPass2026!</span>
              </p>
              <p>
                Demo 2FA Code: <span className="text-indigo-400 font-bold">123456</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-slate-500 flex items-center justify-center space-x-2">
          <HardDrive className="w-3.5 h-3.5" />
          <span>Powered by Google Drive API &bull; Hosted on Vercel</span>
        </div>
      </div>
    </div>
  );
}
