import React, { useEffect, useState } from "react";
import axiosInstance from "../../Apis/axiosInstance";
import toast from "react-hot-toast";
import "./style.css";

const ProfileModal = ({ id, onClose }) => {
  const [user, setUser] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        console.log("userId", id)
        const res = await axiosInstance.get(`/users/me/`);
        
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);
  

  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()
    : "";

   const updatePassword = async () => {
      if (newPassword !== confirmPassword) {
        alert("New passwords do not match!");
        return;
      }
      setSaving(true);
      try {
        await axiosInstance.post(`users/${id}/change-password/`, {
          new_password: newPassword,
          current_password: currentPassword,
        });
        alert("Password updated successfully!");
        setShowPasswordForm(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (err) {
       
        toast.error(err?.response?.data?.new_password[0] || "Error updating password");
        console.error("Error updating password:", err);
      } finally {
        setSaving(false);
      }
    };

  return (
    <div className="profile-overlay">
      <div className="profile-modal">
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : !user ? (
          <p className="error">Failed to load profile</p>
        ) : (
          <div className="profile-content">
            {/* Header */}
            <div className="profile-header">
              <div className="avatar">{initials}</div>
              <div>
                <h2>
                  {user.first_name} {user.last_name}
                </h2>
                <p className="muted">{user.company_email || user.personal_email}</p>
              </div>
            </div>

            {/* Info Section */}
            <div className="info-list">
              <div className="info-item">
                <span className="label">Phone</span>
                <span>{user.phone || "—"}</span>
              </div>
              <div className="info-item">
                <span className="label">Department</span>
                <span>{user.department?.dept_name || "—"}</span>
              </div>
            </div>

            {/* Change Password */}
            {!showPasswordForm ? (
              <button
                className="primary-btn full"
                onClick={() => setShowPasswordForm(true)}
              >
                Change Password
              </button>
            ) : (
              <div className="password-form">
                <h3>Change Password</h3>
                <label>
                  Current Password
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </label>
                <label>
                  New Password
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </label>
                <label>
                  Confirm New Password
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </label>
                <div className="form-actions">
                  <button
                    className="secondary-btn"
                    onClick={() => setShowPasswordForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="primary-btn"
                    onClick={updatePassword}
                    disabled={saving}
                  >
                    {saving ? "Updating..." : "Update"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
