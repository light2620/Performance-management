// CloseReasonModal.jsx
import "./style.css";
import { useState, useEffect } from "react";

export default function CloseReasonModal({ isOpen, defaultReason, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState(defaultReason || "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason(defaultReason || "");
      setError("");
    }
  }, [isOpen, defaultReason]);

  const handleConfirm = () => {
    if (!reason || reason.trim().length < 3) {
      setError("Please provide a valid reason (min 3 characters).");
      return;
    }
    setError("");
    onConfirm(reason.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="close-modal-backdrop" role="dialog" aria-modal="true">
      <div className="close-modal-panel">
        <div className="close-modal-header">
          <h3 className="close-modal-title">Close Conversation</h3>
          <button className="close-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="close-modal-body">
          <label className="close-modal-label">Reason for closing</label>
          <textarea
            className="close-modal-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe why this conversation is being closed (required)"
            rows={5}
            disabled={loading}
          />
          {error && <div className="close-modal-error">{error}</div>}
        </div>

        <div className="close-modal-footer">
          <button className="close-stp-btn close-stp-btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="close-stp-btn close-stp-btn-danger"
            onClick={handleConfirm}
            disabled={loading}
            style={{ marginLeft: 10 }}
          >
            {loading ? "Closing..." : "Confirm Close"}
          </button>
        </div>
      </div>
    </div>
  );
};
