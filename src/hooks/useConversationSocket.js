// src/hooks/useWebsocket.js
import { useEffect, useRef, useState, useCallback } from "react";

/**
 * useWebsocket with outbound queue
 * urlTemplate: "wss://.../?token="
 * token: auth token
 * handlers: { onConversationMessage, onMessageConfirmation, onConnectionConfirmed, onOpen, onClose, onError }
 */
export default function useWebsocket(urlTemplate, token, handlers = {}, deps = []) {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const [readyState, setReadyState] = useState("CLOSED"); // "OPEN","CONNECTING","CLOSED"
  const heartbeatRef = useRef(null);
  const outboundQueue = useRef([]); // queue of objects to send when open

  const drainQueue = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    while (outboundQueue.current.length > 0) {
      const obj = outboundQueue.current.shift();
      try {
        wsRef.current.send(JSON.stringify(obj));
      } catch (err) {
        console.error("Failed to send queued message, re-queuing", err);
        // put it back and abort to avoid tight loop
        outboundQueue.current.unshift(obj);
        break;
      }
    }
  }, []);

  const connect = useCallback(() => {
    if (!token) {
      setReadyState("CLOSED");
      return;
    }
    const url = urlTemplate + encodeURIComponent(token);
    try { wsRef.current && wsRef.current.close(); } catch (e) {}
    setReadyState("CONNECTING");
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setReadyState("OPEN");
      handlers.onOpen && handlers.onOpen();
      // start heartbeat
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = setInterval(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          try { wsRef.current.send(JSON.stringify({ type: "ping" })); } catch {}
        }
      }, 25000);
      // drain queued messages
      drainQueue();
    };

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data.type === "connection_confirmed") {
          handlers.onConnectionConfirmed && handlers.onConnectionConfirmed(data);
        } else if (data.type === "message_confirmation") {
          handlers.onMessageConfirmation && handlers.onMessageConfirmation(data);
        } else if (data.type === "conversation_message") {
          handlers.onConversationMessage && handlers.onConversationMessage(data);
        } else {
          handlers.onMessage && handlers.onMessage(data);
        }
      } catch (err) {
        console.error("WS parse error", err);
      }
    };

    ws.onclose = (ev) => {
      setReadyState("CLOSED");
      handlers.onClose && handlers.onClose(ev);
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      // reconnect with backoff
      if (!reconnectTimer.current) {
        reconnectTimer.current = setTimeout(() => {
          reconnectTimer.current = null;
          connect();
        }, 2000 + Math.floor(Math.random() * 3000));
      }
    };

    ws.onerror = (err) => {
      handlers.onError && handlers.onError(err);
      // we rely on onclose to trigger reconnect
      console.warn("WS error", err);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, urlTemplate, ...deps]);

  useEffect(() => {
    if (token) connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      try { wsRef.current && wsRef.current.close(); } catch {}
      wsRef.current = null;
      setReadyState("CLOSED");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, connect]);

  /**
   * send(obj)
   * - if socket open -> sends immediately and returns true
   * - if socket not open -> queues and returns true (accepted)
   * - returns false only if queueing failed (very unlikely)
   */
  const send = useCallback((obj) => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(obj));
        return true;
      }
      // not open: queue it for later
      outboundQueue.current.push(obj);
      // optional: cap queue length to prevent unbounded memory usage
      if (outboundQueue.current.length > 200) {
        // drop oldest if necessary
        outboundQueue.current.shift();
      }
      return true;
    } catch (e) {
      console.error("WS send err", e);
      return false;
    }
  }, []);

  return {
    send,
    readyState,
    reconnect: connect,
    // expose queue length for debugging if desired
    queueLength: () => outboundQueue.current.length,
  };
}
