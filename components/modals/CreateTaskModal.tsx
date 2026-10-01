"use client";

import React, { useState, useEffect } from "react";
import { useWorkspace } from "../providers/WorkspaceProvider";
import { MentionTextarea } from "../common/MentionTextarea";
import {
  X,
  Plus,
  Trash2,
  Calendar,
  FolderKanban,
  Briefcase,
  CheckCircle2,
} from "lucide-react";

export function CreateTaskModal() {
  const { isCreateTaskOpen, setCreateTaskOpen } = useWorkspace();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Not Started");
  const [priority, setPriority] = useState("Medium");
  const [assigneeId, setAssigneeId] = useState("");
  const [clientId, setClientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [videoNumber, setVideoNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Options
  const [members, setMembers] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    if (isCreateTaskOpen) {
      Promise.all([
        fetch("/api/team").then((r) => r.json()),
        fetch("/api/clients").then((r) => r.json()),
      ]).then(([tData, cData]) => {
        if (tData.members) setMembers(tData.members);
        if (cData.clients) setClients(cData.clients);
      });
    }
  }, [isCreateTaskOpen]);

  if (!isCreateTaskOpen) return null;

  const handleAddSubtask = () => {
    if (subtaskInput.trim()) {
      setSubtasks([...subtasks, subtaskInput.trim()]);
      setSubtaskInput("");
    }
  };

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          status,
          priority,
          assigneeId: assigneeId || undefined,
          clientId: clientId || undefined,
          dueDate: dueDate || undefined,
          videoNumber: videoNumber || undefined,
          notes: notes || undefined,
          subtasks,
        }),
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
        setStatus("Not Started");
        setPriority("Medium");
        setAssigneeId("");
        setClientId("");
        setDueDate("");
        setVideoNumber("");
        setNotes("");
        setSubtasks([]);
        setCreateTaskOpen(false);
        window.dispatchEvent(new CustomEvent("task-created"));
      }
    } catch (e) {
      console.error("Failed to create task", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-[#202020] rounded-xl shadow-2xl border border-[#333333] overflow-hidden flex flex-col max-h-[90vh] text-[#ededed]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2d2d]">
          <div className="flex items-center gap-2">
            <span className="text-sm">📄</span>
            <h2 className="text-sm font-semibold text-[#ededed]">
              New Task / Video
            </h2>
          </div>
          <button
            onClick={() => setCreateTaskOpen(false)}
            className="p-1 rounded text-[#808080] hover:text-[#ededed] hover:bg-[#2a2a2a] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task / Video name (e.g. Danil — Video 9)..."
              className="w-full text-base font-semibold text-[#ededed] bg-transparent border-none outline-none placeholder-[#666666]"
            />
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-[#2d2d2d]">
            {/* Status */}
            <div>
              <label className="block text-[10px] font-bold text-[#808080] uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs bg-[#262626] border border-[#383838] rounded-md p-1.5 text-[#ededed] outline-none"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[10px] font-bold text-[#808080] uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs bg-[#262626] border border-[#383838] rounded-md p-1.5 text-[#ededed] outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-[10px] font-bold text-[#808080] uppercase tracking-wider mb-1">
                Assignee
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full text-xs bg-[#262626] border border-[#383838] rounded-md p-1.5 text-[#ededed] outline-none"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-[10px] font-bold text-[#808080] uppercase tracking-wider mb-1">
                Deadline
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs bg-[#262626] border border-[#383838] rounded-md p-1.5 text-[#ededed] outline-none"
              />
            </div>
          </div>

          {/* Client & Video Number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#808080] mb-1">
                Project / Client
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full text-xs bg-[#262626] border border-[#383838] rounded-md p-2 text-[#ededed] outline-none"
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
              <label className="block text-xs font-medium text-[#808080] mb-1">
                Video Number (#)
              </label>
              <input
                type="text"
                value={videoNumber}
                onChange={(e) => setVideoNumber(e.target.value)}
                placeholder="e.g. 1, 2, 6..."
                className="w-full text-xs bg-[#262626] border border-[#383838] rounded-md p-2 text-[#ededed] outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-[#808080] mb-1">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Short notes..."
              className="w-full text-xs bg-[#262626] border border-[#383838] rounded-md p-2 text-[#ededed] outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[#808080] mb-1">
              Description & Mentions (@teammate)
            </label>
            <MentionTextarea
              value={description}
              onChange={setDescription}
              placeholder="Provide context or mention teammates..."
              rows={3}
            />
          </div>

          {/* Footer Submit */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#2d2d2d]">
            <button
              type="button"
              onClick={() => setCreateTaskOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#808080] hover:bg-[#2a2a2a] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim()}
              className="px-5 py-2 rounded-lg bg-[#ededed] hover:bg-[#d0d0d0] text-[#191919] text-xs font-semibold shadow-xs transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
