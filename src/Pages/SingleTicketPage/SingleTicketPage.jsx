// pages/ConversationPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../Apis/axiosInstance";
import { tokenService } from "../../Apis/tokenService";
import "./style.css"; // updated CSS provided below

const getConversationDetailsApi = (conversationId) =>
  axiosInstance.get(`/conversations/${conversationId}/`);

const getConversationMessagesApi = (conversationId, params = {}) =>
  axiosInstance.get(`/conversations/${conversationId}/messages`, { params });

const postMessageApi = (conversationId, body) =>
  axiosInstance.post(`/conversations/${conversationId}/messages`, body);

/** helper to generate temp ids for optimistic messages */
const makeTempId = () => `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

/** helper to get initials from a name */
const initials = (first = "", last = "") => {
  const a = (first && first[0]) || "";
  const b = (last && last[0]) || "";
  const res = (a + b).toUpperCase();
  return res || "U";
};

const WEBSOCKET_BASE = "wss://demerits.authorityentrepreneurs.com";

export default function ConversationPage() {
  const { id: conversationId } = useParams();
  const [conversationDetails, setConversationDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const WEBSOCKET_URL = `${WEBSOCKET_BASE}/ws/conversations/user/?token=${tokenService.getAccess()}`;

  // fetch conversation details + messages
  useEffect(() => {
    if (!conversationId) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [dRes, mRes] = await Promise.all([
          getConversationDetailsApi(conversationId),
          getConversationMessagesApi(conversationId, { page_size: 500 }),
        ]);
        if (!mounted) return;
        setConversationDetails(dRes.data ?? dRes);
        const msgs = (mRes.data && mRes.data.results) ? mRes.data.results : (mRes.data ?? mRes);
        const normalized = Array.isArray(msgs) ? msgs.slice() : [];
        normalized.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        setMessages(normalized);
        setTimeout(() => scrollToBottom(), 50);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Could not load conversation. Try refreshing.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [conversationId]);

  // auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    } catch (e) {}
  };

  // websocket connect + handlers + reconnect
  useEffect(() => {
    if (!conversationId) return;
    let ws;
    let closedByUser = false;

    const connect = () => {
      ws = new WebSocket(WEBSOCKET_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        try {
          ws.send(JSON.stringify({ type: "subscribe", conversation_id: conversationId }));
        } catch (e) {}
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          handleWsMessage(data);
        } catch (err) {
          console.warn("WS parse error:", err);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        if (!closedByUser) {
          reconnectTimerRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = (err) => {
        console.error("WS error", err);
        try { ws.close(); } catch (e) {}
      };
    };

    connect();

    return () => {
      closedByUser = true;
      setConnected(false);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      try { wsRef.current?.close(); } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // handle WS messages (server shapes per your docs)
  const handleWsMessage = (data) => {
    if (!data || !data.type) return;
    const t = (data.type || "").toLowerCase();

    if (t === "connection_confirmed") {
      return;
    }
    if (t === "pong") {
      return;
    }

    if (t === "conversation_message" || t === "new_message" || t.includes("conversation")) {
      const msg = data.message ?? data;
      appendMessage(msg);
      return;
    }

    if (t === "message_confirmation" || t.includes("confirm")) {
      const msg = data.message ?? data;
      setMessages((prev) => {
        const arr = prev.slice();
        const idx = arr.findIndex((m) => m.id === msg.id || m.id === msg.client_temp_id || m.client_temp_id === msg.client_temp_id);
        if (idx !== -1) {
          arr[idx] = { ...arr[idx], ...msg, status: "sent" };
        } else {
          arr.push(msg);
          arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        }
        return arr;
      });
      return;
    }

    if (data.id && data.message) {
      appendMessage(data);
    }
  };

  const appendMessage = (msg) => {
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === msg.id);
      if (exists) return prev;
      const arr = prev.slice();
      arr.push(msg);
      arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return arr;
    });
  };

  // send message (optimistic)
  const sendMessage = async () => {
    const text = (newMessage || "").trim();
    if (!text) return;
    setSending(true);

    const tempId = makeTempId();
    const optimistic = {
      id: tempId,
      client_temp_id: tempId,
      message: text,
      created_at: new Date().toISOString(),
      sender: {
        first_name: conversationDetails?.initiator?.first_name || "You",
        last_name: conversationDetails?.initiator?.last_name || "",
      },
      status: "pending",
    };

    setMessages((prev) => {
      const arr = prev.slice();
      arr.push(optimistic);
      arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      return arr;
    });

    setNewMessage("");
    scrollToBottom();

    const payload = {
      type: "message",
      conversation_id: conversationId,
      message: text,
      client_temp_id: tempId,
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(payload));
      } catch (err) {
        console.error("WS send failed:", err);
        await fallbackRestSend(text, tempId);
      }
    } else {
      await fallbackRestSend(text, tempId);
    }
    setSending(false);
  };

  const fallbackRestSend = async (text, tempId) => {
    try {
      const res = await postMessageApi(conversationId, { message: text });
      const serverMsg = res?.data ?? res;
      setMessages((prev) => {
        const arr = prev.slice();
        const idx = arr.findIndex((m) => m.id === tempId || m.client_temp_id === tempId);
        if (idx !== -1) {
          arr[idx] = { ...arr[idx], ...serverMsg, status: "sent" };
        } else {
          arr.push(serverMsg);
        }
        arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        return arr;
      });
    } catch (err) {
      console.error("REST send failed:", err);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, status: "failed" } : m)));
      setError("Failed to send message. Try again.");
    }
  };

  if (loading) return <div className="conv-loading">Loading conversation…</div>;
  if (error) return <div className="conv-error">{error}</div>;
  if (!conversationDetails) return <div className="conv-empty">Conversation not found</div>;

  return (
    <div className="conv-root">
      <header className="conv-header">
        <div className="conv-left">
          <div className="conv-title">{conversationDetails.related_object?.employee_name ?? "Conversation"}</div>
          <div className="conv-sub">{conversationDetails.conversation_type} • {conversationDetails.is_active ? "Active" : "Closed"}</div>
        </div>

        <div className="conv-right">
          <div className={`ws-badge ${connected ? "connected" : "disconnected"}`}>
            {connected ? "Connected" : "Disconnected"}
          </div>
        </div>
      </header>

      <section className="conv-main">
        <aside className="conv-side">
          <div className="related-card">
            <div className="related-label">Related</div>
            <div className="related-body">
              <div><strong>Type:</strong> {conversationDetails.related_object?.type}</div>
              {conversationDetails.related_object?.points !== undefined && <div><strong>Points:</strong> {conversationDetails.related_object.points}</div>}
              {conversationDetails.related_object?.reason && <div className="muted"><strong>Reason:</strong> {conversationDetails.related_object.reason}</div>}
            </div>
          </div>

          <div className="participants">
            <div className="participants-title">Participants</div>
            {Array.isArray(conversationDetails.participants) && conversationDetails.participants.map((p) => (
              <div className="participant" key={p.id}>
                <div className="avatar">{initials(p.first_name, p.last_name)}</div>
                <div className="p-meta">
                  <div className="p-name">{p.first_name} {p.last_name}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="conv-chat">
          <div className="messages" role="list">
            {messages.length === 0 && <div className="empty">No messages yet — start the conversation</div>}

            {messages.map((m) => {
              const isTemp = String(m.id).startsWith("temp_") || !!m.client_temp_id;
              const senderFirst = m.sender?.first_name ?? "";
              const senderLast = m.sender?.last_name ?? "";
              const who = senderFirst || senderLast ? `${senderFirst} ${senderLast}`.trim() : "Unknown";
              const isMine = m.sender && conversationDetails?.initiator && m.sender.id === conversationDetails.initiator.id;

              return (
                <div
                  key={m.id ?? m.client_temp_id ?? Math.random()}
                  className={`message-row ${isMine ? "me" : "them"} ${isTemp ? "optimistic" : ""}`}
                  role="listitem"
                >
                  <div className="msg-avatar">{initials(senderFirst, senderLast)}</div>
                  <div className="msg-body">
                    <div className="msg-meta">
                      <div className="msg-who">{isMine ? "You" : who}</div>
                      <div className="msg-time">{m.created_at ? new Date(m.created_at).toLocaleString() : ""}</div>
                    </div>
                    <div className="msg-text">{m.message}</div>
                    <div className="msg-status">
                      {m.status === "pending" && <span className="pending">Sending…</span>}
                      {m.status === "failed" && <span className="failed">Failed</span>}
                    </div>
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          <div className="composer">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Write a message..."
              className="composer-input"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!sending) sendMessage();
                }
              }}
              rows={2}
            />
            <div className="composer-actions">
              <button className="send-btn" onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </main>
      </section>
    </div>
  );
}
