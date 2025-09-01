import React, { useState } from "react";
import { addDepartment } from "../../Apis/DepartmentApis";
import "./style.css"
const AddDepartment = ({ onAdd }) => {
  const [deptName, setDeptName] = useState("");
  const [touched, setTouched] = useState(false);

  const valid = deptName.trim().length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    onAdd?.(deptName.trim(), () => {
      setDeptName("");
      setTouched(false);
    });
  };

  return (
    <form className="card add-dept" onSubmit={handleSubmit}>
      <label className="label">Add Department</label>
      <div className="row">
        <input
          className={`input ${touched && !valid ? "input-error" : ""}`}
          placeholder="e.g. Engineering"
          value={deptName}
          onChange={(e) => setDeptName(e.target.value)}
        />
        <button className="btn primary" type="submit">
          Add
        </button>
      </div>
      {touched && !valid && (
        <div className="hint">Department name is required.</div>
      )}
    </form>
  );
};

export default AddDepartment;
