"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const [workspaceName, setWorkspaceName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshUser } = useWorkspace();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceName,
          name,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        await refreshUser();
        router.push("/");
      } else {
        setError(data.error || "Failed to create workspace");
      }
    } catch {
      setError("An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-[#191919] text-[#ededed]">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#252525] border border-[#333333] text-neutral-100 font-bold text-xl mb-2">
            🚀
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Create Your Workspace
          </h1>
          <p className="text-xs text-neutral-400">
            Setup your company workspace, default databases, and owner credentials
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#202020] p-8 rounded-2xl border border-[#2e2e2e] space-y-5">
          {error && (
            <div className="p-3 text-xs rounded-lg bg-[#381a1d] border border-[#52252a] text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Company / Workspace Name
              </label>
              <input
                type="text"
                required
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="e.g. CREZ Media or Acme Corp"
                className="w-full px-3.5 py-2 rounded-lg border border-[#333333] bg-[#191919] text-xs text-white placeholder-neutral-500 outline-none focus:border-neutral-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Your Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3.5 py-2 rounded-lg border border-[#333333] bg-[#191919] text-xs text-white placeholder-neutral-500 outline-none focus:border-neutral-500 transition"
              />
            </div>

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
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2 rounded-lg border border-[#333333] bg-[#191919] text-xs text-white placeholder-neutral-500 outline-none focus:border-neutral-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#ededed] hover:bg-white text-[#191919] text-xs font-semibold transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                "Creating Workspace..."
              ) : (
                <>
                  <span>Create Workspace & Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Existing account link */}
        <div className="text-center text-xs text-neutral-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-neutral-200 hover:text-white underline underline-offset-4"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
