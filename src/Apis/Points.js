import axiosInstance from "./axiosInstance";


const getAllPointsApi = async() => {
    try{
      const res = await axiosInstance.get("/points-aggregates");
      return res;
    }catch(err){
        throw err;
    }
}

const getPerformanceApi = async() => {
    try{
const res = await axiosInstance.get("/points-aggregates/my-summary");
      return res;
    }catch(err){
        throw err;
    }
}
export {getPerformanceApi}