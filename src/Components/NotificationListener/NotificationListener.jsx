import React, { useEffect, useRef, useState } from "react";
import { tokenService } from "../../Apis/tokenService";
import "./style.css";

const WS_URL = "wss://demerits.authorityentrepreneurs.com/ws/notifications/";

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const NotificationListener = () => {
  const [items, setItems] = useState([]);
  const socketRef = useRef(null);
  const tokenRef = useRef(tokenService.getAccess?.() ?? null);
  const reconnectingRef = useRef(false);

  // utility to cleanly close socket
  const closeSocket = () => {
    try {
      if (socketRef.current) {
        socketRef.current.onmessage = null;
        socketRef.current.onopen = null;
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.close();
        socketRef.current = null;
      }
    } catch (e) {
      console.warn("Error closing socket", e);
    }
  };

  // open socket for a given token
  const openSocket = (token) => {
    if (!token) return;
    try {
      const ws = new WebSocket(`${WS_URL}?token=${token}`);
      socketRef.current = ws;

      ws.onopen = () => {
        console.info("✅ Notification WS connected");
      };

      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          console.log("📩 Notification WS message", data);
          if (data?.type === "notification" && data.notification) {
            const n = data.notification;
            const id = n.id ?? uid();
            const title = n.title ?? "Notification";
            const message = n.message ?? n.preview ?? "";
            const status = n.status ?? "";
            const ntype = n.type ?? "";
            const navigate_url = n.navigate_url ?? n.metadata?.navigate_url ?? null;
            const meta = n.metadata ?? null;

            let kind = "info";
            if (typeof ntype === "string") {
              if (ntype.includes("MERIT") || ntype.toUpperCase().includes("MERIT")) kind = "success";
              if (ntype.includes("DEMERIT") || ntype.toUpperCase().includes("DEMERIT")) kind = "error";
              if (ntype.includes("REQUEST") || ntype.toUpperCase().includes("REQUEST")) kind = "warning";
            }

            const newItem = {
              id,
              title,
              message,
              kind,
              status,
              type: ntype,
              navigate_url,
              meta,
              createdAt: Date.now(),
            };

            // prepend and avoid duplicates by id
            setItems((prev) => {
              if (prev.some(p => p.id === id)) return prev;
              return [newItem, ...prev];
            });
          }
        } catch (err) {
          console.error("❌ Failed to parse WS message", err);
        }
      };

      ws.onclose = (ev) => {
        console.info("🔌 Notification WS closed", ev.reason || "");
        socketRef.current = null;
      };

      ws.onerror = (err) => {
        console.error("❌ Notification WS error", err);
      };
    } catch (e) {
      console.error("Failed to open WS", e);
    }
  };

  // effect: manage socket lifecycle based on tokenRef.current
  useEffect(() => {
    const token = tokenService.getAccess?.();
    tokenRef.current = token ?? null;

    if (tokenRef.current) {
      openSocket(tokenRef.current);
    }

    // storage event handler: detect token changes from other tabs (common logout flow)
    const onStorage = () => {
      const newToken = tokenService.getAccess?.() ?? null;
      // if token removed => logout happened
      if (!newToken && tokenRef.current) {
        tokenRef.current = null;
        // close socket & clear notifications
        closeSocket();
        setItems([]);
        console.info("NotificationListener: token removed -> closing socket & clearing items");
      } else if (newToken && newToken !== tokenRef.current) {
        // token changed (login or token refresh) -> reconnect
        tokenRef.current = newToken;
        closeSocket();
        // small debounce to avoid quick reconnect loops
        if (!reconnectingRef.current) {
          reconnectingRef.current = true;
          setTimeout(() => {
            openSocket(newToken);
            reconnectingRef.current = false;
          }, 250);
        }
      }
    };

    // custom event listener (if your logout flow emits window.dispatchEvent(new Event('auth:logout')))
    const onAuthLogout = () => {
      tokenRef.current = null;
      closeSocket();
      setItems([]);
      console.info("NotificationListener: auth:logout -> closed socket & cleared items");
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("auth:logout", onAuthLogout);

    // cleanup on unmount
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth:logout", onAuthLogout);
      closeSocket();
    };
    // run once (we rely on storage / auth events to change token)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // explicit logout helper (optional) — you can call window.dispatchEvent(new Event('auth:logout')) from your logout code
  // remove single item
  const removeItem = (id) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClick = (it) => {
    try {
      if (it.navigate_url) {
        window.open(it.navigate_url, "_blank", "noopener,noreferrer");
      } else if (it.meta?.request_id) {
        window.open(`/request/${it.meta.request_id}`, "_self");
      }
    } catch (e) {
      console.error("Open notification target failed", e);
    }
  };

  const kindIcon = (kind) => {
    if (kind === "success") return "✅";
    if (kind === "error") return "⚠️";
    if (kind === "warning") return "⚠️";
    return "🔔";
  };

  return (
    <div className="nl-root" aria-live="polite" aria-atomic="true">
      <div className="nl-container" role="list">
        {/* optional "clear all" button shown when items exist */}
        {items.length > 0 && (
          <div className="nl-clear-all">
            <button
              className="nl-clear-btn"
              onClick={() => setItems([])}
              aria-label="Clear all notifications"
            >
              Clear All
            </button>
          </div>
        )}

        {items.map((it) => (
          <div
            key={it.id}
            role="listitem"
            className={`nl-item nl-${it.kind}`}
          >
            <button
              className="nl-close-btn"
              aria-label="Dismiss"
              onClick={() => removeItem(it.id)}
            >
              ✕
            </button>

            <div className="nl-left">
              <div className="nl-icon">{kindIcon(it.kind)}</div>
            </div>

            <div
              className="nl-main"
              onClick={() => handleClick(it)}
              tabIndex={0}
              role="button"
            >
              <div className="nl-title">{it.title}</div>
              <div className="nl-msg">{it.message}</div>
              <div className="nl-meta">
                {it.type && <span className="nl-type">{it.type}</span>}
                {it.status && <span className="nl-status-txt">{it.status}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationListener;
