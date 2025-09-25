import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSingleEntryApi, reverseEntryApi } from "../../Apis/EntriesApi";
import { createConversationApi } from "../../Apis/CreateConversation";
import { useAuth } from "../../Utils/AuthContext";
import toast from "react-hot-toast";
import TimelineModal from "../../Components/TimelineModal/TimelineModal";
import ConfirmModal from "../../Components/ConfirmModal/ConfirmModal";
import UserDetailModal from "../../Components/UserDetailModal/UserDetailModal";
import "./style.css";

export default function SingleEntryPageRedesign() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
     const [showUserDetailModal, setUserDetailModal] = useState(false)
     const [userId,setUserId] = useState("")

  // Confirm modal for reversal
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    action: null,
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await getSingleEntryApi(id);
        if (!mounted) return;
        setEntry(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load entry");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, [id]);

  const typeVal = String(entry?.type || "").toUpperCase();
  const isDemerit = typeVal === "DEMERIT" || typeVal === "DMERIT";
  const isMerit = typeVal === "MERIT";

  // ------------------------------
  // Create Ticket
  // ------------------------------
  const handleCreateTicket = async () => {
    if (!entry) return;
    setBusy(true);
    try {
      if (!isDemerit) {
        toast.error("Ticket can only be created for demerit entries");
        setBusy(false);
        return;
      }

      const participant_ids = ["4459e8ab-3ce6-4dae-9f86-c16cce6c9abb"];
      const payload = {
        conversation_type: "point_discussion",
        content_object_id: entry.id,
        participant_ids,
      };
      const res = await createConversationApi(payload);
      toast.success("Ticket created — opening conversation");
      navigate(`/tickets/${res.data.id}`);
    } catch (err) {
      console.error(err);
      if(err.response?.data?.content_object_id[0] === "A conversation already exist for this object"){

        navigate(`/tickets/`);
        
      }else{
         toast.error( err.message || "Failed to create ticket");
      }
     
    } finally {
      setBusy(false);
    }
  };

  // ------------------------------
  // Reversal
  // ------------------------------
  const handleReverse = () => {
    if (!entry) return;

    setConfirmModal({
      open: true,
      title: "Reverse Entry",
      message: "Are you sure you want to reverse this entry? This will undo granted points.",
      action: async () => {
        setBusy(true);
        try {
          await reverseEntryApi(entry.id);
          setEntry((prev) =>
            prev ? { ...prev, operation: "REVERSED", is_reversed: true, updated_at: new Date().toISOString() } : prev
          );
          toast.success("Entry reversed");
        } catch (err) {
          console.error(err);
          toast.error(err.response?.data?.detail || "Reverse entry failed");
        } finally {
          setBusy(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="sep-root sep-center">
        <div className="sep-skeleton">
          <div className="sep-skel-header" />
          <div className="sep-skel-body" />
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="sep-root sep-center">
        <div className="sep-empty">
          <h3>Entry not found</h3>
          <p className="sep-muted">We couldn't find the entry you're looking for.</p>
          <div className="sep-actions">
            <button className="sepr-btn sepr-btn-outline" onClick={() => navigate(-1)}>Go back</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sep-root">
      <div className="sep-container">
        {/* Header + actions */}
        <div className="sep-header">
          <div className="sep-title-block">
            <h1 className="sep-title">{entry.type ?? "Entry"}</h1>
            <div className="sep-meta">
              <div className={`sep-badge ${isMerit ? 'sep-badge-merit' : isDemerit ? 'sep-badge-demerit' : 'sep-badge-neutral'}`}>{typeVal || '—'}</div>
              <div className="sep-id">{entry.id}</div>
            </div>
          </div>

          <div className="sepr-actions">
            {isDemerit && !isAdmin && (
              <button
                disabled={busy}
                onClick={handleCreateTicket}
                className="sepr-btn sepr-btn-primary"
              >
                🎫 Create Ticket
              </button>
            )}

            {isAdmin ? (
  !entry.is_reversed ? (
    <button
      disabled={busy}
      onClick={handleReverse}
      className="sepr-btn sepr-btn-primary "
    >
      Reverse Entry
    </button>
  ) : (
    <div className="sepr-reversed reverse-text">Entry is Reversed</div>
  )
) : (
  entry.is_reversed && (
    <div className="sepr-reversed reverse-text">Entry is Reversed</div>
  )
)}


            <button
              onClick={() => setTimelineOpen(true)}
              className="sepr-btn sepr-btn-primary"
            >
              History
            </button>
            <button
              onClick={() => navigate(-1)}
              className="sepr-btn sepr-btn-ghost"
            >
              Back
            </button>
          </div>
        </div>

        {/* Main card */}
        <div className="sep-card">
          <div className="sep-grid">
            <div className="sep-main">
              <div className="sep-points">
                <div className="sep-muted">Points</div>
                <div className="sep-points-value">{entry.points}</div>
              </div>

              <div className="sep-reason">
                <div className="sep-muted">Note / Reason</div>
                <div className="sep-reason-box">{entry.reason || '— No reason provided —'}</div>
              </div>
            </div>

            <aside className="sep-aside">
              {isAdmin && (
                <div className="sep-aside-row">
                  <div className="sep-muted" >Created for</div>
                  <div className={`sep-strong ${isAdmin && "sep-clickable"}`} onClick={() => {
                  isAdmin && setUserDetailModal(true)
                  isAdmin && setUserId(entry.employee?.id)}}>{entry.employee?.first_name} {entry.employee?.last_name}</div>
                </div>
              )}

              {isAdmin && <div className="sep-aside-row">
                <div className="sep-muted" >Created by</div>
                <div onClick={() => {
                  isAdmin && setUserDetailModal(true)
                  isAdmin && setUserId(entry.created_by?.id)}}className={`sep-strong ${isAdmin && "sep-clickable"}`}>{entry.created_by?.first_name} {entry.created_by?.last_name}</div>
              </div>}

              <div className="sep-aside-row">
                <div className="sep-muted">Created at</div>
                <div className="sep-small">{new Date(entry.created_at).toLocaleString()}</div>
              </div>
            </aside>
          </div>
        </div>

        <div className="sep-footer sep-muted">Last updated: {new Date(entry.updated_at || entry.created_at).toLocaleString()}</div>
      </div>

      <TimelineModal
        entryId={entry.id}
        open={timelineOpen}
        onClose={() => setTimelineOpen(false)}
        isAdmin={isAdmin}
      />

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => {
          confirmModal.action?.();
          setConfirmModal({ open: false, title: "", message: "", action: null });
        }}
        onCancel={() => setConfirmModal({ open: false, title: "", message: "", action: null })}
      />
      {
        showUserDetailModal && <UserDetailModal onClose={() => setUserDetailModal(false)} userId={userId}/>
      }
    </div>
  );
}
