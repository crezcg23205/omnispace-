"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import {
  Users,
  Plus,
  Mail,
  CheckCircle2,
  Clock,
  X,
  Trash2,
  Check,
} from "lucide-react";

export default function TeamPage() {
  const { user } = useWorkspace();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Invite Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Member");
  const [department, setDepartment] = useState("Video Production");
  const [error, setError] = useState("");

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/team");
      if (res.ok) {
        const d = await res.json();
        setMembers(d.members || []);
      }
    } catch (e) {
      console.error("Failed to load team", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    const handleTeamUpdate = () => fetchMembers();
    window.addEventListener("team-updated", handleTeamUpdate);
    return () => window.removeEventListener("team-updated", handleTeamUpdate);
  }, [fetchMembers]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setError("");

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          role,
          department,
        }),
      });

      const d = await res.json();
      if (res.ok && d.success) {
        setName("");
        setEmail("");
        setIsInviteOpen(false);
        fetchMembers();
      } else {
        setError(d.error || "Failed to add member");
      }
    } catch {
      setError("An unexpected error occurred");
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`"${memberName}"ni jamoa guruhidan o'chirishni xohlaysizmi?`)) return;
    try {
      const res = await fetch(`/api/team?memberId=${memberId}`, { method: "DELETE" });
      if (res.ok) {
        fetchMembers();
      }
    } catch (e) {
      console.error("Failed to remove member", e);
    }
  };

  const isManager = user?.currentRole === "Owner" || user?.currentRole === "Admin";

  const getRoleBadge = (r: string) => {
    switch (r) {
      case "Owner":
        return "bg-[#383329] text-[#e2d5c3] border-[#4a4234]";
      case "Admin":
        return "bg-[#282828] text-neutral-200 border-[#383838]";
      default:
        return "bg-[#202020] text-neutral-400 border-[#2e2e2e]";
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full text-[#ededed]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            People & Team
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manage company collaborators, permissions, departments, and active workloads
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#ededed] hover:bg-white text-[#191919] text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Teammate</span>
          </button>
        )}
      </div>

      {/* Telegram Bot Integration Status Banner */}
      <div className="p-4 rounded-xl bg-[#202020] border border-[#2e2e2e] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#282828] border border-[#383838] flex items-center justify-center text-amber-400 flex-shrink-0 text-sm">
            🤖
          </div>
          <div>
            <h3 className="text-xs font-semibold text-white flex items-center gap-2">
              <span>Telegram Xabarnomalar Boti:</span>
              <a
                href="https://t.me/testtolovabot"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline font-mono"
              >
                @testtolovabot
              </a>
            </h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Xodimga yangi vazifa biriktirilganda yoki <b>@mention</b> qilinganda bot Telegram'ga real-time xabar jo'natadi. Bosh Admin: <span className="font-mono text-neutral-300">5725671264</span>
            </p>
          </div>
        </div>
        <a
          href="https://t.me/testtolovabot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#282828] hover:bg-[#333333] border border-[#383838] text-white text-xs font-medium transition flex-shrink-0 self-start sm:self-auto"
        >
          <span>Botni ochish</span>
          <span>➔</span>
        </a>
      </div>

      {/* Team Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-neutral-500">Loading team members...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="p-5 rounded-xl bg-[#202020] border border-[#2e2e2e] flex flex-col justify-between group/card"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#282828] border border-[#383838] flex items-center justify-center font-bold text-sm text-neutral-200 overflow-hidden">
                      {member.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        member.name[0]
                      )}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {member.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-0.5">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded border ${getRoleBadge(
                        member.role
                      )}`}
                    >
                      {member.role}
                    </span>

                    {isManager && member.userId !== user?.id && (
                      <button
                        onClick={() => handleRemoveMember(member.id, member.name)}
                        className="opacity-0 group-hover/card:opacity-100 p-1 text-neutral-500 hover:text-rose-400 rounded transition"
                        title="Remove member from workspace"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 py-3 border-y border-[#2a2a2a] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Department</span>
                    <span className="font-medium text-neutral-200">
                      {member.department}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Telegram Bot</span>
                    {member.telegramChatId ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                        <Check className="w-3 h-3" />
                        <span>{member.telegramUsername ? `@${member.telegramUsername}` : `ID: ${member.telegramChatId}`}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-500 font-mono">
                        Ulanmagan (/link)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Task Workload Stats */}
              <div className="flex items-center justify-between pt-3 text-[11px] text-neutral-400">
                <span className="flex items-center gap-1 text-amber-300 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {member.activeTasks} Active Tasks
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {member.completedTasks} Completed
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-md bg-[#202020] rounded-xl border border-[#2e2e2e] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                Add Team Member
              </h2>
              <button onClick={() => setIsInviteOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-[#381a1d] text-rose-300 border border-[#52252a] text-xs">{error}</div>
            )}

            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Muxammadraxim Baxriddin"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#333333] bg-[#191919] text-white placeholder-neutral-500 outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#333333] bg-[#191919] text-white placeholder-neutral-500 outline-none focus:border-neutral-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-[#333333] bg-[#191919] text-white outline-none"
                  >
                    <option value="Member">Member</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Video Production"
                    className="w-full text-xs p-2 rounded-lg border border-[#333333] bg-[#191919] text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-neutral-300 hover:bg-[#282828]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#ededed] hover:bg-white text-[#191919] text-xs font-semibold"
                >
                  Add Teammate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
