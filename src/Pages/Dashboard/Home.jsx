import React from 'react'
import Merit from '../../Components/Performance/Merit'
import Demerit from '../../Components/Performance/Demerit'
import "./style.css"
import QuickAction from '../../Components/QuickAction/QuickAction'
const Home= () => {
  return (
    <div className='dashboard-cont'>
      <div className="info-column">
        <div className="welcome-title">
          <h1>Welcome back, Shivam</h1>
          <p>Track your performance and provide feedback to colleagues</p>
        </div>
          <div className="performance-cont">
             <Merit />
             <Demerit />
          </div>
          <div>
            <QuickAction />
          </div>
      </div>
    </div>
  )
}

export default Home
