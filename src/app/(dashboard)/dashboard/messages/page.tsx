"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTabIndicator } from "@/hooks/use-tab-indicator";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Calendar, Loader2, MessageSquare, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, ErrorState, LoadingState } from "@/components/system/system-states";
import { PageShell, Panel } from "@/components/layout/page-shell";
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
  const [msgTab, setMsgTab] = useState(0);
  const MSG_TABS = ["All", "Unread"];
  const { containerRef: msgTabRef, indicatorStyle: msgIndicatorStyle } = useTabIndicator(msgTab);

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

  const unreadCount = threads.filter((thread) => thread.unread).length;

  const filteredThreads = threads.filter((thread) => {
    if (msgTab === 1 && !thread.unread) return false;
    if (!query.trim()) return true;
    const participantName = thread.participants.map((participant) => participant.name).join(" ").toLowerCase();
    return participantName.includes(query.trim().toLowerCase()) || thread.lastMessage?.body.toLowerCase().includes(query.trim().toLowerCase());
  });

  const primaryParticipant = selected?.participants.find((participant) => participant.id !== userId);

  return (
    <PageShell>
      <div className="flex items-end justify-between gap-3 border-b border-[var(--eh-border)] pb-5">
        <div>
          <h1 className="text-[24px] font-semibold leading-[1.15] tracking-[-0.022em] text-[var(--eh-text)]">Messages</h1>
          <p className="mt-1.5 text-[14px] text-[var(--eh-text-3)]">Communicate with candidates and manage hiring conversations.</p>
        </div>
      </div>

      {loading ? (
        <LoadingState title="Loading messages" message="Syncing your conversations and latest replies." />
      ) : error ? (
        <ErrorState title="Couldn't load messages" message={error} actions={<button onClick={loadThreads} className="eh-btn eh-btn-secondary eh-btn-sm">Retry</button>} />
      ) : (
        <Panel className="grid min-h-[700px] grid-cols-1 overflow-hidden xl:grid-cols-[280px_1fr_280px]">
          {/* Left: Thread list */}
          <aside className="border-r border-[var(--eh-border)] flex flex-col">
            {/* Tabs */}
            <div ref={msgTabRef} className="relative flex border-b border-[var(--eh-border)]">
              <div className="eh-tabs-indicator" style={msgIndicatorStyle} />
              {MSG_TABS.map((tabLabel, i) => (
                <button
                  key={tabLabel}
                  data-tab={tabLabel}
                  onClick={() => setMsgTab(i)}
                  className={["flex-1 py-3 text-[12px] font-semibold transition-colors", msgTab === i ? "text-[var(--eh-primary-700)]" : "text-[var(--eh-text-3)] hover:text-[var(--eh-text-2)]"].join(" ")}
                >
                  {tabLabel} {tabLabel === "All" && threads.length > 0 ? threads.length : tabLabel === "Unread" && unreadCount > 0 ? unreadCount : ""}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="border-b border-[var(--eh-border)] p-3">
              <div className="flex items-center gap-2 rounded-lg border border-[var(--eh-border)] bg-[var(--surface-base)] px-3 py-2">
                <Search size={13} className="shrink-0 text-[var(--eh-text-4)]" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search conversations..." className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--eh-text)] outline-none placeholder:text-[var(--eh-text-4)]" />
              </div>
            </div>
            {/* Thread list */}
            <div className="flex-1 overflow-y-auto">
              {filteredThreads.length === 0 ? (
                <div className="p-4">
                  <EmptyState title="No conversations" message={query.trim() ? "Try a different search." : "Messages appear here when someone contacts you."} />
                </div>
              ) : filteredThreads.map((thread, idx) => {
                const participant = thread.participants.find((p) => p.id !== userId) || thread.participants[0];
                const active = selectedId === thread.id;
                return (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedId(thread.id)}
                    className={["flex w-full items-start gap-3 border-b border-[var(--eh-border)] px-4 py-3.5 text-left transition-colors", active ? "bg-[var(--eh-primary-50)]" : "hover:bg-[var(--surface-base)]"].join(" ")}
                  >
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white" style={{ background: avatarColors[idx % avatarColors.length] }}>
                      {initials(participant?.name || "?")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13px] font-semibold text-[var(--eh-text)]">{participant?.name || "Conversation"}</p>
                        <span className="shrink-0 text-[11px] text-[var(--eh-text-4)]">
                          {thread.lastMessage ? new Date(thread.lastMessage.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : ""}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-[var(--eh-text-3)]">{thread.subject || participant?.role || "Teacher"}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="flex-1 truncate text-[12px] text-[var(--eh-text-3)]">{thread.lastMessage?.body || "No messages yet"}</p>
                        {thread.unread && <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--eh-primary-600)] text-[9px] font-bold text-white">1</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-[var(--eh-border)] px-3 py-2 text-center text-[12px] text-[var(--eh-text-3)]">
              Showing 1 to {filteredThreads.length} of {threads.length} conversations
            </div>
          </aside>

          {/* Center: Chat */}
          <section className="flex min-h-0 flex-col bg-[var(--surface-base)]">
            {selected && primaryParticipant ? (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 border-b border-[var(--eh-border)] bg-white px-4 py-3">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--eh-primary-700)] text-[12px] font-semibold text-white">
                    {initials(primaryParticipant.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-[var(--eh-text)]">{primaryParticipant.name}</p>
                    <p className="text-[11px] text-[var(--eh-text-3)] capitalize">{primaryParticipant.role.toLowerCase().replace("_", " ")}</p>
                  </div>
                </div>
                {/* Action bar */}
                <div className="flex gap-2 border-b border-[var(--eh-border)] bg-white px-4 py-2">
                  <Link href={`/profile/${primaryParticipant.id}`} className="eh-btn eh-btn-secondary eh-btn-sm">View Profile</Link>
                  <Link href="/dashboard/interviews" className="eh-btn eh-btn-secondary eh-btn-sm"><Calendar size={12} /> Schedule Interview</Link>
                </div>
                {/* Messages */}
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.map((message) => {
                    const mine = message.sender.id === userId;
                    return (
                      <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"} gap-2`}>
                        {!mine && (
                          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center self-end rounded-full bg-[var(--eh-primary-200)] text-[10px] font-bold text-[var(--eh-primary-800)]">
                            {initials(message.sender.name)}
                          </span>
                        )}
                        <div className={["max-w-[70%] rounded-2xl px-4 py-2.5 text-[13px]", mine ? "rounded-br-sm bg-[var(--eh-primary-600)] text-white" : "rounded-bl-sm border border-[var(--eh-border)] bg-white text-[var(--eh-text)]"].join(" ")}>
                          <p className="leading-relaxed">{message.body}</p>
                          <p className={`mt-1 text-[10px] ${mine ? "text-right text-white/60" : "text-[var(--eh-text-4)]"}`}>
                            {new Date(message.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                            {mine && " ✓✓"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {messages.length === 0 && (
                    <p className="text-center text-[13px] text-[var(--eh-text-3)] pt-8">Start the conversation with {primaryParticipant.name}.</p>
                  )}
                </div>
                {/* Composer */}
                <div className="border-t border-[var(--eh-border)] bg-white p-3">
                  <div className="flex items-end gap-2 rounded-xl border border-[var(--eh-border)] bg-[var(--surface-base)] px-3 py-2">
                    <textarea
                      value={composer}
                      onChange={(e) => setComposer(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      placeholder="Type a message..."
                      className="max-h-[100px] min-h-[40px] w-full resize-none bg-transparent text-[13px] text-[var(--eh-text)] outline-none placeholder:text-[var(--eh-text-4)]"
                    />
                    <div className="flex shrink-0 items-center gap-1">
                      <button onClick={sendMessage} disabled={sending || !composer.trim()} className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--eh-primary-600)] text-white disabled:opacity-50 hover:bg-[var(--eh-primary-700)]" aria-label="Send">
                        {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-base)]">
                    <MessageSquare size={22} className="text-[var(--eh-text-4)]" />
                  </div>
                  <p className="text-[14px] font-semibold text-[var(--eh-text)]">Select a conversation</p>
                  <p className="mt-1 text-[13px] text-[var(--eh-text-3)]">Choose from the left to start messaging.</p>
                </div>
              </div>
            )}
          </section>

          {/* Right: Candidate Summary */}
          <aside className="hidden border-l border-[var(--eh-border)] xl:flex xl:flex-col">
            {primaryParticipant ? (
              <div className="flex flex-col gap-0 divide-y divide-[var(--eh-border)] overflow-y-auto">
                {/* Header */}
                <div className="p-4 text-center">
                  <span className="mx-auto mb-2 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--eh-primary-700)] text-[16px] font-semibold text-white">
                    {initials(primaryParticipant.name)}
                  </span>
                  <p className="text-[14px] font-semibold text-[var(--eh-text)]">{primaryParticipant.name}</p>
                  <p className="text-[11px] text-[var(--eh-text-3)] capitalize">{primaryParticipant.role.toLowerCase().replace("_", " ")}</p>
                </div>
                {/* Conversation */}
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--eh-text-4)] mb-2">Conversation</p>
                  <p className="text-[13px] font-semibold text-[var(--eh-text)]">{selected?.subject || "Direct message"}</p>
                  {selected?.lastMessage && (
                    <p className="mt-1 text-[11px] text-[var(--eh-text-3)]">
                      Last reply {new Date(selected.lastMessage.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                  )}
                </div>
                {/* Actions */}
                <div className="p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--eh-text-4)] mb-2">Actions</p>
                  <div className="space-y-1.5">
                    <Link href={`/profile/${primaryParticipant.id}`} className="flex w-full items-center gap-2 rounded-lg border border-[var(--eh-border)] px-3 py-2 text-[12px] font-medium text-[var(--eh-text-2)] hover:bg-[var(--surface-base)]">
                      View Full Profile
                    </Link>
                    <Link href="/dashboard/interviews" className="flex w-full items-center gap-2 rounded-lg border border-[var(--eh-border)] px-3 py-2 text-[12px] font-medium text-[var(--eh-text-2)] hover:bg-[var(--surface-base)]">
                      <Calendar size={12} /> Schedule Interview
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-4">
                <p className="text-center text-[13px] text-[var(--eh-text-3)]">Select a conversation to view candidate details.</p>
              </div>
            )}
          </aside>
        </Panel>
      )}
    </PageShell>
  );
}
