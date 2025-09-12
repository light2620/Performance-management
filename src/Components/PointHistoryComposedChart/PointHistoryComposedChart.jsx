// PointHistoryChart.jsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../../Apis/axiosInstance";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function PointHistoryChart({ employee, type }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAllEntries = async () => {
    setLoading(true);
    try {
      let url = "/point-entries/";
      const params = { ordering: "created_at" };
      if (employee) params.employee = employee;
      if (type) params.type = type;

      let allResults = [];
      while (url) {
        const res = await axiosInstance.get(url, { params });
        const results = res?.data?.results ?? [];
        allResults = [...allResults, ...results];
        url = res?.data?.next || null;
      }

      // Filter only GRANT operations
      const grants = allResults.filter(
        (e) => (e.operation || "").toUpperCase() === "GRANT"
      );

      // Group by date + type
      const grouped = {};
      grants.forEach((e) => {
        const dateKey = new Date(e.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        if (!grouped[dateKey]) {
          grouped[dateKey] = { time: dateKey, MERIT: 0, DEMERIT: 0 };
        }
        const typeKey = (e.type || "").toUpperCase();
        grouped[dateKey][typeKey] += Number(e.points ?? 0);
      });

      const chartData = Object.values(grouped);
      setData(chartData);
    } catch (err) {
      console.error("Error fetching point entries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee, type]);

  if (loading) return <div>Loading chart…</div>;
  if (!data.length) return <div>No point history available</div>;

  return (
    <div style={{ width: "100%", height: 350 }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis />
          <Tooltip />
          <Legend />
          {/* Separate bars for MERIT (green) and DEMERIT (red) */}
          <Bar dataKey="MERIT" fill="#10b981" barSize={30} />
          <Bar dataKey="DEMERIT" fill="#ef4444" barSize={30} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
