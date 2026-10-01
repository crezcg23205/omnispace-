"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWorkspace } from "../providers/WorkspaceProvider";
import { MentionTextarea } from "../common/MentionTextarea";
import {
  X,
  Calendar,
  CheckCircle2,
  Trash2,
  Send,
  History,
  Clock,
  Plus,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export function TaskDetailPanel() {
  const { selectedTaskId, setSelectedTaskId } = useWorkspace();
  const [task, setTask] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [subtaskInput, setSubtaskInput] = useState("");

  const [members, setMembers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  const fetchTaskDetails = useCallback(async (taskId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        setTask(data.task);
        setActivities(data.activities || []);
      }
    } catch (e) {
      console.error("Failed to load task details", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTaskId) {
      fetchTaskDetails(selectedTaskId);
      Promise.all([
        fetch("/api/team").then((r) => r.json()),
        fetch("/api/clients").then((r) => r.json()),
      ]).then(([tData, cData]) => {
        if (tData.members) setMembers(tData.members);
        if (cData.clients) setClients(cData.clients);
      });
    } else {
      setTask(null);
    }
  }, [selectedTaskId, fetchTaskDetails]);

  if (!selectedTaskId) return null;

  const handleUpdateField = async (field: string, value: any) => {
    if (!task) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        const data = await res.json();
        setTask((prev: any) => ({ ...prev, ...data.task }));
        fetchTaskDetails(task.id);
        window.dispatchEvent(new CustomEvent("task-updated"));
      }
    } catch (e) {
      console.error("Failed to update task", e);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, completed: boolean) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtaskId, completed }),
      });
      if (res.ok) {
        setTask((prev: any) => ({
          ...prev,
          subtasks: prev.subtasks.map((st: any) =>
            st.id === subtaskId ? { ...st, completed } : st
          ),
        }));
      }
    } catch (e) {
      console.error("Failed to toggle subtask", e);
    }
  };

  const handleAddSubtask = async () => {
    if (!subtaskInput.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: subtaskInput.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setTask((prev: any) => ({
          ...prev,
          subtasks: [...(prev.subtasks || []), data.subtask],
        }));
        setSubtaskInput("");
      }
    } catch (e) {
      console.error("Failed to add subtask", e);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks?subtaskId=${subtaskId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTask((prev: any) => ({
          ...prev,
          subtasks: prev.subtasks.filter((st: any) => st.id !== subtaskId),
        }));
      }
    } catch (e) {
      console.error("Failed to delete subtask", e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      if (res.ok) {
        setCommentText("");
        fetchTaskDetails(task.id);
      }
    } catch (e) {
      console.error("Failed to post comment", e);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedTaskId(null);
        window.dispatchEvent(new CustomEvent("task-deleted"));
      }
    } catch (e) {
      console.error("Failed to delete task", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-[#202020] text-[#ededed] h-full shadow-2xl border-l border-[#333333] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2d2d] bg-[#1c1c1c]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#2a2a2a] text-[#ededed] border border-[#383838]">
              {task?.status || "Task"}
            </span>
            <span className="text-xs text-[#808080] font-mono">#{task?.id?.slice(-6)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteTask}
              title="Delete task"
              className="p-1.5 rounded text-[#808080] hover:text-[#e05e5e] hover:bg-[#332020] transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedTaskId(null)}
              className="p-1.5 rounded text-[#808080] hover:text-white hover:bg-[#2a2a2a] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading && !task ? (
          <div className="flex-1 flex items-center justify-center text-xs text-[#808080]">
            Loading details...
          </div>
        ) : task ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title */}
            <div>
              <input
                type="text"
                defaultValue={task.title}
                onBlur={(e) => {
                  if (e.target.value.trim() && e.target.value !== task.title) {
                    handleUpdateField("title", e.target.value.trim());
                  }
                }}
                className="w-full text-xl font-bold text-[#ededed] bg-transparent border-none outline-none focus:bg-[#252525] rounded p-1 transition"
              />
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[#262626] border border-[#333333] text-xs">
              <div>
                <span className="text-[#808080] font-medium block mb-1">Status</span>
                <select
                  value={task.status}
                  onChange={(e) => handleUpdateField("status", e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#383838] rounded-md p-1.5 text-[#ededed] outline-none"
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div>
                <span className="text-[#808080] font-medium block mb-1">Priority</span>
                <select
                  value={task.priority}
                  onChange={(e) => handleUpdateField("priority", e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#383838] rounded-md p-1.5 text-[#ededed] outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <span className="text-[#808080] font-medium block mb-1">Assignee</span>
                <select
                  value={task.assigneeId || ""}
                  onChange={(e) => handleUpdateField("assigneeId", e.target.value || null)}
                  className="w-full bg-[#1e1e1e] border border-[#383838] rounded-md p-1.5 text-[#ededed] outline-none"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[#808080] font-medium block mb-1">Deadline</span>
                <input
                  type="date"
                  value={task.dueDate ? task.dueDate.split("T")[0] : ""}
                  onChange={(e) => handleUpdateField("dueDate", e.target.value || null)}
                  className="w-full bg-[#1e1e1e] border border-[#383838] rounded-md p-1.5 text-[#ededed] outline-none"
                />
              </div>

              <div>
                <span className="text-[#808080] font-medium block mb-1">Project / Client</span>
                <select
                  value={task.clientId || ""}
                  onChange={(e) => handleUpdateField("clientId", e.target.value || null)}
                  className="w-full bg-[#1e1e1e] border border-[#383838] rounded-md p-1.5 text-[#ededed] outline-none"
                >
                  <option value="">None</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[#808080] font-medium block mb-1">Video Number (#)</span>
                <input
                  type="text"
                  defaultValue={task.videoNumber || ""}
                  onBlur={(e) => handleUpdateField("videoNumber", e.target.value || null)}
                  placeholder="e.g. 1, 2, 6"
                  className="w-full bg-[#1e1e1e] border border-[#383838] rounded-md p-1.5 text-[#ededed] outline-none font-mono"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-bold text-[#808080] uppercase tracking-wider mb-2">
                Notes
              </label>
              <input
                type="text"
                defaultValue={task.notes || ""}
                onBlur={(e) => handleUpdateField("notes", e.target.value)}
                placeholder="Add quick notes..."
                className="w-full text-xs p-2.5 rounded-lg border border-[#333333] bg-[#262626] text-[#ededed] outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold text-[#808080] uppercase tracking-wider mb-2">
                Description & Mentions
              </label>
              <MentionTextarea
                value={task.description || ""}
                onChange={(val) => setTask((prev: any) => ({ ...prev, description: val }))}
                placeholder="Add description... Type @ to mention team members"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => handleUpdateField("description", task.description)}
                  className="px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#333333] text-xs font-medium text-[#ededed] rounded transition"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Subtasks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold text-[#808080] uppercase tracking-wider">
                  Checklist ({task.subtasks?.filter((s: any) => s.completed).length || 0}/
                  {task.subtasks?.length || 0})
                </label>
              </div>

              <div className="space-y-1.5 mb-2.5">
                {task.subtasks?.map((st: any) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2 rounded bg-[#262626] border border-[#333333] text-xs group"
                  >
                    <label className="flex items-center gap-2 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={st.completed}
                        onChange={(e) => handleToggleSubtask(st.id, e.target.checked)}
                        className="rounded border-[#444444] text-[#ededed] focus:ring-0"
                      />
                      <span className={st.completed ? "line-through text-[#666666]" : "text-[#ededed]"}>
                        {st.title}
                      </span>
                    </label>
                    <button
                      onClick={() => handleDeleteSubtask(st.id)}
                      className="text-[#808080] hover:text-[#e05e5e] opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSubtask();
                    }
                  }}
                  placeholder="Add item..."
                  className="flex-1 text-xs bg-[#262626] border border-[#333333] rounded p-1.5 text-[#ededed]"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-3 py-1.5 bg-[#2e2e2e] text-[#ededed] rounded text-xs font-semibold hover:bg-[#383838]"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Comments Thread */}
            <div className="pt-4 border-t border-[#2d2d2d]">
              <label className="block text-[10px] font-bold text-[#808080] uppercase tracking-wider mb-3">
                Comments ({task.comments?.length || 0})
              </label>

              <form onSubmit={handleAddComment} className="space-y-2 mb-4">
                <MentionTextarea
                  value={commentText}
                  onChange={setCommentText}
                  placeholder="Write a comment..."
                  rows={2}
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ededed] hover:bg-[#d0d0d0] text-[#191919] rounded text-xs font-semibold transition disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    Comment
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                {task.comments?.map((c: any) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-lg bg-[#262626] border border-[#333333] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#ededed]">{c.author?.name}</span>
                      <span className="text-[10px] text-[#808080]">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-[#cccccc] whitespace-pre-line">{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
