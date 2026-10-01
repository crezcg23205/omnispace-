"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TaskCalendarView } from "@/components/tasks/TaskCalendarView";
import { Plus } from "lucide-react";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";

export default function CalendarPage() {
  const { setCreateTaskOpen } = useWorkspace();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const d = await res.json();
        setTasks(d.tasks || []);
      }
    } catch (e) {
      console.error("Failed to load tasks for calendar", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Workspace Calendar
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Visual deadline schedule across all company projects and deliverables
          </p>
        </div>

        <button
          onClick={() => setCreateTaskOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#ededed] hover:bg-white text-[#191919] text-xs font-semibold transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-neutral-500">Loading schedule...</div>
      ) : (
        <TaskCalendarView tasks={tasks} />
      )}
    </div>
  );
}
