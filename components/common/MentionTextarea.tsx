"use client";

import React, { useState, useEffect, useRef } from "react";

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  department: string;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  autoFocus?: boolean;
}

export function MentionTextarea({
  value,
  onChange,
  placeholder = "Write description or comment... Type @ to mention a teammate",
  rows = 3,
  className = "",
  autoFocus = false,
}: MentionTextareaProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionFilter, setMentionFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => {
        if (data.members) setMembers(data.members);
      })
      .catch((e) => console.error("Failed to load team for mentions", e));
  }, []);

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChange(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAt = textBeforeCursor.lastIndexOf("@");

    if (lastAt !== -1 && !/\s/.test(textBeforeCursor.slice(lastAt + 1))) {
      const query = textBeforeCursor.slice(lastAt + 1);
      setMentionFilter(query);
      setShowMentionMenu(true);
      setSelectedIndex(0);
    } else {
      setShowMentionMenu(false);
    }
  };

  const insertMention = (member: Member) => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const textAfterCursor = value.slice(cursorPos);
    const lastAt = textBeforeCursor.lastIndexOf("@");

    if (lastAt !== -1) {
      const firstName = member.name.split(" ")[0];
      const newText =
        textBeforeCursor.slice(0, lastAt) +
        `@${firstName} ` +
        textAfterCursor;
      onChange(newText);
      setShowMentionMenu(false);

      setTimeout(() => {
        if (textareaRef.current) {
          const nextPos = lastAt + firstName.length + 2;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(nextPos, nextPos);
        }
      }, 10);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionMenu && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredMembers.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredMembers[selectedIndex]);
        return;
      }
      if (e.key === "Escape") {
        setShowMentionMenu(false);
        return;
      }
    }
  };

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        autoFocus={autoFocus}
        className={`w-full rounded-lg border border-[#333333] bg-[#262626] p-2.5 text-xs text-[#ededed] placeholder-[#666666] focus:outline-none focus:border-[#555555] transition resize-y ${className}`}
      />

      {showMentionMenu && filteredMembers.length > 0 && (
        <div className="absolute left-2 bottom-full mb-1 w-60 bg-[#202020] border border-[#333333] rounded-lg shadow-2xl py-1 z-50 max-h-48 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] font-bold text-[#808080] uppercase tracking-wider">
            Mention Teammate
          </div>
          {filteredMembers.map((member, i) => (
            <div
              key={member.userId}
              onClick={() => insertMention(member)}
              className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer text-xs transition ${
                i === selectedIndex
                  ? "bg-[#2a2a2a] text-white font-medium"
                  : "text-[#aaaaaa] hover:bg-[#252525]"
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-[#333333] flex items-center justify-center font-bold text-[9px] text-[#ededed] overflow-hidden">
                {member.name[0]}
              </div>
              <div className="flex-1 truncate">
                <span className="font-medium text-[#ededed]">{member.name}</span>
                <span className="text-[#666666] ml-1.5">({member.department})</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
