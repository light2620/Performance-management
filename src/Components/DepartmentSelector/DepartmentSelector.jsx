import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import "./style.css";

const DepartmentSelector = ({ value, onChange, error }) => {
  const departments = useSelector((state) => state.department.departments) || [];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const boxRef = useRef(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) =>
      String(d.dept_name || "").toLowerCase().includes(q)
    );
  }, [departments, query]);

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = departments.find((d) => d.id === value) || null;

  return (
    <div className="dept-select" ref={boxRef}>
      <div
        className={`dept-select-control ${error ? "error-input" : ""}`}
        onClick={() => setOpen((o) => !o)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" ? setOpen((o) => !o) : null)}
      >
        <span className={`dept-select-placeholder ${selected ? "has" : ""}`}>
          {selected ? selected.dept_name : "Select department"}
        </span>
        <span className="dept-caret">▾</span>
      </div>

      {open && (
        <div className="dept-dropdown">
          <input
            type="text"
            className="dept-search"
            placeholder="Search department..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <ul className="dept-list">
            {filtered.length === 0 && (
              <li className="dept-empty">No results</li>
            )}
            {filtered.map((d) => (
              <li
                key={d.id}
                className={`dept-item ${d.id === value ? "active" : ""}`}
                onClick={() => {
                  onChange?.(d.id, d);
                  setOpen(false);
                  setQuery("");
                }}
              >
                {d.dept_name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <span className="error-text">{error}</span>}
    </div>
  );
};

export default DepartmentSelector;
