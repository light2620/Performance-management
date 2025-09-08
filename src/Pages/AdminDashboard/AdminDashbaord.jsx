// AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { getAllUserApi } from "../../Apis/UserApi";
import { getAllrequest } from "../../Apis/pointRequestApi";
import axiosInstance from "../../Apis/axiosInstance"; // adjust path if needed
import PointsTable from "../All Points/AllPoints"; // adjust path if needed
import { useNavigate } from "react-router-dom";
import {
  FiUsers,
  FiLayers,
  FiClock,
  FiBarChart2,
  FiCheckCircle,
  FiXCircle,
  FiPauseCircle,
} from "react-icons/fi";
import "./style.css";

/* Big colorful stat card */
const BigStatCard = ({ colorClass, label, value, sub, icon }) => (
  <div className={`big-stat-card ${colorClass}`}>
    <div className="big-stat-inner">
      <div className="big-stat-icon">{icon}</div>
      <div className="big-stat-value">{value}</div>
      <div className="big-stat-label">{label}</div>
      {sub && <div className="big-stat-sub">{sub}</div>}
    </div>
  </div>
);

/* User row */
const UserRow = ({ user, rank }) => {
  const points = user.net_points ?? user.netPoints ?? 0;
  const name =
    (user.first_name || user.employee?.first_name || "") +
    " " +
    (user.last_name || user.employee?.last_name || "");
  const email =
    user.company_email || user.employee?.company_email || user.email || "";
  return (
    <div className="user-row">
      <div className="user-left">
        <div className="user-rank">{rank}</div>
        <div className="user-info">
          <div className="user-name">{name.trim() || "Unknown"}</div>
          <div className="user-email">{email}</div>
        </div>
      </div>
      <div className="user-points">{points}</div>
    </div>
  );
};

/* Status tag */
const StatusTag = ({ status }) => {
  const map = {
    PENDING: { color: "tag-pending", icon: <FiPauseCircle /> },
    APPROVED: { color: "tag-approved", icon: <FiCheckCircle /> },
    REJECTED: { color: "tag-rejected", icon: <FiXCircle /> },
  };
  const { color, icon } = map[status] || { color: "tag-pending", icon: "?" };
  return (
    <span className={`status-tag ${color}`}>
      {icon}
      {status}
    </span>
  );
};

/* Recent request row */
const RequestRow = ({ req,navigate }) => (
  <div className="request-row" onClick={()=> {navigate(`/requests/${req.id}`)}}>
    <div>
      <div className="request-title">
        {req.employee?.first_name} {req.employee?.last_name}
      </div>
      <div className="request-email">{req.employee?.company_email}</div>
    </div>
    <StatusTag status={req.status} />
  </div>
);

export default function AdminDashboard() {
  const departments =
    useSelector((state) => state.department?.departments) || [];
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pointsAgg, setPointsAgg] = useState([]);
  const [loading, setLoading] = useState({
    users: false,
    requests: false,
    points: false,
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchAllUsers = async () => {
    setLoading((s) => ({ ...s, users: true }));
    try {
      const response = await getAllUserApi();
      setUsers(response?.data?.results ?? []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading((s) => ({ ...s, users: false }));
    }
  };

  const fetchAllRequests = async () => {
    setLoading((s) => ({ ...s, requests: true }));
    try {
      const res = await getAllrequest("/point-requests/");
      setRequests(res?.data?.results ?? []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading((s) => ({ ...s, requests: false }));
    }
  };

  const fetchPointsAgg = async () => {
    setLoading((s) => ({ ...s, points: true }));
    try {
      const res = await axiosInstance.get(`/points-aggregates`);
      setPointsAgg(res?.data?.results ?? []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading((s) => ({ ...s, points: false }));
    }
  };

  useEffect(() => {
    fetchAllUsers();
    fetchAllRequests();
    fetchPointsAgg();
  }, []);

  const totalUsers = users.length;
  const totalDepartments = departments.length;
  const pendingRequestsCount = requests.filter(
    (r) => r.status === "PENDING"
  ).length;

  const source = pointsAgg.length ? pointsAgg : users;
  const sortedByPoints = source
    .slice()
    .sort(
      (a, b) =>
        (b.net_points ?? b.netPoints ?? 0) -
        (a.net_points ?? a.netPoints ?? 0)
    );
  const topFive = sortedByPoints.slice(0, 5);
  const bottomFive = sortedByPoints.slice(-5).reverse();

  const aggregatesCountDisplay = 3;

  // requests by status counts
  const statusCounts = {
    PENDING: requests.filter((r) => r.status === "PENDING").length,
    APPROVED: requests.filter((r) => r.status === "APPROVED").length,
    REJECTED: requests.filter((r) => r.status === "REJECTED").length,
  };

  return (
        <div className="admin-dashboard colorful">
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
      </div>

      {/* Big colorful stat cards */}
      <div className="big-stats-grid">
        <BigStatCard
          colorClass="c-blue"
          label="Total Users"
          value={loading.users ? "…" : totalUsers}
          sub="Active accounts"
          icon={<FiUsers />}
        />
        <BigStatCard
          colorClass="c-green"
          label="Departments"
          value={totalDepartments}
          sub="Teams & units"
          icon={<FiLayers />}
        />
        <BigStatCard
          colorClass="c-orange"
          label="Pending Requests"
          value={loading.requests ? "…" : pendingRequestsCount}
          sub="Needs review"
          icon={<FiClock />}
        />
      </div>

      {/* NEW: Four cards in one row */}
      <div className="grid-row-4">
        <section className="card medium-card">
          <h3 className="section-title">Top 5 Users</h3>
          {topFive.length === 0 ? (
            <div className="placeholder">No data</div>
          ) : (
            <div className="list">
              {topFive.map((u, idx) => (
                <UserRow key={u.id ?? idx} user={u} rank={idx + 1} />
              ))}
            </div>
          )}
        </section>

        <section className="card medium-card">
          <h3 className="section-title">Bottom 5 Users</h3>
          {bottomFive.length === 0 ? (
            <div className="placeholder">No data</div>
          ) : (
            <div className="list">
              {bottomFive.map((u, idx) => (
                <UserRow key={u.id ?? idx} user={u} rank={idx + 1} />
              ))}
            </div>
          )}
        </section>

        <section className="card medium-card">
          <h3 className="section-title">Recent Activity</h3>
          {requests.length === 0 ? (
            <div className="placeholder">No requests</div>
          ) : (
            <div className="list" style={{cursor:"pointer"}}>
              {requests.slice(0, 5).map((req) => (
                <RequestRow key={req.id} req={req} navigate={navigate}  />
              ))}
            </div>
          )}
        </section>


      </div>

      <div className="card table-card">
        <h3 className="section-title">Points Aggregates</h3>
        <PointsTable data={pointsAgg} />
      </div>

      {error && <div className="error">Error loading data</div>}
    </div>
  );
}
