import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getSingleEntryApi,
  reverseEntryApi,
  getAllEntriesApi,
} from "../../Apis/EntriesApi";
import { createConversationApi } from "../../Apis/CreateConversation";
import ConfirmModal from "../../Components/ConfirmModal/ConfirmModal";
import { useAuth } from "../../Utils/AuthContext";
import toast from "react-hot-toast";
import "./style.css"; // keep filename if you'd like; classes are namespaced with `entry`

const API_URL = "/point-entries/";

export default function SingleEntryPageRefactor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    action: null,
  });

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const res = await getSingleEntryApi(id);
        if (mounted) setEntry(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load entry");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();
    return () => (mounted = false);
  }, [id]);

  const markReversedLocally = () => {
    setEntry((prev) =>
      prev ? { ...prev, operation: "REVERSED", updated_at: new Date().toISOString() } : prev
    );
  };

  const operationToStatus = (op) => {
    if (!op) return "PENDING";
    const key = String(op).toUpperCase();
    if (key === "GRANT") return "APPROVED";
    if (["REVERSE", "REVOKE", "REVERSED"].includes(key)) return "REJECTED";
    return "PENDING";
  };

  const handleReverse = (entryId) => {
    setConfirmModal({
      open: true,
      title: "Reverse Entry",
      message: "Are you sure you want to reverse this entry? This will undo granted points.",
      action: async () => {
        setBusy(true);
        try {
          await reverseEntryApi(entryId);
          await getAllEntriesApi(API_URL);
          markReversedLocally();
          toast.success("↩️ Entry reversed");
        } catch (err) {
          console.error(err);
          toast.error(err.response?.data?.detail || "Reverse entry failed");
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const handleCreateTicket = async () => {
    if (!entry) return;
    setBusy(true);
    try {
      const typeCheck = String(entry.type || "").toUpperCase();
      if (!["DEMERIT", "DMERIT"].includes(typeCheck)) {
        toast.error("Ticket can only be created for demerit entries");
        setBusy(false);
        return;
      }

      const participant_ids = ["4459e8ab-3ce6-4dae-9f86-c16cce6c9abb"];
      const payload = { conversation_type: "point_discussion", content_object_id: entry.id, participant_ids };

      const res = await createConversationApi(payload);
      const conversation = res.data;
      toast.success("Ticket created — opening conversation");
      navigate(`/tickets/${conversation.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || err.message || "Failed to create ticket");
    } finally {
      setBusy(false);
    }
  };

  if (loading)
    return (
      <div className="srp-entry-root">
        <div className="srp-entry-container">
          <div className="srp-entry-loading">
            <div className="srp-entry-skeleton header" />
            <div className="srp-entry-skeleton card" />
          </div>
        </div>
      </div>
    );

  if (!entry)
    return (
      <div className="srp-entry-root">
        <div className="srp-entry-container">
          <div className="srp-entry-empty">
            <div className="srp-entry-empty-box">
              <h3>Entry not found</h3>
              <button className="entry-btn-outline" onClick={() => navigate(-1)}>Go back</button>
            </div>
          </div>
        </div>
      </div>
    );

  const initials = (first, last) => {
    const a = (first?.[0] ?? "").toUpperCase();
    const b = (last?.[0] ?? "").toUpperCase();
    return (a + b).trim();
  };

  const status = operationToStatus(entry.operation);

  return (
    <div className="srp-entry-root">
      <div className="srp-entry-container">
        <div className="srp-entry-header">
          <div>
            <h2 className="srp-entry-title">{entry.type ?? "Entry"}</h2>
            {isAdmin && <div className="srp-entry-sub">ID: <code className="srp-entry-code">{entry.id}</code></div>}
          </div>

          <div className="srp-entry-actions">
            <div className={`srp-entry-badge srp-entry-badge-${status.toLowerCase()}`}>
              <span style={{marginRight:8}}>
                {entry.operation?.toUpperCase() === "GRANT" ? "✅" : (["REVERSE","REVERSED"].includes(entry.operation?.toUpperCase()) ? "↩️" : "⏳")}
              </span>
              {entry.operation ?? status}
            </div>

            <div className="srp-entry-action-buttons">
              {isAdmin && entry.operation && entry.operation.toUpperCase() !== "REVERSAL" && (
                <button className="entry-btn-danger" disabled={busy} onClick={() => handleReverse(entry.id)}>↩️ Reverse</button>
              )}

              {(["DEMERIT","DMERIT"].includes(String(entry.type || "").toUpperCase())) && (
                <button className="entry-btn-muted" disabled={busy} onClick={handleCreateTicket}>🎫 Create Ticket</button>
              )}

              <button className="entry-btn-ghost" onClick={() => navigate(-1)}>Back</button>
            </div>
          </div>
        </div>

        <div className="srp-entry-grid">
          <main className="srp-entry-main">
            <div className="srp-entry-person">
              <div className="srp-entry-avatar">{initials(entry.employee?.first_name, entry.employee?.last_name)}</div>
              <div>
                <div className="srp-entry-muted">Created for</div>
                <div className="srp-entry-strong">{entry.employee?.first_name} {entry.employee?.last_name}</div>
                <div className="srp-entry-muted srp-entry-small">{entry.employee?.email}</div>
              </div>
            </div>

            <section className="srp-entry-section">
              <h4 className="srp-entry-section-title">Note / Reason</h4>
              <div className="srp-entry-reason">{entry.reason || "— No reason provided —"}</div>
            </section>

            <section className="srp-entry-stats">
              <div className="srp-entry-stat">
                <div className="srp-entry-muted">Points</div>
                <div className="srp-entry-strong srp-entry-large">{entry.points}</div>
              </div>

              <div className="srp-entry-stat">
                <div className="srp-entry-muted">Created</div>
                <div className="srp-entry-strong">{new Date(entry.created_at).toLocaleString()}</div>
              </div>

              <div className="srp-entry-stat">
                <div className="srp-entry-muted">Updated</div>
                <div className="srp-entry-strong">{new Date(entry.updated_at || entry.created_at).toLocaleString()}</div>
              </div>

              <div className="srp-entry-stat">
                <div className="srp-entry-muted">Operation</div>
                <div className="srp-entry-strong">{entry.operation ?? "—"}</div>
              </div>
            </section>

            <section className="srp-entry-activity">
              <h4 className="srp-entry-section-title">Activity</h4>

              <div className="srp-entry-activity-item">
                <div className="srp-entry-activity-avatar">{initials(entry.created_by?.first_name, entry.created_by?.last_name)}</div>
                <div>
                  <div className="srp-entry-strong">Created</div>
                  <div className="srp-entry-muted srp-entry-small">{new Date(entry.created_at).toLocaleString()}</div>
                </div>
              </div>

              {entry.operation && (
                <div className="srp-entry-activity-item">
                  <div className="srp-entry-activity-avatar">{entry.operation ? initials(entry.created_by?.first_name, entry.created_by?.last_name) : "-"}</div>
                  <div>
                    <div className="srp-entry-strong">{entry.operation}</div>
                    <div className="srp-entry-muted srp-entry-small">{new Date(entry.updated_at || entry.created_at).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </section>
          </main>

          <aside className="srp-entry-aside">
            <div className="srp-entry-card">
              <div className="srp-entry-card-row">
                <div>
                  <div className="srp-entry-muted">Entry by</div>
                  <div className="srp-entry-strong">{entry.created_by?.first_name} {entry.created_by?.last_name}</div>
                </div>
                <div className="srp-entry-muted srp-entry-small">{new Date(entry.created_at).toLocaleDateString()}</div>
              </div>

              <div className="srp-entry-card-divider" />

              <div className="srp-entry-card-details">
                <div className="srp-entry-detail-row"><span className="srp-entry-muted">Type</span><span>{entry.type ?? "—"}</span></div>
                <div className="srp-entry-detail-row"><span className="srp-entry-muted">Operation</span><span>{entry.operation ?? "—"}</span></div>
                <div className="srp-entry-detail-row"><span className="srp-entry-muted">Original</span><span>{entry.original_entry ?? "—"}</span></div>
              </div>

              <div className="srp-entry-card-actions">
                {isAdmin && entry.operation && entry.operation.toUpperCase() !== "REVERSAL" ? (
                  <>
                    <button className="entry-btn-danger entry-full" disabled={busy} onClick={() => handleReverse(entry.id)}>Reverse</button>
                    <button className="entry-btn-ghost entry-full" disabled={busy} onClick={() => navigate(-1)}>Back</button>
                  </>
                ) : (
                  <div className="srp-entry-muted srp-entry-small">No admin actions</div>
                )}

                {(["DEMERIT","DMERIT"].includes(String(entry.type || "").toUpperCase())) && (
                  <button className="entry-btn-muted entry-full" disabled={busy} onClick={handleCreateTicket}>Create Ticket</button>
                )}
              </div>
            </div>

            {entry.type === "DEMERIT" && <div className="srp-entry-tip">Tip: Entry operation is shown above. Actions are audited.</div>}
          </aside>
        </div>

        <div className="srp-entry-footer">Last updated: {new Date(entry.updated_at || entry.created_at).toLocaleString()}</div>
      </div>

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title || "Confirm Action"}
        message={confirmModal.message || "Are you sure?"}
        onConfirm={() => {
          try {
            confirmModal.action?.();
          } catch (err) {
            console.error("Confirm action error:", err);
          } finally {
            setConfirmModal({ open: false, title: "", message: "", action: null });
          }
        }}
        onCancel={() => setConfirmModal({ open: false, title: "", message: "", action: null })}
      />
    </div>
  );
}
