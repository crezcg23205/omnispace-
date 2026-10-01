"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import {
  Briefcase,
  Plus,
  Search,
  Mail,
  Phone,
  User,
  FolderKanban,
  CheckSquare,
  X,
  Building2,
  Table2,
} from "lucide-react";

function ClientsContent() {
  const searchParams = useSearchParams();
  const { setSelectedTaskId } = useWorkspace();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Selected client drawer
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    searchParams.get("clientId") || null
  );
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const q = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
      const res = await fetch(`/api/clients${q}`);
      if (res.ok) {
        const d = await res.json();
        setClients(d.clients || []);
      }
    } catch (e) {
      console.error("Failed to load clients", e);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const fetchClientDetails = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/clients/${id}`);
      if (res.ok) {
        const d = await res.json();
        setSelectedClient(d.client);
      }
    } catch (e) {
      console.error("Failed to load client details", e);
    }
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      fetchClientDetails(selectedClientId);
    } else {
      setSelectedClient(null);
    }
  }, [selectedClientId, fetchClientDetails]);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !company.trim()) return;

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          company: company.trim(),
          contact,
          email,
          phone,
          notes,
        }),
      });

      if (res.ok) {
        setName("");
        setCompany("");
        setContact("");
        setEmail("");
        setPhone("");
        setNotes("");
        setIsCreateOpen(false);
        fetchClients();
      }
    } catch (e) {
      console.error("Failed to create client", e);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full text-[#ededed]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Clients
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Accounts, customer relationships, projects, and active deliverables
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#ededed] hover:bg-white text-[#191919] text-xs font-semibold transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Client</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#202020] border border-[#2e2e2e] max-w-md">
        <Search className="w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by company, contact person, or email..."
          className="bg-transparent border-none outline-none text-xs text-white placeholder-neutral-500 w-full"
        />
      </div>

      {/* Clients Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-neutral-500">Loading clients...</div>
      ) : clients.length === 0 ? (
        <div className="py-20 text-center bg-[#202020] rounded-xl border border-[#2e2e2e] space-y-3">
          <Briefcase className="w-10 h-10 text-neutral-600 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No clients found</h3>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-[#ededed] hover:bg-white text-[#191919] rounded-lg text-xs font-medium transition"
          >
            Add Your First Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedClientId(c.id)}
              className="p-5 rounded-xl bg-[#202020] border border-[#2e2e2e] hover:border-[#444444] cursor-pointer transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#282828] border border-[#383838] text-amber-400 flex items-center justify-center font-bold text-sm">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition truncate">
                      {c.name}
                    </h3>
                    <p className="text-[11px] text-neutral-400 truncate">{c.company}</p>
                  </div>
                </div>

                {/* Contact info */}
                <div className="space-y-1.5 text-xs text-neutral-400 mb-4">
                  {c.contact && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                      <span className="truncate">{c.contact}</span>
                    </div>
                  )}
                  {c.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                      <span className="truncate">{c.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[#2a2a2a] text-[11px] text-neutral-400">
                <span className="flex items-center gap-1">
                  <FolderKanban className="w-3.5 h-3.5 text-neutral-400" />
                  {c.projects?.length || 0} Projects
                </span>
                <Link
                  href={`/tasks?client=${encodeURIComponent(c.name)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition"
                  title="Open client tasks in Notion table"
                >
                  <Table2 className="w-3.5 h-3.5" />
                  <span>{c.tasks?.length || 0} Tasks ➔</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Client Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="w-full max-w-lg bg-[#202020] rounded-xl border border-[#2e2e2e] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">
                Add New Client
              </h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Client / Account Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Danil"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#333333] bg-[#191919] text-white placeholder-neutral-500 outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Company Entity
                </label>
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Danil Production"
                  className="w-full text-xs p-2.5 rounded-lg border border-[#333333] bg-[#191919] text-white placeholder-neutral-500 outline-none focus:border-neutral-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Primary Contact
                  </label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="e.g. Danil"
                    className="w-full text-xs p-2 rounded-lg border border-[#333333] bg-[#191919] text-white placeholder-neutral-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="danil@client.com"
                    className="w-full text-xs p-2 rounded-lg border border-[#333333] bg-[#191919] text-white placeholder-neutral-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 000 0000"
                  className="w-full text-xs p-2 rounded-lg border border-[#333333] bg-[#191919] text-white placeholder-neutral-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key relationship details, preferences, scope..."
                  className="w-full text-xs p-2 rounded-lg border border-[#333333] bg-[#191919] text-white placeholder-neutral-500 outline-none"
                />
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
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Client Detail Drawer */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div
            className="w-full max-w-xl bg-[#202020] h-full border-l border-[#2e2e2e] flex flex-col overflow-y-auto p-6 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#2e2e2e]">
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-[#282319] border border-[#3d3424] text-amber-300">
                Client Profile
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/tasks?client=${encodeURIComponent(selectedClient.name)}`}
                  className="px-2.5 py-1 rounded bg-[#2a2a2a] hover:bg-[#333333] text-white text-[11px] font-medium border border-[#3d3d3d] flex items-center gap-1.5 transition"
                >
                  <Table2 className="w-3.5 h-3.5" />
                  <span>Open in Notion Table</span>
                </Link>
                <button onClick={() => setSelectedClientId(null)} className="text-neutral-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">
                {selectedClient.name}
              </h2>
              <p className="text-xs text-neutral-400 font-medium">{selectedClient.company}</p>
              {selectedClient.notes && (
                <p className="text-xs text-neutral-300 mt-2 bg-[#191919] border border-[#2e2e2e] p-3 rounded-lg">
                  {selectedClient.notes}
                </p>
              )}
            </div>

            {/* Linked Projects */}
            <div>
              <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Active Projects ({selectedClient.projects?.length || 0})
              </h3>
              <div className="space-y-2">
                {selectedClient.projects?.map((p: any) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-lg bg-[#191919] border border-[#2e2e2e] text-xs flex items-center justify-between"
                  >
                    <span className="font-medium text-neutral-200 truncate">
                      {p.name}
                    </span>
                    <span className="text-neutral-400">{p.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Linked Tasks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Client Tasks ({selectedClient.tasks?.length || 0})
                </h3>
                <Link
                  href={`/tasks?client=${encodeURIComponent(selectedClient.name)}`}
                  className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 underline transition"
                >
                  <span>Filter in Notion Table</span>
                  <span>➔</span>
                </Link>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {selectedClient.tasks?.map((t: any) => (
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
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-500">Loading clients...</div>}>
      <ClientsContent />
    </Suspense>
  );
}
