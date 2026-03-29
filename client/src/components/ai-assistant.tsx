import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Bot, X, Send, Plus, Trash2, ChevronLeft, Sparkles,
  MessageSquare, Loader2, Sun
} from "lucide-react";
import type { AiConversation, AiMessage } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

function formatMessage(content: string) {
  const lines = content.split("\n");
  return lines.map((line, i) => {
    let processed = line
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`(.+?)`/g, "<code class='bg-muted px-1 rounded text-[11px] font-mono'>$1</code>");
    if (line.startsWith("• ") || line.startsWith("- ")) {
      return <p key={i} className="ml-3" dangerouslySetInnerHTML={{ __html: processed }} />;
    }
    if (line.trim() === "") return <div key={i} className="h-2" />;
    return <p key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
  });
}

const SUGGESTIONS = [
  "Quais projetos estão aguardando vistoria?",
  "Me dê um resumo geral dos projetos ativos",
  "Quais projetos precisam de atenção urgente?",
  "Liste os projetos com pagamento pendente",
  "Qual o valor total da carteira de projetos?",
  "Quais projetos foram atualizados hoje?",
];

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [showConvList, setShowConvList] = useState(false);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [localMessages, setLocalMessages] = useState<AiMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: conversations = [] } = useQuery<AiConversation[]>({
    queryKey: ["/api/assistant/conversations"],
    enabled: open,
  });

  const { data: messages = [], isLoading: loadingMessages } = useQuery<AiMessage[]>({
    queryKey: ["/api/assistant/conversations", activeConvId, "messages"],
    queryFn: async () => {
      if (!activeConvId) return [];
      const res = await fetch(`/api/assistant/conversations/${activeConvId}/messages`, { credentials: "include" });
      return res.json();
    },
    enabled: !!activeConvId,
  });

  const prevMessagesRef = useRef<AiMessage[]>([]);
  useEffect(() => {
    const prev = prevMessagesRef.current;
    const sameLength = prev.length === messages.length;
    const sameLastId = sameLength && (messages.length === 0 || prev[prev.length - 1]?.id === messages[messages.length - 1]?.id);
    if (!sameLastId) {
      prevMessagesRef.current = messages;
      setLocalMessages(messages);
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages, streamingText]);

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/assistant/conversations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/assistant/conversations"] });
      setActiveConvId(null);
      setLocalMessages([]);
    },
  });

  const sendMessage = useCallback(async (text: string) => {
    const msg = text.trim();
    if (!msg || streaming) return;
    setInput("");
    setStreaming(true);
    setStreamingText("");

    const userMsg: AiMessage = {
      id: Date.now(),
      conversationId: activeConvId || 0,
      role: "user",
      content: msg,
      createdAt: new Date(),
    };
    setLocalMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: msg, conversationId: activeConvId }),
      });

      if (!res.ok) throw new Error("Erro ao enviar mensagem");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";
      let newConvId = activeConvId;

      let streamError: string | null = null;
      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.conversationId && !activeConvId) {
              newConvId = data.conversationId;
              setActiveConvId(data.conversationId);
            }
            if (data.error) {
              streamError = data.error;
              break outer;
            }
            if (data.content) {
              fullResponse += data.content;
              setStreamingText(fullResponse);
            }
            if (data.done) {
              const assistantMsg: AiMessage = {
                id: Date.now() + 1,
                conversationId: newConvId || 0,
                role: "assistant",
                content: fullResponse,
                createdAt: new Date(),
              };
              setLocalMessages(prev => [...prev, assistantMsg]);
              setStreamingText("");
              qc.invalidateQueries({ queryKey: ["/api/assistant/conversations"] });
              if (newConvId) {
                qc.invalidateQueries({ queryKey: ["/api/assistant/conversations", newConvId, "messages"] });
              }
            }
          } catch {}
        }
      }
      if (streamError) throw new Error(streamError);
    } catch (e: any) {
      const errorMsg: AiMessage = {
        id: Date.now() + 2,
        conversationId: activeConvId || 0,
        role: "assistant",
        content: `Erro: ${e?.message || "Falha ao processar. Verifique a chave de API nas configurações."}`,
        createdAt: new Date(),
      };
      setLocalMessages(prev => [...prev, errorMsg]);
      setStreamingText("");
    } finally {
      setStreaming(false);
    }
  }, [activeConvId, streaming, qc]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const startNewConversation = () => {
    setActiveConvId(null);
    setLocalMessages([]);
    setStreamingText("");
    setShowConvList(false);
  };

  const selectConversation = (id: number) => {
    setActiveConvId(id);
    setLocalMessages([]);
    setStreamingText("");
    setShowConvList(false);
  };

  const isEmpty = localMessages.length === 0 && !streaming;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300",
          open
            ? "bg-foreground text-background scale-95"
            : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:scale-110 hover:shadow-primary/30"
        )}
        data-testid="button-ai-assistant"
        title="Assistente IA Lumi"
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-background animate-pulse" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[420px] max-w-[calc(100vw-48px)] bg-background border border-border/50 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: "min(600px, calc(100vh - 160px))" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border/30 bg-gradient-to-r from-primary/5 to-transparent shrink-0">
            {showConvList ? (
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setShowConvList(false)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            ) : (
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">Lumi</span>
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border bg-muted/60 border-border/40 text-emerald-500">
                  <Sparkles className="h-3 w-3" />
                  GPT-4o mini
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium truncate">
                {showConvList ? "Histórico de conversas" : "Assistente de projetos solares"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-muted"
                onClick={() => setShowConvList(s => !s)}
                title="Conversas"
              >
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-muted"
                onClick={startNewConversation}
                title="Nova conversa"
              >
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {showConvList ? (
            /* Conversation list */
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-10 text-center px-6">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">Nenhuma conversa ainda</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {conversations.map(conv => (
                    <div
                      key={conv.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer group transition-colors",
                        activeConvId === conv.id ? "bg-primary/10 text-primary" : "hover:bg-muted/60"
                      )}
                      onClick={() => selectConversation(conv.id)}
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{conv.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(conv.createdAt!).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Button
                        variant="ghost" size="icon"
                        className="h-6 w-6 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive shrink-0"
                        onClick={e => { e.stopPropagation(); deleteMut.mutate(conv.id); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Messages area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages && activeConvId ? (
                  <div className="flex justify-center pt-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
                  </div>
                ) : isEmpty ? (
                  <div className="flex flex-col items-center justify-center h-full py-6 text-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Sun className="h-8 w-8 text-primary/60" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-1">Olá! Sou a Lumi</h3>
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[260px]">
                        Seu assistente de projetos solares com <span className="font-semibold text-emerald-500">GPT-4o mini</span>.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 w-full mt-2">
                      {SUGGESTIONS.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(s)}
                          className="text-left text-[11px] font-medium text-foreground/70 hover:text-primary bg-muted/40 hover:bg-primary/5 border border-border/40 hover:border-primary/20 px-3 py-2 rounded-xl transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  localMessages.map(msg => (
                    <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                      {msg.role === "assistant" && (
                        <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                          <Sparkles className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed space-y-1",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted/60 text-foreground rounded-tl-sm border border-border/30"
                      )}>
                        {msg.role === "user"
                          ? <p>{msg.content}</p>
                          : formatMessage(msg.content)
                        }
                      </div>
                    </div>
                  ))
                )}
                {/* Streaming message */}
                {streaming && streamingText && (
                  <div className="flex justify-start">
                    <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                      <Sparkles className="h-3 w-3 text-primary-foreground" />
                    </div>
                    <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-tl-sm text-xs leading-relaxed bg-muted/60 border border-border/30 space-y-1">
                      {formatMessage(streamingText)}
                      <span className="inline-block w-1.5 h-3.5 bg-primary/60 animate-pulse rounded-sm ml-0.5" />
                    </div>
                  </div>
                )}
                {streaming && !streamingText && (
                  <div className="flex justify-start">
                    <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                      <Sparkles className="h-3 w-3 text-primary-foreground animate-pulse" />
                    </div>
                    <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-muted/60 border border-border/30">
                      <div className="flex gap-1 items-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border/30 bg-background/50 backdrop-blur-sm shrink-0">
                <div className="flex gap-2 items-end">
                  <Textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Pergunte à Lumi..."
                    className="resize-none text-xs rounded-2xl border-border/40 bg-muted/30 focus:bg-background min-h-[40px] max-h-[120px] py-2.5 px-3.5"
                    rows={1}
                    disabled={streaming}
                    data-testid="input-ai-message"
                  />
                  <Button
                    size="icon"
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || streaming}
                    className="h-10 w-10 rounded-xl shrink-0"
                    data-testid="button-ai-send"
                  >
                    {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[9px] text-muted-foreground/40 text-center mt-1.5 font-medium">
                  Enter para enviar · Shift+Enter para nova linha
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
