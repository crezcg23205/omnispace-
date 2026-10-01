"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Send,
  FolderKanban,
  Activity as ActivityIcon,
  Plus,
  Flame,
  Building2,
  Calendar,
  User,
  ExternalLink,
} from "lucide-react";
import { format, isPast, isToday, formatDistanceToNow } from "date-fns";

export default function DashboardPage() {
  const { user, setSelectedTaskId, setCreateTaskOpen } = useWorkspace();
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Compact AI prompt input
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const router = useRouter();

  const loadDashboardData = useCallback(async () => {
    try {
      const [tRes, pRes, cRes, aRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/projects"),
        fetch("/api/clients"),
        fetch("/api/activity?limit=10"),
      ]);

      if (tRes.ok) {
        const d = await tRes.json();
        setTasks(d.tasks || []);
      }
      if (pRes.ok) {
        const d = await pRes.json();
        setProjects(d.projects || []);
      }
      if (cRes.ok) {
        const d = await cRes.json();
        setClients(d.clients || []);
      }
      if (aRes.ok) {
        const d = await aRes.json();
        setActivities(d.activities || []);
      }
    } catch (e) {
      console.error("Dashboard data load error", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    const handleRefresh = () => loadDashboardData();
    window.addEventListener("task-created", handleRefresh);
    window.addEventListener("task-updated", handleRefresh);
    window.addEventListener("task-deleted", handleRefresh);

    return () => {
      window.removeEventListener("task-created", handleRefresh);
      window.removeEventListener("task-updated", handleRefresh);
      window.removeEventListener("task-deleted", handleRefresh);
    };
  }, [loadDashboardData]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Filter calculations
  const highPriorityTasks = tasks.filter(
    (t) => (t.priority === "High" || t.priority === "Urgent") && t.status !== "Done" && t.status !== "Cancelled"
  );
  const myAssignedTasks = tasks.filter(
    (t) => t.assigneeId === user?.id && t.status !== "Done" && t.status !== "Cancelled"
  );
  const dueTodayTasks = tasks.filter(
    (t) =>
      t.dueDate &&
      t.status !== "Done" &&
      t.status !== "Cancelled" &&
      isToday(new Date(t.dueDate))
  );
  const overdueTasks = tasks.filter(
    (t) =>
      t.dueDate &&
      t.status !== "Done" &&
      t.status !== "Cancelled" &&
      isPast(new Date(t.dueDate)) &&
      !isToday(new Date(t.dueDate))
  );
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress");
  const completedTasks = tasks.filter((t) => t.status === "Done");

  const handleAskAI = async (customText?: string) => {
    const text = customText || aiPrompt;
    if (!text.trim()) return;

    setAiLoading(true);
    setAiAnswer(null);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          customApiKey: typeof window !== "undefined" ? localStorage.getItem("omnispace_custom_gemini_key") || undefined : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiAnswer(data.content);
        loadDashboardData();
      }
    } catch (e) {
      console.error("AI error", e);
      setAiAnswer("AI assistant is temporarily unavailable.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleQuickStatusDone = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Done" }),
      });
      if (res.ok) {
        loadDashboardData();
      }
    } catch (err) {
      console.error("Failed to mark done", err);
    }
  };

  const getClientTagStyle = (clientName: string) => {
    const name = clientName?.toLowerCase() || "";
    if (name.includes("kamila") || name.includes("keyko")) {
      return "bg-[#453324] text-[#e6a868] border border-[#594230]";
    }
    if (name.includes("danil")) {
      return "bg-[#383329] text-[#c9a76d] border border-[#4d4638]";
    }
    if (name.includes("study")) {
      return "bg-[#3d3826] text-[#ded66a] border border-[#524b33]";
    }
    if (name.includes("ruslan")) {
      return "bg-[#233d2e] text-[#63d994] border border-[#2e523d]";
    }
    if (name.includes("sfad")) {
      return "bg-[#45242b] text-[#e6687a] border border-[#592f38]";
    }
    if (name.includes("bashkent")) {
      return "bg-[#2c3328] text-[#a4c78d] border border-[#3d4737]";
    }
    if (name.includes("doniyor")) {
      return "bg-[#382b24] text-[#d49b6a] border border-[#4a3a30]";
    }
    return "bg-[#333333] text-[#bbbbbb] border border-[#444444]";
  };

  const exampleChips = [
    "What tasks are overdue?",
    "Show tasks for Danil",
    "Show High priority tasks",
    "What is in progress?",
  ];

  return (
    <div className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full bg-[#191919] text-[#ededed]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2d2d2d] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h1 className="text-2xl font-bold tracking-tight text-[#ededed]">
              {greeting}, {user?.name?.split(" ")[0] || "Team"}
            </h1>
          </div>
          <p className="text-xs text-[#808080] mt-1">
            Real-time command center for <span className="font-semibold text-[#cccccc]">{user?.currentWorkspace?.name}</span> • All departments & production lines connected.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/tasks"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252525] hover:bg-[#303030] border border-[#3a3a3a] text-white text-xs font-medium transition"
          >
            <CheckSquare className="w-3.5 h-3.5 text-[#aaaaaa]" />
            <span>Notion Database ({tasks.length})</span>
          </Link>
          <Link
            href="/projects"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252525] hover:bg-[#303030] border border-[#3a3a3a] text-white text-xs font-medium transition"
          >
            <FolderKanban className="w-3.5 h-3.5 text-[#aaaaaa]" />
            <span>Projects ({projects.length})</span>
          </Link>
          <button
            onClick={() => setCreateTaskOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#ededed] hover:bg-white text-[#191919] text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* 1. Overview Interactive Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* High Priority Alert Card */}
        <Link
          href="/tasks?priority=High"
          className="p-4 rounded-xl bg-[#202020] border border-[#452b2b] hover:border-[#663b3b] transition group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#e07575] flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-[#e05e5e]" />
              High Priority
            </span>
            <span className="text-[10px] text-[#e05e5e] font-mono group-hover:translate-x-0.5 transition">➔</span>
          </div>
          <div className="text-2xl font-bold text-[#e05e5e]">
            {highPriorityTasks.length}
          </div>
          <div className="text-[10px] text-[#a66a6a] mt-0.5">Critical attention</div>
        </Link>

        {/* In Progress */}
        <Link
          href="/tasks?status=In Progress"
          className="p-4 rounded-xl bg-[#202020] border border-[#2e2e2e] hover:border-[#444444] transition group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#808080]">In Progress</span>
            <Clock className="w-3.5 h-3.5 text-[#e0ad48]" />
          </div>
          <div className="text-2xl font-bold text-[#e0ad48]">
            {inProgressTasks.length}
          </div>
          <div className="text-[10px] text-[#666666] mt-0.5">Active editing/review</div>
        </Link>

        {/* Due Today */}
        <Link
          href="/tasks?dueToday=true"
          className="p-4 rounded-xl bg-[#202020] border border-[#2e2e2e] hover:border-[#444444] transition group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#808080]">Due Today</span>
            <Calendar className="w-3.5 h-3.5 text-[#e0ad48]" />
          </div>
          <div className="text-2xl font-bold text-[#e0ad48]">
            {dueTodayTasks.length}
          </div>
          <div className="text-[10px] text-[#666666] mt-0.5">Today's deliverables</div>
        </Link>

        {/* Overdue */}
        <Link
          href="/tasks?overdue=true"
          className="p-4 rounded-xl bg-[#202020] border border-[#2e2e2e] hover:border-[#444444] transition group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#808080]">Overdue</span>
            <AlertTriangle className="w-3.5 h-3.5 text-[#e05e5e]" />
          </div>
          <div className="text-2xl font-bold text-[#e05e5e]">
            {overdueTasks.length}
          </div>
          <div className="text-[10px] text-[#666666] mt-0.5">Passed deadline</div>
        </Link>

        {/* Completed */}
        <Link
          href="/tasks?status=Done"
          className="p-4 rounded-xl bg-[#202020] border border-[#2e2e2e] hover:border-[#444444] transition group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#808080]">Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#68d98d]" />
          </div>
          <div className="text-2xl font-bold text-[#68d98d]">
            {completedTasks.length}
          </div>
          <div className="text-[10px] text-[#666666] mt-0.5">Total finished tasks</div>
        </Link>
      </div>

      {/* 2. 🔥 HIGH PRIORITY & URGENT DELIVERABLES SECTION (Core User Request) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#e05e5e]" />
            <h2 className="text-sm font-bold text-[#ededed] uppercase tracking-wider">
              High & Urgent Priority Tasks ({highPriorityTasks.length})
            </h2>
          </div>
          <Link
            href="/tasks?priority=High"
            className="text-xs text-[#808080] hover:text-[#ededed] flex items-center gap-1 transition"
          >
            <span>View in Notion Table</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-[#202020] rounded-xl border border-[#382b2b] overflow-hidden divide-y divide-[#2a2424]">
          {highPriorityTasks.length > 0 ? (
            highPriorityTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="p-3.5 flex items-center justify-between hover:bg-[#252020] cursor-pointer transition group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[#e05e5e] flex-shrink-0 animate-pulse" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white group-hover:text-[#f5a3a3] transition truncate">
                        {task.title}
                      </span>
                      {task.videoNumber && (
                        <span className="text-[10px] text-[#808080] font-mono">
                          #{task.videoNumber}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#808080]">
                      {task.project && (
                        <span className="truncate text-[#999999]">
                          {task.project.name}
                        </span>
                      )}
                      {task.assignee && (
                        <span>• Assigned to {task.assignee.name}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {task.client && (
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded ${getClientTagStyle(
                        task.client.name
                      )}`}
                    >
                      {task.client.name}
                    </span>
                  )}
                  <span className="text-[10px] font-semibold text-[#e05e5e] bg-[#422020] border border-[#592b2b] px-2 py-0.5 rounded">
                    {task.priority}
                  </span>
                  <span className="text-xs text-[#808080]">{task.status}</span>
                  <button
                    onClick={(e) => handleQuickStatusDone(task.id, e)}
                    className="p-1 rounded hover:bg-[#333333] text-[#808080] hover:text-[#68d98d] transition"
                    title="Mark Done"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-[#808080]">
              All high-priority deliverables are up to date! No urgent bottlenecks detected.
            </div>
          )}
        </div>
      </div>

      {/* 3. 🎬 CLIENT PRODUCTION PIPELINES (Relational Notion Rollup) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#808080]" />
            <h2 className="text-sm font-bold text-[#ededed] uppercase tracking-wider">
              Client Production Pipelines ({clients.length})
            </h2>
          </div>
          <Link
            href="/clients"
            className="text-xs text-[#808080] hover:text-[#ededed] flex items-center gap-1 transition"
          >
            <span>View All Clients</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {clients.map((client) => {
            const clientTasks = tasks.filter((t) => t.clientId === client.id);
            const total = clientTasks.length;
            const completed = clientTasks.filter((t) => t.status === "Done").length;
            const inProgress = clientTasks.filter((t) => t.status === "In Progress").length;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <Link
                key={client.id}
                href={`/tasks?client=${encodeURIComponent(client.name)}`}
                className="p-4 rounded-xl bg-[#202020] border border-[#2e2e2e] hover:border-[#444444] transition flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded ${getClientTagStyle(
                        client.name
                      )}`}
                    >
                      {client.name}
                    </span>
                    <span className="text-[11px] font-mono text-[#808080]">
                      {completed}/{total}
                    </span>
                  </div>

                  <h3 className="text-xs font-semibold text-white group-hover:text-amber-300 transition truncate mt-1">
                    {client.company || `${client.name} Series`}
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] text-[#808080] mt-1">
                    <span>{inProgress} In Progress</span>
                    <span>•</span>
                    <span>{total - completed} Remaining</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 space-y-1">
                  <div className="w-full h-1.5 rounded-full bg-[#191919] overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#666666]">
                    <span>Progress</span>
                    <span className="font-mono text-[#808080]">{percent}%</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 4. 📁 ACTIVE PROJECTS WITH LIVE PROGRESS ROLLUPS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-[#808080]" />
            <h2 className="text-sm font-bold text-[#ededed] uppercase tracking-wider">
              Active Projects & Initiatives ({projects.length})
            </h2>
          </div>
          <Link
            href="/projects"
            className="text-xs text-[#808080] hover:text-[#ededed] flex items-center gap-1 transition"
          >
            <span>Projects Page</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => router.push(`/projects?projectId=${proj.id}`)}
              className="p-5 rounded-xl bg-[#202020] border border-[#2e2e2e] hover:border-[#444444] cursor-pointer transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded border bg-[#242424] border-[#383838] text-[#cccccc]">
                    {proj.status}
                  </span>
                  {proj.client && (
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded ${getClientTagStyle(
                        proj.client.name
                      )}`}
                    >
                      {proj.client.name}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition mb-1">
                  {proj.name}
                </h3>
                <p className="text-xs text-[#808080] line-clamp-2 leading-relaxed mb-4">
                  {proj.description || "Video production series for account."}
                </p>
              </div>

              {/* Progress */}
              <div className="space-y-2 pt-3 border-t border-[#282828]">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#808080] font-medium">Task Completion</span>
                  <span className="font-semibold text-white font-mono">
                    {proj.progress}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#191919] overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(proj.progress || 0, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#808080]">
                  <span>{proj.completedTasks || 0}/{proj.totalTasks || 0} tasks done</span>
                  {proj.deadline && (
                    <span>Due {format(new Date(proj.deadline), "MMM d")}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. In Progress Queue & Recent Activities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: In Progress Queue */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#808080]" />
              <h2 className="text-sm font-bold text-[#ededed] uppercase tracking-wider">
                Active In Progress Queue ({inProgressTasks.length})
              </h2>
            </div>
            <Link
              href="/tasks?status=In Progress"
              className="text-xs text-[#808080] hover:text-[#ededed] transition"
            >
              Filter in Database
            </Link>
          </div>

          <div className="bg-[#202020] rounded-xl border border-[#2e2e2e] overflow-hidden divide-y divide-[#282828]">
            {inProgressTasks.length > 0 ? (
              inProgressTasks.slice(0, 6).map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="p-3.5 flex items-center justify-between hover:bg-[#252525] cursor-pointer transition group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-[#e0ad48] flex-shrink-0" />
                    <span className="text-xs font-medium text-[#ededed] truncate group-hover:text-white">
                      {task.title}
                    </span>
                    {task.videoNumber && (
                      <span className="text-[10px] text-[#808080] font-mono">
                        #{task.videoNumber}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {task.client && (
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded ${getClientTagStyle(
                          task.client.name
                        )}`}
                      >
                        {task.client.name}
                      </span>
                    )}
                    <span className="text-[10px] text-[#e0ad48] bg-[#423620] border border-[#59492b] px-2 py-0.5 rounded">
                      {task.priority || "Medium"}
                    </span>
                    <button
                      onClick={(e) => handleQuickStatusDone(task.id, e)}
                      className="p-1 rounded hover:bg-[#333333] text-[#808080] hover:text-[#68d98d] transition"
                      title="Mark Done"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-[#808080]">
                No videos currently in progress.
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Recent Activities */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-[#808080]" />
            <h2 className="text-sm font-bold text-[#ededed] uppercase tracking-wider">
              Workspace Activity
            </h2>
          </div>

          <div className="bg-[#202020] rounded-xl border border-[#2e2e2e] p-3 divide-y divide-[#282828]">
            {activities.length > 0 ? (
              activities.slice(0, 6).map((act) => (
                <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="text-[#aaaaaa] truncate max-w-[200px]">
                    {act.details || act.entityTitle}
                  </span>
                  <span className="text-[10px] text-[#666666] flex-shrink-0">
                    {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-[#666666]">
                No recent activity recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. AI Assistant Quick Query Input Widget */}
      <div className="p-5 rounded-xl bg-[#202020] border border-[#2e2e2e] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Workspace AI Assistant
            </h3>
          </div>
          <Link
            href="/ai"
            className="text-xs text-[#808080] hover:text-[#ededed] flex items-center gap-1 transition"
          >
            <span>Open Dedicated AI Chat</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Search input bar */}
        <div className="flex items-center gap-2 bg-[#191919] rounded-lg p-2 border border-[#333333]">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAskAI();
              }
            }}
            placeholder="Ask workspace anything... (e.g. 'Show high priority tasks' or 'What is remaining for Danil?')"
            className="flex-1 bg-transparent border-none outline-none text-xs text-[#ededed] placeholder-[#666666] px-2"
          />
          <button
            onClick={() => handleAskAI()}
            disabled={aiLoading || !aiPrompt.trim()}
            className="px-3 py-1.5 bg-[#ededed] hover:bg-white text-[#191919] rounded text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {aiLoading ? (
              "Thinking..."
            ) : (
              <>
                <Send className="w-3 h-3" />
                <span>Ask AI</span>
              </>
            )}
          </button>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2">
          {exampleChips.map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setAiPrompt(chip);
                handleAskAI(chip);
              }}
              className="text-[11px] text-[#aaaaaa] bg-[#282828] hover:bg-[#303030] hover:text-white px-2.5 py-1 rounded border border-[#383838] transition"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Live Answer Box */}
        {aiAnswer && (
          <div className="mt-3 p-3.5 rounded-lg bg-[#1a1a1a] border border-[#333333] text-xs leading-relaxed space-y-1.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Workspace Assistant:</span>
            </div>
            <div className="text-[#cccccc] whitespace-pre-line">
              {aiAnswer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
