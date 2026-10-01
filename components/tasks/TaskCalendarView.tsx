"use client";

import React, { useState } from "react";
import { useWorkspace } from "../providers/WorkspaceProvider";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
} from "lucide-react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isToday,
} from "date-fns";

interface TaskCalendarViewProps {
  tasks: any[];
}

export function TaskCalendarView({ tasks }: TaskCalendarViewProps) {
  const { setSelectedTaskId } = useWorkspace();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Build calendar days
  const rows = [];
  let days = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day;
      const dayTasks = tasks.filter(
        (t) => t.dueDate && isSameDay(new Date(t.dueDate), cloneDay)
      );

      days.push(
        <div
          key={day.toISOString()}
          className={`min-h-[110px] p-2 border-b border-r border-[#2e2e2e] transition ${
            !isSameMonth(day, monthStart)
              ? "bg-[#161616] text-neutral-600"
              : "bg-[#202020] text-neutral-200"
          } ${isToday(day) ? "ring-1 ring-neutral-400 inset-0" : ""}`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span
              className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                isToday(day)
                  ? "bg-[#ededed] text-[#191919]"
                  : "text-neutral-400"
              }`}
            >
              {format(day, "d")}
            </span>
            {dayTasks.length > 0 && (
              <span className="text-[10px] text-neutral-500 font-mono">
                {dayTasks.length}
              </span>
            )}
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[80px]">
            {dayTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTaskId(t.id)}
                className={`px-2 py-1 rounded text-[11px] font-medium truncate cursor-pointer transition flex items-center gap-1 ${
                  t.status === "Done"
                    ? "bg-[#252525] text-neutral-500 line-through border border-[#303030]"
                    : t.priority === "Urgent"
                    ? "bg-[#381a1d] text-rose-300 border border-[#52252a]"
                    : "bg-[#282828] text-neutral-200 border border-[#383838] hover:bg-[#323232]"
                }`}
                title={t.title}
              >
                {t.status === "Done" && <CheckCircle2 className="w-2.5 h-2.5 flex-shrink-0 text-neutral-500" />}
                <span className="truncate">{t.title}</span>
              </div>
            ))}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div key={day.toISOString()} className="grid grid-cols-7">
        {days}
      </div>
    );
    days = [];
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-[#202020] rounded-xl border border-[#2e2e2e] overflow-hidden">
      {/* Calendar Header Controls */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2e2e2e]">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-neutral-300" />
          <h2 className="text-base font-semibold text-white">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1.5 rounded-lg border border-[#383838] bg-[#282828] text-xs font-medium text-neutral-200 hover:bg-[#333333] transition mr-2"
          >
            Today
          </button>
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-[#383838] bg-[#282828] text-neutral-300 hover:bg-[#333333] transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-[#383838] bg-[#282828] text-neutral-300 hover:bg-[#333333] transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week Header */}
      <div className="grid grid-cols-7 border-b border-[#2e2e2e] bg-[#1a1a1a] text-neutral-400 text-[11px] font-semibold uppercase tracking-wider py-2 text-center">
        {weekDays.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="divide-y divide-[#2e2e2e]">{rows}</div>
    </div>
  );
}
