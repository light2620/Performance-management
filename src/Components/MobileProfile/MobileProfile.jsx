import React from "react";
import { useAuth } from "../../Utils/AuthContext";
import { logout } from "../../Apis/AuthApis";
import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import "./style.css";

const MobileProfile = () => {
  const { user, setIsLoggedIn } = useAuth();
  const navigate = useNavigate();

  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()
    : "";

  const handleLogout = () => {
    logout(); // clear tokens
    setIsLoggedIn(false); // update context
    navigate("/"); // redirect to home
  };

  return (
    <div className="mobile-profile">
      {/* Avatar */}
      <div className="profile-avatar">{initials}</div>

      {/* User Info */}
      <div className="profile-info">
        <p className="profile-name">
          {user?.first_name} {user?.last_name}
        </p>
        <p className="profile-dept">
          {user?.department?.dept_name || "No Department"}
        </p>
      </div>

      {/* Logout */}
      <button className="logout-btn" onClick={handleLogout}>
        <FiLogOut size={18} /> <span>Logout</span>
      </button>
    </div>
  );
};

export default MobileProfile;
