import { useState } from "react";
import { useSelector } from "react-redux";
import EmployeeSelector from "../EmployeeSelector/EmployeeSelector";
import "./style.css";

const RequestModal = ({ onClose, getApi, postApi }) => {
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
    if (!points || points <= 0) newErrors.points = "Points must be greater than 0";
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
    <div className="request-modal-container">
      <div className="request-modal-header">
        <h3>Create New Point Request</h3>
        <button className="request-modal-close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <form className="request-modal-body" onSubmit={handleSubmit}>
        {/* Type */}
        <label>Type</label>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            clearError("type");
          }}
          className={errors.type ? "request-modal-error" : ""}
          required
        >
          <option value="MERIT">Merit</option>
          <option value="DEMERIT">Demerit</option>
        </select>
        {errors.type && <p className="request-modal-error-text">{errors.type}</p>}

        {/* Employee */}
        <EmployeeSelector
          allEmployees={allEmployees}
          value={employee}
          onChange={(id) => {
            setEmployee(id);
            clearError("employee");
          }}
        />
        {errors.employee && <p className="request-modal-error-text">{errors.employee}</p>}

        {/* Points */}
        <label>Points</label>
        <input
          type="number"
          value={points}
          onChange={(e) => {
            setPoints(e.target.value);
            clearError("points");
          }}
          className={errors.points ? "request-modal-error" : ""}
          required
        />
        {errors.points && <p className="request-modal-error-text">{errors.points}</p>}

        {/* Reason */}
        <label>Reason</label>
        <textarea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            clearError("reason");
          }}
          rows="3"
          className={errors.reason ? "request-modal-error" : ""}
          required
        />
        <small className="request-modal-char-count">
          {reason.length}/50 min characters
        </small>
        {errors.reason && <p className="request-modal-error-text">{errors.reason}</p>}

        <button type="submit" className="request-modal-submit-btn" disabled={loading}>
          {loading ? "Submitting..." : "Create Request"}
        </button>
      </form>
    </div>
  );
};

export default RequestModal;
