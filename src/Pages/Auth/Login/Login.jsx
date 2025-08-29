import React, { useState } from 'react'
import '../style.css'
import logo from "../../../assets/Logo-Orange.png"
import { FiEye } from "react-icons/fi";
import { LuEyeOff } from "react-icons/lu";
import { login } from '../../../Apis/AuthApis';
import toast from 'react-hot-toast';
import { useAuth } from '../../../Utils/AuthContext';
import Spinner from '../../../Utils/SmallSpinner/SmallSpinner';
import { getCurrentUserApi } from '../../../Apis/UserApi';
const Login = () => {
  const [showPassword,setShowPassword] = useState(false);
  const {setIsLoggedIn,setUser} = useAuth()
  const [credentials,setCredentials] = useState({
    company_email: "", password: ""
  })
  const [loading,setLoading] = useState(false);
  const [errors,setErrors] = useState({
   company_email: false,
    password: false
  })

  const handleChange = (e) => {
      const {name,value} = e.target;
      setErrors((prev) => ({...prev,[name]: false}))
       setCredentials((prev) => {return {...prev,[name] : value}})
       console.log(credentials)
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!credentials.company_email && !credentials.password){
          setErrors({company_email : true,password:true})
          return
    }
    if(!credentials.company_email){
          setErrors({company_email : true,password:false})
          return
    }
     if(!credentials.password){
          setErrors({company_email : false,password:true})
          return
    }
    try{
      setLoading(true)
      const res = await login(credentials)
      setIsLoggedIn(true);
      const user = await getCurrentUserApi();
      console.log(user);
      setUser(user.data);
       
    }catch(err){
       console.log(err)
       toast.error(err.response.data.detail);
    }finally{
      setLoading(false)
    }


  }
  return (
    <div className='login-container'>


       <div className='login-form'>
        <div>
                   <h1>Welcome Back</h1>
         <p>Sign in to access your merit dashboard</p>
        </div>
  
            <form action="" onSubmit={handleSubmit}>
                
                <div className="login-form-group">
                  <label className={``} htmlFor="company_email">Company Email</label>
                  <input 
                  className={errors.company_email ? "input-error" : ""}
                  name='company_email' 
                  onChange={handleChange} 
                  disabled={loading}
                  type='email' 
                  id='company_email' 
                  value={credentials.company_email}
                  placeholder='Enter your email'/>
    
                  {errors.company_email && <small>Please enter email</small>}
                </div>

                 <div className="login-form-group">
                  <label htmlFor="password">Password</label>
                  <input 
                  className={errors.password ? "input-error" : ""} 
                  name='password' onChange={handleChange} 
                  disabled={loading}
                  type={showPassword ? "text" : "password"} 
                  value={credentials.password}
                  id='password' 
                  placeholder='Enter your password'/>
                { errors.password && <small>Please enter password</small>}
                    <div className={`show-pass ${errors.password && "show-pass-error"}`} onClick={() => setShowPassword(!showPassword)}>
                     {showPassword ?  <FiEye />
                      : <LuEyeOff />}
                      </div>
                  
                </div>

                <button disabled={loading}>
                 { loading  ? <Spinner /> : "Login" }
                </button>
              
               
            </form>
                  <div className="logo-cont">
          <img src={logo} alt="logo"  width="100%" height="100%"/>
        </div>
       </div>
    </div>
  )
}

export default Login
