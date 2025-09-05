import React, { useEffect, useRef, useState } from "react";
import { tokenService } from "../../Apis/tokenService";
import "./style.css";

const WS_URL = "wss://demerits.authorityentrepreneurs.com/ws/notifications/";
const AUTO_DISMISS_MS = 5000; // default auto close time

// small helper to create unique IDs if backend doesn't provide one
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;

const NotificationListener = () => {
  const [items, setItems] = useState([]); // list of notifications shown
  const socketRef = useRef(null);

  // store timers so we can pause/resume/cancel
  const timersRef = useRef({}); // { id: { timeoutId, startTime, remaining } }

  useEffect(() => {
    const token = tokenService.getAccess?.();
    if (!token) {
      console.error("No token for notification WS");
      return;
    }

    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    socketRef.current = ws;

    ws.onopen = () => {
      console.info("Notification WS connected");
    };

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        // Expecting data.type === "notification" and data.notification payload
        if (data?.type === "notification" && data.notification) {
          const n = data.notification;
          const id = n.id ?? uid();
          const title = n.title ?? "Notification";
          const message = n.message ?? n.preview ?? "";
          const status = n.status ?? "";      // e.g., PENDING
          const ntype = n.type ?? "";        // e.g., POINT_REQUEST_SUBMITTED
          const navigate_url = n.navigate_url ?? n.metadata?.navigate_url ?? null;
          const meta = n.metadata ?? null;

          // map backend type to style/type
          let kind = "info";
          if (ntype?.includes("MERIT") || ntype?.includes("merit")) kind = "success";
          if (ntype?.includes("DEMERIT") || ntype?.includes("demerit")) kind = "error";
          if (ntype?.includes("REQUEST") || ntype?.includes("request")) kind = "warning";

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

          pushItem(newItem);
        }
      } catch (err) {
        console.error("Failed to parse WS message", err);
      }
    };

    ws.onclose = () => {
      console.info("Notification WS closed");
    };

    ws.onerror = (err) => {
      console.error("Notification WS error", err);
    };

    return () => {
      // cleanup
      try { ws.close(); } catch (e) {}
      // clear timers
      Object.values(timersRef.current).forEach(t => {
        clearTimeout(t?.timeoutId);
      });
      timersRef.current = {};
    };
  }, []);

  // push a new item and start its timer
  const pushItem = (item) => {
    setItems((prev) => [item, ...prev].slice(0, 6)); // keep max 6 visible
    startAutoDismiss(item.id, AUTO_DISMISS_MS);
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
    // clear timer
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id].timeoutId);
      delete timersRef.current[id];
    }
  };

  // start timer
  const startAutoDismiss = (id, ms) => {
    // clear previous if exists
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id].timeoutId);
    }
    const start = Date.now();
    const timeoutId = setTimeout(() => {
      removeItem(id);
      delete timersRef.current[id];
    }, ms);

    timersRef.current[id] = { timeoutId, startTime: start, remaining: ms };
  };

  // pause timer for item (on hover)
  const pauseTimer = (id) => {
    const t = timersRef.current[id];
    if (!t) return;
    clearTimeout(t.timeoutId);
    const elapsed = Date.now() - t.startTime;
    const remaining = Math.max(0, (t.remaining ?? AUTO_DISMISS_MS) - elapsed);
    timersRef.current[id] = { ...t, remaining };
  };

  // resume paused timer (on leave)
  const resumeTimer = (id) => {
    const t = timersRef.current[id];
    if (!t) {
      // start new default timer if somehow missing
      startAutoDismiss(id, AUTO_DISMISS_MS);
      return;
    }
    const timeoutId = setTimeout(() => {
      removeItem(id);
      delete timersRef.current[id];
    }, t.remaining ?? AUTO_DISMISS_MS);
    timersRef.current[id] = { ...t, timeoutId, startTime: Date.now() };
  };

  // click opens navigate_url in new tab (if provided)
  const handleClick = (it) => {
    try {
      if (it.navigate_url) {
        // try to open in new tab
        window.open(it.navigate_url, "_blank", "noopener,noreferrer");
      } else if (it.meta?.request_id) {
        window.open(`/request/${it.meta.request_id}`, "_self");
      }
    } catch (e) {
      console.error("Open notification target failed", e);
    } finally {
      removeItem(it.id);
    }
  };

  // small icon per kind
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
            onMouseEnter={() => pauseTimer(it.id)}
            onMouseLeave={() => resumeTimer(it.id)}
          >
            <button className="nl-close-btn" aria-label="Dismiss" onClick={() => removeItem(it.id)}>✕</button>

            <div className="nl-left">
              <div className="nl-icon">{kindIcon(it.kind)}</div>
            </div>

            <div className="nl-main" onClick={() => handleClick(it)} tabIndex={0} role="button">
              <div className="nl-title">{it.title}</div>
              <div className="nl-msg">{it.message}</div>
              <div className="nl-meta">
                {it.type && <span className="nl-type">{it.type}</span>}
                {it.status && <span className="nl-status-txt">{it.status}</span>}
              </div>
              <div className="nl-progress" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationListener;
