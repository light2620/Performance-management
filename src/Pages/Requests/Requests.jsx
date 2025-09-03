import { useEffect, useState } from "react";
import { useAuth } from "../../Utils/AuthContext";
import {
  getAllrequest,
  approveRequestApi,
  rejectRequestApi,
  deleteRequestApi,
  createRequestApi,
} from "../../Apis/pointRequestApi";
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
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // pagination
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [count, setCount] = useState(0);

  // filter employees
  const filteredEmployees = requests
    .map((req) => req.employee)
    .filter(
      (emp) =>
        emp &&
        `${emp.first_name} ${emp.last_name}`
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

      setLastUrl(finalUrl);

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
      fetchRequests(lastUrl);
    } catch (err) {
      console.log(err);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectRequestApi(id);
      fetchRequests(lastUrl);
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteRequestApi(id);
      fetchRequests(lastUrl);
    } catch (err) {
      console.log(err);
    }
  };

  if (!user) {
    return <p className="requestsComp-loading">Loading user...</p>;
  }

  return (
    <div className="requestsComp-container">
      {/* Header */}
      <div className="requestsComp-header">
        <h2 className="requestsComp-title">Point Requests</h2>
        <div className="requestsComp-actions">
          {user?.role === "EMPLOYEE" && (
            <button
              className="requestsComp-createBtn"
              onClick={() => setIsModalOpen(true)}
            >
              + New Request
            </button>
          )}
          <button
            className="requestsComp-refreshBtn"
            onClick={() => {
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
      <div className="requestsComp-filters">
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

        <div className="requestsComp-employeeFilter">
          <input
            type="text"
            placeholder="Search employee in requests..."
            value={employeeSearch}
            onChange={(e) => {
              const value = e.target.value;
              setEmployeeSearch(value);
              setShowSuggestions(true);
              if (value.trim() === "") {
                setEmployee("");
              }
            }}
            onFocus={() => setShowSuggestions(true)}
          />
          {showSuggestions && employeeSearch && (
            <ul className="requestsComp-suggestions">
              {uniqueEmployees.length === 0 ? (
                <li className="requestsComp-noResults">No employees found</li>
              ) : (
                uniqueEmployees.map((emp) => (
                  <li
                    key={emp.id}
                    onClick={() => {
                      setEmployee(emp.id);
                      setEmployeeSearch(
                        `${emp.first_name} ${emp.last_name}`
                      );
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
      <div className="requestsComp-tableWrapper">
        {loading ? (
          <p className="requestsComp-loading">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="requestsComp-noRequests">No requests found.</p>
        ) : (
          <div className="requestsComp-tableScroll">
            <table className="requestsComp-table">
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
              <tbody className="requestsComp-body">
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.type}</td>
                    <td>
                      <span
                        className={`requestsComp-status ${req.status.toLowerCase()}`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td>
                      {req.employee?.first_name} {req.employee?.last_name}
                    </td>
                    <td>{req.points}</td>
                    <td className="requestsComp-reason">{req.reason}</td>
                    <td>{new Date(req.created_at).toLocaleString()}</td>
                    <td>{new Date(req.updated_at).toLocaleString()}</td>
                    <td className="requestsComp-actionsCell">
                      {req.status === "APPROVED" ||
                      req.status === "CANCELLED" ||
                      req.status === "REJECTED" ? (
                        <p>No action required</p>
                      ) : user?.role === "ADMIN" ? (
                        <>
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="requestsComp-approveBtn"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            className="requestsComp-rejectBtn"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleDelete(req.id)}
                            className="requestsComp-deleteBtn"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="requestsComp-deleteBtn"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="requestsComp-pagination">
        <p>
          Showing {requests.length} of {count} requests
        </p>
        <div className="requestsComp-pageBtns">
          <button
            disabled={!prevUrl}
            onClick={() => fetchRequests(prevUrl)}
          >
            ← Prev
          </button>
          <button
            disabled={!nextUrl}
            onClick={() => fetchRequests(nextUrl)}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <RequestModal
          onClose={() => setIsModalOpen(false)}
          getApi={() => fetchRequests(API_URL)}
          postApi={createRequestApi}
        />
      )}
    </div>
  );
};

export default Requests;
