// File: ChatArea.jsx
import React, { useEffect, useRef, useState } from "react";
import "./style.css";
import { IoTrophy } from "react-icons/io5";
import axiosInstance from "../../Apis/axiosInstance";

const ChatArea = ({
  messages = { results: [] },
  messageTo = "Unknown",
  currentUserId = "",
  onSendMessage,
  isAdmin,
  employee_id,
  employee_name,
}) => {
  const [text, setText] = useState("");
  const [user, setUser] = useState(null); // fetched user details
  const bodyRef = useRef(null);
  const textareaRef = useRef(null);

  const getInitials = (first, last) => {
    const a = (first || "").trim().split(" ")[0] || "";
    const b = (last || "").trim().split(" ")[0] || "";
    if (!a && !b) return "U";
    if (!b) return a.charAt(0).toUpperCase();
    return `${a.charAt(0)}${b.charAt(0)}`.toUpperCase();
  };

  const fetchUserDetail = async (userId) => {
    if (!userId) return;
    try {
      const res = await axiosInstance.get(`/users/${userId}/`);
      setUser(res.data);
    } catch (err) {
      // fallback: try to parse employee_name if provided
      console.error("Error fetching user detail:", err);
      if (employee_name) {
        const [first, ...rest] = employee_name.split(" ");
        setUser({
          first_name: first || "",
          last_name: rest.join(" ") || "",
          company_email: null,
          department: { dept_name: null },
          phone: null,
        });
      }
    }
  };

  useEffect(() => {
    fetchUserDetail(employee_id);
  }, [employee_id, employee_name]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  };

  const handleTextareaInput = (e) => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
    setText(e.target.value);
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (onSendMessage) {
      onSendMessage(trimmed);
    }
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatName = (sender) =>
    `${sender?.first_name || ""} ${sender?.last_name || ""}`.trim() || "Unknown";

  // compute header display values
  const headerName = isAdmin ? messageTo : "Support";
  const displayUser = user || { first_name: "", last_name: "", company_email: null, department: { dept_name: null } };
  const initials = getInitials(displayUser.first_name, displayUser.last_name);

  return (
    <div className="chat-area-root">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="header-top">
            <div className="avatar-circle" aria-hidden>
              {initials}
            </div>
            <div className="header-meta">
              <div className="chat-title">{headerName}</div>
              {!isAdmin && <div className="user-email">{displayUser.company_email || "—"}</div>}
            </div>
          </div>
          <div className="chat-sub">
            {displayUser.department && displayUser.department.dept_name
              ? displayUser.department.dept_name
              : ""}
          </div>
        </div>

      </div>

      <div className="chat-body" ref={bodyRef}>
        {messages.results && messages.results.length > 0 ? (
          messages.results.map((m) => {
            const isMine = m.sender && m.sender.id === currentUserId;
            return (
              <div key={m.id} className={`chat-message-row ${isMine ? "mine" : "other"}`}>
                {!isMine && <div className="avatar" aria-hidden>{/* avatar placeholder */}</div>}
                <div className={`chat-bubble ${isMine ? "bubble-mine" : "bubble-other"}`}>
                  <div className="bubble-text">{m.message}</div>
                  <div className="bubble-meta">
                    <span className="sender-name">{isMine ? "You" : formatName(m.sender)}</span>
                    <span className="time">
                      {m.created_at
                        ? new Date(m.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                </div>
                {isMine && <div className="spacer" />}
              </div>
            );
          })
        ) : (
          <div className="empty-placeholder">No messages yet</div>
        )}
      </div>

      <div className="chat-composer">
        <button className="icon-btn left-icon" title="Attach">
          📎
        </button>

        <textarea
          ref={textareaRef}
          className="composer-textarea"
          placeholder="Write a message"
          value={text}
          onChange={handleTextareaInput}
          onKeyDown={handleKeyDown}
          rows={1}
        />

        <button className="composer-send-btn" aria-label="Send message" onClick={handleSend}>
          ➤
        </button>
      </div>
    </div>
  );
};

export default ChatArea;
