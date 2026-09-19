import axios from "axios";
import store from "@src/app/store";
import { logoutAuth, authTokenRefresh } from "@src/features/auth/authReducer";
import { setAlert } from "@src/app/state/actions/alert";
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
let isLoggingOut = false;

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
    url.includes("/api/auth/load-user") ||
    url.includes("/api/auth/refresh-token")
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

      const wasAuthenticated =
        store.getState().auth?.isAuthenticated === true;
      originalRequest._retry = true;

      try {
        const endpoint = `/api/auth/refresh-token`;
        if (!refreshPromise) {
          refreshPromise = axios
            .post(endpoint, {}, { withCredentials: true })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const response = await refreshPromise;

        if (response.data?.status === true) {
          isLoggingOut = false;
          dispatch(authTokenRefresh({}));

          const retryController = attachAbortController(originalRequest);
          ongoingRequests.set(getRequestKey(originalRequest), retryController);

          return api(originalRequest);
        }

        if (!isLoggingOut && wasAuthenticated) {
          isLoggingOut = true;
          dispatch(
            setAlert(
              "Your session expired. Please log in again.",
              "warning",
            ),
          );
          dispatch(logoutAuth());
        }
        return Promise.reject(new Error("Token refresh failed"));
      } catch (refreshError) {
        const refreshStatus = refreshError?.response?.status;
        const hadSession = refreshStatus !== 400;

        if (!isLoggingOut && wasAuthenticated && hadSession) {
          isLoggingOut = true;
          dispatch(
            setAlert(
              "Your session expired. Please log in again.",
              "warning",
            ),
          );
          dispatch(logoutAuth());
        }
        console.error("Token refresh failed:", refreshError);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
