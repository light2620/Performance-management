import axiosInstance from "./axiosInstance";

export const getAllDepartmentApi = async() => {
    try{
        const res = await axiosInstance.get("departments");
        return res;

    }catch(err){
        throw err
    }
}