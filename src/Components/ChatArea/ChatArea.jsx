// File: ChatArea.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import "./style.css";
import axiosInstance from "../../Apis/axiosInstance";

const ChatArea = ({
  messages,
  messageTo = "Unknown",
  currentUserId = "",
  onSendMessage,
  isAdmin,
  employee_id,
  employee_name,
  isActive
}) => {
  const [text, setText] = useState("");
  const [user, setUser] = useState(null);
  const bodyRef = useRef(null);
  const textareaRef = useRef(null);
  const topSentinelRef = useRef(null);

  // internal list and pagination
  const [messagesList, setMessagesList] = useState([]);
  const [nextLink, setNextLink] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // guards & refs
  const lastScrollTopRef = useRef(0);
  const didUserScrollUpRef = useRef(false);
  const fetchInProgressRef = useRef(false);
  const observerDebounceRef = useRef(null);
  const isMountedRef = useRef(false);

  // helper: initials
  const getInitials = (first, last) => {
    const a = (first || "").trim().split(" ")[0] || "";
    const b = (last || "").trim().split(" ")[0] || "";
    if (!a && !b) return "U";
    if (!b) return a.charAt(0).toUpperCase();
    return `${a.charAt(0)}${b.charAt(0)}`.toUpperCase();
  };

  // fetch user details fallback
  const fetchUserDetail = useCallback(
    async (userId) => {
      if (!userId) return;
      try {
        const res = await axiosInstance.get(`/users/${userId}/`);
        if (isMountedRef.current) setUser(res.data);
      } catch (err) {
        console.error("Error fetching user detail:", err);
        if (employee_name) {
          const [first, ...rest] = employee_name.split(" ");
          if (isMountedRef.current)
            setUser({
              first_name: first || "",
              last_name: rest.join(" ") || "",
              company_email: null,
              department: { dept_name: null },
              phone: null,
            });
        }
      }
    },
    [employee_name]
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (observerDebounceRef.current) {
        clearTimeout(observerDebounceRef.current);
        observerDebounceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    fetchUserDetail(employee_id);
  }, [employee_id, fetchUserDetail]);

  // initialize messagesList and nextLink from prop
  useEffect(() => {
    const results = (messages && messages.results) || [];
    setMessagesList(results.slice()); // keep API order (newest-first)
    setNextLink(messages && messages.next ? messages.next : null);

    // programmatic scroll to bottom after initial render
    setTimeout(() => {
      if (bodyRef.current) {
        bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        lastScrollTopRef.current = bodyRef.current.scrollTop;
        didUserScrollUpRef.current = false; // reset user-scroll flag on load
      }
    }, 60);
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  // ========== CORE: fetchMore with visible-item preserving ==========
  const fetchMore = useCallback(
    async (manual = false) => {
      if (!nextLink || loadingMore || fetchInProgressRef.current || !bodyRef.current) return;
      setLoadingMore(true);
      fetchInProgressRef.current = true;

      try {
        const container = bodyRef.current;
        const containerRect = container.getBoundingClientRect();

        // find the first visible message element (closest to top inside container)
        const rows = Array.from(container.querySelectorAll(".chat-message-row"));
        // compute the visible ones and pick the one with smallest positive distance from top
        let firstVisible = null;
        let minDistance = Infinity;
        for (const r of rows) {
          const rRect = r.getBoundingClientRect();
          // distance from container top to row top (could be negative if above)
          const distance = rRect.top - containerRect.top;
          if (distance >= 0 && distance < minDistance) {
            minDistance = distance;
            firstVisible = r;
          }
        }
        // fallback: if none fully visible, pick the first row
        if (!firstVisible && rows.length) {
          firstVisible = rows[0];
          minDistance = firstVisible.getBoundingClientRect().top - containerRect.top;
        }

        const anchorId = firstVisible ? firstVisible.getAttribute("data-msgid") : null;
        const prevAnchorOffset = firstVisible ? (firstVisible.getBoundingClientRect().top - containerRect.top) : null;
        const prevScrollTop = container.scrollTop;
        const prevScrollHeight = container.scrollHeight;

        // call API
        const res = await axiosInstance.get(nextLink);
        const newResults = (res.data && res.data.results) || [];
        const newNext = res.data && res.data.next ? res.data.next : null;

        // merge while avoiding duplicates (API newest-first; append older page to end)
        setMessagesList((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const filtered = newResults.filter((m) => !existingIds.has(m.id));
          return [...prev, ...filtered];
        });

        if (isMountedRef.current) setNextLink(newNext);

        // After DOM renders new items, adjust scroll so the anchor message stays at same visual spot
        setTimeout(() => {
          if (!bodyRef.current) return;
          const newContainer = bodyRef.current;
          if (!anchorId) {
            // fallback: if we couldn't find anchor, try to keep same proportion (simple)
            const newScrollHeight = newContainer.scrollHeight;
            newContainer.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
            lastScrollTopRef.current = newContainer.scrollTop;
            didUserScrollUpRef.current = false;
            return;
          }

          const newAnchorEl = newContainer.querySelector(`.chat-message-row[data-msgid="${anchorId}"]`);
          // if we found the anchor, compute new offset and shift scroll by difference
          if (newAnchorEl) {
            const newAnchorRect = newAnchorEl.getBoundingClientRect();
            const newContainerRect = newContainer.getBoundingClientRect();
            const newOffset = newAnchorRect.top - newContainerRect.top;
            const delta = newOffset - (prevAnchorOffset ?? 0);
            // adjust scrollTop by delta (so anchor returns to previous visual position)
            // note: add to current scrollTop because scrollHeight changed
            newContainer.scrollTop = (newContainer.scrollTop || 0) + delta;
            lastScrollTopRef.current = newContainer.scrollTop;
          } else {
            // anchor not found (very rare) -> fallback to previous method
            const newScrollHeight = newContainer.scrollHeight;
            newContainer.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
            lastScrollTopRef.current = newContainer.scrollTop;
          }
          // reset user-scroll detection so observer won't immediately refetch
          didUserScrollUpRef.current = false;
        }, 60);
      } catch (err) {
        console.error("Error fetching older messages:", err);
      } finally {
        setLoadingMore(false);
        fetchInProgressRef.current = false;
      }
    },
    [nextLink, loadingMore]
  );
  // ==================================================================

  // scroll handler (stable via useCallback)
  const handleScroll = useCallback(() => {
    const el = bodyRef.current;
    if (!el || loadingMore) return;
    const currentTop = el.scrollTop;

    // user scrolled up relative to last recorded
    if (currentTop < lastScrollTopRef.current) {
      didUserScrollUpRef.current = true;
    }
    lastScrollTopRef.current = currentTop;
  }, [loadingMore]);

  // attach scroll listener once (stable handler)
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // IntersectionObserver watching the top sentinel
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const root = bodyRef.current;
    if (!sentinel || !root) return;

    const options = { root, rootMargin: "0px", threshold: 0.01 };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && didUserScrollUpRef.current && nextLink && !fetchInProgressRef.current) {
          if (observerDebounceRef.current) clearTimeout(observerDebounceRef.current);
          observerDebounceRef.current = setTimeout(() => {
            if (isMountedRef.current) fetchMore(false);
          }, 120);
        }
      }
    }, options);

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      if (observerDebounceRef.current) {
        clearTimeout(observerDebounceRef.current);
        observerDebounceRef.current = null;
      }
    };
  }, [fetchMore, nextLink]);

  // textarea auto-resize + input
  const handleTextareaInput = (e) => {
    const ta = textareaRef.current;
    if (!ta) return;
    // prevent leading whitespace when starting new message
    let val = e.target.value;

    // If the current stored text is empty and the user types/pastes leading spaces, strip them
    if ((text === "" || text == null) && /^\s+/.test(val)) {
      val = val.replace(/^\s+/, "");
    }

    // cap height
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
    setText(val);
  };

  // handle paste: remove leading whitespace from pasted chunk and insert at caret
  const handlePaste = (e) => {
    if (!textareaRef.current) return;
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData("text") || "";
    const cleaned = paste.replace(/^\s+/, ""); // remove leading spaces
    const ta = textareaRef.current;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newText = text.slice(0, start) + cleaned + text.slice(end);
    setText(newText);
    // adjust textarea height after paste
    setTimeout(() => {
      if (!textareaRef.current) return;
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
      // set caret after inserted text
      const caret = start + cleaned.length;
      textareaRef.current.selectionStart = textareaRef.current.selectionEnd = caret;
    }, 0);
  };

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (onSendMessage) onSendMessage(trimmed);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setTimeout(() => scrollToBottom(), 150);
  }, [text, onSendMessage, scrollToBottom]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatName = (sender) =>
    `${sender?.first_name || ""} ${sender?.last_name || ""}`.trim() || "Unknown";

  const headerName = isAdmin ? messageTo : "Support";
  const displayUser = user || { first_name: "", last_name: "", company_email: null, department: { dept_name: null } };
  const initials = getInitials(displayUser.first_name, displayUser.last_name);

  // display order oldest-first
  const displayMessages = messagesList.slice().reverse();

  return (
    <div className="chat-area-root">
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="header-top">
            <div className="avatar-circle" aria-hidden>
              {isAdmin ? initials : "S"}
            </div>
            <div className="header-meta">
              <div className="chat-title">{headerName}</div>
              {isAdmin && <div className="user-email">{displayUser.company_email || "—"}</div>}
            </div>
          </div>
          {isAdmin && <div className="chat-sub">{displayUser.department?.dept_name || ""}</div>}
        </div>
      </div>

      <div className="chat-body" ref={bodyRef}>
        {/* top sentinel */}
        <div ref={topSentinelRef} style={{ height: 1, width: "100%" }} />

        {/* loading indicator at top */}
        {loadingMore && (
          <div style={{ textAlign: "center", padding: "6px 0", color: "#6b7280" }}>
            Loading...
          </div>
        )}

        {/* manual load more */}
        {nextLink && !loadingMore && (
          <div className="load-more-container" style={{ textAlign: "center", marginBottom: 8 }}>
            <button
              className="load-more-btn"
              onClick={() => {
                if (!loadingMore) {
                  didUserScrollUpRef.current = true; // mimic user's intent
                  fetchMore(true);
                }
              }}
              disabled={loadingMore}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid #e6eefc",
                background: "#fff",
                cursor: loadingMore ? "not-allowed" : "pointer",
              }}
            >
              Load more
            </button>
          </div>
        )}

        {displayMessages && displayMessages.length > 0 ? (
          displayMessages.map((m) => {
            const isMine = m.sender && m.sender.id === currentUserId;
            return (
              // add data-msgid to preserve anchor
              <div key={m.id} data-msgid={m.id} className={`chat-message-row ${isMine ? "mine" : "other"}`}>
                {!isMine && <div className="avatar" aria-hidden>{/* avatar placeholder */}</div>}
                <div className={`chat-bubble ${isMine ? "bubble-mine" : "bubble-other"}`}>
                  <div className="bubble-text">{m.message}</div>
                  <div className="bubble-meta">
                    <span className="sender-name">{isMine ? "You" : formatName(m.sender)}</span>
                    <span className="time">
                      {m.created_at
                        ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
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

     {isActive &&  <div className="chat-composer">
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
          onPaste={handlePaste}
          rows={1}
        />

        <button
          className="composer-send-btn"
          aria-label="Send message"
          onClick={handleSend}
          disabled={text.trim().length === 0}
          aria-disabled={text.trim().length === 0}
        >
          ➤
        </button>
      </div>}
    </div>
  );
};

export default ChatArea;
