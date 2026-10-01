"use client";

import React from "react";
import { useWorkspace } from "../providers/WorkspaceProvider";
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";

interface TaskListViewProps {
  tasks: any[];
  onTaskUpdated: () => void;
}

export function TaskListView({ tasks, onTaskUpdated }: TaskListViewProps) {
  const { setSelectedTaskId } = useWorkspace();

  const handleStatusChange = async (taskId: string, newStatus: string, e: React.MouseEvent | React.ChangeEvent) => {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Done":
        return "bg-[#213829] text-[#68d98d] border border-[#2b4c37]";
      case "In Progress":
        return "bg-[#2e2619] text-[#e0ad48] border border-[#453723]";
      case "Review":
        return "bg-[#423620] text-[#e0ad48] border border-[#59492b]";
      default:
        return "bg-[#333333] text-[#a6a6a6] border border-[#424242]";
    }
  };

  return (
    <div className="w-full bg-[#191919] rounded-xl border border-[#2d2d2d] overflow-hidden text-[#ededed]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#2d2d2d] bg-[#1e1e1e] text-[#808080] font-normal text-[11px]">
              <th className="py-2.5 px-3 min-w-[240px]">Task / Video</th>
              <th className="py-2.5 px-3 min-w-[120px]">Status</th>
              <th className="py-2.5 px-3 min-w-[100px]">Priority</th>
              <th className="py-2.5 px-3 min-w-[140px]">Assignee</th>
              <th className="py-2.5 px-3 min-w-[140px]">Project / Client</th>
              <th className="py-2.5 px-3 min-w-[140px]">Deadline</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262626]">
            {tasks.map((task) => {
              const isDone = task.status === "Done";
              return (
                <tr
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className="hover:bg-[#202020] cursor-pointer transition"
                >
                  <td className="py-2.5 px-3">
                    <span className={`font-medium ${isDone ? "line-through text-[#666666]" : "text-[#ededed]"}`}>
                      {task.title}
                    </span>
                  </td>

                  <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value, e)}
                      className={`text-[11px] font-medium rounded px-2 py-0.5 outline-none cursor-pointer ${getStatusBadge(
                        task.status
                      )}`}
                    >
                      <option value="Not Started" className="bg-[#202020] text-[#a6a6a6]">Not Started</option>
                      <option value="In Progress" className="bg-[#202020] text-[#e0ad48]">In Progress</option>
                      <option value="Done" className="bg-[#202020] text-[#68d98d]">Done</option>
                    </select>
                  </td>

                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${getPriorityBadge(task.priority)}`}>
                      {task.priority || "Medium"}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-[#ededed]">
                    {task.assignee?.name || "--"}
                  </td>

                  <td className="py-2.5 px-3 text-[#aaaaaa]">
                    {task.client?.name || task.project?.name || "--"}
                  </td>

                  <td className="py-2.5 px-3 text-[#9b9b9b] font-mono text-[11px]">
                    {task.dueDate ? format(new Date(task.dueDate), "dd/MM/yyyy h:mm a") : "--"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
