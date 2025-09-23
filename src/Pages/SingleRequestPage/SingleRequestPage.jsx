import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getSingleRequestApi,
  deleteRequestApi,
  approveRequestApi,
  rejectRequestApi,
  editRequestedPointApi,
} from "../../Apis/pointRequestApi";
import ConfirmModal from "../../Components/ConfirmModal/ConfirmModal";
import { useAuth } from "../../Utils/AuthContext";
import toast from "react-hot-toast";
import RequestTimelineModal from "../../Components/RequestTimeline/RequestTimeline";
import UserDetailModal from "../../Components/UserDetailModal/UserDetailModal";
import { FaCheck, FaTimes, FaTrash, FaHistory, FaArrowLeft, FaPencilAlt } from "react-icons/fa";

import "./style.css";

export default function SingleRequestPageRedesign() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
   const [showUserDetailModal, setUserDetailModal] = useState(false)
   const [userId,setUserId] = useState("")

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    action: null,
  });
  const [showRequestTimeline,setShowRequestTimeline] = useState(false)
  const [editPointsModal, setEditPointsModal] = useState({
    open: false,
    points: "",
    admin_reason: "",
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
            updateLocalStatus("APPROVED", {
              approved_by: { first_name: user.first_name, last_name: user.last_name },
            });
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
            updateLocalStatus("REJECTED", {
              rejected_at: new Date().toISOString(),
              approved_by: { first_name: user.first_name, last_name: user.last_name },
            });
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

  const handleEditPointsSubmit = async () => {
    if (!editPointsModal.points || Number(editPointsModal.points) <= 0) {
      toast.error("Points must be a positive number");
      return;
    }
    setBusy(true);
    try {
      await editRequestedPointApi(id, {
        points: Number(editPointsModal.points),
        admin_reason: editPointsModal.admin_reason,
      });
      setRequest((prev) => ({
        ...prev,
        points: Number(editPointsModal.points),
      }));
      toast.success("Points updated successfully");
      setEditPointsModal({ open: false, points: "", admin_reason: "" });
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.detail || "Failed to update points");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="srdr-root srdr-center">
        <div className="srdr-skeleton">
          <div className="srdr-skel-header" />
          <div className="srdr-skel-body" />
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="srdr-root srdr-center">
        <div className="srdr-empty">
          <h3>Request not found</h3>
          <p className="srdr-muted">We couldn't find the request you're looking for.</p>
          <div className="srdr-actions">
            <button className="srdr-btn srdr-btn-outline" onClick={() => navigate(-1)}>
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusVal = request.status?.toUpperCase() || "PENDING";

  return (
    <div className="srdr-root">
      <div className="srdr-container">
        {/* Header */}
        <div className="srdr-header">
          <div className="srdr-title-block">
            <h1 className="srdr-title">{request.type ?? "Request"}</h1>
            <div className="srdr-meta">
              <div
                className={`srdr-badge ${
                  statusVal === "APPROVED"
                    ? "srdr-badge-approved"
                    : statusVal === "REJECTED"
                    ? "srdr-badge-rejected"
                    : "srdr-badge-pending"
                }`}
              >
                {statusVal}
              </div>
              <div className="srdr-id">{request.id}</div>
            </div>
          </div>

          <div className="srdr-actions">
            {isAdmin && request.status === "PENDING" && (
              <>
                <button
                  disabled={busy}
                  onClick={() => handleAction("approve", request.id)}
                  className="srdr-btn srdr-btn-approve"
                >
                  <FaCheck /> Approve
                </button>
                <button
                  disabled={busy}
                  onClick={() => handleAction("reject", request.id)}
                  className="srdr-btn srdr-btn-reject"
                >
                  <FaTimes /> Reject
                </button>
              </>
            )}

            {request.status === "PENDING" && (
              <button
                disabled={busy}
                onClick={() => handleAction("delete", request.id)}
                className="srdr-btn srdr-btn-delete"
              >
                <FaTrash /> Delete
              </button>
            )}

           {  <button onClick={() => setShowRequestTimeline(true)} className="srdr-btn srdr-btn-history">
              <FaHistory /> Point History
            </button>}

            <button className="srdr-btn srdr-btn-back" onClick={() => navigate(-1)}>
              <FaArrowLeft /> Back
            </button>
          </div>
        </div>

        {/* Main Card */}
        <div className="srdr-card">
          <div className="srdr-grid">
            <div className="srdr-main">
              <div className="srdr-points">
                <div className="srdr-muted">Points</div>
               <div className="srdr-points-value">
  {request.points}
  {isAdmin && (
    <FaPencilAlt
      size={14} // smaller icon
      style={{ marginLeft: 6, cursor: "pointer", verticalAlign: "middle" }}
      onClick={() =>
        setEditPointsModal({ open: true, points: request.points, admin_reason: "" })
      }
    />
  )}
</div>

              </div>

              <div className="srdr-reason">
                <div className="srdr-muted">Note / Reason</div>
                <div className="srdr-reason-box">{request.reason || "— No reason provided —"}</div>
              </div>
            </div>

            <aside className="srdr-aside">
              {isAdmin && (
                <div className="srdr-aside-row">
                  <div className="srdr-muted">Requested By</div>
                  <div className={`srdr-strong ${isAdmin && "srdr-clicable"}`} onClick={ () => {
                    setUserDetailModal(true)
                    setUserId(request.created_by?.id)}
                    
                    }>
                    {request.created_by?.first_name} {request.created_by?.last_name}
                  </div>
                </div>
              )}
              <div className="srdr-aside-row">
                <div className="srdr-muted">Created At</div>
                <div className="srdr-small">{new Date(request.created_at).toLocaleString()}</div>
              </div>

              <div className="srdr-aside-row">
                <div className="srdr-muted">Created For</div>
                <div className={`srdr-strong ${isAdmin && "srdr-clicable"}`} onClick={() => {
                  isAdmin && setUserDetailModal(true)
                  isAdmin && setUserId(request.employee?.id)}}>
                  {request.employee?.first_name} {request.employee?.last_name}
                </div>
              </div>

              <div className="srdr-aside-row">
                <div className="srdr-muted">Last Updated</div>
                <div className="srdr-small">{new Date(request.updated_at || request.created_at).toLocaleString()}</div>
              </div>
            </aside>
          </div>
        </div>

        <div className="srdr-footer">Last updated: {new Date(request.updated_at || request.created_at).toLocaleString()}</div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title || "Confirm Action"}
        message={confirmModal.message || "Are you sure?"}
        onConfirm={() => {
          confirmModal.action?.();
          setConfirmModal({ open: false, title: "", message: "", action: null });
        }}
        onCancel={() => setConfirmModal({ open: false, title: "", message: "", action: null })}
      />

      {/* Edit Points Modal */}
      {editPointsModal.open && (
        <div className="srdr-modal-backdrop">
          <div className="srdr-modal">
            <h2>Edit Points</h2>
            <label>
              Points (positive number)
              <input
                type="number"
                value={editPointsModal.points}
                onChange={(e) => setEditPointsModal({ ...editPointsModal, points: e.target.value })}
                min={1}
              />
            </label>
            <label>
              Reason (optional)
              <textarea
                value={editPointsModal.admin_reason}
                onChange={(e) =>
                  setEditPointsModal({ ...editPointsModal, admin_reason: e.target.value })
                }
              />
            </label>
            <div className="srdr-modal-actions">
              <button
                className="srdr-btn srdr-btn-primary"
                onClick={handleEditPointsSubmit}
                disabled={busy}
              >
                Save
              </button>
              <button
                className="srdr-btn srdr-btn-outline"
                onClick={() => setEditPointsModal({ open: false, points: "", admin_reason: "" })}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showRequestTimeline && (
  <RequestTimelineModal
    requestId={id}
    open={showRequestTimeline}
    onClose={() => setShowRequestTimeline(false)}
  />
)}
{
        showUserDetailModal && <UserDetailModal onClose={() => setUserDetailModal(false)} userId={userId}/>
      }
    </div>
  );
}
