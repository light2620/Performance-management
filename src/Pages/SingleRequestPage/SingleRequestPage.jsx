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

const SingleRequestPage = () => {
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
    const fetch = async () => {
      try {
        const res = await getSingleRequestApi(id);
        setRequest(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const updateLocalStatus = (newStatus) => {
    setRequest((prev) =>
      prev
        ? { ...prev, status: newStatus, updated_at: new Date().toISOString() }
        : prev
    );
  };

  const handleApprove = (reqId) => {
    setConfirmModal({
      open: true,
      title: "Approve Request",
      message: "Are you sure you want to approve this request?",
      action: async () => {
        setBusy(true);
        try {
          await approveRequestApi(reqId);
          updateLocalStatus("APPROVED");
          toast.success("✅ Request approved");
        } catch (err) {
          console.error(err);
          toast.error(err.response?.data?.detail || "Failed to approve");
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const handleReject = (reqId) => {

    setConfirmModal({
      open: true,
      title: "Reject Request",
      message: "Are you sure you want to reject this request?",
      action: async () => {
        setBusy(true);
        try {
          await rejectRequestApi(reqId);
          updateLocalStatus("REJECTED");
          toast.success("❌ Request rejected");
        } catch (err) {
          console.error(err);
          toast.error(err.response?.data?.detail || "Failed to approve");
        } finally {
          setBusy(false);
        }
      },
    });
  };

  const handleDelete = (reqId) => {
    setConfirmModal({
      open: true,
      title: "Delete Request",
      message:
        "Delete this request permanently? This action cannot be undone.",
      action: async () => {
        setBusy(true);
        try {
          await deleteRequestApi(reqId);
          toast.success("🗑️ Request deleted");
          navigate(-1);
        } catch (err) {
          console.error(err);
          toast.error(err.response?.data?.detail || "Failed to approve");
        } finally {
          setBusy(false);
        }
      },
    });
  };

  if (loading) return <div className="single-request-page">Loading…</div>;
  if (!request) return <div className="single-request-page">Request not found</div>;

  const initials = (first, last) => {
    const a = first?.[0] ?? "";
    const b = last?.[0] ?? "";
    return (a + b).toUpperCase();
  };

  // 👇 statusClass will be used for right border color
  const statusClass = request?.status
    ? `status-${request.status.toLowerCase()}`
    : "";

  return (
    <div className="single-request-page">
      <div className={`request-card lively ${statusClass}`}>
        <div className="left-accent" aria-hidden />

        <header className="request-card-header">
          <div className="title-block">
            <h1 className="request-type">
              {request.type?.toUpperCase() ?? "REQUEST"}
            </h1>
            <div className={`big-status ${request.status?.toLowerCase() ?? ""}`}>
              <span className="status-emoji">
                {request.status === "APPROVED"
                  ? "✅"
                  : request.status === "REJECTED"
                  ? "❌"
                  : request.status === "CANCELLED"
                  ? "🚫"
                  : "⏳"}
              </span>
              <span className="status-text">{request.status}</span>
            </div>
          </div>

          <div className="meta-block">
            <div className="for-block">
              <div className="avatar avatar-employee">
                {initials(
                  request.employee?.first_name,
                  request.employee?.last_name
                )}
              </div>
              <div className="who">
                <div className="who-label">Created for</div>
                <div className="who-value">
                  {request.employee?.first_name} {request.employee?.last_name}
                </div>
              </div>
            </div>

            {user.role === "ADMIN" && (
              <div className="by-block">
                <div className="avatar avatar-creator">
                  {initials(
                    request.created_by?.first_name,
                    request.created_by?.last_name
                  )}
                </div>
                <div className="who">
                  <div className="who-label">Created by</div>
                  <div className="who-value">
                    {request.created_by?.first_name}{" "}
                    {request.created_by?.last_name}
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        <section className="request-body">
          <div className="left-column">
            <div className="points-pill">
              Points <strong>{request.points}</strong>
            </div>

            <div className="reason-box">
              <div className="reason-title">Reason</div>
              <div className="reason-content">
                {request.reason || "— No reason provided —"}
              </div>
            </div>

            <div className="timestamps">
              <div className="ts-row">
                <div className="ts-label">Created</div>
                <div className="ts-value">
                  {new Date(request.created_at).toLocaleString()}
                </div>
              </div>
              <div className="ts-row">
                <div className="ts-label">Updated</div>
                <div className="ts-value">
                  {new Date(
                    request.updated_at || request.created_at
                  ).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <aside className="right-column">
            <div className="additional-card">
              <div className="add-title">Request Details</div>
              <div className="add-row">
                <span className="k">Type</span>
                <span className="v">{request.type}</span>
              </div>
              <div className="add-row">
                <span className="k">Status</span>
                <span className="v">{request.status}</span>
              </div>
              {(request.status === "APPROVED" || request.status === "REJECTED" ) && <div className="add-row">
                <span className="k">{request.status === "APPROVED" ? "Approved by" : "Rejected By"}</span>
                <span className="v">
                  {request.approved_by?.first_name
                    ? `${request.approved_by.first_name} ${request.approved_by.last_name}`
                    : "—"}
                </span>
              </div>}

              {(request.status === "APPROVED" || request.status === "REJECTED" ) &&<div className="add-row">
                <span className="k">Rejected at</span>
                <span className="v">
                  {request.rejected_at
                    ? new Date(request.rejected_at).toLocaleString()
                    : "—"}
                </span>
              </div>}
            </div>

            <div className="cta-block">
              {(isAdmin && request.status === "PENDING") ? (
                <>
                  <button
                    className="btn approve"
                    onClick={() => handleApprove(request.id)}
                    disabled={busy || request.status === "APPROVED"}
                  >
                    ✅ Approve
                  </button>
                  <button
                    className="btn reject"
                    onClick={() => handleReject(request.id)}
                    disabled={busy || request.status === "REJECTED"}
                  >
                    ❌ Reject
                  </button>
                </>
              ) : 
              request.status !== "PENDING" && <p>{`This Request is ${request.status}`}</p>
              }
              {request.status === "PENDING" && <button
                className="btn delete"
                onClick={() => handleDelete(request.id)}
                disabled={busy}
              >
                🗑 Delete
              </button>}
            </div>
          </aside>
        </section>

        <footer className="request-footer">
          <div className="small-muted">
            Request ID: <code>{request.id}</code>
          </div>
          <div className="small-muted">
            Status last changed:{" "}
            {new Date(request.updated_at || request.created_at).toLocaleString()}
          </div>
        </footer>
      </div>

      {/* Confirm modal */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title || "Confirm Action"}
        message={confirmModal.message || "Are you sure you want to proceed?"}
        onConfirm={() => {
          try {
            confirmModal.action?.();
          } catch (err) {
            console.error("Confirm action error:", err);
          } finally {
            setConfirmModal({
              open: false,
              title: "",
              message: "",
              action: null,
            });
          }
        }}
        onCancel={() =>
          setConfirmModal({
            open: false,
            title: "",
            message: "",
            action: null,
          })
        }
      />
    </div>
  );
};

export default SingleRequestPage;
