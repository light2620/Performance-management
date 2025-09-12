// SingleTicketPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../Utils/AuthContext";
import {
  getConversationDetailsApi,
  getConversationMessagesApi,
  closeConversationApi,
} from "../../Apis/CreateConversation";
import { getSingleEntryApi } from "../../Apis/EntriesApi";
import { tokenService } from "../../Apis/tokenService";
import ChatArea from "../../Components/ChatArea/ChatArea";
import EntryDetails from "../../Components/RequestDetails/EntryDetails";
import toast from "react-hot-toast";
import CloseReasonModal from "../../Components/CloseConverstaionModal/CloseConversationModal.jsx";
import "./style.css";

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
  const [socket, setSocket] = useState(null);
  const [closing, setClosing] = useState(false);
  const isActive = conversationDetail?.is_active;

  // modal state
  const [showCloseModal, setShowCloseModal] = useState(false);

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
      if (response.data?.related_object_id) {
        fetchEntryDetails(response.data.related_object_id);
      }
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

  useEffect(() => {
    fetchConversationDetails();
    fetchMessages();
  }, [conversationId, fetchConversationDetails, fetchMessages]);

  useEffect(() => {
    if (!conversationId) return;
    const wsUrl = `wss://demerits.authorityentrepreneurs.com/ws/conversations/user/?token=${tokenService.getAccess()}`;
    console.log("WebSocket URL:", wsUrl);
    const newSocket = new WebSocket(wsUrl);
    setSocket(newSocket);

    newSocket.onopen = () => console.log("WebSocket connected");
    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "conversation_message") {
          setMessages((prev) => ({ ...prev, results: [...prev.results, data.message] }));
        } else if (data.type === "connection_confirmed") {
          console.log("WS connected as:", data.user_fullname || data.user_id);
        }
      } catch (e) {
        console.error("ws parse error", e);
      }
    };
    newSocket.onclose = () => console.log("WebSocket disconnected");
    newSocket.onerror = (err) => console.error("WebSocket error:", err);

    return () => newSocket.close();
  }, [conversationId]);

  const messageTo =
    conversationDetail?.participants?.find((p) => p.id !== currentUserId)?.first_name ||
    "Support Team";

  const sendMessage = (messageText) => {
    if (!socket) {
      console.error("WebSocket not connected");
      return;
    }
    if (socket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not open");
      return;
    }
    const messagePayload = {
      type: "message",
      conversation_id: conversationId,
      message: messageText,
    };
    socket.send(JSON.stringify(messagePayload));
    fetchMessages();
  };

  // open modal (admin only)
  const openCloseModal = () => {
    if (!isAdmin) {
      toast.error("Only admins can close conversations");
      return;
    }
    if (conversationDetail?.is_active === false) {
      toast("Conversation is already closed");
      return;
    }
    setShowCloseModal(true);
  };

  // confirm close from modal (send body as { reason })
  const confirmCloseConversation = async (reason) => {
    setClosing(true);
    try {
      const res = await closeConversationApi(conversationId,  reason );
      const updatedConversation = res?.data?.conversation ?? res?.data;
      if (updatedConversation) setConversationDetail(updatedConversation);

      // refresh messages and details
      await fetchMessages();
      await fetchConversationDetails();

      toast.success("Conversation closed successfully");
      setShowCloseModal(false);
    } catch (err) {
      console.error("Error closing conversation:", err);
      toast.error("Failed to close conversation");
    } finally {
      setClosing(false);
    }
  };

  // helper to format ISO date to local string (safe guard)
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
          <button className="stp-btn stp-btn-ghost" onClick={() => window.history.back()}>
            Back
          </button>
        </div>

        {/* Ticket summary (center) */}
        <div style={{ display: "flex", alignItems: "center", marginLeft: 24, flex: 1 }}>
          <div className="ticket-summary">
            

            {/* If ticket is closed, show closed info */}
            {!isActive && conversationDetail && (
              <div className="ticket-closed-info" style={{ marginTop: 8, color: "#6b7280", fontSize: 13 }}>
                <div>
                  <strong>Closed at:</strong> {formatDate(conversationDetail.closed_at)}
                </div>
                <div>
                  <strong>Closed by:</strong>{" "}
                  {conversationDetail.closed_by
                    ? `${conversationDetail.closed_by.first_name || ""} ${conversationDetail.closed_by.last_name || ""}`.trim()
                    : "-"}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Show Close button only for admins and only when active */}
          {isAdmin && isActive && (
            <button
              className="stp-btn stp-btn-close"
              onClick={openCloseModal}
              disabled={!isAdmin || closing || conversationDetail?.is_active === false}
              title={!isAdmin ? "You need admin privileges to close this ticket" : ""}
            >
              {closing ? "Closing..." : "Close Ticket"}
            </button>
          )}

          <button
            className="stp-btn stp-btn-black"
            onClick={() => setShowDetailsModal(true)}
          >
            Show Ticket Details
          </button>
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

      {/* Close Reason Modal */}
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
