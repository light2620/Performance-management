import React, { useEffect, useState } from "react";
import axiosInstance from "../../Apis/axiosInstance";
import { tokenService } from "../../Apis/tokenService";
import DepartmentSelector from "../DepartmentSelector/DepartmentSelector";
import "./style.css";

const UserDetailModal = ({ userId, onClose, fetchUsers, editable = false }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(editable);

  useEffect(() => {
    if (!userId) return;

    const fetchUserDetail = async () => {
      setLoading(true);
      try {
        const token = tokenService.getAccess
          ? tokenService.getAccess()
          : tokenService.get?.();
        const res = await axiosInstance.get(`/users/${userId}/`);
        console.log(userId , "userId")
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching user detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetail();
  }, [userId]);

  const handleChange = (e) => {
    if (!isEditing) return;
    const { name, value } = e.target;
    setUser((prev) => ({
      ...prev,
      [name]: value === "true" ? true : value === "false" ? false : value,
    }));
  };

  const handleDeptChange = (id, dept) => {
    if (!isEditing) return;
    setUser((prev) => ({
      ...prev,
      department: { id, dept_name: dept.dept_name },
    }));
  };

  const handleUpdate = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const token = tokenService.getAccess
        ? tokenService.getAccess()
        : tokenService.get?.();

      const body = {
        first_name: user.first_name,
        last_name: user.last_name,
        company_email: user.company_email,
        phone: user.phone,
        department_id: user.department?.id,
        is_blocked: user.is_blocked,
      };

      const res = await axiosInstance.put(`/users/${userId}/`, body);
       await fetchUsers();

      onClose();
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  if (!userId) return null;

  return (
    <div className="user-detail-overlay">
      <div className="user-detail-modal">
        <button className="close-btn" onClick={onClose}>✕</button>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : !user ? (
          <p className="error">Failed to load user details.</p>
        ) : (
          <div className="user-detail-content">
            <h2>User Details</h2>

            {/* Grid layout for inputs */}
            <div className="compact-grid">
              <label>
                First Name
                <input
                  type="text"
                  name="first_name"
                  value={user.first_name || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>

              <label>
                Last Name
                <input
                  type="text"
                  name="last_name"
                  value={user.last_name || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>

              <label>
                Company Email
                <input
                  type="email"
                  name="company_email"
                  value={user.company_email || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>

              <label>
                Phone
                <input
                  type="text"
                  name="phone"
                  value={user.phone || ""}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>

              <label className="full-width">
                Department
                {isEditing ? (
                  <DepartmentSelector
                    value={user.department?.id || ""}
                    onChange={handleDeptChange}
                  />
                ) : (
                  <input
                    type="text"
                    value={user.department?.dept_name || ""}
                    disabled
                  />
                )}
              </label>
{/* 
              {isEditing && (
                <label className="full-width">
                  Password
                  <input
                    type="password"
                    name="password"
                    value={user.password || ""}
                    onChange={handleChange}
                  />
                </label>
              )} */}
            </div>

            {/* Status Section */}
            <div className="status-section">
              {["is_blocked"].map((field) => (
                <div key={field} className="status-row">
                  <span className="status-label">
                    {field.replace("is_", "").replace("_", " ")}:
                  </span>
                  <label>
                    <input
                      type="radio"
                      name={field}
                      value="true"
                      checked={user[field] === true}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                    Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={field}
                      value="false"
                      checked={user[field] === false}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                    No
                  </label>
                </div>
              ))}
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
                  onClick={() => setIsEditing(true)}
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
