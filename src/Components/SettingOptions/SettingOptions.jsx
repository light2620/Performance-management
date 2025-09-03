import React from 'react'
import { FaUser } from "react-icons/fa";
import { MdManageSearch } from "react-icons/md";
import { MdManageAccounts } from "react-icons/md";
import useIsMobile from '../../CustomHook/useMobile';
import "./style.css"
const SettingOptions = ({navigate,location,closeMobileMenu}) => {
  const isMobile = useIsMobile()

        const settingOption =[

          {
            path: "/settings/manage-user",
            name: "Manage User",
            icon : <MdManageAccounts size={26}/>,
          
          },
          {
            path: "/settings/manage-department",
            name: "Manage Department",
            icon : <MdManageSearch size={26}/>,
          }
    ]
  return (
    <div className="setting-options-container">
      {
        settingOption.map((option,index) => {
            return <div 
            onClick={() => {
              navigate(option.path)
              isMobile && closeMobileMenu()
            }}
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
