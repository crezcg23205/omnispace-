"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  department: string | null;
  role: string;
  currentRole: string;
  currentWorkspace: {
    id: string;
    name: string;
    slug: string;
    icon: string;
  };
  workspaces: Array<{
    id: string;
    name: string;
    slug: string;
    icon: string;
    role: string;
  }>;
  unreadNotificationsCount: number;
}

interface WorkspaceContextType {
  user: WorkspaceUser | null;
  loading: boolean;
  theme: "light" | "dark";
  toggleTheme: () => void;
  refreshUser: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  isCreateTaskOpen: boolean;
  setCreateTaskOpen: (open: boolean) => void;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<WorkspaceUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [isCreateTaskOpen, setCreateTaskOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const router = useRouter();

  // Load theme preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("omnispace_theme") as "light" | "dark" | null;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("omnispace_theme", next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error("Failed to load user session", e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const switchWorkspace = async (workspaceId: string) => {
    try {
      const res = await fetch("/api/workspaces", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId }),
      });
      if (res.ok) {
        await refreshUser();
        router.refresh();
      }
    } catch (e) {
      console.error("Failed to switch workspace", e);
    }
  };

  // Keyboard shortcut listener (Cmd/Ctrl + K, C for create task, Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
        setCreateTaskOpen(false);
        setSelectedTaskId(null);
        return;
      }

      if (!isInput) {
        if (e.key === "c" || e.key === "C") {
          e.preventDefault();
          setCreateTaskOpen(true);
        } else if (e.key === "/") {
          e.preventDefault();
          setCommandPaletteOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        user,
        loading,
        theme,
        toggleTheme,
        refreshUser,
        switchWorkspace,
        isCommandPaletteOpen,
        setCommandPaletteOpen,
        isCreateTaskOpen,
        setCreateTaskOpen,
        selectedTaskId,
        setSelectedTaskId,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
