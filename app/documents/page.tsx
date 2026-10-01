"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BlockEditor, EditorBlock } from "@/components/documents/BlockEditor";
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Check,
  Search,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function DocumentsContent() {
  const searchParams = useSearchParams();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(
    searchParams.get("docId") || null
  );
  const [activeDoc, setActiveDoc] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("📄");
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      if (res.ok) {
        const d = await res.json();
        setDocuments(d.documents || []);
        if (!selectedDocId && d.documents?.length > 0) {
          setSelectedDocId(d.documents[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load documents", e);
    } finally {
      setLoading(false);
    }
  }, [selectedDocId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Load selected document details
  const fetchDocDetails = useCallback(async (docId: string) => {
    try {
      const res = await fetch(`/api/documents/${docId}`);
      if (res.ok) {
        const d = await res.json();
        setActiveDoc(d.document);
        setTitle(d.document.title);
        setIcon(d.document.icon || "📄");
        try {
          const parsed = JSON.parse(d.document.content || "[]");
          setBlocks(Array.isArray(parsed) && parsed.length > 0 ? parsed : [
            { id: "b1", type: "heading", level: 1, content: d.document.title },
            { id: "b2", type: "paragraph", content: "Type '/' for commands..." }
          ]);
        } catch {
          setBlocks([
            { id: "b1", type: "heading", level: 1, content: d.document.title },
            { id: "b2", type: "paragraph", content: d.document.content || "" },
          ]);
        }
      }
    } catch (e) {
      console.error("Failed to fetch document", e);
    }
  }, []);

  useEffect(() => {
    if (selectedDocId) {
      fetchDocDetails(selectedDocId);
    }
  }, [selectedDocId, fetchDocDetails]);

  const handleSave = async (overrideBlocks?: EditorBlock[]) => {
    if (!selectedDocId) return;
    setSaving(true);
    setSaveSuccess(false);

    const blocksToSave = overrideBlocks || blocks;

    try {
      const res = await fetch(`/api/documents/${selectedDocId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          icon,
          content: JSON.stringify(blocksToSave),
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        fetchDocuments();
      }
    } catch (e) {
      console.error("Failed to save document", e);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewPage = async (parentId?: string) => {
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Untitled Page",
          icon: "📄",
          parentId: parentId || null,
        }),
      });

      if (res.ok) {
        const d = await res.json();
        await fetchDocuments();
        setSelectedDocId(d.document.id);
      }
    } catch (e) {
      console.error("Failed to create document", e);
    }
  };

  const handleDeletePage = async () => {
    if (!selectedDocId || !confirm(`Delete document "${title}"?`)) return;
    try {
      const res = await fetch(`/api/documents/${selectedDocId}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedDocId(null);
        setActiveDoc(null);
        fetchDocuments();
      }
    } catch (e) {
      console.error("Failed to delete document", e);
    }
  };

  const filteredDocs = documents.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#191919] text-[#ededed]">
      {/* Document Tree Sidebar */}
      <div className="w-64 border-r border-[#2e2e2e] bg-[#202020] flex flex-col flex-shrink-0 select-none">
        {/* Header */}
        <div className="p-3 border-b border-[#2e2e2e] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-neutral-400" />
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
              Company Wiki
            </h2>
          </div>
          <button
            onClick={() => handleCreateNewPage()}
            className="p-1 rounded hover:bg-[#282828] text-neutral-400 hover:text-white transition"
            title="Create top-level page"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-[#2e2e2e]">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#191919] border border-[#333333] text-xs text-neutral-400">
            <Search className="w-3.5 h-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search wiki..."
              className="bg-transparent border-none outline-none text-xs text-white w-full placeholder-neutral-500"
            />
          </div>
        </div>

        {/* Document Pages List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredDocs.map((doc) => {
            const isSelected = doc.id === selectedDocId;
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition group ${
                  isSelected
                    ? "bg-[#2c2c2c] text-white font-medium border border-[#3e3e3e]"
                    : "text-neutral-400 hover:bg-[#252525] hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                  <span className="text-sm">{doc.icon || "📄"}</span>
                  <span className="truncate">{doc.title}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateNewPage(doc.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#333333] text-neutral-400"
                  title="Add subpage"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Document Main Canvas */}
      <div className="flex-1 flex flex-col h-full bg-[#191919] overflow-y-auto">
        {activeDoc ? (
          <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-[#2e2e2e]">
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span>Updated {formatDistanceToNow(new Date(activeDoc.updatedAt), { addSuffix: true })}</span>
                {activeDoc.author && <span>by {activeDoc.author.name}</span>}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ededed] hover:bg-white text-[#191919] rounded-lg text-xs font-semibold transition"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? "Saving..." : "Save Page"}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDeletePage}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-[#282828] transition"
                  title="Delete Page"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Title & Icon Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="text-3xl w-12 bg-transparent border-none outline-none text-center hover:bg-[#252525] rounded-lg p-1"
                  title="Click to edit emoji"
                />
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Page Title..."
                className="w-full text-3xl font-extrabold text-white bg-transparent border-none outline-none tracking-tight placeholder-neutral-600"
              />
            </div>

            {/* Notion Block-Based Editor */}
            <div className="pt-2">
              <BlockEditor
                initialBlocks={blocks}
                onChange={(updated) => setBlocks(updated)}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-neutral-400 p-8 space-y-3">
            <FileText className="w-12 h-12 text-neutral-600" />
            <p className="text-xs">Select a page from the Wiki or create a new document.</p>
            <button
              onClick={() => handleCreateNewPage()}
              className="px-4 py-2 bg-[#ededed] text-[#191919] rounded-lg text-xs font-semibold hover:bg-white transition"
            >
              Create New Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-neutral-500">Loading documents...</div>}>
      <DocumentsContent />
    </Suspense>
  );
}
