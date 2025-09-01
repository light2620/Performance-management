import axios from "axios";
import axiosInstance from "./axiosInstance";

export const getAllDepartmentApi = async() => {
    try{
        const res = await axiosInstance.get("departments");
        return res;

    }catch(err){
        throw err
    }
}

export const addDepartment = async(data) => {
    try{
        const res = await axiosInstance.post("/departments/",data)
        return res;

    }catch(err){
        throw err
    }
}


export const editDepartment = async(id,data) => {
    try{
        const res = await axiosInstance.put(`/departments/${id}/`,data);
        return res;

    }catch(err){
        throw err
    }
}

export const deleteDepartment = async(id) => {
    try{
       const res = await axiosInstance.delete(`/departments/${id}/`);
       return res;
    }catch(err){
        throw err
    }
}