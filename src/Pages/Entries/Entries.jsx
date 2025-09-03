import { useEffect, useState } from "react";
import { useAuth } from "../../Utils/AuthContext";
import { createEntriesApi, getAllEntriesApi, reverseEntryApi } from "../../Apis/EntriesApi";
import RequestModal from "../../Components/RequestModal.jsx/RequestModal";
import { FaTrashRestore } from "react-icons/fa";
import "./style.css";

const API_URL = "/point-entries/";

const Entries = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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

  const handleReverseEntry = async (id) => {
    try {
      await reverseEntryApi(id);
      await fetchEntries(API_URL);
      setType("");
      setOrdering("");
      setEmployee("");
      setEmployeeSearch("");
    } catch (err) {
      console.log(err);
    }
  };

  if (!user) {
    return <p className="entriesComp-loading">Loading user...</p>;
  }

  return (
    <div className="entriesComp-container">
      {/* Header */}
      <div className="entriesComp-header">
        <h2 className="entriesComp-title">Point Entries</h2>
        <div className="entriesComp-actions">
          {user && user.role === "ADMIN" && (
            <button
              className="entriesComp-createBtn"
              onClick={() => setShowModal(true)}
            >
              Create Entry
            </button>
          )}
          <button
            className="entriesComp-refreshBtn"
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
      <div className="entriesComp-filters">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="MERIT">Merit</option>
          <option value="DEMERIT">Demerit</option>
        </select>

        <select value={operation} onChange={(e) => setOperation(e.target.value)}>
          <option value="">All Operations</option>
          <option value="GRANT">Grant</option>
          <option value="REVERSAL">Reversal</option>
        </select>

        <select value={ordering} onChange={(e) => setOrdering(e.target.value)}>
          <option value="-created_at">Newest First</option>
          <option value="created_at">Oldest First</option>
          <option value="-updated_at">Recently Updated</option>
          <option value="updated_at">Oldest Update</option>
        </select>

        {user?.role === "ADMIN" && (
          <div className="entriesComp-employeeFilter">
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
              <ul className="entriesComp-suggestions">
                {uniqueEmployees.length === 0 ? (
                  <li className="entriesComp-noResults">No employees found</li>
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
      <div className="entriesComp-tableWrapper">
        {loading ? (
          <p className="entriesComp-loading">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="entriesComp-noEntries">No entries found.</p>
        ) : (
          <div className="entriesComp-tableScroll">
            <table className="entriesComp-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Operation</th>
                 { user?.role === "ADMIN" && <th>Employee</th>}
                  <th>Points</th>
                  <th>Reason</th>
                  <th>Created By</th>
                  <th>Created</th>
                  <th>Updated</th>
                  {user.role === "ADMIN" && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.type}</td>
                    <td>
                      <span
                        className={`entriesComp-tag ${entry.operation.toLowerCase()}`}
                      >
                        {entry.operation}
                      </span>
                    </td>
                   { user?.role === "ADMIN" && (
                      <td>
                        {entry.employee?.first_name} {entry.employee?.last_name}
                      </td>
                    )}
                    <td>{entry.points}</td>
                    <td className="entriesComp-reason">{entry.reason}</td>
                    <td>
                      {entry.created_by?.first_name}{" "}
                      {entry.created_by?.last_name}
                    </td>
<td>{new Date(entry.created_at).toLocaleDateString()}</td>
<td>{new Date(entry.updated_at).toLocaleDateString()}</td>
                    {user.role === "ADMIN" && (
                      <td
                        onClick={() => handleReverseEntry(entry.id)}
                        className="entriesComp-reverse"
                      >
                        <FaTrashRestore size={18} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="entriesComp-pagination">
        <p>
          Showing {entries.length} of {count} entries
        </p>
        <div className="entriesComp-pageBtns">
          <button
            disabled={!prevUrl}
            onClick={() => fetchEntries(prevUrl)}
          >
            ← Prev
          </button>
          <button
            disabled={!nextUrl}
            onClick={() => fetchEntries(nextUrl)}
          >
            Next →
          </button>
        </div>
      </div>

      {showModal && (
        <RequestModal
          postApi={createEntriesApi}
          getApi={() => getAllEntriesApi(API_URL)}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default Entries;
