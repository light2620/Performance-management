import React, { useState } from "react";
import { IoSettingsSharp } from "react-icons/io5";
import { MdDashboard } from "react-icons/md";
import { TbMessageReportFilled } from "react-icons/tb";
import { FaChevronRight, FaChevronDown } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import SettingOptions from "../SettingOptions/SettingOptions";
import "./style.css";

const Sidebar = () => {
  const [showSettingOptions, setShowSettingOptions] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const navOption = [
    {
      path: "/",
      name: "Dashboard",
      icon: <MdDashboard size={22} />,
      className: "nav-home",
    },
    {
      path: "/report",
      name: "Report",
      icon: <TbMessageReportFilled size={22} />,
      className: "nav-report",
    },
  ];

  return (
    <div className="navbar-cont">
      {/* Main Nav Options */}
      {navOption.map((option, index) => (
        <div
          key={index}
          className={` ${
            location.pathname === option.path && !showSettingOptions ? "active-option" : "nav-option"
          }`}
          onClick={() => {
            navigate(option.path)
            setShowSettingOptions(false)
          }}
        >
          {option.icon}
          <p>{option.name}</p>
        </div>
      ))}

      {/* Settings Dropdown */}
      <div className="setting-cont">
        <div
          className={`${
            location.pathname.includes("/settings") ? "active-option border-remove" : "nav-option"
          }`}
          onClick={() => {
            setShowSettingOptions(!showSettingOptions)
            navigate("/settings")
          }}
        >
          <IoSettingsSharp size={22} />
          <span >Setting</span>
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
            <SettingOptions navigate={navigate} location={location} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
