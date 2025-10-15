import React, { useEffect, useRef, useState } from "react";
import axiosInstance from "../../Apis/axiosInstance";
import { useNavigate } from "react-router-dom";

import "./style.css";

/**
 * EntryDetails (modal)
 *
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - onApprove: () => void
 *  - onReject: () => void
 *  - createdBy, isAdmin, reason, points, type, operation, forUser, created_at, requestId
 */

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const EntryDetails = ({
  isOpen,
  onClose = () => {},
  createdBy,
  isAdmin,
  reason,
  points,
  type,
  forUser,
  created_at,
  entryId,
}) => {
  const firstButtonRef = useRef(null);

  const [forUserDetail,setForUserDetail] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!forUser?.id) return;

    const fetchUserDetail = async () => {
      
      try {
        const res = await axiosInstance.get(`/users/${forUser?.id}/`);
        setForUserDetail(res.data);
      } catch (err) {
        console.error("Error fetching user detail:", err);
      } 
    };

    fetchUserDetail();
  }, [forUser?.id]);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      // trap focus simple: tabbing cycles within modal (minimal)
    };

    // prevent background scroll
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);

    // autofocus first actionable control for keyboard users
    setTimeout(() => firstButtonRef.current?.focus(), 0);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const title = `${type?.charAt(0).toUpperCase() + type?.slice(1).toLowerCase()} Point Entry`

  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
      role="presentation"
      aria-hidden={false}
    >
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ed-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <div className="modal-left">
            {/* <div className="modal-avatar" aria-hidden>
              {forUser?.first_name?.[0]?.toUpperCase() || "U"}
            </div> */}
            <div className="modal-heading">
              <div id="ed-title" className="modal-title">{title}</div>
             {isAdmin && <div className="modal-sub">Entry ID: <span className="modal-id">{entryId || "—"}</span></div>}
            </div>
          </div>

          <div className="modal-controls">
            <div className="modal-badges" aria-hidden>

              <span className="badge type">{type || "N/A"}</span>
              <span className="badge points">{points ?? 0} pts</span>
            </div>
            <button
              className="icon-btn close-btn"
              onClick={onClose}
              aria-label="Close dialog"
              title="Close"
            >
              ✕
            </button>
          </div>
        </header>

        <div className="modal-body">
          <aside className="modal-meta">
            {isAdmin && (
              <div className="person-row">
                <div className="person-left">
                  {/* <div className="person-avatar">{forUser?.first_name?.[0]?.toUpperCase() || "U"}</div> */}
                </div>
                <div className="person-right">
                  <div className="person-name">{forUserDetail?.first_name} {forUser?.last_name}</div>
                   {forUserDetail?.department?.dept_name && (
                    <div className="person-dept">  Department: {forUserDetail.department.dept_name}</div>
                  )}
                  <div className="contact">
                    <div>Email: {forUserDetail?.company_email || "—"}</div>
                    
                  </div>
                </div>
              </div>
            )}

            <div className="meta-list">
              {/* <div className="meta-item">
                <div className="meta-key">Created by</div>
                <div className="meta-val">{createdBy?.first_name ? `${createdBy.first_name} ${createdBy.last_name || ""}` : createdBy?.company_email || "—"}</div>
              </div> */}

              <div className="meta-item">
                <div className="meta-key">Created at</div>
                <div className="meta-val">{formatDate(created_at)}</div>
              </div>

              {/* <div className="meta-item">
                <div className="meta-key">Operation</div>
                <div className="meta-val">{operation || "—"}</div>
              </div> */}
            </div>
            <div className="meta-item">
                 <button  
                   onClick={() => navigate(`/points-entries/${entryId}`)}
                 className="redirect-entry-btn">Show Entry</button>
            </div>
          </aside>

          <section className="modal-content">
            <div className="reason-head">Reason</div>
            <div className="reason-box">
              {reason ? <p>{reason}</p> : <div className="muted">No reason provided</div>}
            </div>
          </section>
        </div>

        <footer className="modal-footer" role="toolbar" aria-label="Dialog actions">
          <div className="footer-left">
            <button className="btn ghost" onClick={onClose}>Close</button>
          </div>

        
        </footer>
      </div>
    </div>
  );
};

export default EntryDetails;
