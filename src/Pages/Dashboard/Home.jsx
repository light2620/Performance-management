import React, { useEffect, useState } from 'react'
import Merit from '../../Components/Performance/Merit'
import Demerit from '../../Components/Performance/Demerit'
import "./style.css"
import QuickAction from '../../Components/QuickAction/QuickAction'
import { getPerformanceApi } from '../../Apis/Points'
import TotalPoints from '../../Components/Performance/TotalPoints'
import { useAuth } from '../../Utils/AuthContext'
import NotificationListener from '../../Components/NotificationListener/NotificationListener'
import SetupWebSocket from '../../Components/Test'
const Home= () => {

  const [performance,setPerformance] = useState({
    totalPoints : "",
    merits : "",
    demerits: ""
  })
  const {user} = useAuth();

  const fetchPerformancePoint = async() => {
    try{
        const res = await getPerformanceApi();
      setPerformance({
        totalPoints: res.data.net_points,
        merits: res.data.total_merit,
        demerits : res.data.total_demerit

      })
      
    }catch(err){
      console.log(err)
    }
  }
  useEffect( ()=> {
        
       fetchPerformancePoint();
  } ,[])
  return (
    <div className='dashboard-cont'>
      <div className="info-column">
        <div className="welcome-title">
          <h1>Welcome back, {user?.first_name} {user?.last_name}</h1>
          <p>Track your performance</p>
        </div>
          <div className="performance-cont">
             <Merit merits={performance.merits} />
             <Demerit demerits ={performance.demerits} />
          </div>
          <div>
            <TotalPoints totalPoints = {performance.totalPoints}/>
          </div>
          <div>
            <QuickAction />
          </div>
          <NotificationListener />
          <SetupWebSocket />
      </div>
    </div>
  )
}

export default Home
