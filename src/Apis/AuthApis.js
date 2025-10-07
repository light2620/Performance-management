import axios from "axios";
import axiosInstance from "./axiosInstance";
import { tokenService } from "./tokenService";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { WebSocketProvider } from "../Provider/WebSocketProvider";

const BASE = axiosInstance.defaults.baseURL || "";

// Login should return { access, refresh }
export async function login(credentials) {
  const { data } = await axios.post(`${BASE}login/`, credentials);
  
  if (data?.access){
     tokenService.setAccess(data.access);
 
  }
  if (data?.refresh) tokenService.setRefresh(data.refresh);
  return data;
}

export async function logout() {

  const refreshToken = tokenService.getRefresh();
  try{
    const logout = await axiosInstance.post("logout/",{refresh: refreshToken})
    toast.success(logout?.data?.details || "logout");
    tokenService.clear();
  
    
  }catch(err){
    throw err
  }


}
