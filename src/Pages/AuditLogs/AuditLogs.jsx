import React, { useEffect, useState } from "react";
import axiosInstance from "../../Apis/axiosInstance";
import { tokenService } from "../../Apis/tokenService";
import "./style.css";

const API_BASE = "/audit-logs/my-activity/";

const MyActivity = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ordering, setOrdering] = useState("");
  const [action, setAction] = useState("");
  const [error, setError] = useState("");

  const fetchActivities = async () => {
    setLoading(true);
    setError("");
    try {
      const token = tokenService.getAccess
        ? tokenService.getAccess()
        : tokenService.get?.();

      const params = new URLSearchParams();
      if (action) params.append("action", action);
      if (ordering) params.append("ordering", ordering);

      const res = await axiosInstance.get(`${API_BASE}?${params.toString()}`);

      setRows(res.data.results || []);
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError("Failed to load activities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [action, ordering]);

  return (
    <div className="activity-wrapper">
      <h2>My Activity</h2>

      <div className="activity-toolbar">
        <select value={action} onChange={(e) => setAction(e.target.value)}>
          <option value="">All Actions</option>
          <option value="MERIT_ADD">Merit Added</option>
          <option value="DEMERIT_ADD">Demerit Added</option>
          <option value="REQUEST_ADD">Request Submitted</option>
        </select>

        <select value={ordering} onChange={(e) => setOrdering(e.target.value)}>
          <option value="-created_at">Newest First</option>
          <option value="created_at">Oldest First</option>
        </select>

        <button className="refresh-btn" onClick={fetchActivities}>
          Refresh
        </button>
      </div>

      <div className="activity-table-card">
        <div className="activity-table-scroll">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Actor</th>
                <th>Target</th>
                <th>Details</th>
                <th>Created</th>
                <th>IP Address</th>
                <th>User Agent</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="center muted">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={7} className="center error">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="center muted">
                    No activity found.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                rows.map((a) => (
                  <tr key={a.id}>
                    <td>{a.action_display}</td>
                    <td>
                      {a.actor?.first_name} {a.actor?.last_name}
                    </td>
                    <td>
                      {a.target?.first_name} {a.target?.last_name}
                    </td>
                    <td>
                      {a.details?.points && (
                        <span className="pill">{a.details.points} pts</span>
                      )}
                     {a.details?.type && (
  <span
    className={`pill ${
      a.details.type === "MERIT" ? "pill-merit" : "pill-demerit"
    }`}
  >
    {a.details.type}
  </span>
)}
                      <br />
                      <span className="muted">{a.details?.reason}</span>
                    </td>
                    <td>
                      {new Date(a.created_at).toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>{a.ip_address}</td>
                    <td className="muted">{a.user_agent}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MyActivity;
