import { useEffect, useState } from "react";
import { useAuth } from "../../Utils/AuthContext";
import { getAllrequest,approveRequestApi,rejectRequestApi,deleteRequestApi } from "../../Apis/pointRequestApi";
import { IoCheckmarkDoneSharp } from "react-icons/io5";
import { createRequestApi } from "../../Apis/pointRequestApi";
import RequestModal from "../../Components/RequestModal.jsx/RequestModal";


import "./style.css";

const API_URL = "/point-requests/";

const Requests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastUrl, setLastUrl] = useState(API_URL);

  // filters
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [employee, setEmployee] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState(""); // input value
const [showSuggestions, setShowSuggestions] = useState(false);

  // pagination
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [count, setCount] = useState(0);
const filteredEmployees = requests
  .map((req) => req.employee) // take employees from requests
  .filter((emp) => emp && `${emp.first_name} ${emp.last_name}`
    .toLowerCase()
    .includes(employeeSearch.toLowerCase())
  );

  const uniqueEmployees = Array.from(
  new Map(filteredEmployees.map((e) => [e.id, e])).values()
);
  

  useEffect(() => {
    if (!user) return;
    fetchRequests(API_URL);
  }, [user, status, type, ordering, employee]);

 const fetchRequests = async (url) => {
  try {
    setLoading(true);

    let query = "";
    if (status) query += `&status=${status}`;
    if (type) query += `&type=${type}`;
    if (ordering) query += `&ordering=${ordering}`;
    if (user?.role === "ADMIN" && employee) query += `&employee=${employee}`;

    const finalUrl = url.includes("?")
      ? url
      : `${url}?${query.startsWith("&") ? query.slice(1) : query}`;

    setLastUrl(finalUrl); // ✅ save last used url

    const res = await getAllrequest(finalUrl);

    setRequests(res.data.results);
    setCount(res.data.count);
    setNextUrl(res.data.next);
    setPrevUrl(res.data.previous);
  } catch (err) {
    console.error("Error fetching requests:", err);
  } finally {
    setLoading(false);
  }
};

const handleApprove = async (id) => {
  try {
    await approveRequestApi(id);
    fetchRequests(lastUrl); // ✅ refresh with same filters/pagination
  } catch (err) {
    console.log(err);
  }
};

const handleReject = async (id) => {
  try {
    await rejectRequestApi(id);
    fetchRequests(lastUrl); // ✅ refresh
  } catch (err) {
    console.log(err);
  }
};

const handleDelete = async (id) => {
  try {
    await deleteRequestApi(id);
    fetchRequests(lastUrl); // ✅ refresh
  } catch (err) {
    console.log(err);
  }
};

  if (!user) {
    return <p className="loading">Loading user...</p>;
  }

  return (
    <div className="requests-container">
      {/* Header */}
      <div className="requests-header">
        <h2 className="title">Point Requests</h2>
        <div className="header-actions">
       { user && user.role === "EMPLOYEE" && <button className="create-btn" onClick={() => setIsModalOpen(true)}>
            + New Request
          </button> }
          
         <button
  className="refresh-btn"
  onClick={() => {
    // ✅ reset all filters
    setStatus("");
    setType("");
    setOrdering("-created_at");
    setEmployee("");
    setEmployeeSearch("");
    fetchRequests(API_URL);
  }}
>
  Refresh
</button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="MERIT">Merit</option>
          <option value="DEMERIT">Demerit</option>
        </select>

        <select value={ordering} onChange={(e) => setOrdering(e.target.value)}>
          <option value="-created_at">Newest First</option>
          <option value="created_at">Oldest First</option>
          <option value="-updated_at">Recently Updated</option>
          <option value="updated_at">Oldest Update</option>
        </select>

        <div className="employee-filter">
      <input
  type="text"
  placeholder="Search employee in requests..."
  value={employeeSearch}
  onChange={(e) => {
    const value = e.target.value;
    setEmployeeSearch(value);
    setShowSuggestions(true);

    if (value.trim() === "") {
      // ✅ reset employee filter when cleared
      setEmployee("");
    }
  }}
  onFocus={() => setShowSuggestions(true)}
/>

      {showSuggestions && employeeSearch && (
        <ul className="suggestions-list">
          {uniqueEmployees.length === 0 ? (
            <li className="no-results">No employees found</li>
          ) : (
            uniqueEmployees.map((emp) => (
             <li
  key={emp.id}
  onClick={() => {
    setEmployee(emp.id); // store UUID for backend filter
    setEmployeeSearch(`${emp.first_name} ${emp.last_name}`);
    setShowSuggestions(false);
  }}
>
  {emp.first_name} {emp.last_name}
  {emp.company_email && (
    <small> ({emp.company_email})</small>
  )}
</li>
            ))
          )}
        </ul>
      )}
    </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <p className="loading">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="no-requests">No requests found.</p>
        ) : (
          <table className="requests-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Status</th>
                <th>Employee</th>
                <th>Points</th>
                <th>Reason</th>
                <th>Created</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="request-table-body">
              {requests.map((req) => (
                <tr key={req.id}>
                  <td>{req.type}</td>
                  <td>
                    <span className={`status-tag ${req.status.toLowerCase()}`}>
                      {req.status}
                    </span>
                  </td>
                  <td>
                    {req.employee?.first_name} {req.employee?.last_name}
                  </td>
                  <td>{req.points}</td>
                  <td className="reason-cell">{req.reason}</td>
                  <td>{new Date(req.created_at).toLocaleString()}</td>
                  <td>{new Date(req.updated_at).toLocaleString()}</td>
                  {
                    req.status === 'APPROVED' || req.status === 'CANCELLED' ? 
                    <td style={{"text-align": "center"}}><p>No action required</p></td> : <td className="actions" style={{display:"flex","flex-direction" : "column", }}>
                    {user?.role === "ADMIN" ? (
                      <>
                        <button 
                        onClick={() => handleApprove(req.id)}
                        className="approve-btn">Approve</button>
                        <button 
                        onClick={() => handleReject(req.id)}
                        className="reject-btn">Reject</button>
                        <button 
                        onClick={() => handleDelete(req.id)}
                        className="delete-btn">Delete</button>
                      </>
                    ) : (
                      <button 
                      onClick={() => handleDelete(req.id)}
                      className="delete-btn">Delete</button>
                    )}
                  </td>
                  }
                  
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <p className="pagination-info">
          Showing {requests.length} of {count} requests
        </p>
        <div className="pagination-buttons">
          <button
            disabled={!prevUrl}
            onClick={() => fetchRequests(prevUrl)}
            className="pagination-btn"
          >
            ← Prev
          </button>
          <button
            disabled={!nextUrl}
            onClick={() => fetchRequests(nextUrl)}
            className="pagination-btn"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && 
      <RequestModal 
          onClose={() => setIsModalOpen(false)} 
          getApi={() => fetchRequests(API_URL)}
          postApi={createRequestApi}
          />}
    </div>
  );
};

export default Requests;
