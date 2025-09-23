import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { getHistoryOfEntryApi } from "../../Apis/EntriesApi";
import { getConversationDetailsApi } from "../../Apis/CreateConversation";
import toast from "react-hot-toast";
import "./style.css";

export default function TimelineModal({ entryId, open, onClose, isAdmin }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const [convLoading, setConvLoading] = useState(false);
  const [convDetails, setConvDetails] = useState(null);
  const [convError, setConvError] = useState(null);

  useEffect(() => {
    if (!open) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      setData(null);
      setConvDetails(null);
      setConvError(null);
      try {
        const res = await getHistoryOfEntryApi(entryId);
        if (!mounted) return;
        setData(res.data || {});
      } catch (err) {
        console.error("Timeline fetch error:", err);
        setError(err.response?.data?.detail || err.message || "Failed to load history");
        toast.error("Failed to load timeline");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => (mounted = false);
  }, [open, entryId]);

  useEffect(() => {
    if (!open) return;
    const convId = data?.conversation?.id;
    if (!convId) return;

    let mounted = true;
    const fetchConv = async () => {
      setConvLoading(true);
      setConvError(null);
      setConvDetails(null);
      try {
        const res = await getConversationDetailsApi(convId);
        if (!mounted) return;
        setConvDetails(res.data || null);
      } catch (err) {
        console.error("Conversation details fetch error:", err);
        setConvError(err.response?.data?.detail || err.message || "Failed to load conversation details");
      } finally {
        if (mounted) setConvLoading(false);
      }
    };

    fetchConv();
    return () => (mounted = false);
  }, [open, data?.conversation?.id]);

  if (!open) return null;

  const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : "—");

  const typeToBadgeText = (t) => {
    const s = String(t || "").toUpperCase();
    if (s === "MERIT") return "Positive";
    if (s === "DEMERIT" || s === "DMERIT") return "Negative";
    return "Neutral";
  };

  const typeToBadgeClass = (t) => {
    const s = String(t || "").toUpperCase();
    if (s === "MERIT") return "badge-merit";
    if (s === "DEMERIT" || s === "DMERIT") return "badge-demerit";
    return "badge-neutral";
  };

  const typeToDotClass = (t) => {
    const s = String(t || "").toUpperCase();
    if (s === "MERIT") return "tm-dot tm-dot-merit";
    if (s === "DEMERIT" || s === "DMERIT") return "tm-dot tm-dot-demerit";
    return "tm-dot";
  };

  const buildEvents = () => {
    if (!data) return [];
    const events = [];

    if (isAdmin && data.request) {
      events.push({ kind: "request", date: data.request.created_at, payload: data.request });
    }

    if (data.entry) {
      events.push({ kind: "entry", date: data.entry.created_at, payload: data.entry });
    }

    if (data.conversation) {
      const convPayload = convDetails ?? data.conversation;
      events.push({
        kind: "conversation",
        date: convPayload.created_at || convPayload.updated_at || data.conversation.created_at || data.conversation.updated_at,
        payload: convPayload,
      });

      // Add conversation closed event if available
      if (convPayload.closed_at && convPayload.close_reason) {
        events.push({
          kind: "conversation-closed",
          date: convPayload.closed_at,
          payload: {
            reason: convPayload.close_reason,
          },
        });
      }
    }

    events.sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() : 0;
      const tb = b.date ? new Date(b.date).getTime() : 0;
      return ta - tb;
    });

    return events;
  };

  const events = buildEvents();

  const handleOpenConversation = (convId) => {
    if (!convId) return;
    navigate(`/tickets/${convId}`);
    onClose?.();
  };

  return (
    <div className="tm-overlay" onClick={onClose} role="presentation">
      <div className="tm-modal compact" onClick={(e) => e.stopPropagation()}>
        <div className="tm-header tm-header-compact">
          <h3 className="tm-title">Remark Timeline</h3>
          <button className="tm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="tm-body tm-body-compact">
          {loading && <div className="tm-muted">Loading timeline…</div>}
          {error && <div className="tm-error">Error: {error}</div>}

          {!loading && !error && (!events || events.length === 0) && (
            <div className="tm-muted">No timeline events available.</div>
          )}

          {!loading && !error && events && events.length > 0 && (
            <div className="tm-timeline compact">
              {events.map((ev, idx) => {
                const p = ev.payload || {};
                const displayDate = ev.date ? new Date(ev.date) : null;
                const payloadType = p.type ?? p.request_type ?? p.related_object?.type ?? null;
                const badgeClass = (ev.kind === "conversation" || ev.kind === "conversation-closed") ? "badge-neutral" : typeToBadgeClass(payloadType);
                const dotClass = (ev.kind === "conversation") ? "tm-dot" : (ev.kind === "conversation-closed" ? "tm-dot-closed" : typeToDotClass(payloadType));
                const badgeText = ev.kind === "conversation" ? "Discussion" : (ev.kind === "conversation-closed" ? "Closed" : typeToBadgeText(payloadType));

                if (ev.kind === "request") {
                  return (
                    <div className="tm-row compact" key={"request-" + idx}>
                      <div className="tm-left">
                        <div className="tm-date">{displayDate ? displayDate.getDate() : ""}</div>
                        <div className="tm-month">{displayDate ? displayDate.toLocaleString(undefined, { month: "short" }) : ""}</div>
                      </div>

                      <div className="tm-line-col">
                        <div className={dotClass} />
                        {idx < events.length - 1 && <div className="tm-connector" />}
                      </div>

                      <div className={`tm-card ${badgeClass}`}>
                        <div className="tm-row-top">
                          <span className={`tm-badge ${badgeClass} tm-badge-compact`}>{badgeText}</span>
                          <div className="tm-time-compact">{fmt(p.created_at)}</div>
                        </div>

                        <div className="tm-title-compact">{p.type ?? "Request"}</div>
                        <div className="tm-sub-compact">Requested by {p.created_by ? `${p.created_by.first_name} ${p.created_by.last_name}` : "—"}</div>

                        <div className="tm-meta-compact">
                          <div><strong>For:</strong> {p.employee ? `${p.employee.first_name} ${p.employee.last_name}` : "—"}</div>
                          <div><strong>Points:</strong> {p.points ?? "—"}</div>
                          <div><strong>Reason:</strong> <span className="muted">{p.reason ?? "—"}</span></div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (ev.kind === "entry") {
                  return (
                    <div className="tm-row compact" key={"entry-" + idx}>
                      <div className="tm-left">
                        <div className="tm-date">{displayDate ? displayDate.getDate() : ""}</div>
                        <div className="tm-month">{displayDate ? displayDate.toLocaleString(undefined, { month: "short" }) : ""}</div>
                      </div>

                      <div className="tm-line-col">
                        <div className={dotClass} />
                        {idx < events.length - 1 && <div className="tm-connector" />}
                      </div>

                      <div className={`tm-card ${badgeClass}`}>
                        <div className="tm-row-top">
                          <span className={`tm-badge ${badgeClass} tm-badge-compact`}>Approved Entry</span>
                          <div className="tm-time-compact">{fmt(p.created_at)}</div>
                        </div>

                        <div className="tm-title-compact">{p.reason ?? "Approved entry created"}</div>
                       {p.created_by &&  <div className="tm-sub-compact">Approved by {p.created_by ? `${p.created_by.first_name} ${p.created_by.last_name}` : "—"}</div>}

                        <div className="tm-meta-compact">
                          <div><strong>Points:</strong> {p.points ?? "—"}</div>
                          <div><strong>Approved at:</strong> {fmt(p.created_at)}</div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (ev.kind === "conversation") {
                  const conv = convDetails ?? p;
                  return (
                    <div className="tm-row compact" key={"conv-" + idx}>
                      <div className="tm-left">
                        <div className="tm-date">{displayDate ? displayDate.getDate() : ""}</div>
                        <div className="tm-month">{displayDate ? displayDate.toLocaleString(undefined, { month: "short" }) : ""}</div>
                      </div>

                      <div className="tm-line-col">
                        <div className={dotClass} />
                        {idx < events.length - 1 && <div className="tm-connector" />}
                      </div>

                      <div className={`tm-card ${badgeClass}`}>
                        <div className="tm-row-top">
                          <span className={`tm-badge ${badgeClass} tm-badge-compact`}>Discussion</span>
                          <div className="tm-time-compact">{fmt(conv?.created_at || conv?.updated_at || p?.created_at || p?.updated_at)}</div>
                        </div>

                        <div className="tm-title-compact">Conversation</div>
                        <div className="tm-sub-compact">{conv?.message_count ? `${conv.message_count} messages` : "No messages yet"}</div>

                        <div className="tm-meta-compact flex-row">
                          <div className="tm-participants-compact">{Array.isArray(conv?.participants) ? conv.participants.map(x => x.first_name).slice(0,3).join(", ") : ""}</div>
                          <div>
                            <button
                              className="tm-open-btn tm-open-btn-compact"
                              onClick={() => handleOpenConversation(conv?.id || p?.id)}
                            >
                              Open Chat
                            </button>
                          </div>
                        </div>

                        {convError && <div className="tm-small tm-error" style={{ marginTop: 8 }}>{convError}</div>}
                      </div>
                    </div>
                  );
                }

                if (ev.kind === "conversation-closed") {
                  const closedDate = new Date(ev.date);
                  return (
                    <div className="tm-row compact" key={"conv-closed-" + idx}>
                      <div className="tm-left">
                        <div className="tm-date">{closedDate.getDate()}</div>
                        <div className="tm-month">{closedDate.toLocaleString(undefined, { month: "short" })}</div>
                      </div>

                      <div className="tm-line-col">
                        <div className={dotClass} />
                        {idx < events.length - 1 && <div className="tm-connector" />}
                      </div>

                      <div className="tm-card badge-closed">
                        <div className="tm-row-top">
                          <span className="tm-badge badge-closed tm-badge-compact">Closed</span>
                          <div className="tm-time-compact">{fmt(ev.date)}</div>
                        </div>
                        <div className="tm-title-compact">{ev.payload.reason}</div>
                        <div className="tm-sub-compact">This conversation has been closed.</div>
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          )}
        </div>

        <div className="tm-footer">
          <button className="tm-btn tm-btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

TimelineModal.propTypes = {
  entryId: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  isAdmin: PropTypes.bool,
};

TimelineModal.defaultProps = {
  isAdmin: false,
};
