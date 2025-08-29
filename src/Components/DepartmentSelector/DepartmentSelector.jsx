import React from 'react'
import { useSelector } from 'react-redux'
import "./style.css"

const DepartmentSelector = () => {
    const departments = useSelector((state) => state.department.departments)
    console.log(departments);
  return (
    <div>
       Selector
    </div>
  )
}

export default DepartmentSelector
