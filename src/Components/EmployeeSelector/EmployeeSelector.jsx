import { useState, useMemo, useRef, useEffect } from "react";
import "./style.css";

const EmployeeSelector = ({ allEmployees, value, onChange }) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    if (!search) return allEmployees;
    return allEmployees.filter(
      (emp) =>
        emp.first_name.toLowerCase().includes(search.toLowerCase()) ||
        emp.last_name.toLowerCase().includes(search.toLowerCase()) ||
        emp.company_email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [allEmployees, search]);

  // Get selected employee
  const selectedEmployee = allEmployees.find((emp) => emp.id === value);

  return (
    <div className="employee-selector" ref={dropdownRef}>
      <label>Employee</label>

      {/* Dropdown Box */}
      <div
        className="dropdown-box"
        onClick={() => setOpen((prev) => !prev)}
      >
        {selectedEmployee ? (
          <span>
            {selectedEmployee.first_name} {selectedEmployee.last_name}{" "}
            <small>({selectedEmployee.company_email})</small>
          </span>
        ) : (
          <span className="placeholder">Select Employee</span>
        )}
        <span className="arrow">{open ? "▲" : "▼"}</span>
      </div>

      {/* Dropdown List */}
      {open && (
        <div className="dropdown-list">
          <input
            type="text"
            className="search-box"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <ul>
            {filteredEmployees.length === 0 ? (
              <li className="no-results">No employees found</li>
            ) : (
              filteredEmployees.map((emp) => (
                <li
                  key={emp.id}
                  className={`dropdown-item ${
                    value === emp.id ? "selected" : ""
                  }`}
                  onClick={() => {
                    onChange(emp.id);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  {emp.first_name} {emp.last_name}{" "}
                  <small>({emp.company_email})</small>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EmployeeSelector;
