"use client";

import React, { useState } from "react";
import { useWorkspace } from "../providers/WorkspaceProvider";
import {
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  Calendar,
  User,
  Hash,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Image,
  Flame,
} from "lucide-react";
import { format } from "date-fns";

interface NotionDatabaseViewProps {
  tasks: any[];
  onTaskUpdated: () => void;
  selectedClientFilter?: string | null;
  onSelectClient?: (clientName: string | null) => void;
}

export function NotionDatabaseView({
  tasks,
  onTaskUpdated,
  selectedClientFilter,
  onSelectClient,
}: NotionDatabaseViewProps) {
  const { setSelectedTaskId } = useWorkspace();
  const [activeTab, setActiveTab] = useState<"all" | "in_progress" | "high_priority" | "not_started" | "done" | "by_client">("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [newTitleByGroup, setNewTitleByGroup] = useState<Record<string, string>>({});
  const [addingInGroup, setAddingInGroup] = useState<string | null>(null);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleStatusChange = async (taskId: string, newStatus: string, e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) onTaskUpdated();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleInlineCreateTask = async (status: string, clientName?: string) => {
    const title = newTitleByGroup[status]?.trim();
    if (!title) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          status,
          priority: "Medium",
        }),
      });

      if (res.ok) {
        setNewTitleByGroup((prev) => ({ ...prev, [status]: "" }));
        setAddingInGroup(null);
        onTaskUpdated();
      }
    } catch (err) {
      console.error("Failed to inline create task", err);
    }
  };

  // Notion-style Client/Project Tag pill colors - strictly NO blue/purple
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

  // Status pills matching screenshot (In Progress, Not Started, Done) - strictly NO blue/purple
  const getStatusBadge = (st: string) => {
    if (st === "In Progress") {
      return {
        pill: "bg-[#2e2619] text-[#e0ad48] border border-[#453723]",
        dot: "bg-[#e0ad48]",
      };
    }
    if (st === "Done") {
      return {
        pill: "bg-[#213829] text-[#68d98d] border border-[#2b4c37]",
        dot: "bg-[#68d98d]",
      };
    }
    // Not Started / Todo / Backlog
    return {
      pill: "bg-[#333333] text-[#a6a6a6] border border-[#424242]",
      dot: "bg-[#888888]",
    };
  };

  // Priority badge matching screenshot
  const getPriorityStyle = (p: string) => {
    switch (p) {
      case "High":
      case "Urgent":
        return "bg-[#422020] text-[#e05e5e] border border-[#592b2b]";
      case "Medium":
        return "bg-[#423620] text-[#e0ad48] border border-[#59492b]";
      case "Low":
        return "bg-[#20422c] text-[#5ee08a] border border-[#2b593b]";
      default:
        return "bg-[#333333] text-[#999999] border border-[#444444]";
    }
  };

  // Grouping logic
  const statuses = ["In Progress", "Not Started", "Done"];

  // Filter tasks by active tab
  let displayTasks = tasks;
  if (selectedClientFilter) {
    displayTasks = displayTasks.filter((t) =>
      t.client?.name?.toLowerCase().includes(selectedClientFilter.toLowerCase())
    );
  }
  if (activeTab === "in_progress") {
    displayTasks = displayTasks.filter((t) => t.status === "In Progress");
  } else if (activeTab === "high_priority") {
    displayTasks = displayTasks.filter((t) => t.priority === "High" || t.priority === "Urgent");
  } else if (activeTab === "not_started") {
    displayTasks = displayTasks.filter((t) => t.status === "Not Started" || t.status === "Todo" || t.status === "Backlog");
  } else if (activeTab === "done") {
    displayTasks = displayTasks.filter((t) => t.status === "Done");
  }

  // Get unique clients for "By Client" tab
  const uniqueClients = Array.from(
    new Set(tasks.map((t) => t.client?.name || "No Client"))
  );

  return (
    <div className="w-full bg-[#191919] text-[#ededed] min-h-screen font-sans select-none pb-20">
      {/* 1. Notion Top Cover/Action Bar */}
      <div className="px-8 pt-6 pb-2 text-xs text-[#808080] flex items-center gap-4">
        <button className="flex items-center gap-1.5 hover:text-[#ededed] transition">
          <Image className="w-3.5 h-3.5" />
          <span>Add cover</span>
        </button>
        <button className="flex items-center gap-1.5 hover:text-[#ededed] transition">
          <FileText className="w-3.5 h-3.5" />
          <span>Add description</span>
        </button>
      </div>

      {/* 2. Notion Page Title */}
      <div className="px-8 py-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📁</span>
          <h1 className="text-3xl font-bold tracking-tight text-[#ededed]">
            Projects
          </h1>
        </div>
      </div>

      {/* 3. Notion Views Navigation Tabs */}
      <div className="px-8 flex items-center gap-1 border-b border-[#2d2d2d] mb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === "all"
              ? "border-[#ededed] text-[#ededed]"
              : "border-transparent text-[#808080] hover:text-[#b0b0b0]"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>All Projects</span>
        </button>

        <button
          onClick={() => setActiveTab("high_priority")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === "high_priority"
              ? "border-[#e05e5e] text-[#e05e5e]"
              : "border-transparent text-[#808080] hover:text-[#b0b0b0]"
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-[#e05e5e]" />
          <span>High Priority</span>
        </button>

        <button
          onClick={() => setActiveTab("in_progress")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === "in_progress"
              ? "border-[#ededed] text-[#ededed]"
              : "border-transparent text-[#808080] hover:text-[#b0b0b0]"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>In Progress</span>
        </button>

        <button
          onClick={() => setActiveTab("not_started")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === "not_started"
              ? "border-[#ededed] text-[#ededed]"
              : "border-transparent text-[#808080] hover:text-[#b0b0b0]"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Not Started</span>
        </button>

        <button
          onClick={() => setActiveTab("done")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === "done"
              ? "border-[#ededed] text-[#ededed]"
              : "border-transparent text-[#808080] hover:text-[#b0b0b0]"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Done</span>
        </button>

        <button
          onClick={() => setActiveTab("by_client")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition ${
            activeTab === "by_client"
              ? "border-[#ededed] text-[#ededed]"
              : "border-transparent text-[#808080] hover:text-[#b0b0b0]"
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>By Client</span>
        </button>
      </div>

      {/* 4. Notion Table Database Content */}
      <div className="px-8 space-y-6">
        {activeTab !== "by_client" ? (
          // Group by Status
          statuses.map((statusGroup) => {
            const groupTasks = displayTasks.filter((t) => {
              if (statusGroup === "Not Started") {
                return t.status === "Not Started" || t.status === "Todo" || t.status === "Backlog";
              }
              return t.status === statusGroup;
            });

            if (activeTab !== "all" && groupTasks.length === 0) return null;

            const isCollapsed = collapsedGroups[statusGroup] || false;
            const badge = getStatusBadge(statusGroup);

            return (
              <div key={statusGroup} className="space-y-1">
                {/* Group Header Pill */}
                <div
                  onClick={() => toggleGroup(statusGroup)}
                  className="flex items-center gap-2 py-1.5 cursor-pointer text-xs font-semibold group w-fit"
                >
                  <button className="text-[#808080] hover:text-[#ededed]">
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium ${badge.pill}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    <span>{statusGroup}</span>
                  </div>

                  <span className="text-xs text-[#666666] font-mono">
                    {groupTasks.length}
                  </span>
                </div>

                {/* Table for this group */}
                {!isCollapsed && (
                  <div className="w-full border-t border-b border-[#2d2d2d] overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#2d2d2d] text-[#808080] font-normal text-[11px]">
                          <th className="py-2.5 px-3 min-w-[260px] font-normal">
                            <span className="flex items-center gap-1.5">
                              <span className="font-serif">Aa</span>
                              <span>Task / Video</span>
                            </span>
                          </th>
                          <th className="py-2.5 px-3 min-w-[150px] font-normal">
                            <span className="flex items-center gap-1.5">
                              <span>⊙</span>
                              <span>Project / Client</span>
                            </span>
                          </th>
                          <th className="py-2.5 px-3 min-w-[120px] font-normal">
                            <span className="flex items-center gap-1.5">
                              <span>☼</span>
                              <span>Status</span>
                            </span>
                          </th>
                          <th className="py-2.5 px-3 min-w-[100px] font-normal">
                            <span className="flex items-center gap-1.5">
                              <span>⊙</span>
                              <span>Priority</span>
                            </span>
                          </th>
                          <th className="py-2.5 px-3 min-w-[160px] font-normal">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Deadline</span>
                            </span>
                          </th>
                          <th className="py-2.5 px-3 min-w-[150px] font-normal">
                            <span className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" />
                              <span>Notes</span>
                            </span>
                          </th>
                          <th className="py-2.5 px-3 min-w-[180px] font-normal">
                            <span className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5" />
                              <span>Assignee</span>
                            </span>
                          </th>
                          <th className="py-2.5 px-3 min-w-[120px] font-normal">
                            <span className="flex items-center gap-1.5">
                              <Hash className="w-3.5 h-3.5" />
                              <span>Video Number</span>
                            </span>
                          </th>
                          <th className="py-2.5 px-3 w-8 font-normal text-right">
                            <Plus className="w-3.5 h-3.5 text-[#666666] inline" />
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#262626]">
                        {groupTasks.map((task) => {
                          const clientName = task.client?.name || "";
                          const taskBadge = getStatusBadge(task.status);

                          return (
                            <tr
                              key={task.id}
                              onClick={() => setSelectedTaskId(task.id)}
                              className="hover:bg-[#202020] cursor-pointer transition group"
                            >
                              {/* Task / Video Title */}
                              <td className="py-2 px-3 text-[#ededed]">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-3.5 h-3.5 text-[#808080] flex-shrink-0" />
                                  <span className="font-medium truncate max-w-[280px]">
                                    {task.title}
                                  </span>
                                </div>
                              </td>

                              {/* Project / Client colored pill */}
                              <td className="py-2 px-3">
                                {clientName ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectClient?.(clientName);
                                    }}
                                    title={`Filter tasks by ${clientName}`}
                                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium tracking-wide hover:opacity-80 transition cursor-pointer ${getClientTagStyle(
                                      clientName
                                    )}`}
                                  >
                                    {clientName}
                                  </button>
                                ) : (
                                  <span className="text-[#555555]">--</span>
                                )}
                              </td>

                              {/* Status Dropdown */}
                              <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                                <select
                                  value={task.status}
                                  onChange={(e) => handleStatusChange(task.id, e.target.value, e)}
                                  className={`text-[11px] font-medium rounded px-2 py-0.5 outline-none cursor-pointer ${taskBadge.pill}`}
                                >
                                  <option value="In Progress" className="bg-[#202020] text-[#e0ad48]">
                                    In Progress
                                  </option>
                                  <option value="Not Started" className="bg-[#202020] text-[#a6a6a6]">
                                    Not Started
                                  </option>
                                  <option value="Done" className="bg-[#202020] text-[#68d98d]">
                                    Done
                                  </option>
                                </select>
                              </td>

                              {/* Priority Pill */}
                              <td className="py-2 px-3">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${getPriorityStyle(
                                    task.priority
                                  )}`}
                                >
                                  {task.priority || "Medium"}
                                </span>
                              </td>

                              {/* Deadline */}
                              <td className="py-2 px-3 text-[#9b9b9b] font-mono text-[11px]">
                                {task.dueDate ? (
                                  <span>{format(new Date(task.dueDate), "dd/MM/yyyy h:mm a")}</span>
                                ) : (
                                  <span className="text-[#444444]">--</span>
                                )}
                              </td>

                              {/* Notes */}
                              <td className="py-2 px-3 text-[#808080] truncate max-w-[150px]">
                                {task.notes || task.description || ""}
                              </td>

                              {/* Assignee */}
                              <td className="py-2 px-3">
                                {task.assignee ? (
                                  <div className="flex items-center gap-1.5 text-[11px] text-[#ededed]">
                                    <span className="w-4 h-4 rounded-full bg-[#333333] text-[#aaaaaa] flex items-center justify-center font-bold text-[9px]">
                                      {task.assignee.name?.[0] || "M"}
                                    </span>
                                    <span className="truncate max-w-[150px]">
                                      {task.assignee.name}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[#444444]">--</span>
                                )}
                              </td>

                              {/* Video Number */}
                              <td className="py-2 px-3 text-[#ededed] font-mono text-center">
                                {task.videoNumber || ""}
                              </td>

                              {/* Actions */}
                              <td className="py-2 px-3 text-right">
                                <span className="opacity-0 group-hover:opacity-100 text-[#666666]">
                                  •••
                                </span>
                              </td>
                            </tr>
                          );
                        })}

                        {/* Inline Create Row */}
                        {addingInGroup === statusGroup ? (
                          <tr className="bg-[#202020]">
                            <td className="py-2 px-3" colSpan={9}>
                              <div className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-[#808080]" />
                                <input
                                  type="text"
                                  autoFocus
                                  value={newTitleByGroup[statusGroup] || ""}
                                  onChange={(e) =>
                                    setNewTitleByGroup((prev) => ({
                                      ...prev,
                                      [statusGroup]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleInlineCreateTask(statusGroup);
                                    } else if (e.key === "Escape") {
                                      setAddingInGroup(null);
                                    }
                                  }}
                                  placeholder="Task / Video name... (Press Enter to save, Esc to cancel)"
                                  className="w-full bg-transparent border-none outline-none text-xs text-[#ededed] placeholder-[#666666]"
                                />
                                <button
                                  onClick={() => handleInlineCreateTask(statusGroup)}
                                  className="px-2.5 py-1 bg-[#333333] hover:bg-[#444444] text-white rounded text-[11px] font-semibold flex-shrink-0"
                                >
                                  Save
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>

                    {/* Notion + New task button at bottom of group */}
                    <div className="py-1.5 px-3">
                      <button
                        onClick={() => {
                          setAddingInGroup(statusGroup);
                          setNewTitleByGroup((prev) => ({ ...prev, [statusGroup]: "" }));
                        }}
                        className="flex items-center gap-2 text-xs text-[#808080] hover:text-[#ededed] transition py-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>New task</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          // Group by Client
          uniqueClients.map((clientName) => {
            const groupTasks = tasks.filter((t) => (t.client?.name || "No Client") === clientName);
            const isCollapsed = collapsedGroups[clientName] || false;

            return (
              <div key={clientName} className="space-y-1">
                <div
                  onClick={() => toggleGroup(clientName)}
                  className="flex items-center gap-2 py-1.5 cursor-pointer text-xs font-semibold group w-fit"
                >
                  <button className="text-[#808080]">
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${getClientTagStyle(clientName)}`}>
                    {clientName}
                  </span>
                  <span className="text-xs text-[#666666] font-mono">{groupTasks.length}</span>
                </div>

                {!isCollapsed && (
                  <div className="w-full border-t border-b border-[#2d2d2d] overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#2d2d2d] text-[#808080] font-normal text-[11px]">
                          <th className="py-2.5 px-3 min-w-[260px] font-normal">Task / Video</th>
                          <th className="py-2.5 px-3 min-w-[120px] font-normal">Status</th>
                          <th className="py-2.5 px-3 min-w-[100px] font-normal">Priority</th>
                          <th className="py-2.5 px-3 min-w-[160px] font-normal">Deadline</th>
                          <th className="py-2.5 px-3 min-w-[180px] font-normal">Assignee</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#262626]">
                        {groupTasks.map((task) => {
                          const taskBadge = getStatusBadge(task.status);
                          return (
                            <tr
                              key={task.id}
                              onClick={() => setSelectedTaskId(task.id)}
                              className="hover:bg-[#202020] cursor-pointer transition"
                            >
                              <td className="py-2 px-3 text-[#ededed] font-medium flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-[#808080]" />
                                <span>{task.title}</span>
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${taskBadge.pill}`}>
                                  {task.status}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${getPriorityStyle(task.priority)}`}>
                                  {task.priority || "Medium"}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-[#9b9b9b] font-mono text-[11px]">
                                {task.dueDate ? format(new Date(task.dueDate), "dd/MM/yyyy h:mm a") : "--"}
                              </td>
                              <td className="py-2 px-3 text-[#ededed] text-[11px]">
                                {task.assignee?.name || "--"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
