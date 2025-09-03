import React, { useEffect, useState } from "react";
import axios from "axios";
import axiosInstance from "../../Apis/axiosInstance";
import "./style.css"; // Changed to normal CSS

const PointsTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderBy, setOrderBy] = useState("-net_points"); // default ordering
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPoints = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/points-aggregates/?ordering=${orderBy}`
      );
      setData(res.data.results || []);
    } catch (err) {
      console.error("Error fetching points:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, [orderBy]);

  const filteredData = data.filter((item) => {
    const fullName = `${item.employee.first_name} ${item.employee.last_name}`.toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      item.employee.company_email
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="points-table-container"> {/* Changed class name */}
      <h2 className="points-table-title">Points</h2> {/* Changed class name */}

      {/* Controls */}
      <div className="controls">
        <select
          value={orderBy}
          onChange={(e) => setOrderBy(e.target.value)}
          className="order-select"
        >
          <option value="-net_points">Net Points (High → Low)</option>
          <option value="net_points">Net Points (Low → High)</option>
          <option value="-total_merit">Merit (High → Low)</option>
          <option value="total_merit">Merit (Low → High)</option>
          <option value="-total_demerit">Demerit (High → Low)</option>
          <option value="total_demerit">Demerit (Low → High)</option>
        </select>

        <input
          type="text"
          placeholder="Search employee..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <p className="loading">Loading...</p>
        ) : (
          <table className="points-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Email</th>
                <th>Department</th>
                <th>Total Merit</th>
                <th>Total Demerit</th>
                <th>Net Points</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.employee.first_name} {item.employee.last_name}
                    </td>
                    <td>{item.employee?.company_email ?? "-"}</td>
                    <td>{item.employee.department?.dept_name ?? "-"}</td>
                    <td className="merit">{item?.total_merit ?? "-"}</td>
                    <td className="demerit">{item?.total_demerit ?? "-"}</td>
                    <td className="net">{item?.net_points ?? "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    No matching records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PointsTable;