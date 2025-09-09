// Apis/conversationsApi.js
import axiosInstance from "./axiosInstance";

export const createConversationApi = async ({ conversation_type, content_object_id, participant_ids }) => {
  const url = "/conversations/";
  const body = { conversation_type, content_object_id, participant_ids };
  // axios default baseURL / interceptors assumed; else include full base
  return axiosInstance.post(url, body);
};


export const getAllConversationsApi = () =>{
   return  axiosInstance.get("/conversations/")
}


export const getConversationDetailsApi = (conversationId) =>
  axiosInstance.get(`/conversations/${conversationId}/`);

export const getConversationMessagesApi = (conversationId, params = {}) =>
  // params can be { page: 1, page_size: 50 } if backend supports pagination
  axiosInstance.get(`/conversations/${conversationId}/messages`, { params });


  export const postMessageApi = (conversationId, body) =>
  // Optional fallback to post messages via REST if you prefer server-side send
  axiosInstance.post(`/conversations/${conversationId}/messages`, body);