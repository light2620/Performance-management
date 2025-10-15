// src/Providers/NotificationProvider.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { tokenService } from "../Apis/tokenService";
import PropTypes from "prop-types";

const WS_BASE = "wss://demerits.authorityentrepreneurs.com/ws/notifications/";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const socketRef = useRef(null);
  const reconnectRef = useRef(null);
  const tokenRef = useRef(tokenService.getAccess?.() ?? null);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Internal: open socket for a token
  const openSocketWithToken = useCallback((token) => {
    if (!token) return;

    try {
      const url = `${WS_BASE}?token=${token}`;
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("Notification WS ✅ connected");
      };

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);

          if (data?.type === "notification" && data.notification) {
            const n = data.notification;
            const id = n.id ?? `notif-${Date.now()}`;
            const title = n.title ?? "";
            const message = n.message ?? n.preview ?? "";
            const type = n.type ?? "";
            const navigate_url =
              n.navigate_url ?? n.metadata?.navigate_url ?? null;
            const created_at = n.created_at ?? new Date().toISOString();
            const is_read = Boolean(n.is_read);

            const item = {
              id,
              title,
              message,
              type,
              navigate_url,
              meta: n.metadata ?? null,
              created_at,
              is_read,
            };

            setNotifications((prev) => {
              if (prev.some((p) => p.id === id)) return prev;
              return [item, ...prev].slice(0, 10);
            });
          } else if (data?.type === "count_update") {
            setUnreadCount(data.unread_count ?? 0);
          }
        } catch (e) {
          console.warn("NotificationProvider: ⚠️ failed to parse message", e);
        }
      };

      ws.onclose = (ev) => {
  console.log("Notification WS ❌ closed", ev?.reason ?? ev?.code ?? "");
  socketRef.current = null;
  // do not auto-reconnect — manual connection only
};

      ws.onerror = (err) => {
        console.error("Notification WS ⚠️ error", err);
      };
    } catch (e) {
      console.error("NotificationProvider openSocket error", e);
    }
  }, []);

  // Public: connectNotification() - call manually after login
  const connectNotification = useCallback(() => {
    const token = tokenService.getAccess?.();
    if (!token) return false;

    if (socketRef.current) {
      const rs = socketRef.current.readyState;
      if (rs === WebSocket.OPEN || rs === WebSocket.CONNECTING) return true;
      try {
        socketRef.current.close();
      } catch {}
      socketRef.current = null;
    }

    tokenRef.current = token;
    openSocketWithToken(token);

    return true;
  }, [openSocketWithToken]);

  // Public: close socket (call on logout)
  const close = useCallback(() => {
    console.log("NotificationProvider: 🔌 closing socket");
    try {
      socketRef.current?.close();
    } catch {}
    socketRef.current = null;
  }, []);

  // Local helpers
  const remove = useCallback((id) => {
    setNotifications((p) => p.filter((x) => x.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const markReadLocal = useCallback((id) => {
    setNotifications((p) =>
      p.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // On mount: register global helpers and event listeners
  useEffect(() => {
    try {
      // expose manual helpers so other code can call them
      window.__notif_connect = connectNotification;
      window.__notif_close = close;
    } catch (e) {}

    const onStorage = (e) => {
      // When the access token in localStorage changes we will NOT auto-connect.
      // We only react to removals (logout) by closing and clearing local state.
      if (e.key === "access") {
        const newToken = tokenService.getAccess?.() ?? null;
        if (!newToken && tokenRef.current) {
          // token removed -> treat as logout
          tokenRef.current = null;
          close();
          setNotifications([]);
          setUnreadCount(0);
        } else if (newToken && newToken !== tokenRef.current) {
          // token changed/added: update tokenRef but do NOT auto-open the socket.
          tokenRef.current = newToken;
          // If there's an existing socket, close it so subsequent manual connect starts fresh.
          if (socketRef.current) {
            try {
              socketRef.current.close();
            } catch {}
            socketRef.current = null;
          }
          // IMPORTANT: do not call openSocketWithToken here — connection is manual only.
        }
      }
    };

    const onAuthLogout = () => {
      tokenRef.current = null;
      close();
      setNotifications([]);
      setUnreadCount(0);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("auth:logout", onAuthLogout);

    return () => {
      try {
        delete window.__notif_connect;
        delete window.__notif_close;
      } catch (e) {}
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth:logout", onAuthLogout);
      close();
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    };
  }, [connectNotification, close, openSocketWithToken]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        removeNotification: remove,
        clearNotifications: clearAll,
        markReadLocal,
        connectNotification,
        close,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node,
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};
