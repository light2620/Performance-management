import React from 'react'
import { MdPendingActions } from "react-icons/md";
import { IoWarningOutline } from "react-icons/io5";

import "./style.css"
const QuickAction = () => {
  return (
    <div className="quick-action-cont">
       <div className="quick-action-title">
        <div className="heading">
        <MdPendingActions size={24} color='#5638B0'/>
        <p>Quick Actions</p>
        </div>
        <p>
            Merit and feedback tools
        </p>
       </div>
       <div className="quick-actions">
            <div className="quick-action-option">
               <IoWarningOutline />
               <p>Report Issue</p>
            </div>
       </div>
    </div> 
  )
}

export default QuickAction
