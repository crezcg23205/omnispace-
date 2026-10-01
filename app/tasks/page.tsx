"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { NotionDatabaseView } from "@/components/tasks/NotionDatabaseView";
import { TaskListView } from "@/components/tasks/TaskListView";
import { TaskKanbanView } from "@/components/tasks/TaskKanbanView";
import { TaskCalendarView } from "@/components/tasks/TaskCalendarView";
import {
  Table2,
  Kanban,
  List,
  Calendar as CalendarIcon,
  Search,
  Plus,
  X,
  Filter,
  Flame,
} from "lucide-react";

function TasksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCreateTaskOpen, setSelectedTaskId } = useWorkspace();

  const [view, setView] = useState<"notion" | "kanban" | "list" | "calendar">("notion");
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [clientFilter, setClientFilter] = useState("");
  const [projectIdFilter, setProjectIdFilter] = useState("");
  const [dueTodayOnly, setDueTodayOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [myTasksOnly, setMyTasksOnly] = useState(false);

  useEffect(() => {
    const taskIdParam = searchParams.get("taskId");
    if (taskIdParam) {
      setSelectedTaskId(taskIdParam);
    }
    const priorityParam = searchParams.get("priority");
    if (priorityParam) setPriorityFilter(priorityParam);

    const statusParam = searchParams.get("status");
    if (statusParam) setStatusFilter(statusParam);

    const clientParam = searchParams.get("client");
    if (clientParam) setClientFilter(clientParam);

    const projectIdParam = searchParams.get("projectId");
    if (projectIdParam) setProjectIdFilter(projectIdParam);

    if (searchParams.get("dueToday") === "true") setDueTodayOnly(true);
    if (searchParams.get("overdue") === "true") setOverdueOnly(true);
    if (searchParams.get("myTasks") === "true") setMyTasksOnly(true);
  }, [searchParams, setSelectedTaskId]);

  const clearAllFilters = () => {
    setStatusFilter("All");
    setPriorityFilter("All");
    setClientFilter("");
    setProjectIdFilter("");
    setDueTodayOnly(false);
    setOverdueOnly(false);
    setMyTasksOnly(false);
    setSearch("");
    router.push("/tasks");
  };

  const hasActiveFilters =
    statusFilter !== "All" ||
    priorityFilter !== "All" ||
    clientFilter !== "" ||
    projectIdFilter !== "" ||
    dueTodayOnly ||
    overdueOnly ||
    myTasksOnly ||
    search.trim() !== "";

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "All") params.append("status", statusFilter);
      if (priorityFilter !== "All") params.append("priority", priorityFilter);
      if (clientFilter) params.append("client", clientFilter);
      if (projectIdFilter) params.append("projectId", projectIdFilter);
      if (dueTodayOnly) params.append("dueToday", "true");
      if (overdueOnly) params.append("overdue", "true");
      if (myTasksOnly) params.append("myTasks", "true");
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (e) {
      console.error("Failed to fetch tasks", e);
    } finally {
      setLoading(false);
    }
  }, [
    statusFilter,
    priorityFilter,
    clientFilter,
    projectIdFilter,
    dueTodayOnly,
    overdueOnly,
    myTasksOnly,
    search,
  ]);

  useEffect(() => {
    fetchTasks();

    const handleRefresh = () => fetchTasks();
    window.addEventListener("task-created", handleRefresh);
    window.addEventListener("task-updated", handleRefresh);
    window.addEventListener("task-deleted", handleRefresh);

    return () => {
      window.removeEventListener("task-created", handleRefresh);
      window.removeEventListener("task-updated", handleRefresh);
      window.removeEventListener("task-deleted", handleRefresh);
    };
  }, [fetchTasks]);

  return (
    <div className="flex-1 bg-[#191919] min-h-screen text-[#ededed]">
      {/* View Switcher & Quick Search Header Bar */}
      <div className="px-8 py-3 flex items-center justify-between border-b border-[#2d2d2d] bg-[#191919]">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#222222] p-0.5 rounded-lg border border-[#303030] text-xs">
            <button
              onClick={() => setView("notion")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
                view === "notion"
                  ? "bg-[#303030] text-white shadow-xs"
                  : "text-[#808080] hover:text-[#ededed]"
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>Notion Table</span>
            </button>
            <button
              onClick={() => setView("kanban")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
                view === "kanban"
                  ? "bg-[#303030] text-white shadow-xs"
                  : "text-[#808080] hover:text-[#ededed]"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
                view === "list"
                  ? "bg-[#303030] text-white shadow-xs"
                  : "text-[#808080] hover:text-[#ededed]"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
                view === "calendar"
                  ? "bg-[#303030] text-white shadow-xs"
                  : "text-[#808080] hover:text-[#ededed]"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#222222] border border-[#303030] text-xs text-[#808080] w-48">
            <Search className="w-3.5 h-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-[#ededed] placeholder-[#666666] text-xs w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateTaskOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2e2e2e] hover:bg-[#383838] border border-[#404040] text-white text-xs font-medium transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Active Filter Pills Banner (Notion-style) */}
      {hasActiveFilters && (
        <div className="mx-8 mt-3 mb-1 px-3 py-2 rounded-lg bg-[#202020] border border-[#333333] flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#888888] font-medium flex items-center gap-1 text-[11px]">
              <Filter className="w-3.5 h-3.5" />
              Active Filters:
            </span>

            {priorityFilter !== "All" && (
              <span className="px-2 py-0.5 rounded bg-[#3d2424] text-[#e05e5e] border border-[#523030] flex items-center gap-1 text-[11px] font-medium">
                <Flame className="w-3 h-3 text-[#e05e5e]" />
                Priority: {priorityFilter}
                <button
                  onClick={() => setPriorityFilter("All")}
                  className="hover:text-white ml-1 text-[#aaaaaa]"
                >
                  ✕
                </button>
              </span>
            )}

            {statusFilter !== "All" && (
              <span className="px-2 py-0.5 rounded bg-[#332c1e] text-[#e0ad48] border border-[#473d2a] flex items-center gap-1 text-[11px] font-medium">
                Status: {statusFilter}
                <button
                  onClick={() => setStatusFilter("All")}
                  className="hover:text-white ml-1 text-[#aaaaaa]"
                >
                  ✕
                </button>
              </span>
            )}

            {clientFilter && (
              <span className="px-2 py-0.5 rounded bg-[#2b2b2b] text-[#cccccc] border border-[#3d3d3d] flex items-center gap-1 text-[11px] font-medium">
                Client: {clientFilter}
                <button
                  onClick={() => setClientFilter("")}
                  className="hover:text-white ml-1 text-[#aaaaaa]"
                >
                  ✕
                </button>
              </span>
            )}

            {projectIdFilter && (
              <span className="px-2 py-0.5 rounded bg-[#2b2b2b] text-[#cccccc] border border-[#3d3d3d] flex items-center gap-1 text-[11px] font-medium">
                Project Filtered
                <button
                  onClick={() => setProjectIdFilter("")}
                  className="hover:text-white ml-1 text-[#aaaaaa]"
                >
                  ✕
                </button>
              </span>
            )}

            {dueTodayOnly && (
              <span className="px-2 py-0.5 rounded bg-[#332c1e] text-[#e0ad48] border border-[#473d2a] flex items-center gap-1 text-[11px] font-medium">
                Due Today
                <button
                  onClick={() => setDueTodayOnly(false)}
                  className="hover:text-white ml-1 text-[#aaaaaa]"
                >
                  ✕
                </button>
              </span>
            )}

            {overdueOnly && (
              <span className="px-2 py-0.5 rounded bg-[#3d2424] text-[#e05e5e] border border-[#523030] flex items-center gap-1 text-[11px] font-medium">
                Overdue
                <button
                  onClick={() => setOverdueOnly(false)}
                  className="hover:text-white ml-1 text-[#aaaaaa]"
                >
                  ✕
                </button>
              </span>
            )}

            {myTasksOnly && (
              <span className="px-2 py-0.5 rounded bg-[#243328] text-[#5ee08a] border border-[#2f4735] flex items-center gap-1 text-[11px] font-medium">
                Assigned to Me
                <button
                  onClick={() => setMyTasksOnly(false)}
                  className="hover:text-white ml-1 text-[#aaaaaa]"
                >
                  ✕
                </button>
              </span>
            )}

            {search.trim() && (
              <span className="px-2 py-0.5 rounded bg-[#252525] text-[#aaaaaa] border border-[#333333] flex items-center gap-1 text-[11px]">
                Search: "{search}"
                <button
                  onClick={() => setSearch("")}
                  className="hover:text-white ml-1 text-[#aaaaaa]"
                >
                  ✕
                </button>
              </span>
            )}
          </div>

          <button
            onClick={clearAllFilters}
            className="text-[11px] text-[#888888] hover:text-[#ededed] underline transition ml-auto"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Main View Display */}
      {loading && tasks.length === 0 ? (
        <div className="py-20 text-center text-xs text-[#808080]">Loading database...</div>
      ) : view === "notion" ? (
        <NotionDatabaseView
          tasks={tasks}
          onTaskUpdated={fetchTasks}
          selectedClientFilter={clientFilter}
          onSelectClient={(c) => setClientFilter(c || "")}
        />
      ) : view === "kanban" ? (
        <div className="p-8">
          <TaskKanbanView tasks={tasks} onTaskUpdated={fetchTasks} />
        </div>
      ) : view === "list" ? (
        <div className="p-8">
          <TaskListView tasks={tasks} onTaskUpdated={fetchTasks} />
        </div>
      ) : (
        <div className="p-8">
          <TaskCalendarView tasks={tasks} />
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#808080]">Loading...</div>}>
      <TasksContent />
    </Suspense>
  );
}
