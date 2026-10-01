"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useWorkspace } from "../providers/WorkspaceProvider";
import {
  Home,
  Inbox,
  CheckSquare,
  FolderKanban,
  Users,
  FileText,
  Calendar,
  Sparkles,
  Search,
  Settings,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  Layers,
  Briefcase,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    theme,
    toggleTheme,
    refreshUser,
    switchWorkspace,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    setCommandPaletteOpen,
    setCreateTaskOpen,
  } = useWorkspace();

  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await refreshUser();
      router.push("/login");
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const navItems = [
    { label: "Projects (Notion DB)", href: "/tasks", icon: CheckSquare, highlight: true },
    { label: "Home Dashboard", href: "/", icon: Home },
    {
      label: "Inbox",
      href: "/inbox",
      icon: Inbox,
      badge: user?.unreadNotificationsCount ? user.unreadNotificationsCount : undefined,
    },
    { label: "My Tasks", href: "/tasks?myTasks=true", icon: Layers },
    { label: "All Projects", href: "/projects", icon: FolderKanban },
    { label: "Clients", href: "/clients", icon: Briefcase },
    { label: "Team", href: "/team", icon: Users },
    { label: "Wiki & Documents", href: "/documents", icon: FileText },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "AI Assistant", href: "/ai", icon: Sparkles },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-[#2d2d2d] bg-[#191919] text-[#ededed] transition-all duration-200 ease-in-out z-30 select-none ${
        isSidebarCollapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Workspace Switcher Header */}
      <div className="p-3 border-b border-[#2d2d2d] flex items-center justify-between">
        {!isSidebarCollapsed ? (
          <div className="relative flex-1">
            <button
              onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
              className="flex items-center gap-2.5 w-full p-1.5 rounded-lg hover:bg-[#252525] transition text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-[#2a2a2a] border border-[#383838] text-white flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                {user?.currentWorkspace?.icon || "📁"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate text-[#ededed]">
                  {user?.currentWorkspace?.name || "Projects Workspace"}
                </div>
                <div className="text-[11px] text-[#808080] capitalize">
                  {user?.currentRole || "Member"}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#808080]" />
            </button>

            {workspaceMenuOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-[#202020] border border-[#333333] rounded-xl shadow-2xl py-2 z-50">
                <div className="px-3 py-1.5 text-[10px] font-bold text-[#808080] uppercase tracking-wider">
                  Workspaces
                </div>
                {user?.workspaces?.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws.id);
                      setWorkspaceMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 w-full px-3 py-1.5 text-xs text-left hover:bg-[#2a2a2a] transition ${
                      ws.id === user.currentWorkspace.id
                        ? "font-semibold text-white bg-[#2a2a2a]"
                        : "text-[#aaaaaa]"
                    }`}
                  >
                    <span>{ws.icon || "📁"}</span>
                    <span className="truncate flex-1">{ws.name}</span>
                    <span className="text-[10px] text-[#666666]">{ws.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full flex justify-center py-1">
            <div className="w-8 h-8 rounded-lg bg-[#2a2a2a] border border-[#383838] text-white flex items-center justify-center font-bold text-xs">
              {user?.currentWorkspace?.icon || "📁"}
            </div>
          </div>
        )}
      </div>

      {/* Quick Search & New Task Buttons */}
      <div className="p-3 space-y-2">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className={`flex items-center gap-2.5 w-full py-1.5 px-2.5 rounded-lg border border-[#303030] bg-[#222222] text-[#808080] hover:bg-[#282828] hover:text-[#ededed] transition text-xs font-medium ${
            isSidebarCollapsed ? "justify-center" : ""
          }`}
          title="Search (Cmd + K)"
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0" />
          {!isSidebarCollapsed && (
            <>
              <span className="flex-1 text-left">Search...</span>
              <kbd className="px-1.5 py-0.5 text-[10px] bg-[#1a1a1a] text-[#808080] rounded border border-[#333333] font-mono">
                ⌘K
              </kbd>
            </>
          )}
        </button>

        <button
          onClick={() => setCreateTaskOpen(true)}
          className={`flex items-center gap-2 w-full py-1.5 px-2.5 rounded-lg bg-[#2e2e2e] hover:bg-[#383838] border border-[#404040] text-white transition text-xs font-medium shadow-xs ${
            isSidebarCollapsed ? "justify-center" : ""
          }`}
          title="Create Task (C)"
        >
          <Plus className="w-3.5 h-3.5 flex-shrink-0" />
          {!isSidebarCollapsed && (
            <>
              <span className="flex-1 text-left font-medium">New Task</span>
              <kbd className="px-1 py-0.2 text-[10px] bg-[#222222] rounded text-[#808080] font-mono">
                C
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {!isSidebarCollapsed && (
          <div className="px-2 pt-2 pb-1 text-[10px] font-bold text-[#666666] uppercase tracking-wider">
            Workspace
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href.split("?")[0];
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition font-medium group ${
                isActive
                  ? "bg-[#252525] text-white font-semibold"
                  : "text-[#9b9b9b] hover:bg-[#222222] hover:text-[#ededed]"
              } ${isSidebarCollapsed ? "justify-center" : ""}`}
              title={item.label}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0 text-[#808080] group-hover:text-[#ededed]" />
              {!isSidebarCollapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-bold bg-[#e05e5e] text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Settings & User Menu */}
      <div className="p-2 border-t border-[#2d2d2d] space-y-1">
        <div className="flex items-center justify-between px-1">
          <Link
            href="/settings"
            className="p-1.5 rounded-lg text-[#808080] hover:bg-[#252525] hover:text-[#ededed] transition"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg text-[#808080] hover:bg-[#252525] hover:text-[#ededed] transition"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Pill */}
        <div className="relative pt-1">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={`flex items-center gap-2.5 w-full p-1.5 rounded-lg hover:bg-[#252525] transition text-left ${
              isSidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-[#333333] flex items-center justify-center font-bold text-xs text-[#ededed] overflow-hidden flex-shrink-0">
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.[0] || "U"
              )}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate text-[#ededed]">
                  {user?.name || "Account"}
                </div>
                <div className="text-[10px] text-[#808080] truncate">{user?.email}</div>
              </div>
            )}
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-full left-0 mb-1 w-52 bg-[#202020] border border-[#333333] rounded-xl shadow-2xl py-1 z-50">
              <div className="px-3 py-2 border-b border-[#2d2d2d]">
                <p className="text-xs font-semibold text-[#ededed]">{user?.name}</p>
                <p className="text-[10px] text-[#808080]">{user?.email}</p>
              </div>
              <Link
                href="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-[#aaaaaa] hover:bg-[#2a2a2a] hover:text-white"
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#e05e5e] hover:bg-[#332020] text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
