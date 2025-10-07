// src/Providers/WebSocketProvider.jsx
import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
} from "react";
import { tokenService } from "../Apis/tokenService";
import PropTypes from "prop-types";

const WS_URL_BASE =
  "wss://demerits.authorityentrepreneurs.com/ws/conversations/user/?token=";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const wsRef = useRef(null);
  const subscribersRef = useRef(new Map());
  const nextSubscriberId = useRef(1);
  const [socketReady, setSocketReady] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const manuallyClosedRef = useRef(false);

  // Creates socket for the current token and wires handlers.
  const createSocket = useCallback((token) => {
    if (!token) return null;
    try {
      const socket = new WebSocket(WS_URL_BASE + token);

      socket.onopen = () => {
        setSocketReady(true);
        // reset manual-close flag (connected by explicit user call)
        manuallyClosedRef.current = false;
      };

      socket.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload?.type === "connection_confirmed") {
            setUnreadCount(payload.total_unread_conversations ?? 0);
          } else if (payload?.type === "unread_status_update") {
            setUnreadCount(payload.total_unread_conversations ?? 0);
          }

          for (const cb of subscribersRef.current.values()) {
            try {
              cb(payload);
            } catch {}
          }
        } catch {}
      };

      socket.onclose = () => {
        setSocketReady(false);
      };

      socket.onerror = () => {
        // optional: log or handle
      };

      return socket;
    } catch {
      return null;
    }
  }, []);

  // Manually initiate a connection. Call this after login.
  const connect = useCallback(() => {
    const token = tokenService.getAccess();
    if (!token) return false;

    // If already open or connecting, no-op
    if (wsRef.current) {
      const rs = wsRef.current.readyState;
      if (rs === WebSocket.OPEN || rs === WebSocket.CONNECTING) {
        setSocketReady(rs === WebSocket.OPEN);
        
        return true;
      }
      try {
        wsRef.current.close();
      } catch {}
    }

    manuallyClosedRef.current = false;
    wsRef.current = createSocket(token);
    
    return !!wsRef.current;
  }, [createSocket]);

  // Close socket (call on logout)
  const closeSocket = useCallback(() => {
    manuallyClosedRef.current = true;
    try {
      wsRef.current?.close();
    } catch {}
    wsRef.current = null;
    setSocketReady(false);
    setUnreadCount(0);
  }, []);

  const sendPayload = useCallback((payload) => {
    const socket = wsRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    try {
      socket.send(JSON.stringify(payload));
      return true;
    } catch {
      return false;
    }
  }, []);

  const subscribe = useCallback((cb) => {
    const id = String(nextSubscriberId.current++);
    subscribersRef.current.set(id, cb);
    return id;
  }, []);

  const unsubscribe = useCallback((id) => {
    subscribersRef.current.delete(id);
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        connect,
        closeSocket,
        sendPayload,
        subscribe,
        unsubscribe,
        socketReady,
        unreadCount,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

WebSocketProvider.propTypes = {
  children: PropTypes.node,
};

export const useWebSocket = () => {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useWebSocket must be used within WebSocketProvider");
  return ctx;
};
