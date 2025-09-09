// hooks/useConversationSocket.js
import { useCallback, useEffect, useRef, useState } from "react";
import { tokenService } from "../Apis/tokenService";

/**
 * useConversationSocket(conversationId, opts)
 * - conversationId: optional (hook will send subscribe on open)
 * - opts: { pingIntervalMs, confirmationTimeoutMs }
 *
 * Exposes:
 *  { connected, lastEvent, sendMessage, closeSocket }
 *
 * sendMessage(payload) returns a Promise that resolves when:
 *  - server sends message_confirmation containing the client_temp_id, or
 *  - server includes client_temp_id inside message payload
 *
 * If payload doesn't include client_temp_id, sendMessage resolves immediately (best-effort).
 */
export default function useConversationSocket(conversationId, opts = {}) {
  const pingIntervalMs = opts.pingIntervalMs ?? 25000;
  const confirmationTimeoutMs = opts.confirmationTimeoutMs ?? 15000;

  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);

  const wsRef = useRef(null);
  const reconnectRef = useRef({ attempts: 0, timer: null });
  const pingTimerRef = useRef(null);
  const manualCloseRef = useRef(false);

  // pending confirmations: client_temp_id -> { resolve, reject, timer }
  const pendingRef = useRef({});

  const buildUrl = useCallback(() => {
    const token = tokenService.getAccess?.() || tokenService.getToken?.();
    const base = process.env.REACT_APP_WS_BASE || "wss://demerits.authorityentrepreneurs.com";
    return `${base}/ws/conversations/user/?token=${encodeURIComponent(token || "")}`;
  }, []);

  const startPing = (ws) => {
    if (pingTimerRef.current) clearInterval(pingTimerRef.current);
    try { ws.send(JSON.stringify({ type: "ping" })); } catch (e) {}
    pingTimerRef.current = setInterval(() => {
      try {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      } catch (e) {}
    }, pingIntervalMs);
  };

  const clearPing = () => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  };

  const handleRawMessage = useCallback((raw) => {
    // raw is MessageEvent
    let data;
    try {
      data = JSON.parse(raw.data);
    } catch (e) {
      setLastEvent({ raw: raw.data });
      return;
    }

    // Resolve pending if message_confirmation with client_temp_id
    const t = (data.type || "").toString().toLowerCase();
    if (t.includes("confirm") || t === "message_confirmation") {
      const clientTemp = data.client_temp_id ?? data.message?.client_temp_id ?? null;
      if (clientTemp && pendingRef.current[clientTemp]) {
        pendingRef.current[clientTemp].resolve(data.message ?? data);
        clearTimeout(pendingRef.current[clientTemp].timer);
        delete pendingRef.current[clientTemp];
      }
    }

    // Also resolve if message includes message.client_temp_id
    if (data?.message && data.message.client_temp_id) {
      const ct = data.message.client_temp_id;
      if (ct && pendingRef.current[ct]) {
        pendingRef.current[ct].resolve(data.message);
        clearTimeout(pendingRef.current[ct].timer);
        delete pendingRef.current[ct];
      }
    }

    // set lastEvent for consumer
    setLastEvent(data);
  }, []);

  const connect = useCallback(() => {
    manualCloseRef.current = false;
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (e) {}
      wsRef.current = null;
    }

    const url = buildUrl();
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectRef.current.attempts = 0;
      setConnected(true);
      startPing(ws);
      // subscribe to conversation id (server may accept or ignore)
      if (conversationId) {
        try {
          ws.send(JSON.stringify({ type: "subscribe", conversation_id: conversationId }));
        } catch (e) {}
      }
    };

    ws.onmessage = (msg) => handleRawMessage(msg);

    ws.onclose = (ev) => {
      setConnected(false);
      clearPing();

      // reject pending promises
      Object.keys(pendingRef.current).forEach((k) => {
        try {
          pendingRef.current[k].reject(new Error("ws-closed"));
          clearTimeout(pendingRef.current[k].timer);
        } catch (_) {}
        delete pendingRef.current[k];
      });

      if (manualCloseRef.current) {
        // do not reconnect if closed manually
        return;
      }
      const attempts = (reconnectRef.current.attempts || 0) + 1;
      reconnectRef.current.attempts = attempts;
      const backoff = Math.min(30000, 1000 * 2 ** attempts);
      reconnectRef.current.timer = setTimeout(() => {
        connect();
      }, backoff);
    };

    ws.onerror = (err) => {
      // errors will often be followed by onclose
      console.error("[WS] error", err);
    };

    return ws;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildUrl, conversationId, handleRawMessage]);

  useEffect(() => {
    connect();
    return () => {
      manualCloseRef.current = true;
      if (reconnectRef.current.timer) clearTimeout(reconnectRef.current.timer);
      clearPing();
      if (wsRef.current) try { wsRef.current.close(); } catch (e) {}
      // reject pending on unmount
      Object.keys(pendingRef.current).forEach((k) => {
        pendingRef.current[k].reject(new Error("hook-unmount"));
        clearTimeout(pendingRef.current[k].timer);
        delete pendingRef.current[k];
      });
    };
  }, [connect]);

  /**
   * sendMessage(payload, opts)
   * payload should be plain JS object. If payload contains client_temp_id,
   * this function will return a Promise that resolves when server confirms (or times out).
   */
  const sendMessage = useCallback((payload = {}, opts = {}) =>
    new Promise((resolve, reject) => {
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        reject(new Error("ws-not-open"));
        return;
      }

      try {
        const outgoing = JSON.stringify(payload);
        ws.send(outgoing);
      } catch (err) {
        reject(err);
        return;
      }

      const ct = payload.client_temp_id ?? payload.client_temp ?? null;
      const timeoutMs = opts.timeoutMs ?? confirmationTimeoutMs;

      if (ct) {
        if (pendingRef.current[ct]) {
          // clean previous if exists
          clearTimeout(pendingRef.current[ct].timer);
          pendingRef.current[ct].reject(new Error("duplicate-client-temp"));
          delete pendingRef.current[ct];
        }
        const timer = setTimeout(() => {
          if (pendingRef.current[ct]) {
            pendingRef.current[ct].reject(new Error("confirmation-timeout"));
            delete pendingRef.current[ct];
          }
        }, timeoutMs);
        pendingRef.current[ct] = { resolve, reject, timer };
      } else {
        // if no client_temp_id provided, resolve immediately (best-effort)
        resolve();
      }
    }), [confirmationTimeoutMs]);

  const closeSocket = useCallback(() => {
    manualCloseRef.current = true;
    clearPing();
    if (reconnectRef.current.timer) clearTimeout(reconnectRef.current.timer);
    if (wsRef.current) {
      try { wsRef.current.close(); } catch (e) {}
      wsRef.current = null;
    }
    // reject pending
    Object.keys(pendingRef.current).forEach((k) => {
      pendingRef.current[k].reject(new Error("manual-close"));
      clearTimeout(pendingRef.current[k].timer);
      delete pendingRef.current[k];
    });
    setConnected(false);
  }, []);

  return { connected, lastEvent, sendMessage, closeSocket };
}
