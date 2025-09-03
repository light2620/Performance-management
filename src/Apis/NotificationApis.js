import axiosInstance from "./axiosInstance";

export const getAllNotifications = (params) =>
  axiosInstance.get(params);

export const getUnreadCount = () =>
  axiosInstance.get("/notifications/count/");

export const getNotificationById = (id) =>
  axiosInstance.get(`/notifications/${id}/`);

export const markAsRead = (id) =>
  axiosInstance.post(`/notifications/${id}/mark-read/`);
