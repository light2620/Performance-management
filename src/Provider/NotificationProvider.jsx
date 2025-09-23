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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const reconnectRef = useRef(null);
  const tokenRef = useRef(tokenService.getAccess?.() ?? null);
  console.log("unread count", unreadCount)

  const openSocket = useCallback((token) => {
    if (!token) {
      console.log("NotificationProvider: ❌ no token, skipping socket connect");
      return;
    }
    try {
      const url = `${WS_BASE}?token=${token}`;
      console.log("NotificationProvider: 🌐 connecting ->", url);
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("Notification WS ✅ connected");
      };

      ws.onmessage = (evt) => {
        console.log("Notification WS 📩 raw message:", evt.data);
        try {
          const data = JSON.parse(evt.data);
          console.log("Notification WS 📦 parsed payload:", data);

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

            console.log("Notification WS ➕ adding notification:", item);

            setNotifications((prev) => {
              if (prev.some((p) => p.id === id)) {
                console.log("Notification WS 🔄 duplicate ignored:", id);
                return prev;
              }
              return [item, ...prev].slice(0, 10);
            });
          } else if (data?.type === "count_update") {
            console.log("Notification WS 🔢 updating unread count:", data.unread_count);
            setUnreadCount(data.unread_count ?? 0);
          } else {
            console.log("Notification WS ℹ️ other message received:", data);
          }
        } catch (e) {
          console.warn("NotificationProvider: ⚠️ failed to parse WS message", e);
        }
      };

      ws.onclose = (ev) => {
        console.log("Notification WS ❌ closed", ev?.reason ?? ev?.code ?? "");
        socketRef.current = null;
        if (!reconnectRef.current) {
          reconnectRef.current = setTimeout(() => {
            console.log("Notification WS 🔄 attempting reconnect...");
            reconnectRef.current = null;
            const t = tokenService.getAccess?.();
            if (t) openSocket(t);
          }, 3000);
        }
      };

      ws.onerror = (err) => {
        console.error("Notification WS ⚠️ error", err);
      };
    } catch (e) {
      console.error("NotificationProvider openSocket error", e);
    }
  }, []);

  const closeSocket = useCallback(() => {
    console.log("NotificationProvider: 🔌 closing socket");
    try {
      socketRef.current?.close();
    } catch (_) {}
    socketRef.current = null;
  }, []);

  useEffect(() => {
    const token = tokenService.getAccess?.();
    tokenRef.current = token ?? null;
    console.log(
      "NotificationProvider: 🚀 useEffect mount, token =",
      tokenRef.current
    );

    if (tokenRef.current) openSocket(tokenRef.current);

    const onStorage = () => {
      console.log("NotificationProvider: 📦 storage event fired");
      const newToken = tokenService.getAccess?.() ?? null;
      if (!newToken && tokenRef.current) {
        console.log("NotificationProvider: 🔒 logged out, clearing notifications");
        tokenRef.current = null;
        closeSocket();
        setNotifications([]);
        setUnreadCount(0);
      } else if (newToken && newToken !== tokenRef.current) {
        console.log("NotificationProvider: 🔑 token changed, reconnecting");
        tokenRef.current = newToken;
        closeSocket();
        setTimeout(() => openSocket(newToken), 200);
      }
    };

    const onAuthLogout = () => {
      console.log("NotificationProvider: 🔒 auth:logout event, clearing notifications");
      tokenRef.current = null;
      closeSocket();
      setNotifications([]);
      setUnreadCount(0);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("auth:logout", onAuthLogout);

    return () => {
      console.log("NotificationProvider: 🧹 cleanup on unmount");
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth:logout", onAuthLogout);
      closeSocket();
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
    };
  }, [openSocket, closeSocket]);

  const remove = useCallback((id) => {
    console.log("NotificationProvider: 🗑️ removing notification", id);
    setNotifications((p) => p.filter((x) => x.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    console.log("NotificationProvider: 🗑️ clearing all notifications");
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const markReadLocal = useCallback((id) => {
    console.log("NotificationProvider: ✏️ marking notification as read", id);
    setNotifications((p) =>
      p.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        removeNotification: remove,
        clearNotifications: clearAll,
        markReadLocal,
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
