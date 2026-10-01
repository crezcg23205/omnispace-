"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "../providers/WorkspaceProvider";
import {
  Search,
  CheckSquare,
  FolderKanban,
  FileText,
  Briefcase,
  Users,
  Sparkles,
  Plus,
  ArrowRight,
} from "lucide-react";

interface SearchResult {
  id: string;
  type: "TASK" | "PROJECT" | "CLIENT" | "DOCUMENT" | "MEMBER";
  title: string;
  subtitle: string;
  url: string;
}

export function CommandPalette() {
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setCreateTaskOpen,
    setSelectedTaskId,
  } = useWorkspace();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isCommandPaletteOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setSelectedIndex(0);
        }
      } catch (e) {
        console.error("Search error", e);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isCommandPaletteOpen) return null;

  const quickActions = [
    {
      id: "action-task",
      title: "Create new task",
      subtitle: "Shortcut: C",
      icon: Plus,
      action: () => {
        setCommandPaletteOpen(false);
        setCreateTaskOpen(true);
      },
    },
    {
      id: "action-project",
      title: "Create new project",
      subtitle: "Add project with client & deadline",
      icon: FolderKanban,
      action: () => {
        setCommandPaletteOpen(false);
        router.push("/projects?new=true");
      },
    },
    {
      id: "action-doc",
      title: "Create Notion-style page",
      subtitle: "Add wiki page or SOP document",
      icon: FileText,
      action: () => {
        setCommandPaletteOpen(false);
        router.push("/documents?new=true");
      },
    },
    {
      id: "action-ai",
      title: "Ask Workspace AI",
      subtitle: "Search, summarize, or manage tasks",
      icon: Sparkles,
      action: () => {
        setCommandPaletteOpen(false);
        router.push("/ai");
      },
    },
  ];

  const handleSelectResult = (item: SearchResult) => {
    setCommandPaletteOpen(false);
    if (item.type === "TASK") {
      setSelectedTaskId(item.id);
    } else {
      router.push(item.url);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = query.trim() ? results.length : quickActions.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(totalItems, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % Math.max(totalItems, 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (query.trim() && results[selectedIndex]) {
        handleSelectResult(results[selectedIndex]);
      } else if (!query.trim() && quickActions[selectedIndex]) {
        quickActions[selectedIndex].action();
      }
    }
  };

  const getTypeIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "TASK":
        return <CheckSquare className="w-4 h-4 text-[#68d98d]" />;
      case "PROJECT":
        return <FolderKanban className="w-4 h-4 text-[#c9a76d]" />;
      case "CLIENT":
        return <Briefcase className="w-4 h-4 text-[#e6a868]" />;
      case "DOCUMENT":
        return <FileText className="w-4 h-4 text-[#ded66a]" />;
      case "MEMBER":
        return <Users className="w-4 h-4 text-[#e05e5e]" />;
      default:
        return <Search className="w-4 h-4 text-[#808080]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-[#202020] rounded-xl shadow-2xl border border-[#333333] overflow-hidden flex flex-col max-h-[80vh] text-[#ededed]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#2d2d2d]">
          <Search className="w-4 h-4 text-[#808080]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search workspace..."
            className="flex-1 bg-transparent border-none outline-none text-xs text-[#ededed] placeholder-[#666666]"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] bg-[#1a1a1a] text-[#808080] rounded border border-[#333333] font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 flex-1">
          {loading ? (
            <div className="py-8 text-center text-xs text-[#808080]">Searching workspace...</div>
          ) : query.trim() ? (
            results.length > 0 ? (
              results.map((r, i) => (
                <div
                  key={`${r.type}-${r.id}`}
                  onClick={() => handleSelectResult(r)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-xs transition ${
                    i === selectedIndex
                      ? "bg-[#2a2a2a] text-white font-medium"
                      : "text-[#aaaaaa] hover:bg-[#252525]"
                  }`}
                >
                  <div className="p-1 rounded bg-[#2a2a2a]">
                    {getTypeIcon(r.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-semibold text-[#ededed]">
                      {r.title}
                    </div>
                    <div className="text-[11px] text-[#808080] truncate">{r.subtitle}</div>
                  </div>
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-[#2a2a2a] text-[#808080] rounded border border-[#333333]">
                    {r.type}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#666666]" />
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-[#808080]">
                No matching results found for &quot;{query}&quot;
              </div>
            )
          ) : (
            <div>
              <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-[#666666] uppercase tracking-wider">
                Quick Actions
              </div>
              {quickActions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.id}
                    onClick={action.action}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-xs transition ${
                      i === selectedIndex
                        ? "bg-[#2a2a2a] text-white font-medium"
                        : "text-[#aaaaaa] hover:bg-[#252525]"
                    }`}
                  >
                    <div className="p-1 rounded bg-[#2a2a2a] text-[#808080]">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium text-[#ededed]">
                        {action.title}
                      </div>
                      <div className="text-[10px] text-[#666666] truncate">{action.subtitle}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#666666]" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-[#1c1c1c] border-t border-[#2d2d2d] text-[10px] text-[#666666] flex items-center justify-between">
          <span>Navigate with ↑ ↓ and Enter to select</span>
          <span>Notion Command Palette</span>
        </div>
      </div>
    </div>
  );
}
