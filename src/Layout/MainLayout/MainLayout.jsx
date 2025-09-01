import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../../Components/Header/Header'
import { getAllDepartmentApi } from '../../Apis/DepartmentApis'
import { useDispatch } from 'react-redux'
import { setDepartment } from '../../Redux/DepartmentSlice'
import { setAllUsers } from '../../Redux/AllUsersSllice'
import { getAllUserApi } from '../../Apis/UserApi'
import Sidebar from '../../Components/Sidebar/Sidebar'
import logo from "../../assets/Logo-Orange.png"
import useIsMobile from '../../CustomHook/useMobile'
import { useNavigate } from 'react-router-dom'

import "./style.css"
const MainLayout = () => {
const dispatch = useDispatch();
const isMobile = useIsMobile();
const navigate = useNavigate();

const fetchAllDepartment = async() => {
  try{
    const data = await getAllDepartmentApi();
    dispatch(setDepartment(data.data.results));

  }catch(err){
    console.log(err);
  }
}
const fetchAllUsers = async() => {
  try{
      const response = await getAllUserApi();
     dispatch(setAllUsers(response.data.results));
  }catch(err){
    console.log(err);
  }
}
  useEffect(() => {
      fetchAllDepartment();
      fetchAllUsers();
  },[])

  return (
    <div className='main-layout-container'>
          
          <div className="component-cont">
            {!isMobile && <div className="sidebar-area"> 
              <div className="side-bar-logo">
                 <img src={logo} alt="logo" width="100%" height="100%" onClick={() => navigate("/")}  />
              </div>
               <div className='sidebar-cont'>
               <Sidebar />
              </div>
         

            </div>}
              <div className="main-content-area">
                <Header />
                <div className="main-cont">
                     <Outlet />
                </div>
                
            </div>
            
          </div>
    </div>
  )
}

export default MainLayout
