// src/Components/NotificationListener/NotificationListener.jsx
import React from "react";
import { useNotifications } from "../../Provider/NotificationProvider";
import { useNavigate } from "react-router-dom";
import "./style.css";

/**
 * NotificationListener
 * - Navigates based on notification.type and notification.meta fields (request_id, object_id, reversal_entry_id)
 * - View button / clicking row will navigate and mark read locally
 * - Dismiss button removes notification only
 */
const NotificationListener = () => {
  const { notifications, removeNotification, clearNotifications, markReadLocal } = useNotifications();
  const navigate = useNavigate();

  // derive app route & whether to open in new tab from notification
  const getNavigationTarget = (n) => {
    const meta = n.meta || {};
    const type = String(n.type || "").toUpperCase();

    // helper to coerce ids
    const objId = meta.object_id ?? meta.objectId ?? meta.entry_id ?? null;
    const requestId = meta.request_id ?? meta.requestId ?? null;
    const reversalId = meta.reversal_entry_id ?? meta.reversal_entryId ?? null;

    switch (type) {
      case "DEMERIT_AWARDED":
      case "MERIT_AWARDED":
        // points entries show the object_id (entry id)
        if (objId) return { route: `/points-entries/${objId}`, external: false };
        break;

      case "MERIT_REVERSED":
        // prefer reversal_entry_id, fallback to object_id
        if (reversalId) return { route: `/points-entries/${reversalId}`, external: false };
        if (objId) return { route: `/points-entries/${objId}`, external: false };
        break;

      case "POINT_REQUEST_APPROVED":
      case "POINT_REQUEST_REJECTED":
      case "POINT_REQUEST_CANCELLED":
      case "POINT_REQUEST_SUBMITTED":
      case "POINT_REQUEST_MODIFIED":
        // go to requests page (use request_id)
        if (requestId) return { route: `/requests/${requestId}`, external: false };
        // fallback: sometimes object_id contains request id
        if (objId) return { route: `/requests/${objId}`, external: false };
        break;

      default:
        break;
    }

    // final fallback: if server supplied a relative navigate_url, use it as internal route.
    if (n.navigate_url && typeof n.navigate_url === "string") {
      const url = n.navigate_url;
      // If absolute URL to another domain -> open in new tab.
      const isAbsolute = /^https?:\/\//i.test(url);
      if (isAbsolute) return { route: url, external: true };
      // treat as internal relative route
      return { route: url, external: false };
    }

    return null;
  };

  const handleOpen = (n) => {
    const target = getNavigationTarget(n);

    if (!target) {
      // No route target known: mark read locally and remove
      markReadLocal(n.id);
      removeNotification(n.id);
      return;
    }

    // mark read locally
    markReadLocal(n.id);
    // remove from the list
    removeNotification(n.id);

    if (target.external) {
      // open absolute urls in new tab
      window.open(target.route, "_blank", "noopener,noreferrer");
    } else {
      // internal navigate
      try {
        // If the route is absolute path string starting with http(s) but same origin, fall back to location
        navigate(target.route);
      } catch (e) {
        // fallback
        window.location.href = target.route;
      }
    }
  };

  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="nl-root-simple" aria-live="polite">
      <div className="nl-header">
        <strong>Notifications</strong>
        <button className="nl-clear" onClick={clearNotifications} aria-label="Clear notifications">Clear</button>
      </div>

      <div className="nl-list">
        {notifications.map((n) => (
          <div key={n.id} className={`nl-row ${n.is_read ? "read" : "unread"}`}>
            <div className="nl-left">
              <div className="nl-dot" aria-hidden />
            </div>

            <div
              className="nl-body"
              onClick={() => handleOpen(n)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleOpen(n); }}
            >
              <div className="nl-title">{n.title || (n.type ?? "Notification")}</div>
              <div className="nl-msg">{n.message}</div>
            </div>

            <div className="nl-actions">
              <button
                className="nl-view"
                onClick={(ev) => { ev.stopPropagation(); handleOpen(n); }}
                aria-label="View notification"
              >
                View
              </button>
              <button
                className="nl-dismiss"
                onClick={(ev) => { ev.stopPropagation(); removeNotification(n.id); }}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationListener;
