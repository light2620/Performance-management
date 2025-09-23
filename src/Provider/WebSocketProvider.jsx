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
    if (!token) {
      console.warn("WebSocketProvider: no token found, skipping ws connect");
      return;
    }
    const url = WS_URL_BASE + token;
    console.log("WS: attempting to connect →", url);

    try {
      const socket = new WebSocket(url);
      wsRef.current = socket;

      socket.onopen = () => {
        setSocketReady(true);
        console.log("WS: ✅ connected");
      };

      socket.onmessage = (ev) => {
        console.log("WS: 📩 incoming message →", ev.data);
        try {
          const payload = JSON.parse(ev.data);

          if (payload.type === "connection_confirmed") {
            console.log("WS: connection confirmed", payload);
         
              setUnreadCount(payload.total_unread_conversations);
        
          } else if (payload.type === "unread_status_update") {
            console.log("WS: unread count updated", payload);
            
              setUnreadCount(payload.total_unread_conversations);
            
          }

          for (const cb of subscribersRef.current.values()) {
            try {
              cb(payload);
            } catch (e) {
              console.error("WS subscriber callback error:", e);
            }
          }
        } catch (e) {
          console.error("WS parse error:", e);
        }
      };

      socket.onclose = (ev) => {
        console.log("WS: ❌ closed →", ev.reason || ev.code);
        setSocketReady(false);
        if (!reconnectTimer.current) {
          reconnectTimer.current = setTimeout(() => {
            console.log("WS: 🔄 reconnecting...");
            reconnectTimer.current = null;
            connect();
          }, 3000);
        }
      };

      socket.onerror = (err) => {
        console.error("WS: ⚠️ error →", err);
      };
    } catch (e) {
      console.error("WS connect error", e);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      console.log("WS: provider unmounted → closing socket");
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
    console.log("WS: ✉️ sending payload →", payload);
    const socket = wsRef.current;
    if (!socket) {
      console.error("WS: no socket instance to send");
      return false;
    }
    if (socket.readyState !== WebSocket.OPEN) {
      console.error("WS: socket not open yet (state:", socket.readyState, ")");
      return false;
    }
    try {
      socket.send(JSON.stringify(payload));
      console.log("WS: ✅ payload sent");
      return true;
    } catch (e) {
      console.error("WS send error", e);
      return false;
    }
  }, []);

  const subscribe = useCallback((cb) => {
    const id = String(nextSubscriberId.current++);
    subscribersRef.current.set(id, cb);
    console.log("WS: 👀 new subscriber added (id:", id, ")");
    return id;
  }, []);

  const unsubscribe = useCallback((id) => {
    subscribersRef.current.delete(id);
    console.log("WS: 🗑️ subscriber removed (id:", id, ")");
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
