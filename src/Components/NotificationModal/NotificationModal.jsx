import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { getNotificationById, markAsRead } from "../../Apis/NotificationApis";
import { tokenService } from "../../Apis/tokenService";
import { useAuth } from "../../Utils/AuthContext";
import axios from "axios";
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

    const fetchNotification = async () => {
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

    fetchNotification();
  }, [id]);

  if (!id) return null;

  const getRequestIdFromNotification = (notif) => {
    if (notif?.metadata?.request_id) return notif.metadata.request_id;
    const url = notif?.navigate_url || notif?.metadata?.navigate_url;
    if (url && typeof url === "string") {
      try {
        const parts = url.split("/").filter(Boolean);
        return parts[parts.length - 1];
      } catch (e) {
        // ignore
      }
    }
    return null;
  };

  const handleViewRequest = async () => {
    if (!notification) return;
    const requestId = getRequestIdFromNotification(notification);
    if (!requestId) {
      onClose?.();
      return;
    }

    setBusy(true);
    try {
      await markAsRead(notification.id);
      if (typeof fetchNotification === "function") {
        try { await fetchNotification(); } catch(e){/*ignore*/ }
      }
      navigate(`/requests/${requestId}`);
      onClose?.();
    } catch (err) {
      console.error("Failed to mark as read / navigate:", err);
      navigate(`/requests/${requestId}`);
      onClose?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="nm-overlay" role="dialog" aria-modal="true" aria-labelledby="nm-title">
      <div className="nm-card">
        <button
          className="nm-close"
          onClick={() => onClose?.()}
          aria-label="Close notification"
        >
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
                  {notification.sender && <span className="nm-recipient">By <strong>{notification.sender?.first_name} {notification.sender?.last_name}</strong></span>}
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
              {notification?.type === "POINT_REQUEST_SUBMITTED" && (
                <button
                  className="nm-btn nm-btn-primary"
                  onClick={handleViewRequest}
                  disabled={busy}
                >
                  {busy ? "Please wait…" : "View Request"}
                </button>
              )}

              <button
                className="nm-btn nm-btn-ghost"
                onClick={() => {
                  if (!notification) return;
                  setBusy(true);
                  markAsRead(notification.id)
                    .catch(console.error)
                    .finally(() => {
                      setBusy(false);
                      if (typeof fetchNotification === "function") {
                        fetchNotification().catch(()=>{/*ignore*/});
                      }
                      onClose?.();
                    });
                }}
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
