import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import { getRequestHistoryApi } from "../../Apis/pointRequestApi";
import "./style.css";

export default function RequestTimelineModal({ requestId, open, onClose }) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getRequestHistoryApi(requestId);
        if (!mounted) return;
        setHistory(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load history");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();
    return () => (mounted = false);
  }, [requestId, open]);

  if (!open) return null;

const current = history?.current_data ?? null;
const changes = [...(history?.change_history ?? [])].reverse(); // reverse order
const original = history?.original_values ?? null;

  return (
    <div className="sep-tl-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sep-tl-modal" role="dialog" aria-modal="true" aria-label="Point change history">
        <button className="sep-tl-close" onClick={onClose} aria-label="Close timeline">
          <FaTimes />
        </button>

        <div className="sep-tl-body">
  {loading && <div className="sep-tl-loading">Loading history...</div>}

  {!loading && !current && <div className="sep-tl-empty">No history available</div>}

  {!loading && current && (
    <>
      {/* Top-left badge */}
      <div
        className={`sep-tl-type ${
          current.type?.toLowerCase() === "merit"
            ? "sep-tl-type-merit"
            : current.type?.toLowerCase() === "demerit"
            ? "sep-tl-type-demerit"
            : ""
        }`}
      >
        {current.type || "—"}
      </div>

      {/* Original starting point */}
      {original && (
        <div className="sep-tl-timeline-wrap">
          <div className="sep-tl-line" />

          <div className="sep-tl-item sep-tl-item-center">
            <div className="sep-tl-dot sep-tl-dot-current" />
            <div className="sep-tl-card sep-tl-card-center">
              <div className="sep-tl-card-row">
                <strong>Original Points:</strong>&nbsp;{original.points ?? "—"}
              </div>
              <div className="sep-tl-card-row">
                <strong>Original Reason:</strong>&nbsp;{original.reason || "— No reason —"}
              </div>
            </div>
          </div>

          {/* History items */}
          {changes.map((item, i) => {
  const side = i % 2 === 0 ? "left" : "right";
  const oldPts = item?.changes?.points?.old ?? "—";
  const newPts = item?.changes?.points?.new ?? "—";

  // Format changed_by
  const changedBy =
    item.changed_by && typeof item.changed_by === "object"
      ? `${item.changed_by.first_name ?? ""} ${item.changed_by.last_name ?? ""}`.trim()
      : item.changed_by ?? "—";

  return (
    <div className={`sep-tl-item sep-tl-item-${side}`} key={i}>
      <div className="sep-tl-dot" />
      <div className={`sep-tl-card sep-tl-card-${side}`}>
        <div className="sep-tl-card-row">
          <strong>Changed By:</strong>&nbsp;{changedBy}
        </div>
        <div className="sep-tl-card-row">
          <strong>Changed At:</strong>&nbsp;
          {item.changed_at ? new Date(item.changed_at).toLocaleString() : "—"}
        </div>
        <div className="sep-tl-card-row">
          <strong>Points:</strong>&nbsp;{oldPts} → {newPts}
        </div>

        {/* Show admin_reason if available */}
        {item.admin_reason && (
          <div className="sep-tl-card-row">
            <strong>Admin Reason:</strong>&nbsp;{item.admin_reason}
          </div>
        )}
      </div>
    </div>
  );
})}

        </div>
      )}
    </>
  )}
</div>

      </div>
    </div>
  );
}

RequestTimelineModal.propTypes = {
  requestId: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
