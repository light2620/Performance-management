// SingleTicketPage.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../Utils/AuthContext";
import {
  getConversationDetailsApi,
  getConversationMessagesApi,
  closeConversationApi,
} from "../../Apis/CreateConversation";
import { getSingleEntryApi } from "../../Apis/EntriesApi";
import ChatArea from "../../Components/ChatArea/ChatArea";
import EntryDetails from "../../Components/RequestDetails/EntryDetails";
import toast from "react-hot-toast";
import CloseReasonModal from "../../Components/CloseConverstaionModal/CloseConversationModal.jsx";
import "./style.css";
import { useWebSocket } from "../../Provider/WebSocketProvider.jsx";

const SingleTicketPage = () => {
  const { id: conversationId } = useParams();
  const { user } = useAuth();
  const currentUserId = user?.id;
  const isAdmin = String(user?.role || "").toUpperCase() === "ADMIN";

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [conversationDetail, setConversationDetail] = useState(null);
  const [entryDetail, setEntryDetail] = useState(null);
  const [messages, setMessages] = useState({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const isActive = conversationDetail?.is_active;
  const [showCloseModal, setShowCloseModal] = useState(false);

  const { sendPayload, subscribe, unsubscribe, socketReady } = useWebSocket();
  const subIdRef = useRef(null);
  const fallbackTimeoutRef = useRef(null);

  const fetchEntryDetails = useCallback(async (entryId) => {
    if (!entryId) return;
    try {
      const response = await getSingleEntryApi(entryId);
      setEntryDetail(response.data);
    } catch (err) {
      console.error("fetchEntryDetails:", err);
    }
  }, []);

  const fetchConversationDetails = useCallback(async () => {
    try {
      const response = await getConversationDetailsApi(conversationId);
      setConversationDetail(response.data);
      if (response.data?.related_object_id) fetchEntryDetails(response.data.related_object_id);
    } catch (err) {
      console.error("fetchConversationDetails:", err);
    }
  }, [conversationId, fetchEntryDetails]);

  const fetchMessages = useCallback(async () => {
    setLoadingMessages(true);
    try {
      const res = await getConversationMessagesApi(conversationId);
      setMessages({
        ...res.data,
        results: Array.isArray(res.data.results) ? res.data.results : [],
      });
    } catch (err) {
      console.error("fetchMessages:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, [conversationId]);

  // initial load
  useEffect(() => {
    fetchConversationDetails();
    fetchMessages();
  }, [conversationId, fetchConversationDetails, fetchMessages]);

  // websocket subscription
  useEffect(() => {
    if (!subscribe) return;

    const handler = (payload) => {
      if (payload.conversation_id !== conversationId) return;

      if (payload.type === "conversation_message" || payload.type === "message_confirmation") {
        // simple approach: refetch all messages to maintain order
        fetchMessages();
      }

      if (payload.type === "unread_status_update") {
        setConversationDetail((prev) => (prev ? { ...prev, has_unread: !!payload.conversation_has_unread } : prev));
      }
    };

    const id = subscribe(handler);
    subIdRef.current = id;

    return () => {
      if (subIdRef.current) {
        unsubscribe(subIdRef.current);
        subIdRef.current = null;
      }
    };
  }, [subscribe, unsubscribe, conversationId, fetchMessages]);

  // mark viewing/not viewing
  useEffect(() => {
    if (!conversationId) return;
    const sendViewing = () => sendPayload?.({ type: "viewing_conversation", conversation_id: conversationId });
    const sendNotViewing = () => sendPayload?.({ type: "not_viewing_conversation", conversation_id: conversationId });

    if (socketReady) sendViewing();
    const t = setTimeout(sendViewing, 500);

    return () => {
      clearTimeout(t);
      sendNotViewing();
    };
  }, [conversationId, sendPayload, socketReady]);

  const messageTo =
    conversationDetail?.participants?.find((p) => p.id !== currentUserId)?.first_name || "Support Team";

  // send message
  const sendMessage = async (messageText) => {
    if (!sendPayload) {
      toast.error("Cannot send message (socket unavailable)");
      return;
    }

    setSending(true);
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      message: messageText,
      sender: { id: currentUserId, first_name: user?.first_name || "", last_name: user?.last_name || "" },
      status: "sending",
      created_at: new Date().toISOString(),
    };

    // append temp message at bottom
    setMessages((prev) => ({ ...prev, results: [...prev.results, optimisticMessage] }));

    try {
      const sent = sendPayload({ type: "message", conversation_id: conversationId, message: messageText });
      if (!sent) throw new Error("socket send failed");

      // fallback: fetch messages after 4s if confirmation doesn't come
      if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = setTimeout(() => {
        fetchMessages();
        fallbackTimeoutRef.current = null;
      }, 4000);
    } catch (err) {
      toast.error("Failed to send message");
      setMessages((prev) => ({ ...prev, results: prev.results.filter((m) => m.id !== tempId) }));
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    return () => {
      if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
    };
  }, []);

  const openCloseModal = () => {
    if (!isAdmin) return toast.error("Only admins can close conversations");
    if (!conversationDetail?.is_active) return toast("Conversation is already closed");
    setShowCloseModal(true);
  };

  const confirmCloseConversation = async (reason) => {
    setClosing(true);
    try {
      const res = await closeConversationApi(conversationId, reason);
      const updatedConversation = res?.data?.conversation ?? res?.data;
      if (updatedConversation) setConversationDetail(updatedConversation);
      await fetchMessages();
      await fetchConversationDetails();
      toast.success("Conversation closed successfully");
      setShowCloseModal(false);
    } catch (err) {
      toast.error("Failed to close conversation");
      console.error(err);
    } finally {
      setClosing(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="stp-root">
      <div className="stp-topbar" style={{ display: "flex", alignItems: "center" }}>
        <div className="stp-actions">
          <button className="stp-btn stp-btn-ghost" onClick={() => window.history.back()}>Back</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", marginLeft: 24, flex: 1 }}>
          <div className="ticket-summary">
            {!isActive && conversationDetail && (
              <div className="ticket-closed-info" style={{ marginTop: 8, color: "#6b7280", fontSize: 13 }}>
                <div><strong>Closed at:</strong> {formatDate(conversationDetail.closed_at)}</div>
                <div><strong>Closed by:</strong> {conversationDetail.closed_by ? `${conversationDetail.closed_by.first_name || ""} ${conversationDetail.closed_by.last_name || ""}`.trim() : "-"}</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isAdmin && isActive && (
            <button className="stp-btn stp-btn-close" onClick={openCloseModal} disabled={closing}>
              {closing ? "Closing..." : "Close Ticket"}
            </button>
          )}
          <button className="stp-btn stp-btn-black" onClick={() => setShowDetailsModal(true)}>Show Ticket Details</button>
        </div>
      </div>

      <div className="stp-content">
        <main className="stp-right" style={{ width: "100%" }}>
          <ChatArea
            messages={messages}
            messageTo={messageTo}
            employee_id={conversationDetail?.related_object?.employee_id}
            currentUserId={currentUserId}
            sending={sending}
            loading={loadingMessages}
            onSendMessage={sendMessage}
            isAdmin={isAdmin}
            isActive={isActive}
          />
        </main>
      </div>

      <EntryDetails
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        createdBy={entryDetail?.created_by}
        reason={entryDetail?.reason}
        points={entryDetail?.points}
        type={entryDetail?.type}
        operation={entryDetail?.operation}
        forUser={entryDetail?.employee}
        isAdmin={isAdmin}
        created_at={entryDetail?.created_at}
        requestId={entryDetail?.id}
      />

      <CloseReasonModal
        isOpen={showCloseModal}
        defaultReason="Resolved"
        onClose={() => setShowCloseModal(false)}
        onConfirm={confirmCloseConversation}
        loading={closing}
      />
    </div>
  );
};

export default SingleTicketPage;
