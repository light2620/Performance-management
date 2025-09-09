import React, { useEffect, useRef, useState } from "react";
import "./style.css";

const ChatArea = ({ messages = { results: [] }, messageTo = "Unknown", currentUserId = "" }) => {
  const [text, setText] = useState("");
  const bodyRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (!bodyRef.current) return;
    // smooth scroll for nicer UX
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
    // replace with your send logic
    console.log("message sent", trimmed);
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

  return (
    <div className="chat-area-root">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-title">{messageTo}</div>
          {/* <div className="chat-sub">Online</div> */}
        </div>
        <div className="chat-header-right">i</div>
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
                      {m.created_at ? new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ""}
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

        <button className="composer-send-btn" onClick={handleSend} aria-label="Send message">
          ➤
        </button>
      </div>
    </div>
  );
};

export default ChatArea;
