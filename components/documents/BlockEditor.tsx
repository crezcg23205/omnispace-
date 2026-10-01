"use client";

import React, { useState, useEffect } from "react";
import {
  Heading1,
  Heading2,
  Type,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  AlertCircle,
  Plus,
  Trash2,
} from "lucide-react";

export interface EditorBlock {
  id: string;
  type: "heading" | "paragraph" | "bullet" | "numbered" | "todo" | "quote" | "code" | "divider" | "callout";
  level?: number;
  content: string;
  completed?: boolean;
}

interface BlockEditorProps {
  initialBlocks: EditorBlock[];
  onChange: (blocks: EditorBlock[]) => void;
  readOnly?: boolean;
}

export function BlockEditor({ initialBlocks, onChange, readOnly = false }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<EditorBlock[]>(
    initialBlocks.length > 0
      ? initialBlocks
      : [{ id: "b-1", type: "paragraph", content: "Type '/' for commands..." }]
  );
  const [slashMenuBlockIndex, setSlashMenuBlockIndex] = useState<number | null>(null);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashSelectedIndex, setSlashSelectedIndex] = useState(0);

  useEffect(() => {
    if (initialBlocks && initialBlocks.length > 0) {
      setBlocks(initialBlocks);
    }
  }, [initialBlocks]);

  const updateBlock = (index: number, newProps: Partial<EditorBlock>) => {
    const updated = blocks.map((b, i) => (i === index ? { ...b, ...newProps } : b));
    setBlocks(updated);
    onChange(updated);
  };

  const addBlockAfter = (index: number, type: EditorBlock["type"] = "paragraph", level?: number) => {
    const newBlock: EditorBlock = {
      id: "b-" + Math.random().toString(36).substring(2, 8),
      type,
      level,
      content: "",
      completed: false,
    };
    const updated = [...blocks.slice(0, index + 1), newBlock, ...blocks.slice(index + 1)];
    setBlocks(updated);
    onChange(updated);
    setSlashMenuBlockIndex(null);
  };

  const removeBlock = (index: number) => {
    if (blocks.length <= 1) {
      updateBlock(0, { content: "", type: "paragraph" });
      return;
    }
    const updated = blocks.filter((_, i) => i !== index);
    setBlocks(updated);
    onChange(updated);
  };

  const slashMenuItems = [
    { label: "Text", type: "paragraph" as const, icon: Type, desc: "Plain text paragraph" },
    { label: "Heading 1", type: "heading" as const, level: 1, icon: Heading1, desc: "Large section header" },
    { label: "Heading 2", type: "heading" as const, level: 2, icon: Heading2, desc: "Medium subsection header" },
    { label: "To-do list", type: "todo" as const, icon: CheckSquare, desc: "Track tasks with a checklist" },
    { label: "Bulleted list", type: "bullet" as const, icon: List, desc: "Simple bullet list" },
    { label: "Numbered list", type: "numbered" as const, icon: ListOrdered, desc: "Ordered sequence" },
    { label: "Quote", type: "quote" as const, icon: Quote, desc: "Capture a quote or takeaway" },
    { label: "Code", type: "code" as const, icon: Code, desc: "Formatted code snippet" },
    { label: "Divider", type: "divider" as const, icon: Minus, desc: "Visual horizontal line" },
    { label: "Callout", type: "callout" as const, icon: AlertCircle, desc: "Highlighted callout box" },
  ];

  const filteredSlashItems = slashMenuItems.filter((item) =>
    item.label.toLowerCase().includes(slashQuery.toLowerCase())
  );

  const applySlashCommand = (item: (typeof slashMenuItems)[0]) => {
    if (slashMenuBlockIndex === null) return;
    const current = blocks[slashMenuBlockIndex];
    const cleanContent = current.content.replace(/^\/[a-zA-Z0-9]*/, "").trim();

    updateBlock(slashMenuBlockIndex, {
      type: item.type,
      level: item.level,
      content: cleanContent,
    });
    setSlashMenuBlockIndex(null);
    setSlashQuery("");
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-1 py-4 font-sans text-neutral-100">
      {blocks.map((block, index) => (
        <div key={block.id} className="relative group flex items-start gap-2 py-1">
          {/* Block handle / drag placeholder */}
          {!readOnly && (
            <div className="opacity-0 group-hover:opacity-100 flex items-center pt-1 transition text-neutral-500">
              <button
                onClick={() => addBlockAfter(index)}
                className="p-1 hover:text-white"
                title="Add block below"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => removeBlock(index)}
                className="p-1 hover:text-rose-400"
                title="Delete block"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Block Content Rendering based on type */}
          <div className="flex-1 min-w-0">
            {block.type === "heading" && block.level === 1 && (
              <input
                type="text"
                disabled={readOnly}
                value={block.content}
                onChange={(e) => updateBlock(index, { content: e.target.value })}
                placeholder="Heading 1"
                className="w-full text-2xl font-bold bg-transparent border-none outline-none text-white placeholder-neutral-600"
              />
            )}

            {block.type === "heading" && block.level === 2 && (
              <input
                type="text"
                disabled={readOnly}
                value={block.content}
                onChange={(e) => updateBlock(index, { content: e.target.value })}
                placeholder="Heading 2"
                className="w-full text-xl font-semibold bg-transparent border-none outline-none text-white placeholder-neutral-600 mt-2"
              />
            )}

            {block.type === "paragraph" && (
              <textarea
                disabled={readOnly}
                rows={1}
                value={block.content}
                onChange={(e) => {
                  const val = e.target.value;
                  updateBlock(index, { content: val });
                  if (val.startsWith("/")) {
                    setSlashMenuBlockIndex(index);
                    setSlashQuery(val.slice(1));
                    setSlashSelectedIndex(0);
                  } else {
                    if (slashMenuBlockIndex === index) setSlashMenuBlockIndex(null);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    addBlockAfter(index);
                  } else if (e.key === "Backspace" && block.content === "") {
                    e.preventDefault();
                    removeBlock(index);
                  }
                }}
                placeholder="Type '/' for commands..."
                className="w-full text-sm leading-relaxed bg-transparent border-none outline-none resize-none placeholder-neutral-600 text-neutral-200"
              />
            )}

            {block.type === "todo" && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  disabled={readOnly}
                  checked={block.completed || false}
                  onChange={(e) => updateBlock(index, { completed: e.target.checked })}
                  className="rounded border-[#444444] bg-[#222222] accent-[#ededed] w-4 h-4 cursor-pointer"
                />
                <input
                  type="text"
                  disabled={readOnly}
                  value={block.content}
                  onChange={(e) => updateBlock(index, { content: e.target.value })}
                  placeholder="To-do item..."
                  className={`flex-1 text-sm bg-transparent border-none outline-none ${
                    block.completed ? "line-through text-neutral-500" : "text-neutral-200"
                  }`}
                />
              </div>
            )}

            {block.type === "bullet" && (
              <div className="flex items-start gap-2">
                <span className="text-neutral-500 text-base leading-none pt-1">•</span>
                <input
                  type="text"
                  disabled={readOnly}
                  value={block.content}
                  onChange={(e) => updateBlock(index, { content: e.target.value })}
                  placeholder="List item..."
                  className="flex-1 text-sm bg-transparent border-none outline-none text-neutral-200"
                />
              </div>
            )}

            {block.type === "numbered" && (
              <div className="flex items-start gap-2">
                <span className="text-neutral-500 text-xs font-semibold pt-1">1.</span>
                <input
                  type="text"
                  disabled={readOnly}
                  value={block.content}
                  onChange={(e) => updateBlock(index, { content: e.target.value })}
                  placeholder="Numbered step..."
                  className="flex-1 text-sm bg-transparent border-none outline-none text-neutral-200"
                />
              </div>
            )}

            {block.type === "quote" && (
              <div className="border-l-2 border-neutral-500 pl-3 py-1 my-1">
                <textarea
                  disabled={readOnly}
                  rows={2}
                  value={block.content}
                  onChange={(e) => updateBlock(index, { content: e.target.value })}
                  placeholder="Empty quote..."
                  className="w-full text-sm italic text-neutral-300 bg-transparent border-none outline-none resize-none"
                />
              </div>
            )}

            {block.type === "code" && (
              <div className="rounded-lg bg-[#141414] border border-[#2e2e2e] text-neutral-100 p-3 my-1 font-mono text-xs">
                <textarea
                  disabled={readOnly}
                  rows={3}
                  value={block.content}
                  onChange={(e) => updateBlock(index, { content: e.target.value })}
                  placeholder="// Paste or write code snippet..."
                  className="w-full bg-transparent border-none outline-none font-mono text-xs text-emerald-400 resize-none"
                />
              </div>
            )}

            {block.type === "divider" && (
              <div className="py-2">
                <hr className="border-[#2e2e2e]" />
              </div>
            )}

            {block.type === "callout" && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-[#252525] border border-[#383838] my-1 text-xs text-neutral-200">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <textarea
                  disabled={readOnly}
                  rows={2}
                  value={block.content}
                  onChange={(e) => updateBlock(index, { content: e.target.value })}
                  placeholder="Informational callout..."
                  className="w-full bg-transparent border-none outline-none resize-none text-xs text-neutral-200"
                />
              </div>
            )}
          </div>

          {/* Slash Commands Dropdown Menu */}
          {slashMenuBlockIndex === index && filteredSlashItems.length > 0 && (
            <div className="absolute left-8 top-full mt-1 w-64 bg-[#202020] border border-[#333333] rounded-lg shadow-2xl py-1 z-50 max-h-60 overflow-y-auto">
              <div className="px-3 py-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                Basic Blocks
              </div>
              {filteredSlashItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => applySlashCommand(item)}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs text-left transition ${
                      i === slashSelectedIndex
                        ? "bg-[#2c2c2c] text-white font-medium"
                        : "text-neutral-300 hover:bg-[#252525]"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-neutral-400" />
                    <div>
                      <div className="font-medium text-white">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-neutral-500">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
