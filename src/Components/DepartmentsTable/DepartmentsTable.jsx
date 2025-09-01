import React, { useState } from "react";
import "./style.css"
const EditableCell = ({ value, onChange }) => {
  const [v, setV] = useState(value || "");
  return (
    <div className="edit-cell">
      <input
        className="input sm"
        value={v}
        onChange={(e) => setV(e.target.value)}
      />
      <button className="btn sm" onClick={() => onChange?.(v.trim())}>
        Save
      </button>
    </div>
  );
};

const DepartmentsTable = ({
  rows = [],
  loading = false,
  total = 0,
  next,
  previous,
  onEdit,
  onDelete,
  onNext,
  onPrev,
  onRefresh,
}) => {
  const [editId, setEditId] = useState(null);

  return (
    <div className="card">
      <div className="table-header">
        <h3>All Departments {total ? `(${total})` : ""}</h3>
        <div className="table-actions">
          <button className="btn" onClick={onRefresh}>Refresh</button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: "34%" }}>Department</th>
              <th style={{ width: "22%" }}>Created</th>
              <th style={{ width: "22%" }}>Updated</th>
              <th style={{ width: "22%" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="center muted">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="4" className="center muted">
                  No departments found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {editId === r.id ? (
                      <EditableCell
                        value={r.dept_name}
                        onChange={(val) => {
                          setEditId(null);
                          if (val && val !== r.dept_name) {
                            onEdit?.({ ...r, dept_name: val });
                          }
                        }}
                      />
                    ) : (
                      r.dept_name
                    )}
                  </td>
                  <td className="muted">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="muted">
                    {new Date(r.updated_at).toLocaleString()}
                  </td>
                  <td>
                    <div className="row gap">
                      {editId === r.id ? (
                        <button className="btn sm" onClick={() => setEditId(null)}>
                          Cancel
                        </button>
                      ) : (
                        <button className="btn sm" onClick={() => setEditId(r.id)}>
                          Edit
                        </button>
                      )}
                      <button
                        className="btn sm danger"
                        onClick={() => onDelete?.(r.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pager">
        <button className="btn" disabled={!previous} onClick={onPrev}>
          ← Prev
        </button>
        <button className="btn" disabled={!next} onClick={onNext}>
          Next →
        </button>
      </div>
    </div>
  );
};

export default DepartmentsTable;
