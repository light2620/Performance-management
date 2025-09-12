import axios from "axios";
import { tokenService } from "./tokenService";

const axiosInstance = axios.create({
  baseURL: "https://demerits.authorityentrepreneurs.com/api/v1/",
  headers: { "Content-Type": "application/json" },
});

// ---- attach access token
axiosInstance.interceptors.request.use((config) => {
  const at = tokenService.getAccess();
  if (at) config.headers.Authorization = `Bearer ${at}`;
  return config;
});

// ---- single-flight refresh queue
let isRefreshing = false;
let queue = [];
const flushQueue = (err, token = null) => {
  queue.forEach(({ resolve, reject }) => (err ? reject(err) : resolve(token)));
  queue = [];
};

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (!error.response) return Promise.reject(error);
    if (error.response.status !== 401 || original._retry) return Promise.reject(error);

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push({
          resolve: (newAccess) => {
            if (newAccess) original.headers.Authorization = `Bearer ${newAccess}`;
            resolve(axiosInstance(original));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      // ---- Refresh token flow
      const refresh = tokenService.getRefresh();
      if (!refresh) throw new Error("No refresh token available");

      const baseURL = axiosInstance.defaults.baseURL || "";
      const { data } = await axios.post(
        `${baseURL}accounts/refresh/`,
        { refresh },
        { headers: { "Content-Type": "application/json" } }
      );

      const newAccess = data?.access;
      const newRefresh = data?.refresh;

      if (!newAccess) throw new Error("No access token in refresh response");

      tokenService.setAccess(newAccess);
      if (newRefresh) tokenService.setRefresh(newRefresh); // if rotation supported

      flushQueue(null, newAccess);

      original.headers.Authorization = `Bearer ${newAccess}`;
      return axiosInstance(original);
    } catch (e) {
      flushQueue(e, null);
      tokenService.clear();

      // 🚨 redirect to login when refresh fails
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 200); // small delay to flush UI/toasts

      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;
