import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllConversationsApi } from "../../Apis/CreateConversation";
import { useAuth } from "../../Utils/AuthContext";
import { useWebSocket } from "../../Provider/WebSocketProvider";
import "./style.css";

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
};

const initialsFrom = (user) => {
  if (!user) return "C";
  const a = (user.first_name || "")[0] || "";
  const b = (user.last_name || "")[0] || "";
  return (a + b).toUpperCase() || "C";
};

const Tickets = () => {
  const [conversations, setConversations] = useState([]);
  const [filter, setFilter] = useState("active"); // active or closed
  const { user } = useAuth();
  const navigate = useNavigate();
  const { subscribe, unsubscribe } = useWebSocket();
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    let mounted = true;

    const fetchConversations = async () => {
      if (!user?.role) return; // fetch only after user role is defined
      try {
        const res = await getAllConversationsApi();
        const data = res?.data?.results || [];
        if (mounted) setConversations(data);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchConversations();
    return () => (mounted = false);
  }, [user?.role, subscribe, unsubscribe]);

  if (!user?.role) return null;
  if (loading) return <div className="tickets-loading">Loading conversations…</div>;

  const filteredConversations = conversations.filter(
    (c) => (filter === "active" ? c.is_active : !c.is_active)
  );

  return (
    <div className="tickets-page">
      {/* Header & Tabs */}
      <div className="tickets-header-container">
        <div className="tickets-header">
          <h2 className="tickets-title">Tickets</h2>
          <div className="tickets-tabs">
            <button
              className={`tab-btn ${filter === "active" ? "active" : ""}`}
              onClick={() => setFilter("active")}
            >
              Active Tickets
            </button>
            <button
              className={`tab-btn ${filter === "closed" ? "active" : ""}`}
              onClick={() => setFilter("closed")}
            >
              Closed Tickets
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable container */}
      <div className="tickets-list-container">
        <ul className="conversation-list">
          {filteredConversations.map((c) => {
            const lastMsg = c.last_message || {};
            const isUnread = c.has_unread_msgs;
            const preview = lastMsg.message || lastMsg.content || "No messages yet";

            return (
              <li
                key={c.id}
                className={`conversation-item ${isUnread ? "unread" : ""}`}
                onClick={() => navigate(`/tickets/${c.id}`)}
              >
                <div className="conv-avatar">{isAdmin ? initialsFrom(c.initiator) : "SP"}</div>
                <div className="conv-content">
                  <div className="conv-header">
                    <span className="conv-subject">{`Entry Id# ${c.related_object_id}`}</span>
                    <span className={`conv-status ${c.is_active ? "active" : "closed"}`}>
                      {c.is_active ? "Active" : "Closed"}
                    </span>
                    {c.related_object?.type === "point_entry" && (
                      <span className="conv-points">{c.related_object.points} pts</span>
                    )}
                  </div>
                  <div className="conv-body">{preview}</div>
                  <div className="conv-footer">
                    <span className="conv-participants">
                      {isAdmin
                        ? `${c?.initiator?.first_name || ""} ${c?.initiator?.last_name || ""}`.trim()
                        : "support"}
                    </span>
                    <span className="conv-date">{formatDate(c.updated_at)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Tickets;
