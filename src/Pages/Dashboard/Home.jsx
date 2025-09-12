// Home.jsx (updated)
import React, { useEffect, useState, useCallback } from "react";
import Merit from "../../Components/Performance/Merit";
import Demerit from "../../Components/Performance/Demerit";
import "./style.css";
import QuickAction from "../../Components/QuickAction/QuickAction";
import { getPerformanceApi } from "../../Apis/Points";
import TotalPoints from "../../Components/Performance/TotalPoints";
import { useAuth } from "../../Utils/AuthContext";
import NotificationListener from "../../Components/NotificationListener/NotificationListener";
import SetupWebSocket from "../../Components/Test";
import { getAllConversationsApi } from "../../Apis/CreateConversation";
import axiosInstance from "../../Apis/axiosInstance";
import { FaTrophy } from "react-icons/fa";
import { IoSparkles } from "react-icons/io5";
import { FaExclamationCircle } from "react-icons/fa";
import { FaMessage } from "react-icons/fa6";
import PointHistoryChart from "../../Components/PointHistoryComposedChart/PointHistoryComposedChart";
// Small Big Stat card used on the home page
const BigStatCard = ({ colorClass, label, value, sub, icon }) => (
  <div className={`home-big-stat-card ${colorClass}`}>
    <div className="home-big-stat-inner">
      <div className="home-big-stat-icon">{icon}</div>
      <div className="home-big-stat-value">{value}</div>
      <div className="home-big-stat-label">{label}</div>
      {sub && <div className="home-big-stat-sub">{sub}</div>}
    </div>
  </div>
);

const Home = () => {
  const [performance, setPerformance] = useState({
    totalPoints: "",
    merits: "",
    demerits: "",
  });
  const { user } = useAuth();
  const [activeTickets, setActiveTickets] = useState(0);
  const [loading, setLoading] = useState({ perf: false, conv: false, points: false });


  const fetchPerformancePoint = useCallback(async () => {
    setLoading((s) => ({ ...s, perf: true }));
    try {
      const res = await getPerformanceApi();
      setPerformance({
        totalPoints: res.data.net_points,
        merits: res.data.total_merit,
        demerits: res.data.total_demerit,
      });
    } catch (err) {
      console.log("fetchPerformancePoint:", err);
    } finally {
      setLoading((s) => ({ ...s, perf: false }));
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    setLoading((s) => ({ ...s, conv: true }));
    try {
      const res = await getAllConversationsApi();
      const results = res?.data?.results ?? [];
      const activeCount = results.filter((c) => c.is_active === true).length;
      setActiveTickets(activeCount);
    } catch (err) {
      console.error("fetchConversations:", err);
    } finally {
      setLoading((s) => ({ ...s, conv: false }));
    }
  }, []);


  useEffect(() => {
    fetchPerformancePoint();
    fetchConversations();
  }, [fetchPerformancePoint, fetchConversations]);

  // Pick a default entry ID for the chart:
  // prefer the first pointsAgg item (if it looks like an entry); otherwise null.
  // If your points-aggregates items are user records, replace this with the specific entry id you want to plot.

  return (
    <div className="home-admin-dashboard home-home-dashboard">
      <div className="home-dashboard-header">
        <h2>Welcome back, {user?.first_name}</h2>
        <p className="home-muted">Track your performance & team overview</p>
      </div>

      <div className="home-big-stats-grid">
        <BigStatCard
          colorClass="home-c-blue"
          label="Total Points"
          value={loading.perf ? "…" : performance.totalPoints ?? 0}
          sub="Your current net points"
          icon={<FaTrophy />}
        />
        <BigStatCard
          colorClass="home-c-green"
          label="Merits"
          value={loading.perf ? "…" : performance.merits ?? 0}
          sub="Positive actions"
          icon={<IoSparkles />}
        />
        <BigStatCard
          colorClass="home-c-orange"
          label="Demerits"
          value={loading.perf ? "…" : performance.demerits ?? 0}
          sub="Negative actions"
          icon={<FaExclamationCircle />}
        />
        <BigStatCard
          colorClass="home-c-purple"
          label="Active Tickets"
          value={loading.conv ? "…" : activeTickets}
          sub="Open conversations"
          icon={<FaMessage />}
        />
      </div>

      {/* Chart area */}
      <div className="home-card" style={{ marginTop: 12 }}>
        <h3 className="home-section-title">Point history</h3>
        {user.id ? (
          <PointHistoryChart entryId={user.id} height={340} />
        ) : (
          <div className="home-placeholder">No entry selected to plot history (points-aggregates empty).</div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <NotificationListener />
        <SetupWebSocket />
      </div>
    </div>
  );
};

export default Home;
