import React, { useState, useEffect } from "react";
import { IoSettingsSharp } from "react-icons/io5";
import { MdDashboard } from "react-icons/md";
import { FaChevronRight, FaChevronDown } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import SettingOptions from "../SettingOptions/SettingOptions";
import { PiNotificationBold } from "react-icons/pi";
import { GrDocumentPerformance } from "react-icons/gr";
import { FaRegFilePowerpoint } from "react-icons/fa6";
import "./style.css";
import useIsMobile from "../../CustomHook/useMobile";
import { useAuth } from "../../Utils/AuthContext";
import { AiOutlineAudit } from "react-icons/ai";
import { IoMdNotifications } from "react-icons/io";
import { RiMessage2Fill } from "react-icons/ri";



// import your notification API
import { getUnreadCount } from "../../Apis/NotificationApis";

const Sidebar = ({ closeMobileMenu }) => {
  const [showSettingOptions, setShowSettingOptions] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await getUnreadCount(); // { count: number }
        setUnreadCount(res.data?.unread_count
 || 0);
      } catch (err) {
        console.error("Error fetching unread count:", err);
      }
    };

    fetchCount();

    // optional polling every 30s
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const navOption = [
    {
      path: "/",
      name: "Dashboard",
      icon: <MdDashboard size={22} />,
      className: "nav-home",
      isAdmin: false,
    },
    {
      path: "/requests",
      name: "Points Requests",
      icon: <PiNotificationBold size={22} />,
      className: "nav-requests",
      isAdmin: false,
    },
    {
      path: "/points-entries",
      name: "Points Entries",
      icon: <GrDocumentPerformance size={22} />,
      className: "nav-entries",
      isAdmin: false,
    },
    {
      path: "/notifications",
      name: "Notifications",
      icon: <IoMdNotifications size={22} />,
      className: "nav-notifications",
      isAdmin: false,
      badge: unreadCount, // ✅ attach badge count
    },
    {
      path: "/tickets",
      name: "Tickets",
      icon: <RiMessage2Fill size={22} />,
      className: "nav-tickets",
      isAdmin: false,
    },
  ];

  return (
    <div className="navbar-cont">
      {/* Main Nav Options */}
      {navOption
  .filter((option) => !option.isAdmin || (option.isAdmin && user?.role === "ADMIN"))
  .map((option) => {
    const active = (() => {
      if (option.path === "/") return location.pathname === "/";
      return location.pathname === option.path || location.pathname.startsWith(option.path + "/");
    })();

    return (
      <div
        key={option.path}
        className={active ? "active-option" : "nav-option"}
        onClick={() => {
          navigate(option.path);
          setShowSettingOptions(false);
          if (isMobile) closeMobileMenu();
        }}
      >
        <div className="nav-icon">{option.icon}</div>
        <p>{option.name}</p>
        {option.badge > 0 && <span className="notif-badge">{option.badge}</span>}
      </div>
    );
  })}


      {/* Settings Dropdown */}
      {user?.role === "ADMIN" && (
        <div className="setting-cont">
          <div
            className={`${
              location.pathname.includes("/settings")
                ? "active-option border-remove"
                : "nav-option"
            }`}
            onClick={() => setShowSettingOptions(!showSettingOptions)}
          >
            <IoSettingsSharp size={22} />
            <span>Setting</span>
            <div
              style={{
                flex: "1",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              {showSettingOptions ? <FaChevronDown /> : <FaChevronRight />}
            </div>
          </div>

          {showSettingOptions && (
            <div className="setting-option-cont">
              <SettingOptions
                closeMobileMenu={closeMobileMenu}
                navigate={navigate}
                location={location}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
