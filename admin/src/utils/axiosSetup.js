import axios from "axios";
import store from "@src/app/store";
import { logoutAdminAuth, adminAuthTokenRefresh } from "@src/features/auth/authReducer";
import { resolveApiBaseURL } from "@src/utils/apiBaseUrl";

const baseURL = resolveApiBaseURL();

const api = axios.create({
  baseURL,
  withCredentials: true,
});

axios.defaults.baseURL = baseURL;
axios.defaults.withCredentials = true;

const ongoingRequests = new Map();
let refreshPromise = null;

const getRequestKey = (config) => {
  if (!config) return "";
  const { method, url, params, data } = config;
  return [method, url, JSON.stringify(params), JSON.stringify(data)].join("&");
};

const removeRequest = (requestKey) => {
  if (ongoingRequests.has(requestKey)) {
    ongoingRequests.delete(requestKey);
  }
};

const shouldSkipTokenRefresh = (config) => {
  if (!config) return false;
  if (config.skipAuthRefresh) return true;
  const url = config.url || "";
  return (
    url.includes("/api/auth/admin/load-admin") ||
    url.includes("/api/auth/admin/refresh-token")
  );
};

const attachAbortController = (config) => {
  const controller = new AbortController();
  config.signal = controller.signal;
  return controller;
};

api.interceptors.request.use(
  (config) => {
    const requestKey = getRequestKey(config);

    if (!config.allowDuplicates && ongoingRequests.has(requestKey)) {
      return Promise.reject(new Error("Duplicate request in progress"));
    }

    const controller = attachAbortController(config);
    ongoingRequests.set(requestKey, controller);
    config.withCredentials = true;

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    const requestKey = getRequestKey(response.config);
    removeRequest(requestKey);
    return response;
  },
  async (error) => {
    const originalRequest = error?.config;
    const { dispatch } = store;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const requestKey = getRequestKey(originalRequest);
    removeRequest(requestKey);

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      if (shouldSkipTokenRefresh(originalRequest)) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const endpoint = `/api/auth/admin/refresh-token`;
        if (!refreshPromise) {
          refreshPromise = axios
            .post(endpoint, {}, { withCredentials: true })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const response = await refreshPromise;

        const payload = response.data?.response;
        const admin =
          payload &&
          typeof payload === "object" &&
          !Array.isArray(payload)
            ? payload.admin ?? payload
            : undefined;
        if (admin != null && typeof admin === "object") {
          dispatch(adminAuthTokenRefresh({ admin }));
        }

        const retryController = attachAbortController(originalRequest);
        originalRequest.withCredentials = true;
        ongoingRequests.set(getRequestKey(originalRequest), retryController);

        return api(originalRequest);
      } catch (refreshError) {
        dispatch(logoutAdminAuth());
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
