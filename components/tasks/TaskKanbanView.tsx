"use client";

import React, { useState } from "react";
import { useWorkspace } from "../providers/WorkspaceProvider";
import {
  Calendar,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";

const COLUMNS = [
  { id: "Not Started", label: "Not Started", color: "bg-[#888888]" },
  { id: "In Progress", label: "In Progress", color: "bg-[#e0ad48]" },
  { id: "Review", label: "Review", color: "bg-[#d49b6a]" },
  { id: "Done", label: "Done", color: "bg-[#68d98d]" },
];

interface TaskKanbanProps {
  tasks: any[];
  onTaskUpdated: () => void;
}

export function TaskKanbanView({ tasks, onTaskUpdated }: TaskKanbanProps) {
  const { setSelectedTaskId, setCreateTaskOpen } = useWorkspace();
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    setDraggingTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData("text/plain") || draggingTaskId;
    setDraggingTaskId(null);

    if (!taskId) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: colId }),
      });
      if (res.ok) {
        onTaskUpdated();
      }
    } catch (e) {
      console.error("Failed to move task", e);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Urgent":
      case "High":
        return "bg-[#422020] text-[#e05e5e] border border-[#592b2b]";
      case "Medium":
        return "bg-[#423620] text-[#e0ad48] border border-[#59492b]";
      case "Low":
        return "bg-[#20422c] text-[#5ee08a] border border-[#2b593b]";
      default:
        return "bg-[#2e2e2e] text-[#999999] border border-[#3e3e3e]";
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 select-none min-h-[600px]">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => {
          if (col.id === "Not Started") {
            return t.status === "Not Started" || t.status === "Todo" || t.status === "Backlog";
          }
          return t.status === col.id;
        });
        const isHovered = dragOverColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`w-72 flex-shrink-0 flex flex-col rounded-xl p-2.5 transition duration-150 ${
              isHovered
                ? "bg-[#282828] ring-1 ring-[#555555]"
                : "bg-[#202020] border border-[#2e2e2e]"
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 py-1.5 mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${col.color}`} />
                <span className="text-xs font-semibold text-[#ededed]">
                  {col.label}
                </span>
                <span className="text-[11px] font-semibold text-[#808080] bg-[#191919] px-1.5 py-0.5 rounded border border-[#2e2e2e]">
                  {columnTasks.length}
                </span>
              </div>
              <button
                onClick={() => setCreateTaskOpen(true)}
                className="p-1 rounded text-[#808080] hover:text-[#ededed] hover:bg-[#282828] transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Task Cards */}
            <div className="flex-1 space-y-2 overflow-y-auto min-h-[100px]">
              {columnTasks.map((task) => {
                const isOverdue =
                  task.dueDate &&
                  task.status !== "Done" &&
                  task.status !== "Cancelled" &&
                  isPast(new Date(task.dueDate)) &&
                  !isToday(new Date(task.dueDate));

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="p-3 rounded-lg bg-[#252525] border border-[#303030] hover:border-[#454545] cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${getPriorityBadge(
                          task.priority
                        )}`}
                      >
                        {task.priority || "Medium"}
                      </span>
                      {task.client && (
                        <span className="text-[10px] font-medium text-[#808080] truncate max-w-[120px]">
                          {task.client.name}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-medium text-[#ededed] mb-2 line-clamp-2">
                      {task.title}
                    </h4>

                    <div className="flex items-center justify-between pt-2 border-t border-[#303030] text-[11px] text-[#808080]">
                      <div className="flex items-center gap-1.5">
                        {task.dueDate ? (
                          <div
                            className={`flex items-center gap-1 ${
                              isOverdue ? "text-[#e05e5e] font-semibold" : ""
                            }`}
                          >
                            {isOverdue ? (
                              <AlertTriangle className="w-3 h-3 text-[#e05e5e]" />
                            ) : (
                              <Clock className="w-3 h-3 text-[#808080]" />
                            )}
                            <span>{format(new Date(task.dueDate), "MMM d")}</span>
                          </div>
                        ) : (
                          <span className="text-[#555555]">No date</span>
                        )}
                      </div>

                      {task.assignee ? (
                        <span className="w-5 h-5 rounded-full bg-[#333333] text-[#aaaaaa] flex items-center justify-center font-bold text-[9px]">
                          {task.assignee.name[0]}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
