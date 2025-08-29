import React from 'react'
import "./style.css"
import { SlBadge } from "react-icons/sl";
const Merit = () => {
  return (
    <div className="performance-option merit-cont">
     <div className="performance-logo merit-logo">
       <SlBadge size={25}  color='#5638B0'/>
     </div>
     <div className="total-points">
        <p>Total Merits</p>
        <span>47</span>
     </div>
    </div>
  )
}

export default Merit
