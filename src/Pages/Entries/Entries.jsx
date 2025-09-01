import { useEffect, useState } from "react";
import { useAuth } from "../../Utils/AuthContext";
import { createEntriesApi, getAllEntriesApi } from "../../Apis/EntriesApi";
import RequestModal from "../../Components/RequestModal.jsx/RequestModal";
import { FaTrashRestore } from "react-icons/fa";
import { reverseEntryApi } from "../../Apis/EntriesApi";
import "./style.css";

const API_URL = "/point-entries/";

const Entries = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal,setShowModal] = useState(false)

  // filters
  const [type, setType] = useState("");
  const [operation, setOperation] = useState("");
  const [ordering, setOrdering] = useState("");
  const [employee, setEmployee] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // pagination
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [count, setCount] = useState(0);

  // filter employees from current entries
  const filteredEmployees = entries
    .map((e) => e.employee)
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
    fetchEntries(API_URL);
  }, [user, type, operation, ordering, employee]);

  const fetchEntries = async (url) => {
    try {
      setLoading(true);

      let query = "";
      if (type) query += `&type=${type}`;
      if (operation) query += `&operation=${operation}`;
      if (ordering) query += `&ordering=${ordering}`;
      if (user?.role === "ADMIN" && employee) query += `&employee=${employee}`;

      const finalUrl = url.includes("?")
        ? url
        : `${url}?${query.startsWith("&") ? query.slice(1) : query}`;

      const res = await getAllEntriesApi(finalUrl);

      setEntries(res.data.results);
      setCount(res.data.count);
      setNextUrl(res.data.next);
      setPrevUrl(res.data.previous);
    } catch (err) {
      console.error("Error fetching entries:", err);
    } finally {
      setLoading(false);
    }
  };
  const hanldeReverseEntry = async(id) => {
    try{
      const res = await reverseEntryApi(id);
      console.log(res);
      await fetchEntries(API_URL);
      setType("");
      setOrdering("");
      setEmployee("");
      setEmployeeSearch("")

    }catch(err){
      console.log(err)
    }
  }
  if (!user) {
    return <p className="loading">Loading user...</p>;
  }

  return (
    <div className="entries-container">
      {/* Header */}
      <div className="entries-header">
        <h2 className="title">Point Entries</h2>
        <div className="header-actions" >
            { user && user.role === "ADMIN" && <button className="creat-entry-btn" onClick={() => setShowModal(true)}>
                Create Entry
            </button>}
          <button
            className="refresh-btn"
            onClick={() => {
              setType("");
              setOperation("");
              setOrdering("-created_at");
              setEmployee("");
              setEmployeeSearch("");
              fetchEntries(API_URL);
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="MERIT">Merit</option>
          <option value="DEMERIT">Demerit</option>
        </select>

        <select
          value={operation}
          onChange={(e) => setOperation(e.target.value)}
        >
          <option value="">All Operations</option>
          <option value="GRANT">Grant</option>
          <option value="REVOKE">Revoke</option>
        </select>

        <select value={ordering} onChange={(e) => setOrdering(e.target.value)}>
          <option value="-created_at">Newest First</option>
          <option value="created_at">Oldest First</option>
          <option value="-updated_at">Recently Updated</option>
          <option value="updated_at">Oldest Update</option>
        </select>

        {user?.role === "ADMIN" && (
          <div className="employee-filter">
            <input
              type="text"
              placeholder="Search employee in entries..."
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
              <ul className="suggestions-list">
                {uniqueEmployees.length === 0 ? (
                  <li className="no-results">No employees found</li>
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
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <p className="loading">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="no-entries">No entries found.</p>
        ) : (
          <table className="entries-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Operation</th>
                <th>Employee</th>
                <th>Points</th>
                <th>Reason</th>
                <th>Created By</th>
                <th>Created</th>
                <th>Updated</th>
                {user.role === "ADMIN" && <th>action</th>}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.type}</td>
                  <td>
                    <span
                      className={`operation-tag ${entry.operation.toLowerCase()}`}
                    >
                      {entry.operation}
                    </span>
                  </td>
                  <td>
                    {entry.employee?.first_name} {entry.employee?.last_name}
                  </td>
                  <td>{entry.points}</td>
                  <td className="reason-cell">{entry.reason}</td>
                  <td>
                    {entry.created_by?.first_name}{" "}
                    {entry.created_by?.last_name}
                  </td>
                  <td>{new Date(entry.created_at).toLocaleString()}</td>
                  <td>{new Date(entry.updated_at).toLocaleString()}</td>
                  <td 
                  onClick={() => hanldeReverseEntry(entry.id)}
                  title="revoke" style={{"cursor" : "pointer", display:"flex","justifyContent" : "center","alignItems" : "center"}}>{user.role === 'ADMIN' && <FaTrashRestore size={18} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <p className="pagination-info">
          Showing {entries.length} of {count} entries
        </p>
        <div className="pagination-buttons">
          <button
            disabled={!prevUrl}
            onClick={() => fetchEntries(prevUrl)}
            className="pagination-btn"
          >
            ← Prev
          </button>
          <button
            disabled={!nextUrl}
            onClick={() => fetchEntries(nextUrl)}
            className="pagination-btn"
          >
            Next →
          </button>
        </div>
      </div>
      {showModal 
      && <RequestModal 
      postApi={createEntriesApi}
      getApi= {() => getAllEntriesApi(API_URL)}
      onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default Entries;
