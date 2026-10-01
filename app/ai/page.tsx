"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Bot,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

export default function AIAssistantPage() {
  const { user, setSelectedTaskId } = useWorkspace();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/conversations");
      if (res.ok) {
        const d = await res.json();
        setConversations(d.conversations || []);
        if (!activeConvId && d.conversations?.length > 0) {
          setActiveConvId(d.conversations[0].id);
          setMessages(d.conversations[0].messages || []);
        }
      }
    } catch (e) {
      console.error("Failed to load conversations", e);
    }
  }, [activeConvId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const loadConversationMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/ai/conversations/${convId}`);
      if (res.ok) {
        const d = await res.json();
        setMessages(d.conversation?.messages || []);
      }
    } catch (e) {
      console.error("Failed to load messages", e);
    }
  }, []);

  useEffect(() => {
    if (activeConvId) {
      loadConversationMessages(activeConvId);
    }
  }, [activeConvId, loadConversationMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleStartNewChat = async () => {
    try {
      const res = await fetch("/api/ai/conversations", { method: "POST" });
      if (res.ok) {
        const d = await res.json();
        setActiveConvId(d.conversation.id);
        setMessages([]);
        fetchConversations();
      }
    } catch (e) {
      console.error("Failed to create conversation", e);
    }
  };

  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/ai/conversations/${convId}`, { method: "DELETE" });
      if (res.ok) {
        if (activeConvId === convId) {
          setActiveConvId(null);
          setMessages([]);
        }
        fetchConversations();
      }
    } catch (e) {
      console.error("Failed to delete conversation", e);
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const promptToSend = customPrompt || inputPrompt;
    if (!promptToSend.trim() || loading) return;

    const userMsg = {
      id: "temp-" + Date.now(),
      role: "user",
      content: promptToSend.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setLoading(true);
    setPendingConfirmation(null);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToSend.trim(),
          conversationId: activeConvId || undefined,
          customApiKey: typeof window !== "undefined" ? localStorage.getItem("omnispace_custom_gemini_key") || undefined : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.conversationId && data.conversationId !== activeConvId) {
          setActiveConvId(data.conversationId);
          fetchConversations();
        }

        const assistantMsg = {
          id: data.message?.id || "temp-bot-" + Date.now(),
          role: "assistant",
          content: data.content,
          toolCalls: data.toolCalls ? JSON.stringify(data.toolCalls) : null,
          toolResults: data.toolResults ? JSON.stringify(data.toolResults) : null,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (data.pendingConfirmation) {
          setPendingConfirmation(data.pendingConfirmation);
        }

        window.dispatchEvent(new CustomEvent("task-created"));
        window.dispatchEvent(new CustomEvent("task-updated"));
        window.dispatchEvent(new CustomEvent("team-updated"));
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: "err-" + Date.now(),
            role: "assistant",
            content: "AI service is temporarily unavailable. Please retry shortly.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: "Network error contacting Gemini AI.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (confirmed: boolean) => {
    if (!pendingConfirmation) return;
    setLoading(true);

    try {
      const res = await fetch("/api/ai/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConvId,
          action: pendingConfirmation.action,
          taskId: pendingConfirmation.taskId,
          confirmed,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: "conf-" + Date.now(),
            role: "assistant",
            content: confirmed
              ? data.result?.message || "Action confirmed and executed successfully."
              : "Action cancelled.",
          },
        ]);
        setPendingConfirmation(null);
        window.dispatchEvent(new CustomEvent("task-deleted"));
      }
    } catch (e) {
      console.error("Confirm error", e);
    } finally {
      setLoading(false);
    }
  };

  const renderMessageContent = (content: string) => {
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(content.substring(lastIndex, match.index));
      }

      const label = match[1];
      const url = match[2];
      const taskMatch = url.match(/taskId=([a-zA-Z0-9_\-]+)/);

      parts.push(
        <button
          key={match.index}
          onClick={() => {
            if (taskMatch) {
              setSelectedTaskId(taskMatch[1]);
            } else {
              window.location.href = url;
            }
          }}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#282319] border border-[#3d3424] text-amber-300 font-medium hover:underline text-xs"
        >
          <span>{label}</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </button>
      );

      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push(content.substring(lastIndex));
    }

    return (
      <div className="whitespace-pre-line leading-relaxed text-xs">
        {parts.map((part) => part)}
      </div>
    );
  };

  const samplePrompts = [
    "What tasks are overdue?",
    "Create a task for Muxammadraxim Baxriddin to edit Danil video 45.",
    "What is crez currently working on?",
    "Show me everything related to Danil.",
    "Move Danil 44 to Done.",
    "Find all tasks with High priority.",
  ];

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#191919] text-[#ededed]">
      {/* Left Chat History Sidebar */}
      <div className="w-64 border-r border-[#2e2e2e] bg-[#202020] flex flex-col flex-shrink-0 select-none">
        <div className="p-3 border-b border-[#2e2e2e]">
          <button
            onClick={handleStartNewChat}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-[#2a2a2a] hover:bg-[#333333] border border-[#3e3e3e] text-white text-xs font-medium transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            Recent Conversations
          </div>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setActiveConvId(conv.id)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition group ${
                conv.id === activeConvId
                  ? "bg-[#2c2c2c] text-white font-medium border border-[#3e3e3e]"
                  : "text-neutral-400 hover:bg-[#252525] hover:text-neutral-200"
              }`}
            >
              <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                <MessageSquare className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                <span className="truncate">{conv.title || "Chat"}</span>
              </div>
              <button
                onClick={(e) => handleDeleteConversation(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-400 rounded transition"
                title="Delete Chat"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#191919]">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full">
          {messages.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#252525] border border-[#333333] text-amber-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-base font-semibold text-white">
                Workspace AI Assistant
              </h2>
              <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                Directly connected to your SQLite workspace database. Ask to query video tasks,
                change statuses, assign team members, or inspect client deliverables.
              </p>

              {/* Sample prompt chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto pt-4 text-left">
                {samplePrompts.map((sp) => (
                  <button
                    key={sp}
                    onClick={() => handleSendMessage(sp)}
                    className="p-3 rounded-lg bg-[#202020] border border-[#2e2e2e] hover:border-[#444444] text-xs text-neutral-300 hover:text-white transition text-left"
                  >
                    {sp}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div
                  key={msg.id || i}
                  className={`flex gap-3 items-start ${
                    isAssistant ? "justify-start" : "justify-end"
                  }`}
                >
                  {isAssistant && (
                    <div className="w-7 h-7 rounded-lg bg-[#252525] border border-[#333333] text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`p-4 rounded-xl max-w-2xl space-y-2 ${
                      isAssistant
                        ? "bg-[#202020] border border-[#2e2e2e] text-[#ededed]"
                        : "bg-[#2c2c2c] border border-[#3e3e3e] text-white"
                    }`}
                  >
                    {renderMessageContent(msg.content)}

                    {/* Display executed tool badges */}
                    {msg.toolCalls && (
                      <div className="pt-2 border-t border-[#2e2e2e] flex items-center gap-1.5 text-[10px] text-neutral-400">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Executed database query</span>
                      </div>
                    )}
                  </div>

                  {!isAssistant && (
                    <div className="w-7 h-7 rounded-lg bg-[#2e2e2e] border border-[#3e3e3e] text-neutral-200 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                      {user?.name?.[0] || "U"}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Pending Destructive Confirmation Card */}
          {pendingConfirmation && (
            <div className="p-4 rounded-xl bg-[#2b2518] border border-[#4d3e21] max-w-md mx-auto space-y-3 animate-in zoom-in-95">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Confirmation Required</span>
              </div>
              <p className="text-xs text-neutral-200">
                {pendingConfirmation.prompt}
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => handleConfirmAction(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#444444] text-xs font-medium text-neutral-300 hover:bg-[#333333]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmAction(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-neutral-400 py-2">
              <div className="w-7 h-7 rounded-lg bg-[#252525] border border-[#333333] text-amber-400 flex items-center justify-center animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>Querying workspace database...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-[#2e2e2e] bg-[#202020]">
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a request (e.g. 'Create task for Muxammadraxim tomorrow' or 'Show overdue tasks')..."
              className="flex-1 bg-[#191919] border border-[#333333] rounded-lg px-4 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-neutral-500 transition"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputPrompt.trim()}
              className="px-4 py-2.5 bg-[#ededed] hover:bg-white text-[#191919] rounded-lg text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
