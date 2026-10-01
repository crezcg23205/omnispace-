"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { ArrowRight } from "lucide-react";

const DEMO_USERS = [
  { name: "Muhammadamin", email: "muhammadamin@company.com", role: "Owner" },
  { name: "Muxammadraxim Baxriddin", email: "muxammadraxim@company.com", role: "Video Lead" },
  { name: "crez", email: "crez@company.com", role: "Editor" },
  { name: "Ali", email: "ali@company.com", role: "Design" },
  { name: "Aziz", email: "aziz@company.com", role: "Production" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("muhammadamin@company.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshUser } = useWorkspace();

  const handleLogin = async (e?: React.FormEvent, customEmail?: string) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    const loginEmail = customEmail || email;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        await refreshUser();
        router.push("/");
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoUser = (userEmail: string) => {
    setEmail(userEmail);
    setPassword("password123");
    handleLogin(undefined, userEmail);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-[#191919] text-[#ededed]">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#252525] border border-[#333333] text-neutral-100 font-bold text-xl mb-2">
            ⚡
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome to OmniSpace
          </h1>
          <p className="text-xs text-neutral-400">
            Company workspace & video production database
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#202020] p-8 rounded-2xl border border-[#2e2e2e] space-y-5">
          {error && (
            <div className="p-3 text-xs rounded-lg bg-[#381a1d] border border-[#52252a] text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full px-3.5 py-2 rounded-lg border border-[#333333] bg-[#191919] text-xs text-white placeholder-neutral-500 outline-none focus:border-neutral-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 rounded-lg border border-[#333333] bg-[#191919] text-xs text-white placeholder-neutral-500 outline-none focus:border-neutral-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#ededed] hover:bg-white text-[#191919] text-xs font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                "Signing in..."
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="pt-4 border-t border-[#2e2e2e] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                1-Click Demo Accounts
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">pass: password123</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => handleQuickDemoUser(u.email)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg border border-[#2e2e2e] hover:border-[#444444] bg-[#252525] text-left transition group"
                >
                  <div className="truncate">
                    <span className="text-xs font-medium text-neutral-200 group-hover:text-white">
                      {u.name}
                    </span>
                    <span className="text-[11px] text-neutral-400 ml-1.5">({u.role})</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-neutral-400 group-hover:translate-x-0.5 transition" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Link to Onboarding */}
        <div className="text-center text-xs text-neutral-400">
          Want to start a brand new company workspace?{" "}
          <Link
            href="/register"
            className="font-medium text-neutral-200 hover:text-white underline underline-offset-4"
          >
            Create Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
