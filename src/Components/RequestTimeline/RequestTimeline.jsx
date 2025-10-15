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
  const original = history?.original_values ?? null;

  // Build chronological changes: oldest first.
  const changesOrdered = (history?.change_history ?? [])
    .slice()
    .sort((a, b) => {
      const ta = a?.changed_at ? new Date(a.changed_at).getTime() : 0;
      const tb = b?.changed_at ? new Date(b.changed_at).getTime() : 0;
      return ta - tb;
    });

  const formatName = (objOrString) => {
    if (!objOrString) return "—";
    if (typeof objOrString === "string") return objOrString;
    const name = `${objOrString.first_name ?? ""} ${objOrString.last_name ?? ""}`.trim();
    return name || "—";
  };

  return (
    <div
      className="sep-tl-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="sep-tl-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Point change history"
      >
        <button className="sep-tl-close" onClick={onClose} aria-label="Close timeline">
          <FaTimes />
        </button>

        <div className="sep-tl-body">
          {loading && <div className="sep-tl-loading">Loading history...</div>}

          {!loading && !current && <div className="sep-tl-empty">No history available</div>}

          {!loading && current && (
            <>
              {/* Top row: Original & Current */}
              <div className="sep-tl-top-row">
                <div className="sep-tl-summary-card">
                  <div className="sep-tl-summary-title">Original Points</div>
                  <div className="sep-tl-summary-value">{original?.points ?? "—"}</div>
                  <div className="sep-tl-summary-sub">Reason: {original?.reason ?? "— No reason —"}</div>
                </div>

                <div className="sep-tl-summary-card sep-tl-summary-current">
                  <div className="sep-tl-summary-title">Current Points</div>
                  <div className="sep-tl-summary-value">{current?.points ?? "—"}</div>
                  <div className="sep-tl-summary-sub">
                    Reason: {current?.reason ?? "— No reason —"}
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="sep-tl-timeline-wrap-vertical">
                <div className="sep-tl-vertical-line" aria-hidden="true" />

                {changesOrdered.length === 0 && (
                  <div className="sep-tl-empty">No edits in history</div>
                )}

                {changesOrdered.map((item, idx) => {
                  const oldPts = item?.changes?.points?.old ?? "—";
                  const newPts = item?.changes?.points?.new ?? "—";
                  const changedBy = formatName(item.changed_by);
                  const changedAt = item.changed_at ? new Date(item.changed_at).toLocaleString() : "—";

                  return (
                    <div className="sep-tl-timeline-item" key={idx}>
                      <div className="sep-tl-timeline-dot" aria-hidden="true" />
                      <div className="sep-tl-timeline-card">
                        <div className="sep-tl-card-row">
                          <strong>Edited By:</strong>&nbsp;{changedBy}
                        </div>
                        <div className="sep-tl-card-row">
                          <strong>Edited At:</strong>&nbsp;{changedAt}
                        </div>
                        <div className="sep-tl-card-row">
                          <strong>Points:</strong>&nbsp;{oldPts} → {newPts}
                        </div>
                        {item?.admin_reason && (
                          <div className="sep-tl-card-row">
                            <strong>Admin Reason:</strong>&nbsp;{item.admin_reason}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
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
