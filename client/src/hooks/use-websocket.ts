import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

export type WsMessage = { type: string; [key: string]: any };

let globalWs: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const listeners: Set<(msg: WsMessage) => void> = new Set();

function getWsUrl() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

function connectGlobal(userId: string, role: string) {
  if (globalWs && globalWs.readyState === WebSocket.OPEN) return;

  globalWs = new WebSocket(getWsUrl());

  globalWs.onopen = () => {
    globalWs!.send(JSON.stringify({ type: "auth", userId, role }));
  };

  globalWs.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data) as WsMessage;
      listeners.forEach((fn) => fn(msg));
    } catch {
      // ignore
    }
  };

  globalWs.onclose = () => {
    globalWs = null;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => connectGlobal(userId, role), 5000);
  };

  globalWs.onerror = () => {
    globalWs?.close();
  };
}

export function useWebSocket(userId: string | null, role: string | null, onMessage?: (msg: WsMessage) => void) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!userId || !role) return;
    connectGlobal(userId, role);

    const handler = (msg: WsMessage) => onMessageRef.current?.(msg);
    listeners.add(handler);

    return () => {
      listeners.delete(handler);
    };
  }, [userId, role]);
}

export function useProjectWebSocket(userId: string | null, role: string | null, projectId: string) {
  const queryClient = useQueryClient();

  useWebSocket(userId, role, (msg) => {
    if (msg.projectId !== projectId) return;

    if (msg.type === "chat_message") {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/chat`] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/unread"] });
    }
    if (msg.type === "project_updated" || msg.type === "status_changed") {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
    }
    if (msg.type === "document_added" || msg.type === "document_deleted") {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/documents`] });
    }
    if (msg.type === "timeline_added") {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/timeline`] });
    }
  });
}
