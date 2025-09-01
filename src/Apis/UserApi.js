import axiosInstance from "./axiosInstance";



const getCurrentUserApi = async() =>{ 
    try{
        const response = await axiosInstance.get("users/me")
        return response;

    }catch(err){
        throw err
    }
}


const createUserApi = async(data) => {
    try{
        const res = await axiosInstance.post("users/",data);
        return res;

    }catch(err){
        throw err
    }
}

const getAllUserApi = async() => {
    try{
        const res = await axiosInstance.get("users/")
        return res;

    }catch(err){
        throw err
    }
}

const deleteUserApi = async(id) => {
    try{
          const res = await axiosInstance.delete(`users/${id}/`)
          return res;
    }catch(err){
        throw err
    }

}

export {getCurrentUserApi,createUserApi,getAllUserApi,deleteUserApi}