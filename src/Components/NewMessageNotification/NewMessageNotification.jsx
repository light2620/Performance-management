import React, { useEffect, useState } from "react";
import { useWebSocket } from "../../Provider/WebSocketProvider";
import { useNavigate, useLocation } from "react-router-dom";
import { FaEnvelope } from "react-icons/fa";
import "./style.css";

const NewMessageModal = () => {
  const { subscribe, unsubscribe } = useWebSocket();
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract current conversation ID from URL, e.g., "/tickets/:id"
  const currentConversationId = location.pathname.startsWith("/tickets/")
    ? location.pathname.split("/tickets/")[1]
    : null;

  useEffect(() => {
    if (!subscribe) return;

    const handler = (payload) => {
      if (payload.type === "conversation_message" && payload.message) {
        const { id, message, sender } = payload.message;

        // Ignore messages for the conversation we are currently viewing
        if (payload.conversation_id === currentConversationId) return;

        setNotifications((prev) => [
          ...prev,
          {
            id,
            conversationId: payload.conversation_id,
            senderName: `${sender?.first_name || ""} ${sender?.last_name || ""}`.trim() || "Someone",
            text: message,
          },
        ]);
      }
    };

    const subId = subscribe(handler);
    return () => unsubscribe(subId);
  }, [subscribe, unsubscribe, currentConversationId]);

  const handleReply = (conversationId) => {
    navigate(`/tickets/${conversationId}`);
    setNotifications([]); // close all notifications
  };

  const handleClose = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="nm-modal-wrapper">
      {notifications.map((n) => (
        <div key={n.id} className="nm-modal-card">
          <div className="nm-modal-header">
            <FaEnvelope className="nm-icon" />
            <span className="nm-modal-title">New Message</span>
            <span className="nm-modal-close" onClick={() => handleClose(n.id)}>×</span>
          </div>
          <div className="nm-modal-body">
            <div className="nm-sender-name">{n.senderName}</div>
            <div className="nm-message-text">{n.text}</div>
          </div>
          <div className="nm-modal-footer">
            <button className="nm-reply-btn" onClick={() => handleReply(n.conversationId)}>
              Reply
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NewMessageModal;
