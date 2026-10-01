"use client";

import React, { useState, useEffect } from "react";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import {
  Building2,
  Sparkles,
  Sun,
  Moon,
  Save,
  Check,
  Key,
} from "lucide-react";

export default function SettingsPage() {
  const { user, theme, toggleTheme, refreshUser } = useWorkspace();

  // Workspace state
  const [workspaceName, setWorkspaceName] = useState(user?.currentWorkspace?.name || "");
  const [workspaceIcon, setWorkspaceIcon] = useState(user?.currentWorkspace?.icon || "⚡");

  // User state
  const [userName, setUserName] = useState(user?.name || "");
  const [userDept, setUserDept] = useState(user?.department || "Video Production");

  // AI settings
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");

  // Feedback states
  const [wsSaved, setWsSaved] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setWorkspaceName(user.currentWorkspace?.name || "");
      setWorkspaceIcon(user.currentWorkspace?.icon || "⚡");
      setUserName(user.name || "");
      setUserDept(user.department || "General");
    }

    const savedKey = localStorage.getItem("omnispace_custom_gemini_key");
    if (savedKey) setGeminiApiKey(savedKey);
    const savedModel = localStorage.getItem("omnispace_ai_model");
    if (savedModel) setSelectedModel(savedModel);
  }, [user]);

  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/workspaces", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName, icon: workspaceIcon }),
      });
      if (res.ok) {
        setWsSaved(true);
        setTimeout(() => setWsSaved(false), 2000);
        refreshUser();
      }
    } catch (e) {
      console.error("Failed to update workspace", e);
    }
  };

  const handleSaveAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (geminiApiKey.trim()) {
      localStorage.setItem("omnispace_custom_gemini_key", geminiApiKey.trim());
    } else {
      localStorage.removeItem("omnispace_custom_gemini_key");
    }
    localStorage.setItem("omnispace_ai_model", selectedModel);
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 2000);
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 max-w-4xl mx-auto w-full text-[#ededed]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Settings & Workspace Configuration
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Manage workspace settings, AI model keys, personal preferences, and appearance
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Workspace Configuration Card */}
        <div className="p-6 rounded-xl bg-[#202020] border border-[#2e2e2e] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#2e2e2e] pb-3">
            <Building2 className="w-5 h-5 text-neutral-300" />
            <h2 className="text-sm font-semibold text-white">
              Workspace Settings
            </h2>
          </div>

          <form onSubmit={handleSaveWorkspace} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Workspace Icon
                </label>
                <input
                  type="text"
                  value={workspaceIcon}
                  onChange={(e) => setWorkspaceIcon(e.target.value)}
                  className="w-full text-center text-xl p-2 rounded-lg border border-[#333333] bg-[#191919] text-white"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Company / Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[#333333] bg-[#191919] text-white outline-none focus:border-neutral-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#ededed] hover:bg-white text-[#191919] rounded-lg text-xs font-semibold transition"
              >
                {wsSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span>{wsSaved ? "Saved" : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* 2. Google Gemini AI Settings Card */}
        <div className="p-6 rounded-xl bg-[#202020] border border-[#2e2e2e] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#2e2e2e] pb-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">
              Google Gemini AI Integration
            </h2>
          </div>

          <form onSubmit={handleSaveAI} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Gemini API Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Paste your free GEMINI_API_KEY from Google AI Studio..."
                  className="w-full text-xs p-2.5 pl-9 rounded-lg border border-[#333333] bg-[#191919] text-white font-mono placeholder-neutral-600 outline-none focus:border-neutral-500"
                />
                <Key className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                You can obtain a 100% free API key at{" "}
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-neutral-200 underline underline-offset-2 hover:text-white"
                >
                  aistudio.google.com
                </a>
                . The key is securely used locally.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Model Tier
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-[#333333] bg-[#191919] text-white outline-none"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest, High Intelligence & Function Calling)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Standard Free Tier)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#ededed] hover:bg-white text-[#191919] rounded-lg text-xs font-semibold transition"
              >
                {aiSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span>{aiSaved ? "AI Key Saved" : "Save AI Key"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* 3. Appearance & Theme Card */}
        <div className="p-6 rounded-xl bg-[#202020] border border-[#2e2e2e] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Theme & Appearance</h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Notion dark palette optimized for focus and contrast
            </p>
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#333333] bg-[#191919] hover:bg-[#252525] text-xs font-medium transition"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-neutral-300" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
