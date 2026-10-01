"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import {
  FolderKanban,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Briefcase,
  X,
  FileText,
  Table2,
} from "lucide-react";
import { format } from "date-fns";

function ProjectsContent() {
  const searchParams = useSearchParams();
  const { setSelectedTaskId } = useWorkspace();
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Create Project Modal
  const [isCreateOpen, setIsCreateOpen] = useState(searchParams.get("new") === "true");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [status, setStatus] = useState("Active");
  const [deadline, setDeadline] = useState("");

  // Selected Project Detail Drawer
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    searchParams.get("projectId") || null
  );
  const [selectedProject, setSelectedProject] = useState<any>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "All") params.append("status", statusFilter);
      if (search.trim()) params.append("search", search.trim());

      const [pRes, cRes] = await Promise.all([
        fetch(`/api/projects?${params.toString()}`),
        fetch("/api/clients"),
      ]);

      if (pRes.ok) {
        const d = await pRes.json();
        setProjects(d.projects || []);
      }
      if (cRes.ok) {
        const cd = await cRes.json();
        setClients(cd.clients || []);
      }
    } catch (e) {
      console.error("Failed to load projects", e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const fetchProjectDetails = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const d = await res.json();
        setSelectedProject(d.project);
      }
    } catch (e) {
      console.error("Failed to load project details", e);
    }
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDetails(selectedProjectId);
    } else {
      setSelectedProject(null);
    }
  }, [selectedProjectId, fetchProjectDetails]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description,
          clientId: clientId || undefined,
          status,
          deadline: deadline || undefined,
        }),
      });

      if (res.ok) {
        setName("");
        setDescription("");
        setClientId("");
        setDeadline("");
        setIsCreateOpen(false);
        fetchProjects();
      }
    } catch (e) {
      console.error("Failed to create project", e);
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "Active":
        return "bg-[#233d2e] text-[#9ae6b4] border-[#2b593d]";
      case "Planning":
        return "bg-[#383329] text-[#e2d5c3] border-[#4a4234]";
      case "Completed":
        return "bg-[#20362c] text-[#7ce3ab] border-[#274f3c]";
      case "On Hold":
        return "bg-[#453324] text-[#fbd38d] border-[#5e432b]";
      default:
        return "bg-[#252525] text-neutral-400 border-[#333333]";
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full text-[#ededed]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Projects
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Company initiatives, milestones, deadlines, and client deliverables
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#ededed] hover:bg-white text-[#191919] text-xs font-semibold transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#202020] border border-[#2e2e2e]">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#191919] border border-[#333333] text-xs flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="bg-transparent border-none outline-none text-white placeholder-neutral-500 w-full"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-[#191919] border border-[#333333] rounded-lg px-3 py-1.5 font-medium text-neutral-300 outline-none"
        >
          <option value="All">All Statuses</option>
          <option value="Planning">Planning</option>
          <option value="Active">Active</option>
          <option value="On Hold">On Hold</option>
          <option value="Completed">Completed</option>
          <option value="Archived">Archived</option>
        </select>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-neutral-500">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="py-20 text-center bg-[#202020] rounded-xl border border-[#2e2e2e] space-y-3">
          <FolderKanban className="w-10 h-10 text-neutral-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No projects found</h3>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-[#ededed] hover:bg-white text-[#191919] rounded-lg text-xs font-medium transition"
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => setSelectedProjectId(proj.id)}
              className="p-5 rounded-xl bg-[#202020] border border-[#2e2e2e] hover:border-[#444444] cursor-pointer transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded border ${getStatusBadge(
                      proj.status
                    )}`}
                  >
                    {proj.status}
                  </span>
                  {proj.client && (
                    <span className="text-[11px] font-medium text-neutral-400 truncate flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-amber-400" />
                      {proj.client.name}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition mb-1.5">
                  {proj.name}
                </h3>
                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mb-4">
                  {proj.description || "No description provided."}
                </p>
              </div>

              {/* Progress and Footer */}
              <div className="space-y-3 pt-3 border-t border-[#2a2a2a]">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400 font-medium">Progress</span>
                    <span className="font-semibold text-white font-mono">
                      {proj.progress}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#191919] overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(proj.progress || 0, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{proj.completedTasks || 0}/{proj.totalTasks || 0} tasks</span>
                  </div>
                  <Link
                    href={`/tasks?projectId=${proj.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition"
                    title="Open project tasks in Notion table"
                  >
                    <Table2 className="w-3 h-3" />
                    <span>Notion View</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg bg-[#202020] rounded-xl border border-[#2e2e2e] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                Create New Project
              </h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Video Production Hub"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#333333] bg-[#191919] text-white placeholder-neutral-500 outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Objectives, deliverables, and scope..."
                  className="w-full text-xs p-2.5 rounded-lg border border-[#333333] bg-[#191919] text-white placeholder-neutral-500 outline-none focus:border-neutral-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Client (Optional)
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-[#333333] bg-[#191919] text-white outline-none"
                  >
                    <option value="">No Client (Internal)</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.company})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-[#333333] bg-[#191919] text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-neutral-300 hover:bg-[#282828]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#ededed] hover:bg-white text-[#191919] text-xs font-semibold"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Project Side Drawer */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div
            className="w-full max-w-xl bg-[#202020] h-full border-l border-[#2e2e2e] flex flex-col overflow-y-auto p-6 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#2e2e2e]">
              <span className={`text-xs font-medium px-2 py-0.5 rounded border ${getStatusBadge(selectedProject.status)}`}>
                {selectedProject.status}
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/tasks?projectId=${selectedProject.id}`}
                  className="px-2.5 py-1 rounded bg-[#2a2a2a] hover:bg-[#333333] text-white text-[11px] font-medium border border-[#3d3d3d] flex items-center gap-1.5 transition"
                >
                  <Table2 className="w-3.5 h-3.5" />
                  <span>Open in Notion Table</span>
                </Link>
                <button onClick={() => setSelectedProjectId(null)} className="text-neutral-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">
                {selectedProject.name}
              </h2>
              <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
                {selectedProject.description}
              </p>
            </div>

            {/* Tasks in this project */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Project Tasks ({selectedProject.tasks?.length || 0})
                </h3>
                <Link
                  href={`/tasks?projectId=${selectedProject.id}`}
                  className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 underline transition"
                >
                  <span>Filter in Notion Table</span>
                  <span>➔</span>
                </Link>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {selectedProject.tasks?.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    className="p-2.5 rounded-lg bg-[#191919] border border-[#2e2e2e] text-xs flex items-center justify-between cursor-pointer hover:border-[#444444] transition"
                  >
                    <span className="font-medium text-neutral-200 truncate">
                      {t.title}
                    </span>
                    <span className="text-[11px] text-neutral-400">{t.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Linked Documents */}
            {selectedProject.documents?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Linked Documents & Guidelines
                </h3>
                <div className="space-y-1.5">
                  {selectedProject.documents.map((d: any) => (
                    <div
                      key={d.id}
                      className="p-2.5 rounded-lg bg-[#191919] border border-[#2e2e2e] text-xs flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-neutral-400" />
                      <span className="font-medium text-neutral-200">
                        {d.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-500">Loading projects...</div>}>
      <ProjectsContent />
    </Suspense>
  );
}
