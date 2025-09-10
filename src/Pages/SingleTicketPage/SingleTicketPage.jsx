import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../Utils/AuthContext";
import {
  getConversationDetailsApi,
  getConversationMessagesApi,
} from "../../Apis/CreateConversation";
import { getSingleEntryApi } from "../../Apis/EntriesApi";
import { tokenService } from "../../Apis/tokenService";
import ChatArea from "../../Components/ChatArea/ChatArea";
import EntryDetails from "../../Components/RequestDetails/EntryDetails";
import "./style.css"
const SingleTicketPage = () => {
  const { id: conversationId } = useParams();
  const { user } = useAuth();
  const currentUserId = user?.id;
  const isAdmin = user?.role === "ADMIN";

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [conversationDetail, setConversationDetail] = useState(null);
  const [entryDetail, setEntryDetail] = useState(null);
  const [messages, setMessages] = useState({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  console.log(conversationDetail)
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [socket, setSocket] = useState(null); // WebSocket state

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
      setMessages((prev) => ({
        ...res.data,
        results: Array.isArray(res.data.results) ? res.data.results : [],
      }));
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

  const messageTo =
    conversationDetail?.participants?.find((p) => p.id !== currentUserId)?.first_name ||
    "Support Team";


  // WebSocket Connection Setup
  useEffect(() => {
    if ( !conversationId) return; // Ensure token and conversationId are available

    const wsUrl = `wss://demerits.authorityentrepreneurs.com/ws/conversations/user/?token=${tokenService.getAccess()}`;
     console.log("WebSocket URL:", wsUrl); // Add this line for debugging
    const newSocket = new WebSocket(wsUrl);

    setSocket(newSocket);

    newSocket.onopen = () => {
      console.log("WebSocket connected");
    };

    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "connection_confirmed") {
          console.log("Connection confirmed:", data);
        } else if (data.type === "conversation_message") {
          // New message received
          console.log("New message received:", data);
          setMessages(prevMessages => ({
            ...prevMessages,
            results: [...prevMessages.results, data.message] // Add new message to the state
          }));
        } else if (data.type === "message_confirmation") {
          // Message sent confirmation
          console.log("Message confirmation:", data);
          //update message status maybe?
        }

      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    newSocket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    newSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    // Cleanup function to close the WebSocket connection when the component unmounts
    return () => {
      console.log("Closing WebSocket connection");
      newSocket.close();
    };
  }, [conversationId, setMessages]);

  // Function to send messages
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
    console.log("Message sent:", messagePayload);
  };

   console.log(messages)

  return (
    <div className="stp-root">
      <div className="stp-topbar">

        <div className="stp-actions">
          <button className="stp-btn stp-btn-ghost" onClick={() => window.history.back()}>
            Back
          </button>
          <button
            className="stp-btn stp-btn-black"
            onClick={() => setShowDetailsModal(true)}
            style={{ marginLeft: "8px" }}
          >
            Show Ticket Details
          </button>
        </div>
      </div>

      <div className="stp-content">
        <main className="stp-right" style={{ width: "100%" }}>
          <ChatArea
            messages={messages}
            messageTo={conversationDetail?.related_object?.employee_name}
            employee_id = {conversationDetail?.related_object?.employee_id}
            currentUserId={currentUserId}
            sending={sending}
            loading={loadingMessages}
            onSendMessage={sendMessage} // Pass the sendMessage function
            isAdmin={isAdmin}
          />
        </main>
      </div>

      {/* EntryDetails as modal */}
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
    </div>
  );
};

export default SingleTicketPage;
