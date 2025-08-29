import React from 'react'
import { FaUser } from "react-icons/fa";
import { useLocation } from 'react-router-dom';
import "./style.css"
const SettingOptions = ({navigate,location}) => {
 

        const settingOption =[
          {
            path: "/settings/create-user",
            name : "Create User",
            icon: <FaUser size={16} />,
            active: true
          },
    ]
  return (
    <div className="setting-options-container">
      {
        settingOption.map((option,index) => {
            return <div 
            onClick={() => navigate(option.path)}
            className={`${location.pathname === option.path ? "active-setting-option" : 'setting-options'}`} key={index}>
                {option.icon}
                <p>{option.name}</p>
            </div>
        })
      }
    </div>
  )
}

export default SettingOptions
