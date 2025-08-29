import React from 'react'
import "./style.css"
import { Outlet } from 'react-router-dom'
const AuthLayout = () => {
  return (
    <div className='auth-layout-container'>
      <Outlet />
    </div>
  )
}

export default AuthLayout
