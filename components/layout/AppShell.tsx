"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useWorkspace } from "../providers/WorkspaceProvider";
import { Sidebar } from "../sidebar/Sidebar";
import { CommandPalette } from "../modals/CommandPalette";
import { CreateTaskModal } from "../modals/CreateTaskModal";
import { TaskDetailPanel } from "../modals/TaskDetailPanel";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useWorkspace();

  const isPublicPage = pathname === "/login" || pathname === "/register";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#191919]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2a2a2a] border border-[#383838] text-white flex items-center justify-center font-bold text-lg shadow-md animate-pulse">
            📁
          </div>
          <p className="text-xs font-semibold text-[#808080]">Loading Notion Workspace...</p>
        </div>
      </div>
    );
  }

  if (isPublicPage) {
    return <main className="min-h-screen bg-[#191919]">{children}</main>;
  }

  if (!user && !isPublicPage) {
    if (typeof window !== "undefined") {
      router.replace("/login");
    }
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#191919] text-[#ededed] font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#191919]">
        {children}
      </main>
      <CommandPalette />
      <CreateTaskModal />
      <TaskDetailPanel />
    </div>
  );
}
