import React from 'react'
import "./style.css"
import { SlBadge } from "react-icons/sl";
const Merit = ({merits}) => {
  return (
    <div className="performance-option merit-cont">
     <div className="performance-logo merit-logo">
       <SlBadge size={25}  color='#5638B0'/>
     </div>
     <div className="total-points">
        <p>Merits</p>
        <span>{merits ?? 0}</span>
     </div>
    </div>
  )
}

export default Merit
