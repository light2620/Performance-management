import axiosInstance from "./axiosInstance";




const getAllrequest = async(url) =>{ 
    try{

        const res = await axiosInstance.get(url);
        return res;
    }catch(err){
        throw err
    }
}

const getSingleRequestApi = async(id) => {
    try{
        const res = await axiosInstance.get(`/point-requests/${id}/`)
        return res; 
    }catch(err){
        throw err
    }
}   


const createRequestApi = async(data) => {
    try{
        const res = await axiosInstance.post("/point-requests/",data)
        return res;

    }catch(err){
        throw err
    }
}


const approveRequestApi = async(id) => {

    try{

         const res = await axiosInstance.post(`/point-requests/${id}/approve/`)
         return res;
    }catch(err){
        throw err
    }

}

const rejectRequestApi = async(id) => {

       try{

         const res = await axiosInstance.post(`/point-requests/${id}/reject/`)
         return res;
    }catch(err){
        throw err
    }

}

const deleteRequestApi = async(id) => {
     try{

         const res = await axiosInstance.post(`/point-requests/${id}/cancel/`)
         return res;
    }catch(err){
        throw err
    }
}

export {getAllrequest,createRequestApi,approveRequestApi,rejectRequestApi,deleteRequestApi,getSingleRequestApi}