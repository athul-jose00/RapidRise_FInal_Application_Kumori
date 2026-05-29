import axios from "axios";
import { setTokens, logoutUser } from "../redux/user/userSlice";

// Allow overriding via env if needed; default to localhost:3000
export const API_ROOT = "http://localhost:3000";

export const axiosInstance = axios.create({ baseURL: API_ROOT });

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export function attachInterceptors(store) {
  // add auth header from store on every request
  axiosInstance.interceptors.request.use((config) => {
    try {
      const token = store.getState().user?.accessToken;
      if (token)
        config.headers = {
          ...(config.headers || {}),
          Authorization: `Bearer ${token}`,
        };
    } catch (e) {
      // ignore
    }
    return config;
  });

  axiosInstance.interceptors.response.use(
    (res) => res,
    async (error) => {
      const originalRequest = error.config;
      const status = error.response?.status;

      if ((status === 401 || status === 403) && !originalRequest._retry) {
        originalRequest._retry = true;

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            subscribeTokenRefresh((token) => {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(axiosInstance(originalRequest));
            });
          });
        }

        isRefreshing = true;
        try {
          const refreshToken = store.getState().user?.refreshToken;
          if (!refreshToken) throw new Error("No refresh token");
          const refreshRes = await axios.post(`${API_ROOT}/api/auth/refresh`, {
            refreshToken,
          });
          const newAccess = refreshRes.data?.accessToken;
          const newRefresh = refreshRes.data?.refreshToken;
          if (!newAccess)
            throw new Error("No access token from refresh response");

          // update tokens in redux
          store.dispatch(
            setTokens({ accessToken: newAccess, refreshToken: newRefresh }),
          );
          onRefreshed(newAccess);
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          isRefreshing = false;
          return axiosInstance(originalRequest);
        } catch (err) {
          isRefreshing = false;
          // refresh failed -> logout user
          store.dispatch(logoutUser());
          return Promise.reject(err);
        }
      }

      return Promise.reject(error);
    },
  );
}

export default axiosInstance;
