"use client";

import React, { useState, useEffect } from "react";
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
  const isDemoMode =
    process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS === "true" ||
    process.env.NODE_ENV !== "production";

  const [email, setEmail] = useState(isDemoMode ? "russellfoyze007@gmail.com" : "");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err) {
        if (err === "unauthorized_oauth_callback") {
          setError("Google authentication was not completed. Please try again.");
        } else if (err === "missing_oauth_keys") {
          setError("Google OAuth credentials missing in .env.local.");
        } else if (err === "invalid_oauth_state_csrf") {
          setError("Security state validation expired. Please sign in again.");
        } else {
          setError(decodeURIComponent(err));
        }
      }
    }
  }, []);

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
            <span className="text-white font-black text-xl tracking-wider">MP</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            MultiPortal
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Private Document Vault
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

          {/* Sign In with Gmail (1-Click) */}
          <a
            href="/api/auth/google"
            className="w-full py-3 px-4 rounded-xl bg-[#162032] hover:bg-[#1a263d] border border-[#2b3b55] hover:border-indigo-500/60 text-white font-semibold text-sm transition-all flex items-center justify-center space-x-3 shadow-lg group hover:shadow-indigo-500/10"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span className="text-slate-100 group-hover:text-white font-medium">
              Sign In with Gmail (1-Click)
            </span>
          </a>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#1e293b] w-full" />
            <span className="bg-[#111726] px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              or sign in with password
            </span>
            <div className="border-t border-[#1e293b] w-full" />
          </div>

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
                      placeholder="russellfoyze007@gmail.com"
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
                    Enter the 6-digit verification code from your Authenticator app
                    {isDemoMode && (
                      <> (or enter <code className="text-indigo-400 font-bold">123456</code> for demo testing)</>
                    )}.
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

          {/* Quick Demo Credentials Guide (only rendered in demo / development) */}
          {isDemoMode && (
            <div className="p-3.5 rounded-xl bg-[#0d1322] border border-[#1e293b] text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-slate-300 font-medium text-[11px]">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                <span>Default Credentials (Customizable via .env)</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                <p>
                  Email: <span className="text-slate-200">russellfoyze007@gmail.com</span>
                </p>
                <p>
                  Password: <span className="text-slate-200">PortalPass2026!</span>
                </p>
                <p>
                  Demo 2FA Code: <span className="text-indigo-400 font-bold">123456</span>
                </p>
              </div>
            </div>
          )}
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
