import React from 'react'
import "./style.css"
import { FaStar } from "react-icons/fa";
const TotalPoints = ({totalPoints}) => {
  return (
    <div className="performance-option total-point-cont">
     <div className="performance-logo total-point-logo">
       <FaStar size={25}  color='#3083ffff'/>
     </div>
     <div className="total-points">
        <p>Total Points</p>
        <span>{totalPoints ?? 0}</span>
     </div>
    </div>
  )
}

export default TotalPoints
