import api from "@src/utils/axiosSetup";
import { setAlert, removeAlert } from "@src/app/state/actions/alert";
import { setErrorsList } from "@src/app/state/actions/errors";
import { normalizeErrors } from "@src/utils/helper";
import {
  saveAdminCredentials,
  removeAdminCredentials,
} from "@src/utils/credentialsHelper";
import { getFirstAllowedRoute } from "@src/utils/permissions";
import { removeErrors } from "@src/app/state/reducers/errors";
import {
  adminLoaded,
  adminLoginSuccess,
  adminAuthError,
  logoutAdminAuth,
  adminLoginFail,
  loadingOnAdminLoginSubmit,
  loadAdminAuthPage,
} from "@src/features/auth/authReducer";

export const adminLogin = (formData, navigate) => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingOnAdminLoginSubmit());
  dispatch(removeAlert());
  try {
    // Admin authentication must use admin_id only - map formData to admin_id
    const submitData = {
      admin_id: formData.admin_id,
      password: formData.password,
    };

    const config = { headers: { "Content-Type": "application/json" } };

    const res = await api.post(`/api/auth/admin`, submitData, config);

    if (res.data.status === true) {
      const { user } = res.data.response;
      // Tokens are now handled via httpOnly cookies from backend
      dispatch(adminLoginSuccess({ user }));
      dispatch(loadAdminAuthPage());

      // Redirect to first allowed route (not hardcoded dashboard)
      const firstRoute = getFirstAllowedRoute(user);
      if (firstRoute) {
        navigate(firstRoute);
      } else {
        // No permissions assigned - redirect to no-access page
        navigate("/admin/no-access");
      }
      dispatch(setAlert("Login successfully", "success"));

      // Remember me — save Admin ID only (never the password)
      if (formData.rememberPassword && submitData.admin_id) {
        saveAdminCredentials(submitData.admin_id);
      } else {
        removeAdminCredentials();
      }
    } else {
      const errors = normalizeErrors(res.data.errors);
      if (errors && errors.length > 0) {
        dispatch(setAlert(res.data.message, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
      dispatch(
        adminLoginFail({
          msg: res.response?.data?.message || res.response?.statusText || "Login failed",
          status: res.response?.status || 400,
        })
      );
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    const errors = normalizeErrors(err.response?.data?.errors);
    if (errors && errors.length > 0) {
      dispatch(setAlert(err.response?.data?.message || "An error occurred", "danger"));
      errors.forEach((error) => {
        dispatch(setErrorsList(error.msg, error.path));
      });
    } else if (err.response?.data?.message) {
      dispatch(setAlert(err.response.data.message, "danger"));
    }

    if (err.response) {
      dispatch(
        adminLoginFail({
          msg: err.response.data?.message || err.response.statusText || "Login failed",
          status: err.response.status || 400,
        })
      );
      if (!errors || errors.length === 0) {
        dispatch(
          setAlert(err.response.data?.message || err.response.statusText || "Login failed", "danger")
        );
      }
      return err.response.data;
    }
  }
};

export const loadAdmin = () => async (dispatch) => {
  try {
    const res = await api.get(`/api/auth/admin/load-admin`, {
      skipAuthRefresh: true,
    });

    if (res.data.status === true && res.data.response) {
      dispatch(adminLoaded(res.data.response));
    }
  } catch (err) {
    const error = err?.response?.data;
    if (error && error.tokenStatus !== 0) {
      dispatch(setAlert(error.msg, "danger"));
    }
  }
};

export const logoutAuthActions = () => async (dispatch) => {
  // Tokens are handled via cookies - backend will clear them on logout
  dispatch(logoutAdminAuth());
};

export const initializeAdminAuth = () => async (dispatch) => {
  try {
    // Make GET request to load admin - cookies will be sent automatically via withCredentials
    const res = await api.get(`/api/auth/admin/load-admin`, {
      withCredentials: true,
      skipAuthRefresh: true,
    });

    if (res.data.status === true && res.data.response) {
      // Response contains user/admin - extract user/admin from response
      const user = res.data.response.user || res.data.response;
      // Dispatch adminLoginSuccess with user
      dispatch(adminLoginSuccess({ user }));
    } else {
      // If no user in response, logout
      dispatch(logoutAdminAuth());
    }
  } catch (error) {
    // If request fails (401 or error), logout
    dispatch(logoutAdminAuth());
  }
};

//Logout from current device
export const adminLogout = () => async (dispatch) => {
  const config = { headers: { "Content-Type": "application/json" } };
  try {
    dispatch(removeAlert());
    dispatch(removeErrors());

    // Cookies will be sent automatically via withCredentials
    const res = await api.put(
      `/api/auth/admin/logout`,
      {},
      config
    );

    if (res.data.status === true) {
      dispatch(logoutAuthActions());
    } else {
      const errors = normalizeErrors(res.data.errors);
      if (errors && errors.length > 0) {
        dispatch(setAlert(res.data.message, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    }
  } catch (err) {
    if (err.response) {
      if (err.response.data && err.response.data.tokenStatus === 0) {
        dispatch(setAlert(err.response.data.msg, "danger"));
        dispatch(logoutAuthActions());
        dispatch(removeErrors());
      } else {
        dispatch(
          adminAuthError({
            msg: err.response.statusText,
            status: err.response.status,
          })
        );
        dispatch(
          setAlert(
            err.response.data.message || err.response.statusText,
            "danger"
          )
        );
      }
    }
  }
};
