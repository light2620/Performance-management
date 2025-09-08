import React from "react";
import { useAuth } from "../../Utils/AuthContext";
import { logout } from "../../Apis/AuthApis";
import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import ProfileModal from "../Profile/Profile";
import "./style.css";

const MobileProfile = () => {
  const { user, setIsLoggedIn } = useAuth();
  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const navigate = useNavigate();

  const initials = user
    ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase()
    : "";

  const handleLogout = () => {
logout(); // clear tokens
    setIsLoggedIn(false); // update context
  };
  

  return (
    <div className="mobile-profile">
      {/* Avatar */}
      <div className="profile-avatar">{initials}</div>

      {/* User Info */}
      <div className="profile-info" onClick={() => setShowProfileModal(true)} style={{cursor: 'pointer'}}>
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
    

        {/* Profile Modal */}
        {showProfileModal && <ProfileModal id={user?.id} onClose={() => setShowProfileModal(false)} />}
    </div>
  );
};

export default MobileProfile;
