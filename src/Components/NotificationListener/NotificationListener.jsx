import React, { useEffect, useRef, useState } from "react";
import { tokenService } from "../../Apis/tokenService";
import "./style.css";

const WS_URL = "wss://demerits.authorityentrepreneurs.com/ws/notifications/";

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

const NotificationListener = () => {
  const [items, setItems] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const token = tokenService.getAccess?.();
    if (!token) {
      console.error("No token for notification WS");
      return;
    }

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
          if (ntype?.includes("MERIT")) kind = "success";
          if (ntype?.includes("DEMERIT")) kind = "error";
          if (ntype?.includes("REQUEST")) kind = "warning";

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

          setItems((prev) => [newItem, ...prev]);
        }
      } catch (err) {
        console.error("❌ Failed to parse WS message", err);
      }
    };

    ws.onclose = () => {
      console.info("🔌 Notification WS closed");
    };

    ws.onerror = (err) => {
      console.error("❌ Notification WS error", err);
    };

    return () => {
      try {
        ws.close();
      } catch (e) {}
    };
  }, []);

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
