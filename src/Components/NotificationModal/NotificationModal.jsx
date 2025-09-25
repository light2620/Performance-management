import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { getNotificationById, markAsRead } from "../../Apis/NotificationApis";
import { useAuth } from "../../Utils/AuthContext";
import "./style.css";

const NotificationModal = ({ id, onClose, previewMessage, fetchNotification }) => {
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;

    const fetchNotificationData = async () => {
      try {
        setLoading(true);
        const res = await getNotificationById(id);
        setNotification(res.data);
      } catch (err) {
        console.error("Error fetching notification:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotificationData();
  }, [id]);

  if (!id) return null;

  const handleMarkAsRead = async () => {
    if (!notification) return;
    setBusy(true);
    try {
      await markAsRead(notification.id);
      if (typeof fetchNotification === "function") await fetchNotification();
      onClose?.();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const handleNavigate = async (url) => {
    if (!notification) return;
    setBusy(true);
    try {
      await markAsRead(notification.id);
      if (typeof fetchNotification === "function") await fetchNotification();
      navigate(url);
      onClose?.();
    } catch (err) {
      console.error(err);
      navigate(url);
      onClose?.();
    } finally {
      setBusy(false);
    }
  };

  const getActionUrl = () => {
    if (!notification) return null;
    const { type, related_object_id, metadata,object_id } = notification;

    switch (type) {
      case "DEMERIT_AWARDED":
      case "MERIT_AWARDED":
        return `/points-entries/${object_id}`;
      case "MERIT_REVERSED":
        return `/points-entries/${metadata?.reversal_entry_id}`;
      case "POINT_REQUEST_APPROVED":
      case "POINT_REQUEST_REJECTED":
      case "POINT_REQUEST_CANCELLED":
      case "POINT_REQUEST_SUBMITTED":
      case "POINT_REQUEST_MODIFIED":
        return `/requests/${metadata?.request_id || object_id}`;
      default:
        return null;
    }
  };

  const actionUrl = getActionUrl();

  return (
    <div className="nm-overlay" role="dialog" aria-modal="true" aria-labelledby="nm-title">
      <div className="nm-card">
        <button className="nm-close" onClick={onClose} aria-label="Close notification">
          <IoClose size={20} />
        </button>

        {loading ? (
          <div className="nm-loading">Loading…</div>
        ) : !notification ? (
          <div className="nm-empty">Failed to load notification.</div>
        ) : (
          <>
            <div className="nm-header">
              <div className="nm-avatar">
                {notification?.recipient?.first_name?.[0]?.toUpperCase() ?? "N"}
                {notification?.recipient?.last_name?.[0]?.toUpperCase() ?? ""}
              </div>

              <div className="nm-head-meta">
                <h3 id="nm-title" className="nm-title">{notification.title}</h3>
                <div className="nm-sub">
                  {notification.sender && (
                    <span className="nm-recipient">
                      By <strong>{notification.sender?.first_name} {notification.sender?.last_name}</strong>
                    </span>
                  )}
                  <span className="nm-time">• {new Date(notification.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className={`nm-status ${String(notification.status || "").toLowerCase()}`}>
                {String(notification.status || "").toUpperCase()}
              </div>
            </div>

            <div className="nm-body">
              <p className="nm-preview">{previewMessage ?? notification.message ?? "No message available."}</p>

              {notification.metadata?.action === "points_updated" && (
                <div className="nm-points">
                  <h4>Points Update</h4>
                  <div className="nm-grid">
                    <div>
                      <p className="label">Old Merit</p>
                      <p className="value">{notification.metadata?.old_merit ?? "—"}</p>
                    </div>
                    <div>
                      <p className="label">New Merit</p>
                      <p className="value highlight-green">{notification.metadata?.new_merit ?? "—"}</p>
                    </div>
                    <div>
                      <p className="label">Old Demerit</p>
                      <p className="value">{notification.metadata?.old_demerit ?? "—"}</p>
                    </div>
                    <div>
                      <p className="label">New Demerit</p>
                      <p className="value highlight-red">{notification.metadata?.new_demerit ?? "—"}</p>
                    </div>
                  </div>

                  {notification.metadata?.points_change != null && (
                    <div className={`nm-points-change ${notification.metadata.points_change > 0 ? "pos" : "neg"}`}>
                      {notification.metadata.points_change > 0 ? "⬆️" : "⬇️"} {notification.metadata.points_change > 0 ? "+" : ""}{notification.metadata.points_change} points
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="nm-actions">
              {actionUrl && (
                <button
                  className="nm-btn nm-btn-primary"
                  onClick={() => handleNavigate(actionUrl)}
                  disabled={busy}
                >
                  {busy ? "Please wait…" : "View"}
                </button>
              )}

              <button
                className="nm-btn nm-btn-ghost"
                onClick={handleMarkAsRead}
                disabled={busy}
              >
                Mark as read & Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationModal;
