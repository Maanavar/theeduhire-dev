"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Paperclip, Send, Video, Calendar, MoreHorizontal, Search } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, ErrorState, LoadingState } from "@/components/system/system-states";
import { PageHeader, PageShell, Panel } from "@/components/layout/page-shell";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  getConversation,
  getConversations,
  sendConversationMessage,
  type ConversationMessage as MessageItem,
  type ConversationSummary as ConversationItem,
} from "@/lib/api/hiring-client";

const avatarColors = ["#4338ca", "#0f766e", "#be185d", "#b45309", "#0e7490", "#9a3412"];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState<ConversationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [composer, setComposer] = useState("");
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(() => threads.find((thread) => thread.id === selectedId) || null, [threads, selectedId]);
  const userId = session?.user?.id || "";

  const loadThreads = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getConversations();
      setThreads(data || []);
      const requestedThread = searchParams.get("thread");
      setSelectedId((current) => {
        if (requestedThread && data?.some((thread) => thread.id === requestedThread)) {
          return requestedThread;
        }
        return current || data?.[0]?.id || null;
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to load messages"));
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  const loadThreadMessages = async (threadId: string) => {
    try {
      const data = await getConversation(threadId);
      setMessages(data.messages || []);
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to load conversation"));
    }
  };

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (selectedId) loadThreadMessages(selectedId);
  }, [selectedId]);

  const sendMessage = async () => {
    if (!selectedId || !composer.trim()) return;
    setSending(true);
    try {
      const message = await sendConversationMessage(selectedId, composer.trim());
      setComposer("");
      setMessages((prev) => [...prev, message]);
      await loadThreads();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to send message"));
    } finally {
      setSending(false);
    }
  };

  const filteredThreads = threads.filter((thread) => {
    if (!query.trim()) return true;
    const participantName = thread.participants.map((participant) => participant.name).join(" ").toLowerCase();
    return participantName.includes(query.trim().toLowerCase()) || thread.lastMessage?.body.toLowerCase().includes(query.trim().toLowerCase());
  });

  const primaryParticipant = selected?.participants.find((participant) => participant.id !== userId);

  return (
    <PageShell>
      <PageHeader title="Messages" subtitle="Stay on top of candidate conversations, follow-ups, and interview coordination." />
      {loading ? (
        <LoadingState title="Loading messages" message="Syncing your conversations and latest replies." />
      ) : error ? (
        <ErrorState
          title="Couldn't load messages"
          message={error}
          actions={
            <button onClick={loadThreads} className="eh-btn eh-btn-secondary eh-btn-sm">
              Retry
            </button>
          }
        />
      ) : (
        <Panel className="grid min-h-[680px] grid-cols-1 overflow-hidden xl:grid-cols-[320px_1fr_260px]">
          <aside className="border-r border-[#e9edf4]">
            <div className="border-b border-[#edf1f6] p-4">
              <label className="eh-search mt-2">
                <Search size={14} className="text-eh-text3" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search conversations"
                />
              </label>
              <div className="mt-2 flex gap-1.5">
                <span className="eh-chip eh-chip-active text-[11px]">All</span>
                <span className="eh-chip text-[11px]">Unread</span>
                <span className="eh-chip text-[11px]">Interviews</span>
              </div>
            </div>

            <div className="max-h-[560px] overflow-y-auto">
              {filteredThreads.length === 0 ? (
                <div className="p-3">
                  <EmptyState
                    title="No conversations found"
                    message={query.trim() ? "Try a different search term." : "Messages will appear here when schools or teachers contact you."}
                  />
                </div>
              ) : null}
              {filteredThreads.map((thread, idx) => {
                const participant = thread.participants.find((item) => item.id !== userId) || thread.participants[0];
                const active = selectedId === thread.id;
                return (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedId(thread.id)}
                    className={[
                      "flex w-full items-start gap-3 border-b border-[#edf1f6] px-4 py-3 text-left",
                      active ? "bg-brand-50" : "hover:bg-[#f8fafd]",
                    ].join(" ")}
                  >
                    <span
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-semibold text-white"
                      style={{ background: avatarColors[idx % avatarColors.length] }}
                    >
                      {initials(participant?.name || "User")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-[14px] font-semibold text-slate-900">{participant?.name || "Conversation"}</span>
                        {thread.unread ? <span className="h-2 w-2 rounded-full bg-brand-600" /> : null}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-slate-500">{participant?.role || "User"}</span>
                      <span className="mt-0.5 block truncate text-[12px] text-slate-500">{thread.lastMessage?.body || "No messages yet"}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col">
            <div className="flex items-center gap-3 border-b border-[#edf1f6] px-4 py-3">
              {primaryParticipant ? (
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-[12px] font-semibold text-white">
                  {initials(primaryParticipant.name)}
                </span>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-slate-900">{primaryParticipant?.name || "Conversation"}</p>
                <p className="truncate text-[12px] text-slate-500">{selected?.subject || primaryParticipant?.role || "Active now"}</p>
              </div>
              <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Start video call">
                <Video size={15} />
              </button>
              <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Schedule interview">
                <Calendar size={15} />
              </button>
              <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="More conversation options">
                <MoreHorizontal size={15} />
              </button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto bg-[#f8fafd] p-4">
              {messages.map((message) => {
                const mine = message.sender.id === userId;
                return (
                  <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={[
                        "max-w-[520px] rounded-2xl px-3 py-2 text-[13px]",
                        mine ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md border border-[#e2e8f0] bg-white text-slate-700",
                      ].join(" ")}
                    >
                      <p>{message.body}</p>
                      <p className={`mt-1 text-[10px] ${mine ? "text-indigo-100" : "text-slate-400"}`}>
                        {new Date(message.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 ? <p className="text-[13px] text-slate-500">No messages in this conversation yet.</p> : null}
            </div>

            <div className="border-t border-[#edf1f6] p-4">
              <div className="mb-2 flex flex-wrap gap-1.5">
                <span className="eh-chip text-[11px]">Send interview slot</span>
                <span className="eh-chip text-[11px]">Use template</span>
                <span className="eh-chip text-[11px]">Polish with AI</span>
              </div>
              <div className="flex items-end gap-2 rounded-[12px] border border-[#d9e0ea] bg-white px-3 py-2">
                <textarea
                  value={composer}
                  onChange={(e) => setComposer(e.target.value)}
                  placeholder="Write a message..."
                  className="max-h-[110px] min-h-[48px] w-full resize-y border-0 bg-transparent text-[13px] outline-none"
                />
                <button className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Attach file">
                  <Paperclip size={15} />
                </button>
                <button onClick={sendMessage} disabled={sending || !composer.trim()} className="rounded-md bg-brand-600 p-2 text-white disabled:opacity-50" aria-label="Send message">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </section>

          <aside className="hidden border-l border-[#e9edf4] p-4 xl:block">
            {primaryParticipant ? (
              <>
                <div className="border-b border-[#edf1f6] pb-4 text-center">
                  <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-700 text-[22px] font-semibold text-white">
                    {initials(primaryParticipant.name)}
                  </span>
                  <p className="mt-2 text-[15px] font-semibold text-slate-900">{primaryParticipant.name}</p>
                  <p className="text-[12px] text-slate-500">{primaryParticipant.role}</p>
                </div>
                <div className="pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-slate-400">Application</p>
                  <p className="mt-1 text-[13px] text-slate-600">Interview context and candidate notes are visible here.</p>
                </div>
              </>
            ) : (
              <p className="text-[13px] text-slate-500">Select a conversation to view candidate context.</p>
            )}
          </aside>
        </Panel>
      )}
    </PageShell>
  );
}
