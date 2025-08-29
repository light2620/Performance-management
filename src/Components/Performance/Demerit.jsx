import React from 'react'
import "./style.css"
import { IoWarningOutline } from "react-icons/io5";
const Demerit = () => {
  return (
    <div className="performance-option demerit-cont">
     <div className="performance-logo demerit-logo">
       <IoWarningOutline size={25}  color='#EB2631'/>
     </div>
     <div className='total-points'>
        <p>Total Demrits</p>
        <span>4</span>
     </div>
    </div>
  )
}

export default Demerit
