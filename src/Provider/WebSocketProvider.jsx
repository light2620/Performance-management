// src/Providers/WebSocketProvider.jsx
import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { tokenService } from "../Apis/tokenService";
import PropTypes from "prop-types";

const WS_URL_BASE = "wss://demerits.authorityentrepreneurs.com/ws/conversations/user/?token=";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const wsRef = useRef(null);
  const subscribersRef = useRef(new Map());
  const nextSubscriberId = useRef(1);
  const [socketReady, setSocketReady] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    const token = tokenService.getAccess();
    if (!token) return;

    const url = WS_URL_BASE + token;

    try {
      const socket = new WebSocket(url);
      wsRef.current = socket;

      socket.onopen = () => {
        setSocketReady(true);
      };

      socket.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);

          if (payload.type === "connection_confirmed") {
            setUnreadCount(payload.total_unread_conversations);
          } else if (payload.type === "unread_status_update") {
            setUnreadCount(payload.total_unread_conversations);
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
        if (!reconnectTimer.current) {
          reconnectTimer.current = setTimeout(() => {
            reconnectTimer.current = null;
            connect();
          }, 3000);
        }
      };

      socket.onerror = () => {};
    } catch {}
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      try {
        wsRef.current?.close();
      } catch {}
    };
  }, [connect]);

  const sendPayload = useCallback((payload) => {
    const socket = wsRef.current;
    if (!socket) return false;
    if (socket.readyState !== WebSocket.OPEN) return false;
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
