import axiosInstance from "./axiosInstance";



const getAllEntriesApi = async(url) => {
    try{
       const res = await axiosInstance.get(url);
       return res;
    }catch(err){
        throw err
    }
}

const createEntriesApi = async(data) => {
    try{
        const res = await axiosInstance.post("/point-entries/",data)
        return res;

    }catch(err){
        throw err
    }
}

const getSingleEntryApi = async(id) => {
    try{
        const res = await axiosInstance.get(`/point-entries/${id}/`)
        return res; 
    }catch(err){
        throw err
    }
}   


const reverseEntryApi = async(id) => {
    try{
       const res = await axiosInstance.post(`/point-entries/${id}/rollback/`)
       return res;
    }catch(err){
        throw err
    }
}

const getHistoryOfEntryApi = async(id) => {
     return  axiosInstance.get(`/point-entries/${id}/history/`)
}
export {getAllEntriesApi,createEntriesApi,reverseEntryApi,getSingleEntryApi,getHistoryOfEntryApi}