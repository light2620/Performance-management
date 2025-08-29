import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../../Components/Header/Header'
import { getAllDepartmentApi } from '../../Apis/DepartmentApis'
import { useDispatch } from 'react-redux'
import { setDepartment } from '../../Redux/DepartmentSlice'
import Sidebar from '../../Components/Sidebar/Sidebar'
import logo from "../../assets/Logo-Orange.png"

import "./style.css"
const MainLayout = () => {
const dispatch = useDispatch();

const fetchAllDepartment = async() => {
  try{
    const data = await getAllDepartmentApi();
    dispatch(setDepartment(data.data.results));

  }catch(err){
    console.log(err);
  }
}
  useEffect(() => {
      fetchAllDepartment();
  },[])

  return (
    <div className='main-layout-container'>
          
          <div className="component-cont">
            <div className="sidebar-area"> 
              <div className="side-bar-logo">
                 <img src={logo} alt="logo" width="100%" height="100%"  />
              </div>
              <div className='sidebar-cont'>
               <Sidebar />
              </div>
         

            </div>
              <div className="main-content-area">
                <Header />
                <div style={{"padding":"30px 60px"}}>
                     <Outlet />
                </div>
                
            </div>
            
          </div>
    </div>
  )
}

export default MainLayout
