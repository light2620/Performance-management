import React from "react";
import Sidebar from "../Sidebar/Sidebar";
import MobileProfile from "../MobileProfile/MobileProfile";
import "./style.css";

const MobileMenu = ({ open, onClose,closeMobileMenu }) => {
  return (
    <>
      {/* Backdrop */}
      {open && <div className="mobile-backdrop" onClick={onClose}></div>}

      {/* Sidebar */}
      <div className={`mobile-menu ${open ? "open" : ""}`}>
        <div className="mobile-menu-header">
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
<MobileProfile />
              <Sidebar closeMobileMenu={closeMobileMenu} />

     

      

      </div>
    </>
  );
};

export default MobileMenu;
