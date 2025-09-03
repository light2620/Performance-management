import React from 'react'
import "./style.css"
import logo from "../../assets/Logo-Orange.png"
import { useState } from 'react';
import { IoLogOutOutline } from "react-icons/io5";
import {  useNavigate } from 'react-router-dom';
import { useAuth } from '../../Utils/AuthContext';
import { logout } from '../../Apis/AuthApis';
import useIsMobile from '../../CustomHook/useMobile';
import { GiHamburgerMenu } from "react-icons/gi";
import MobileMenu from '../MobileMenu/MobileMenu';



const Header = () => {
   const navigate = useNavigate()
   const {user,setIsLoggedIn} = useAuth();
   const isMobile = useIsMobile();
const [menuOpen, setMenuOpen] = useState(false);
    const initials = user 
     ? `${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() 
     : "";


  const handleLogout = () => {
    logout();         // clear tokens
    setIsLoggedIn(false); // update context
    navigate("/");    // redirect to home
  };


  return (
    <div className='header-bar'>
    {
      <div className="header-container-mobile">
        <div className="header-logo-cont-mobile" >
           <img src={logo} alt="logo" width="50%" height="50%" onClick={() => navigate("/")}/>
        </div>

       <div className="mobile-nav-option" onClick={() => setMenuOpen(true)}>
          <GiHamburgerMenu size={22} />
       </div>
      </div>
    }
      <MobileMenu closeMobileMenu={() => setMenuOpen(false)} open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}

export default Header
