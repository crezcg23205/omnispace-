"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import {
  Inbox,
  CheckCircle2,
  Bell,
  AtSign,
  MessageSquare,
  ArrowRight,
  CheckCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function InboxPage() {
  const { user, refreshUser, setSelectedTaskId } = useWorkspace();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const d = await res.json();
        setNotifications(d.notifications || []);
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        refreshUser();
      }
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    // Mark as read
    if (!notif.read) {
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notif.id }),
      }).then(() => refreshUser());
    }

    if (notif.link) {
      const taskMatch = notif.link.match(/taskId=([a-zA-Z0-9_\-]+)/);
      if (taskMatch) {
        setSelectedTaskId(taskMatch[1]);
      } else {
        router.push(notif.link);
      }
    }
  };

  const filteredNotifs = notifications.filter((n) =>
    filter === "unread" ? !n.read : true
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "mentioned":
        return <AtSign className="w-4 h-4 text-amber-400" />;
      case "task_assigned":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "comment":
        return <MessageSquare className="w-4 h-4 text-neutral-300" />;
      default:
        return <Bell className="w-4 h-4 text-neutral-400" />;
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-4xl mx-auto w-full text-[#ededed]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Inbox & Notifications
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Task assignments, mentions, comments, and updates directed to you
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter toggle */}
          <div className="flex items-center bg-[#202020] border border-[#2e2e2e] p-1 rounded-lg text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                filter === "all"
                  ? "bg-[#2c2c2c] text-white border border-[#3e3e3e]"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                filter === "unread"
                  ? "bg-[#2c2c2c] text-white border border-[#3e3e3e]"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Unread ({notifications.filter((n) => !n.read).length})
            </button>
          </div>

          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#333333] hover:bg-[#282828] text-xs font-medium text-neutral-300 transition"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-neutral-500">Loading notifications...</div>
      ) : filteredNotifs.length === 0 ? (
        <div className="py-20 text-center bg-[#202020] rounded-xl border border-[#2e2e2e] space-y-3">
          <Inbox className="w-10 h-10 text-neutral-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">All caught up!</h3>
          <p className="text-xs text-neutral-400">
            You have no {filter === "unread" ? "unread" : ""} notifications at this time.
          </p>
        </div>
      ) : (
        <div className="bg-[#202020] rounded-xl border border-[#2e2e2e] divide-y divide-[#2a2a2a] overflow-hidden">
          {filteredNotifs.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 flex items-start justify-between gap-4 cursor-pointer transition hover:bg-[#252525] ${
                !n.read ? "bg-[#232323]" : ""
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-[#282828] border border-[#333333] flex-shrink-0 mt-0.5">
                  {getTypeIcon(n.type)}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white truncate">
                      {n.title}
                    </span>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-neutral-500 block pt-1">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-1" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
