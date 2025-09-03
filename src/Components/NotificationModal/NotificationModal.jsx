import { useEffect, useState } from "react";
import { getNotificationById, markAsRead } from "../../Apis/NotificationApis";
import { IoClose } from "react-icons/io5";
import "./style.css";

const NotificationModal = ({ id, onClose, previewMessage,fetchNotification }) => {
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="notif-modal-overlay">
      <div className="notif-modal">
        {/* Close */}
        <button className="notif-modal-close" onClick={onClose}>
          <IoClose size={22} />
        </button>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : !notification ? (
          <p className="error">Failed to load notification.</p>
        ) : (
          <>
            {/* Title */}
            <h2 className="notif-title">{notification.title}</h2>

            {/* Message */}
            <p className="notif-message">{previewMessage}</p>

            {/* Meta Info */}
            <div className="notif-meta">
              <span>
                👤 <strong>{notification.recipient?.first_name} {notification.recipient?.last_name}</strong>
              </span>
              <span>
                📅 {new Date(notification.created_at).toLocaleString()}
              </span>
            </div>

            {/* Points Info */}
            { notification.metadata?.action === "points_updated" &&<div className="notif-points-card">
              <h3>Points Update</h3>
              <div className="notif-points-grid">
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

              {notification.metadata?.points_change && (
                <p
                  className={`points-change ${
                    notification.metadata.points_change > 0
                      ? "positive"
                      : "negative"
                  }`}
                >
                  {notification.metadata.points_change > 0 ? "⬆️" : "⬇️"}{" "}
                  {notification.metadata.points_change > 0 ? "+" : ""}
                  {notification.metadata.points_change} points
                </p>
              )}
            </div>}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationModal;
