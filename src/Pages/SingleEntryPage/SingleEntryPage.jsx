import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getSingleEntryApi,
  reverseEntryApi,
  getAllEntriesApi,
} from "../../Apis/EntriesApi";
import ConfirmModal from "../../Components/ConfirmModal/ConfirmModal";
import { useAuth } from "../../Utils/AuthContext";
import "./style.css";

const API_URL = "/point-entries/";

const SingleEntryPage = () => {
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

   const fetchSingleEntry = async () => {
      try {
        const res = await getSingleEntryApi(id);
        setEntry(res.data);
      } catch (err) {
        console.error("Fetch entry error:", err);
      } finally {
        setLoading(false);
      }
    };
  useEffect(() => {
   
    fetchSingleEntry();
  }, [id]);

  const markReversedLocally = () => {
    setEntry((prev) =>
      prev
        ? { ...prev, operation: "REVERSED", updated_at: new Date().toISOString() }
        : prev
    );
  };

  const operationToStatusClass = (op) => {
    if (!op) return "entry-status-pending";
    const key = String(op).toUpperCase();
    if (key === "GRANT") return "entry-status-approved";
    if (key === "REVERSE" || key === "REVOKE" || key === "REVERSED")
      return "entry-status-rejected";
    return "entry-status-pending";
  };

  const handleReverse = (entryId) => {
    setConfirmModal({
      open: true,
      title: "Reverse Entry",
      message:
        "Are you sure you want to reverse this entry? This will undo the granted points.",
      action: async () => {
        setBusy(true);
        try {
          await reverseEntryApi(entryId);
          await getAllEntriesApi(API_URL);
          await fetchSingleEntry();

          alert("↩️ Entry reversed");
        } catch (err) {
          console.error("Reverse failed:", err);
          alert("Failed to reverse entry");
        } finally {
          setBusy(false);
        }
      },
    });
  };

  if (loading) return <div className="single-entry-page">Loading…</div>;
  if (!entry) return <div className="single-entry-page">Entry not found</div>;

  const initials = (first, last) => {
    const a = first?.[0] ?? "";
    const b = last?.[0] ?? "";
    return (a + b).toUpperCase();
  };

  const statusClass = operationToStatusClass(entry.operation);

  const creatorEmail =
    entry.created_by?.company_email ??
    entry.created_by?.personal_email ??
    "—";
  const creatorDept =
    entry.created_by?.department?.dept_name ??
    entry.created_by?.department ??
    "—";

  return (
    <div className="single-entry-page">
      <div className={`entry-card lively ${statusClass}`}>
        <div className="entry-left-accent" aria-hidden />

        <header className="entry-card-header">
          <div className="entry-title-block">
            <h1 className="entry-type">
              {entry.type?.toUpperCase() ?? (entry.operation ?? "ENTRY")}
            </h1>

            <div
              className={`entry-big-status ${statusClass.replace(
                "entry-status-",
                ""
              )}`}
            >
              <span className="status-emoji">
                {entry.operation &&
                entry.operation.toUpperCase() === "GRANT"
                  ? "✅"
                  : entry.operation &&
                    (entry.operation.toUpperCase() === "REVERSE" ||
                      entry.operation.toUpperCase() === "REVERSED")
                  ? "↩️"
                  : "ℹ️"}
              </span>
              <span className="status-text">{entry.operation ?? "—"}</span>
            </div>
          </div>

          <div className="entry-meta-block">
            {isAdmin && (
              <div className="entry-for-block">
                <div className="entry-avatar entry-avatar-employee">
                  {initials(
                    entry.employee?.first_name,
                    entry.employee?.last_name
                  )}
                </div>
                <div className="entry-who">
                  <div className="entry-who-label">Created for</div>
                  <div className="entry-who-value">
                    {entry.employee?.first_name} {entry.employee?.last_name}
                  </div>
                </div>
              </div>
            )}

            <div className="entry-by-block">
              <div className="entry-avatar entry-avatar-creator">
                {initials(
                  entry.created_by?.first_name,
                  entry.created_by?.last_name
                )}
              </div>
              <div className="entry-who">
                <div className="entry-who-label">Created by</div>
                <div className="entry-who-value">
                  {entry.created_by?.first_name} {entry.created_by?.last_name}
                </div>
                <div className="entry-who-sub">
                  <span className="entry-who-email">{creatorEmail}</span>
                  <span className="entry-who-dept">{creatorDept}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="entry-body">
          <div className="entry-left-column">
            <div className="entry-points-pill">
              Points <strong>{entry.points}</strong>
            </div>

            <div className="entry-reason-box">
              <div className="entry-reason-title">Note / Reason</div>
              <div className="entry-reason-content">
                {entry.reason || "— No reason provided —"}
              </div>
            </div>

            <div className="entry-timestamps">
              <div className="entry-ts-row">
                <div className="entry-ts-label">Created</div>
                <div className="entry-ts-value">
                  {new Date(entry.created_at).toLocaleString()}
                </div>
              </div>
              <div className="entry-ts-row">
                <div className="entry-ts-label">Updated</div>
                <div className="entry-ts-value">
                  {new Date(
                    entry.updated_at || entry.created_at
                  ).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <aside className="entry-right-column">
            <div className="entry-additional-card">
              <div className="entry-add-title">Entry Details</div>
              <div className="entry-add-row">
                <span className="k">Type</span>
                <span className="v">{entry.type ?? "—"}</span>
              </div>
              <div className="entry-add-row">
                <span className="k">Operation</span>
                <span className="v">{entry.operation ?? "—"}</span>
              </div>
              <div className="entry-add-row">
                <span className="k">Original</span>
                <span className="v">
                  {entry.original_entry ? entry.original_entry : "—"}
                </span>
              </div>
            </div>

            <div className="entry-cta-block">
              {isAdmin   && (
                <>
                  <button
                    className="entry-btn reverse"
                    onClick={() => handleReverse(entry.id)}
                    disabled={
                      busy ||
                      String(entry.operation || "").toUpperCase() === "REVERSAL"
                    }
                  >
                    {  String(entry.operation || "").toUpperCase() === "REVERSAL" ? "Entry Reversed" : "Reverse Entry"}
                  </button>
                  <button
                    className="entry-btn back"
                    onClick={() => navigate(-1)}
                    disabled={busy}
                  >
                    ← Back
                  </button>
                </>
              )}
            </div>
          </aside>
        </section>

        <footer className="entry-footer">
          <div className="entry-small-muted">
            Entry ID: <code>{entry.id}</code>
          </div>
          <div className="entry-small-muted">
            Last updated:{" "}
            {new Date(entry.updated_at || entry.created_at).toLocaleString()}
          </div>
        </footer>
      </div>

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

export default SingleEntryPage;
