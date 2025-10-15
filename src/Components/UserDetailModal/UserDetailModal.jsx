import React, { useEffect, useState } from "react";
import axiosInstance from "../../Apis/axiosInstance";
import { tokenService } from "../../Apis/tokenService";
import DepartmentSelector from "../DepartmentSelector/DepartmentSelector";
import toast from "react-hot-toast";
import "./style.css";

const UserDetailModal = ({ userId, onClose, fetchUsers, editable = false }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(editable);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!userId) return;

    const fetchUserDetail = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/users/${userId}/`);
        setUser(res.data);
        setErrors({});
      } catch (err) {
        console.error("Error fetching user detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetail();
  }, [userId]);

  const clearError = (field) => {
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleChange = (e) => {
    if (!isEditing) return;
    const { name, value } = e.target;
    clearError(name);

    setUser((prev) => ({
      ...prev,
      [name]:
        value === "true" ? true : value === "false" ? false : value,
    }));
  };

  // Phone-specific handler: allow optional leading +, then digits only.
  const handlePhoneChange = (e) => {
    if (!isEditing) return;
    const raw = e.target.value || "";

    // Allow an optional leading +, then digits. Remove all other characters.
    // Keep only the first leading + (if present) and subsequent digits.
    let sanitized = raw;

    // If user types multiple + signs or places + not at start, clean it:
    // Keep leading + only if it exists at position 0, rest digits only.
    const hasLeadingPlus = sanitized.startsWith("+");
    // Remove everything except digits
    const digitsOnly = sanitized.replace(/\D+/g, "");
    sanitized = hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;

    // Show inline error if original input had forbidden characters
    if (sanitized !== raw) {
      setErrors((prev) => ({
        ...prev,
        phone: "Phone can contain only digits and an optional leading +",
      }));
    } else {
      clearError("phone");
    }

    setUser((prev) => ({
      ...prev,
      phone: sanitized,
    }));
  };

  // Handle paste into phone field: sanitize pasted value
  const handlePhonePaste = (e) => {
    if (!isEditing) return;
    const paste = (e.clipboardData || window.clipboardData).getData("text") || "";
    const hasLeadingPlus = paste.startsWith("+");
    const digitsOnly = paste.replace(/\D+/g, "");
    const sanitized = hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;

    if (sanitized !== paste) {
      e.preventDefault();
      // update value manually
      setUser((prev) => ({ ...prev, phone: sanitized }));
      setErrors((prev) => ({
        ...prev,
        phone: "Phone can contain only digits and an optional leading +",
      }));
    }
    // otherwise let normal paste happen (the onChange will sanitize anyway)
  };

  const handleDeptChange = (id, dept) => {
    if (!isEditing) return;
    clearError("department");
    setUser((prev) => ({
      ...prev,
      department: { id, dept_name: dept.dept_name },
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!user?.first_name?.toString().trim()) newErrors.first_name = "First name is required";
    if (!user?.company_email?.toString().trim()) newErrors.company_email = "Company email is required";
    else {
      // simple email regex
      const email = user.company_email.toString().trim();
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(email)) newErrors.company_email = "Enter a valid email address";
    }

    // Phone validation: must be non-empty and match optional + followed by digits only
    const phoneVal = user?.phone?.toString().trim() ?? "";
    if (!phoneVal) {
      newErrors.phone = "Phone is required";
    } else {
      const phoneRe = /^\+?\d+$/;
      if (!phoneRe.test(phoneVal)) {
        newErrors.phone = "Phone must contain only digits and an optional leading +";
      }
    }

    if (!user?.department?.id) newErrors.department = "Select a department";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!user) return;
    if (!validate()) return;

    setSaving(true);
    try {
      const body = {
        first_name: user.first_name,
        last_name: user.last_name,
        company_email: user.company_email,
        phone: user.phone,
        department_id: user.department?.id,
        is_blocked: user.is_blocked,
      };

      await axiosInstance.put(`/users/${userId}/`, body);
      if (typeof fetchUsers === "function") await fetchUsers();
      onClose();
    } catch (err) {
      console.error("Error updating user:", err);
      const data = err?.response?.data;

      const msg =
    data?.phone?.[0] ??
    data?.company_email?.[0] ??
    data?.detail ??
    (typeof data === "string" ? data : null) ??
    err?.message ??
    "Failed to update user, try again";

    toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!userId) return null;

  return (
    <div className="user-detail-overlay" role="dialog" aria-modal="true" aria-labelledby="user-detail-title">
      <div className="user-detail-modal">
        <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : !user ? (
          <p className="error">Failed to load user details.</p>
        ) : (
          <div className="user-detail-content">
            <h2 id="user-detail-title">User Details</h2>

            {/* Grid layout for inputs */}
            <div className="compact-grid">
              <label>
                First Name*
                <input
                  type="text"
                  name="first_name"
                  value={user.first_name || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={errors.first_name ? "input-error" : ""}
                  aria-invalid={!!errors.first_name}
                  aria-describedby={errors.first_name ? "err-first_name" : undefined}
                />
                {errors.first_name && <div id="err-first_name" className="error-text">{errors.first_name}</div>}
              </label>

              <label>
                Last Name
                <input
                  type="text"
                  name="last_name"
                  value={user.last_name || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={errors.last_name ? "input-error" : ""}
                  aria-invalid={!!errors.last_name}
                  aria-describedby={errors.last_name ? "err-last_name" : undefined}
                />
                {errors.last_name && <div id="err-last_name" className="error-text">{errors.last_name}</div>}
              </label>

              <label>
                Company Email*
                <input
                  type="email"
                  name="company_email"
                  value={user.company_email || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={errors.company_email ? "input-error" : ""}
                  aria-invalid={!!errors.company_email}
                  aria-describedby={errors.company_email ? "err-company_email" : undefined}
                />
                {errors.company_email && <div id="err-company_email" className="error-text">{errors.company_email}</div>}
              </label>

              <label>
                Phone*
                <input
                  type="tel"
                  name="phone"
                  value={user.phone || ""}
                  onChange={handlePhoneChange}
                  onPaste={handlePhonePaste}
                  disabled={!isEditing}
                  className={errors.phone ? "input-error" : ""}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "err-phone" : undefined}
                  placeholder="+919999999999"
                />
                {errors.phone && <div id="err-phone" className="error-text">{errors.phone}</div>}
              </label>

              <label className="full-width">
                Department*
                {isEditing ? (
                  <>
                    <DepartmentSelector
                      value={user.department?.id || ""}
                      onChange={handleDeptChange}
                    />
                    {errors.department && <div id="err-department" className="error-text">{errors.department}</div>}
                  </>
                ) : (
                  <input
                    type="text"
                    value={user.department?.dept_name || ""}
                    disabled
                  />
                )}
              </label>
            </div>

            {/* Status Section */}
            <div className="status-section">
              <div className="status-row">
                <span className="status-label">Blocked:</span>
                <label>
                  <input
                    type="radio"
                    name="is_blocked"
                    value="true"
                    checked={user.is_blocked === true}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                  Yes
                </label>
                <label>
                  <input
                    type="radio"
                    name="is_blocked"
                    value="false"
                    checked={user.is_blocked === false}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                  No
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={onClose}>
                Close
              </button>
              {isEditing ? (
                <button
                  type="button"
                  className="save-btn"
                  onClick={handleUpdate}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Update"}
                </button>
              ) : (
                <button
                  type="button"
                  className="save-btn"
                  onClick={() => { setIsEditing(true); setErrors({}); }}
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDetailModal;
