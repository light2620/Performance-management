import React from 'react'
import "./style.css"
import logo from "../../assets/Logo-Orange.png"
import { IoLogOutOutline } from "react-icons/io5";

import {  useNavigate } from 'react-router-dom';
import { useAuth } from '../../Utils/AuthContext';
import { logout } from '../../Apis/AuthApis';



const Header = () => {
   const navigate = useNavigate()
   const {user,setIsLoggedIn} = useAuth();

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
      <div className='header-container'>


            <div className="header-action-cont">
                 <div className="profile-icon">
                     {initials || "U"}
                 </div>

                 <div className="user-info">
                 <p>{user?.first_name} {user?.last_name}</p>
                  <span>{user?.department?.dept_name || "No Department"}</span>
                 </div>
                 
                 <div className='logout-btn'>
                    <button onClick={handleLogout}>
                      <IoLogOutOutline />
                      logout
                    </button>
                 </div>
                  
            </div>
      </div>
      
    </div>
  )
}

export default Header
