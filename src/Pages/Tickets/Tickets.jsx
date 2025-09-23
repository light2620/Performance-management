// File: Tickets.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllConversationsApi } from "../../Apis/CreateConversation";
import toast from "react-hot-toast";
import { useAuth } from "../../Utils/AuthContext";
import "./style.css"; // keep your filename

const formatWhen = (iso) => {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch (e) {
    return iso;
  }
};

const initialsFrom = (user) => {
  if (!user) return "C";
  const a = (user.first_name || "")[0] || "";
  const b = (user.last_name || "")[0] || "";
  const value = (a + b).toUpperCase();
  return value || "C";
};



const Tickets = () => {
  const [conversations, setConversations] = useState([]);
  const { user } = useAuth();
  const currentUserId = user?.id;
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getAllConversationsApi();
        const payload = res?.data ?? res;
        const list = Array.isArray(payload) ? payload : payload.results || [];
        if (mounted) setConversations(list);
      } catch (err) {
        console.error("Failed fetching conversations:", err);
        const msg =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load conversations";
        toast.error(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => (mounted = false);
  }, []);

  const filtered = conversations
    .filter((c) => {
      if (!query) return true;
      const q = query.toLowerCase();
      const subject = (c.subject || "").toLowerCase();
      const participants = (c.participants || [])
        .map((p) => `${p.first_name} ${p.last_name}`.toLowerCase())
        .join(" ");
      const last = (c.last_message?.message || c.last_message?.content || "").toLowerCase();
      return subject.includes(q) || participants.includes(q) || last.includes(q);
    })
    .filter((c) => {
      if (filter === "all") return true;
      if (filter === "unread") return c.last_message && !c.last_message.is_read;
      if (filter === "point_entries") return c.conversation_type === "point_discussion";
      return true;
    });

  if (loading) return <div className="tickets-loading">Loading conversations…</div>;

  return (
    <div className="tickets-page">
      <header className="tickets-header">
        <div>
          <h2 className="tickets-title">Tickets</h2>
          <div className="tickets-sub">Showing {conversations.length} total</div>
        </div>

        {/* <div className="tickets-controls">
          <input
            type="search"
            placeholder="Search by subject, participant, or message"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="tickets-search"
            aria-label="Search conversations"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="tickets-filter"
            aria-label="Filter conversations"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="point_entries">Point Entries</option>
          </select>
        </div> */}
      </header>

      {!filtered.length ? (
        <div className="tickets-empty">No conversations match your search.</div>
      ) : (
        <ul className="conversation-list" role="list">
          {filtered.map((c) => {
            const participants = Array.isArray(c.participants) ? c.participants : [];
            const participantNames = participants.length
              ? participants.map((p) => `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim()).join(", ")
              : "—";

            const related = c.related_object || {};
            const lastMsg = c.last_message || {};
            const preview =
              lastMsg.message || lastMsg.content || c.last_message_preview || related?.reason ||
              (c.message_count ? `${c.message_count} messages` : "No messages yet");

            const when = formatWhen(c.updated_at || c.created_at || lastMsg.created_at);
            const unread = lastMsg && !lastMsg.is_read && lastMsg.sender?.id !== currentUserId;

            // avatar source priority: initiator -> first participant
            const avatarUser = c.initiator || participants[0] || null;
            const initials = initialsFrom(avatarUser);

            return (
              <li
                key={c.id}
                className={`conversation-item ${unread ? "unread" : ""}`}
                onClick={() => navigate(`/tickets/${c.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") navigate(`/tickets/${c.id}`);
                }}
                aria-label={`Open conversation ${c.subject || c.id}`}
              >
            

                <div className="conversation-main">
                  <div className="conv-top">
                    <div className="conv-title">{c.subject || `Entry Id# - ${c.related_object_id}`}</div>

                    <div className="conv-meta">
                      <span className="conv-type">{c.conversation_type}</span>
                      {related?.type === "point_entry" && (
                        <span className="conv-points">{related.points ?? "-"} pts</span>
                      )}
                      {/* Active indicator */}
                      <span className={`conv-active ${c.is_active ? "active" : "inactive"}`}>
                        {c.is_active ? "Active" : "Closed"}
                      </span>
                    </div>
                  </div>

                  <div className="conv-body">
                    <div className="conv-preview">{preview}</div>
                  </div>

                  <div className="conv-bottom">
                    <div className="conv-participants">{participantNames}</div>
                    <div className="conv-right">
                      <div className="conv-date">{when}</div>
                      {/* {unread && <span className="unread-badge" aria-label="Unread">●</span>} */}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Tickets;
