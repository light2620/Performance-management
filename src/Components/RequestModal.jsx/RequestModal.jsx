import React, { useState } from "react";
import { useSelector } from "react-redux";
import EmployeeSelector from "../EmployeeSelector/EmployeeSelector";
import "./style.css";
import toast from "react-hot-toast";

const RequestModal = ({ onClose, getApi, postApi, title }) => {
  const allEmployees = useSelector((state) => state.allUser.allUsers);

  const [type, setType] = useState("MERIT");
  const [employee, setEmployee] = useState("");
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!type) newErrors.type = "Type is required";
    if (!employee) newErrors.employee = "Employee is required";

    if (!points || Number(points) <= 0) {
      newErrors.points = "Points must be greater than 0";
    } else if (Number(points) > 20) {
      newErrors.points = "Points cannot be greater than 20";
    }

    if (!reason) {
      newErrors.reason = "Reason is required";
    } else if (reason.length < 50) {
      newErrors.reason = "Reason must be at least 50 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const body = {
        type,
        employee_id: employee,
        points: Number(points),
        reason,
      };

      await postApi(body);
      setTimeout(async () => await getApi(), 1000);
      toast.success(`${type} ${title} Created Successfully`);
      onClose();
    } catch (err) {
      console.error("Error creating request:", err);
      alert("Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field) => {
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  return (
    <div className="request-modal-container" role="dialog" aria-modal="true">
      <div className="request-modal-header">
        <h3>{`Create New Point ${title}`}</h3>
        <button className="request-modal-close-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <form className="request-modal-body" onSubmit={handleSubmit} noValidate>
        {/* Type */}
        <label htmlFor="req-type">Type*</label>
        <select
          id="req-type"
          value={type}
          onChange={(e) => {
            clearError("type");
            setType(e.target.value);
          }}
          className={errors.type ? "request-modal-error" : ""}
          aria-invalid={!!errors.type}
          aria-describedby={errors.type ? "err-type" : undefined}
          required
        >
          <option value="MERIT">Merit</option>
          <option value="DEMERIT">Demerit</option>
        </select>
        {errors.type && (
          <small id="err-type" className="request-modal-error-text">
            {errors.type}
          </small>
        )}

        {/* Employee */}
        <EmployeeSelector
          allEmployees={allEmployees}
          value={employee}
          onChange={(id) => {
            clearError("employee");
            setEmployee(id);
          }}
          id="req-employee"
          aria-invalid={!!errors.employee}
          aria-describedby={errors.employee ? "err-employee" : undefined}
        />
        {errors.employee && (
          <small id="err-employee" className="request-modal-error-text">
            {errors.employee}
          </small>
        )}

        {/* Points */}
        <label htmlFor="req-points">Points* (Max 20)</label>
        <input
          id="req-points"
          type="number"
          value={points}
          onChange={(e) => {
            const raw = e.target.value;
            clearError("points");
            if (raw === "") {
              setPoints("");
              return;
            }
            const n = Number(raw);
            if (Number.isNaN(n)) return;
            if (n < 1) setPoints("1");
            else if (n > 20) setPoints("20");
            else setPoints(String(n));
          }}
          min="1"
          max="20"
          className={errors.points ? "request-modal-error" : ""}
          aria-invalid={!!errors.points}
          aria-describedby={errors.points ? "err-points" : undefined}
          required
        />
        {errors.points && (
          <small id="err-points" className="request-modal-error-text">
            {errors.points}
          </small>
        )}

        {/* Reason */}
        <label htmlFor="req-reason">Reason*</label>
        <textarea
          id="req-reason"
          value={reason}
          onChange={(e) => {
            const value = e.target.value;
            // Check for invalid characters
            const invalid = /[^a-zA-Z0-9 _.,&()\-/]/.test(value);
            setErrors((prev) => ({
              ...prev,
              reason: invalid
                ? "Only letters, numbers, underscores, spaces, and .,&()-/ are allowed"
                : undefined,
            }));
            // Keep only allowed characters
            const filtered = value.replace(/[^a-zA-Z0-9 _.,&()\-/]/g, "");
            setReason(filtered);
          }}
          rows="3"
          className={errors.reason ? "request-modal-error" : ""}
          aria-invalid={!!errors.reason}
          aria-describedby={errors.reason ? "err-reason" : undefined}
          required
        />
        {errors.reason && (
          <small id="err-reason" className="request-modal-error-text">
            {errors.reason}
          </small>
        )}
        <small className="request-modal-char-count">{reason.length}/50 min characters</small>

        <button type="submit" className="request-modal-submit-btn" disabled={loading}>
          {loading ? "Submitting..." : `Create ${title}`}
        </button>
      </form>
    </div>
  );
};

export default RequestModal;
