import axiosInstance from "./axiosInstance";



const getCurrentUserApi = async() =>{ 
    try{
        const response = await axiosInstance.get("users/me")
        return response;

    }catch(err){
        throw err
    }
}


export {getCurrentUserApi}