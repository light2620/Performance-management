// pages/Tickets.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllConversationsApi } from "../../Apis/CreateConversation";
import toast from "react-hot-toast";
import { useAuth } from "../../Utils/AuthContext";
import "./style.css";

const Tickets = () => {
  const [conversations, setConversations] = useState([]);
  const { user } = useAuth();
  const currentUserId = user?.id;
  const isAdmin = user?.role === "ADMIN";
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getAllConversationsApi();
        console.log("Fetched conversations:", res);

        const payload = res?.data ?? res; // axios response typically has .data
        let list = payload.results;


        setConversations(list);
      } catch (err) {
        console.error("Failed fetching conversations:", err);
        const msg =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load conversations";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  if (loading) return <div className="tickets-loading">Loading conversations…</div>;

  if (!conversations.length) return <div className="tickets-empty">No conversations found</div>;

  return (
    <div className="tickets-page">
      <header className="tickets-header">
        <h2 className="tickets-title">Conversations</h2>
        <div className="tickets-sub">Showing {conversations.length} conversations</div>
      </header>

      <ul className="conversation-list">
        {conversations.map((c) => {
          const participants = Array.isArray(c.participants) ? c.participants : [];
          const participantNames = participants.length
            ? participants.map((p) => `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()).join(", ")
            : "—";
          const related = c.related_object || {};
          const preview =
            (c.last_message && (c.last_message.content || c.last_message.text)) ||
            c.last_message_preview ||
            related?.reason ||
            (c.message_count ? `${c.message_count} messages` : "No messages yet");

          const when = new Date(c.updated_at || c.created_at || Date.now()).toLocaleString();

          return (
            <li
              key={c.id}
              className="conversation-item"
              onClick={() => navigate(`/tickets/${c.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(`/tickets/${c.id}`);
              }}
            >
              <div className="conversation-left">
                <div className="conv-avatar">
                  {/* use initiator or first participant for initials */}
                  <span className="avatar-text">
                    {((c.initiator?.first_name?.[0] ?? "") + (c.initiator?.last_name?.[0] ?? "")).toUpperCase() || "C"}
                  </span>
                </div>
              </div>

              <div className="conversation-main">
                <div className="conv-top">
                  <div className="conv-title">{c.subject || `Conversation #${c.id}`}</div>
                  <div className="conv-meta">
                    <span className="conv-type">{c.conversation_type}</span>
                  </div>
                </div>

                <div className="conv-body">
                  <div className="conv-preview">{preview}</div>
                </div>

                <div className="conv-bottom">
                  <div className="conv-participants">{participantNames}</div>
                  <div className="conv-date">{when}</div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Tickets;
