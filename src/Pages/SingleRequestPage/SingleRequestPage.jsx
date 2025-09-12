import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getSingleRequestApi,
  deleteRequestApi,
  approveRequestApi,
  rejectRequestApi,
} from "../../Apis/pointRequestApi";
import ConfirmModal from "../../Components/ConfirmModal/ConfirmModal";
import { useAuth } from "../../Utils/AuthContext";
import toast from "react-hot-toast";
import "./style.css";

// React component using plain CSS (file: SingleRequestPageRefactor.css)
export default function SingleRequestPageRefactor() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
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
        const res = await getSingleRequestApi(id);
        if (mounted) setRequest(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load request");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();
    return () => (mounted = false);
  }, [id]);

  const updateLocalStatus = (newStatus, meta = {}) => {
    setRequest((prev) =>
      prev
        ? {
            ...prev,
            status: newStatus,
            updated_at: new Date().toISOString(),
            ...meta,
          }
        : prev
    );
  };

  const handleAction = (type, reqId) => {
    const map = {
      approve: {
        title: "Approve request",
        message: "Approve this request and award points?",
        fn: async () => {
          setBusy(true);
          try {
            await approveRequestApi(reqId);
            updateLocalStatus("APPROVED", { approved_by: { first_name: user.first_name, last_name: user.last_name } });
            toast.success("Request approved");
          } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.detail || "Failed to approve");
          } finally {
            setBusy(false);
          }
        },
      },
      reject: {
        title: "Reject request",
        message: "Reject this request? The requester will be notified.",
        fn: async () => {
          setBusy(true);
          try {
            await rejectRequestApi(reqId);
            updateLocalStatus("REJECTED", { rejected_at: new Date().toISOString(), approved_by: { first_name: user.first_name, last_name: user.last_name } });
            toast.success("Request rejected");
          } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.detail || "Failed to reject");
          } finally {
            setBusy(false);
          }
        },
      },
      delete: {
        title: "Delete request",
        message: "Delete permanently? This cannot be undone.",
        fn: async () => {
          setBusy(true);
          try {
            await deleteRequestApi(reqId);
            toast.success("Request deleted");
            navigate(-1);
          } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.detail || "Failed to delete");
          } finally {
            setBusy(false);
          }
        },
      },
    };

    const item = map[type];
    if (!item) return;

    setConfirmModal({ open: true, title: item.title, message: item.message, action: item.fn });
  };

  if (loading)
    return (
      <div className="srp-loading">
        <div className="srp-skeleton header" />
        <div className="srp-skeleton card" />
      </div>
    );

  if (!request)
    return (
      <div className="srp-empty">
        <div className="srp-empty-box">
          <h3>Request not found</h3>
          <button className="btn-outline" onClick={() => navigate(-1)}>Go back</button>
        </div>
      </div>
    );

  const initials = (first, last) => {
    const a = first?.[0] ?? "";
    const b = last?.[0] ?? "";
    return (a + b).toUpperCase();
  };

  return (
    <div className="srp-root">
      <div className="srp-container">
        <div className="srp-header">
          <div>
            <h2 className="srp-title">{request.type ?? "Request"}</h2>
            <div className="srp-sub">ID: <code className="srp-code">{request.id}</code></div>
          </div>

          <div className="srp-actions">
            <div className={`srp-badge srp-badge-${request.status?.toLowerCase()}`}>{request.status}</div>

            <div className="srp-action-buttons">
              {isAdmin && request.status === "PENDING" && (
                <>
                  <button className="btn-primary" disabled={busy} onClick={() => handleAction('approve', request.id)}>✅ Approve</button>
                  <button className="btn-danger" disabled={busy} onClick={() => handleAction('reject', request.id)}>❌ Reject</button>
                </>
              )}

              {request.status === "PENDING" && (
                <button className="btn-muted" disabled={busy} onClick={() => handleAction('delete', request.id)}>🗑 Delete</button>
              )}

              <button className="btn-ghost" onClick={() => navigate(-1)}>Back</button>
            </div>
          </div>
        </div>

        <div className="srp-grid">
          <main className="srp-main">
            <div className="srp-person">
              <div className="srp-avatar">{initials(request.employee?.first_name, request.employee?.last_name)}</div>
              <div>
                <div className="muted">Created for</div>
                <div className="strong">{request.employee?.first_name} {request.employee?.last_name}</div>
                <div className="muted small">{request.employee?.email}</div>
              </div>
            </div>

            <section className="srp-section">
              <h4 className="srp-section-title">Reason</h4>
              <div className="srp-reason">{request.reason || "— No reason provided —"}</div>
            </section>

            <section className="srp-stats">
              <div className="srp-stat">
                <div className="muted">Points</div>
                <div className="strong large">{request.points}</div>
              </div>

              <div className="srp-stat">
                <div className="muted">Last updated</div>
                <div className="strong">{new Date(request.updated_at || request.created_at).toLocaleString()}</div>
              </div>

              <div className="srp-stat">
                <div className="muted">Created at</div>
                <div className="strong">{new Date(request.created_at).toLocaleString()}</div>
              </div>

              <div className="srp-stat">
                <div className="muted">Type</div>
                <div className="strong">{request.type}</div>
              </div>
            </section>

            <section className="srp-activity">
              <h4 className="srp-section-title">Activity</h4>
              <div className="activity-item">
                <div className="activity-avatar">{initials(request.created_by?.first_name, request.created_by?.last_name)}</div>
                <div>
                  <div className="strong">Created</div>
                  <div className="muted small">{new Date(request.created_at).toLocaleString()}</div>
                </div>
              </div>

              {request.status !== 'PENDING' && (
                <div className="activity-item">
                  <div className="activity-avatar">{request.approved_by?.first_name ? initials(request.approved_by.first_name, request.approved_by.last_name) : '-'}</div>
                  <div>
                    <div className="strong">{request.status === 'APPROVED' ? 'Approved' : 'Rejected'}</div>
                    <div className="muted small">{new Date(request.updated_at || request.rejected_at || request.created_at).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </section>
          </main>

          <aside className="srp-aside">
            <div className="card">
              <div className="card-row">
                <div>
                  <div className="muted">Requested by</div>
                  <div className="strong">{request.created_by?.first_name} {request.created_by?.last_name}</div>
                </div>
                <div className="muted small">{new Date(request.created_at).toLocaleDateString()}</div>
              </div>

              <div className="card-divider" />

              <div className="card-details">
                <div className="detail-row"><span className="muted">Status</span><span>{request.status}</span></div>
                <div className="detail-row"><span className="muted">Status changed</span><span>{new Date(request.updated_at || request.created_at).toLocaleString()}</span></div>
                <div className="detail-row"><span className="muted">Approved/Rejected by</span><span>{request.approved_by?.first_name ? `${request.approved_by.first_name} ${request.approved_by.last_name}` : '—'}</span></div>
              </div>

              <div className="card-actions">
                {isAdmin && request.status === 'PENDING' ? (
                  <>
                    <button className="btn-primary full" disabled={busy} onClick={() => handleAction('approve', request.id)}>Approve</button>
                    <button className="btn-danger full" disabled={busy} onClick={() => handleAction('reject', request.id)}>Reject</button>
                  </>
                ) : (
                  <div className="muted small">No actions available</div>
                )}

                {request.status === 'PENDING' && (
                  <button className="btn-ghost full" disabled={busy} onClick={() => handleAction('delete', request.id)}>Delete</button>
                )}
              </div>
            </div>

           { request.status === 'PENDING' && <div className="tip">Tip: Use the actions above to change request state. All actions are audited.</div>}
          </aside>
        </div>

        <div className="srp-footer">Status last changed: {new Date(request.updated_at || request.created_at).toLocaleString()}</div>
      </div>

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title || 'Confirm Action'}
        message={confirmModal.message || 'Are you sure?'}
        onConfirm={() => {
          try {
            confirmModal.action?.();
          } catch (err) {
            console.error('Confirm action error:', err);
          } finally {
            setConfirmModal({ open: false, title: '', message: '', action: null });
          }
        }}
        onCancel={() => setConfirmModal({ open: false, title: '', message: '', action: null })}
      />
    </div>
  );
}

