"use client";
import { useState, useRef } from "react";
import {
  Plus,
  Send,
  Sparkles,
  ArrowUpRight,
  PanelLeft,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useRecords } from "@/hooks/use-records";
import { api, deleteRecord } from "@/lib/firestore/client";
import { Button, Card, PageHeader, Modal, ErrorState } from "@/components/ui";
import { AIResponse } from "@/components/health/ai-response";
import { hardcodedHealthResponse } from "@/lib/ai/hardcoded";
import type { AIResult, RecordData } from "@/types";
type Message = {
  role: "user" | "assistant";
  content: string | AIResult;
  createdAt: string;
};
export function Chatbot() {
  const conversations = useRecords("conversations");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [id, setId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [remove, setRemove] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  async function send(text = input) {
    if (!text.trim() || busy) return;
    setError("");
    setBusy(true);
    setMessages((old) => [
      ...old,
      { role: "user", content: text, createdAt: new Date().toISOString() },
    ]);
    setInput("");
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setMessages((old) => [
        ...old,
        {
          role: "assistant",
          content: hardcodedHealthResponse(text),
          createdAt: new Date().toISOString(),
        },
      ]);
      setTimeout(
        () =>
          bottom.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          }),
        100,
      );
    } catch {
      setError(
        "Could not prepare the informational response. Please try again.",
      );
      setInput(text);
      setMessages((old) => old.slice(0, -1));
    } finally {
      setBusy(false);
    }
  }
  async function openChat(c: RecordData) {
    setBusy(true);
    setError("");
    try {
      const data = await api<{ records: Message[] }>(
        `/api/ai/chat?conversationId=${c.id}`,
      );
      setId(c.id);
      setMessages(data.records);
      setShowHistory(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load conversation.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="A SPACE TO ASK"
        title="Your AI health companion"
        description="Simple explanations. Thoughtful guidance. A little more clarity."
        action={
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
          >
            <PanelLeft />
            History
          </Button>
        }
      />
      <div className="flex gap-4">
        {showHistory && (
          <Card className="w-60 shrink-0 p-3 max-sm:absolute max-sm:z-20 max-sm:shadow-xl">
            <Button
              className="mb-4 w-full"
              onClick={() => {
                setId(undefined);
                setMessages([]);
                setError("");
                setShowHistory(false);
              }}
            >
              <Plus />
              New conversation
            </Button>
            {conversations.records.map((c) => (
              <div key={c.id} className="flex items-center gap-1">
                <button
                  className="flex-1 truncate rounded-lg p-3 text-left text-xs hover:bg-muted"
                  onClick={() => openChat(c)}
                >
                  {String(c.title)}
                </button>
                <button
                  aria-label="Delete conversation"
                  onClick={() => setRemove(c.id)}
                >
                  <Trash2 className="size-3 text-muted-foreground" />
                </button>
              </div>
            ))}
            {!conversations.records.length && (
              <p className="p-3 text-xs text-muted-foreground">
                No conversations yet.
              </p>
            )}
          </Card>
        )}
        <Card className="flex min-h-[660px] min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2 border-b border-border px-5 py-4">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#ecf1e4]">
              <Sparkles className="size-4 text-primary" />
            </span>
            <div>
              <p className="text-xs font-medium">UyirNadi assistant</p>
              <p className="mt-0.5 text-[9px] text-muted-foreground">
                Hardcoded, informational health guidance
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => {
                setId(undefined);
                setMessages([]);
                setError("");
              }}
            >
              <Plus />
              New chat
            </Button>
          </div>
          <div className="max-h-[650px] flex-1 overflow-y-auto p-5 sm:p-8">
            {messages.length ? (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`mb-6 flex ${m.role === "user" ? "justify-end" : ""}`}
                >
                  <div
                    className={`max-w-[90%] rounded-xl p-4 ${m.role === "user" ? "bg-[#edf2e5]" : "w-full border border-border bg-white"}`}
                  >
                    {typeof m.content === "string" ? (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {m.content}
                      </p>
                    ) : (
                      <AIResponse result={m.content} />
                    )}
                    <p className="mt-3 text-[9px] text-muted-foreground">
                      {m.role === "user" ? "You" : "UyirNadi"} ·{" "}
                      {new Date(m.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="mx-auto flex max-w-lg flex-col items-center py-12 text-center">
                <span className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-[#edf2e5]">
                  <Sparkles className="size-7 text-[#91a778]" />
                </span>
                <h2 className="text-2xl font-medium tracking-tight">
                  A little clarity can go a long way.
                </h2>
                <p className="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground">
                  This prewritten guide can help you prepare for a check-up,
                  understand a health term, and find the right UyirNadi tool.
                </p>
                <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
                  {[
                    "Help me prepare for a check-up",
                    "Explain a term in my health report",
                    "How can I build a better sleep routine?",
                    "What should I ask my doctor?",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => setInput(s)}
                      className="flex items-center justify-between gap-4 rounded-lg border border-border p-4 text-left text-xs text-muted-foreground hover:bg-muted"
                    >
                      {s}
                      <ArrowUpRight className="size-3 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {busy && (
              <div
                role="status"
                className="flex items-center gap-2 p-3 text-xs text-muted-foreground"
              >
                <Loader2 className="size-4 animate-spin" />
                Taking a thoughtful look...
              </div>
            )}
            <div ref={bottom} />
          </div>
          <div className="space-y-3 border-t border-border p-4 sm:p-5">
            {error && <ErrorState message={error} retry={() => send()} />}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
              className="flex gap-2 rounded-xl border border-border bg-[#fafbf8] p-2"
            >
              <textarea
                aria-label="Your health question"
                className="max-h-32 min-h-12 flex-1 resize-none bg-transparent px-3 py-3 text-xs outline-none"
                placeholder="What’s on your mind? Ask a health question..."
                maxLength={10000}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
              />
              <Button
                aria-label="Send message"
                disabled={busy || !input.trim()}
                type="submit"
                size="icon"
                className="self-end"
              >
                <Send />
              </Button>
            </form>
            <p className="text-center text-[9px] text-muted-foreground">
              Prewritten guidance only. It does not diagnose or replace a
              doctor. For emergencies, seek immediate help.
            </p>
          </div>
        </Card>
      </div>
      <Modal
        open={!!remove}
        onOpenChange={() => setRemove(null)}
        title="Delete this conversation?"
        description="This removes the conversation from your history."
      >
        <Button
          variant="destructive"
          onClick={async () => {
            try {
              await deleteRecord("conversations", remove!);
              if (id === remove) {
                setMessages([]);
                setId(undefined);
              }
              setRemove(null);
              toast.success("Conversation deleted.");
            } catch {
              toast.error("Could not delete conversation.");
            }
          }}
        >
          Delete conversation
        </Button>
      </Modal>
    </>
  );
}
