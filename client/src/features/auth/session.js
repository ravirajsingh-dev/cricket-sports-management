import api from "@src/utils/axiosSetup";
import { normalizeErrors } from "@src/utils/helper";
import { sanitizeApiAlert } from "@src/utils/sanitizeError";
import { setAlert, removeAlert } from "@src/app/state/actions/alert";
import { setErrorsList } from "@src/app/state/actions/errors";
import {
  saveUserCredentials,
  removeUserCredentials,
} from "@src/utils/credentialsHelper";
import { removeErrors } from "@src/app/state/reducers/errors";
import {
  userLoaded,
  registerSuccess,
  loginSuccess,
  registerFail,
  authError,
  logoutAuth,
  loginFail,
  loadingOnLoginSubmit,
  loadingOnRegisterSubmit,
} from "@src/features/auth/authReducer";

export const login = (formData, navigate) => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(loadingOnLoginSubmit());
  dispatch(removeAlert());
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      allowDuplicates: true,
    };

    const res = await api.post(`/api/auth`, formData, config);

    if (res.data.status === true) {
      const { user } = res.data.response;
      dispatch(loginSuccess({ user }));

      navigate("/user/dashboard");

      dispatch(setAlert("Login successfully", "success"));

      // Remember me — save Member ID only (never the password)
      if (formData.rememberPassword) {
        saveUserCredentials(formData.memberId);
      } else {
        removeUserCredentials();
      }
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(setAlert(sanitizeApiAlert(res.data), "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
      dispatch(
        loginFail({
          msg: sanitizeApiAlert(res.data),
          status: res.status,
        }),
      );
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    const errors = normalizeErrors(err.response?.data?.errors);
    if (errors.length > 0) {
      dispatch(setAlert(sanitizeApiAlert(err), "danger"));
      errors.forEach((error) => {
        dispatch(setErrorsList(error.msg, error.path));
      });
    }

    if (err.response) {
      dispatch(
        loginFail({
          msg: sanitizeApiAlert(err),
          status: err.response.status,
        }),
      );
      dispatch(setAlert(sanitizeApiAlert(err), "danger"));
      return err.response.data;
    }
  }
};

export const register = (formData) => async (dispatch) => {
  try {
    dispatch(removeAlert());
    dispatch(removeErrors());
    dispatch(loadingOnRegisterSubmit());

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      allowDuplicates: true,
    };

    const res = await api.post(`/api/auth/users/register`, formData, config);

    if (res.data.status === true) {
      dispatch(registerSuccess(res.data.response));
      dispatch(setAlert("Registration successful", "success"));
      return res.data;
    } else {
      dispatch(setAlert(sanitizeApiAlert(res.data, "Something went wrong"), "danger"));
      res.data.errors?.forEach((error) =>
        dispatch(setErrorsList(error.msg, error.path)),
      );
      return res.data ? res?.data?.response?.user : { status: false };
    }
  } catch (errors) {
    if (errors.response) {
      let errorMessage = sanitizeApiAlert(errors);

      // Check if there's an array of errors in the response data
      if (
        errors.response.data.errors &&
        Array.isArray(errors.response.data.errors)
      ) {
        // Extract all messages from the errors array
        const errorMessages = errors.response.data.errors.map(
          (error) => error.msg,
        );
        errorMessage = sanitizeApiAlert(errorMessages.join(", "));
      }

      dispatch(
        registerFail({
          msg: errorMessage,
          status: errors.response.status,
        }),
      );
      dispatch(setAlert("Data not valid please try again", "danger"));
      errors.response.data.errors.forEach((error) => {
        dispatch(setErrorsList(error.msg, error.path));
      });
      return errors.response.data;
    }
  }
};

export const loadUser = () => async (dispatch) => {
  try {
    const res = await api.get(`/api/auth/load-user`, {
      skipAuthRefresh: true,
    });

    if (res.data.status === true && res.data.response) {
      dispatch(userLoaded(res.data.response));
      return { success: true, user: res.data.response };
    }

    dispatch(logoutAuth());
    return { success: false };
  } catch (err) {
    const error = err?.response?.data;
    if (error?.tokenStatus === 0) {
      // Not logged in / expired session — expected on public pages.
      dispatch(logoutAuth());
    } else if (error && error.tokenStatus !== 0) {
      dispatch(setAlert(sanitizeApiAlert(err), "danger"));
      dispatch(logoutAuth());
    } else {
      dispatch(logoutAuth());
    }
    return { success: false };
  }
};

export const logoutAuthActions = () => async (dispatch) => {
  dispatch(logoutAuth());
};

export const initializeAuth = () => async (dispatch) => {
  dispatch(loadUser());
};

//Logout from current device
export const logout = () => async (dispatch) => {
  const config = { headers: { "Content-Type": "application/json" } };
  try {
    dispatch(removeAlert());
    dispatch(removeErrors());

    // Cookies will be sent automatically via withCredentials
    const res = await api.put(`/api/auth/logout`, {}, config);

    if (res.data.status === true) {
      dispatch(logoutAuthActions());
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(setAlert(sanitizeApiAlert(res.data), "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
      // Always logout even if API returns error status
      dispatch(logoutAuthActions());
    }
  } catch (err) {
    if (err.response) {
      if (err.response.data && err.response.data.tokenStatus === 0) {
        dispatch(setAlert(sanitizeApiAlert(err), "danger"));
        dispatch(logoutAuthActions());
        dispatch(removeErrors());
      } else {
        dispatch(
          authError({
            msg: err.response.statusText,
            status: err.response.status,
          }),
        );
        dispatch(setAlert(sanitizeApiAlert(err), "danger"));
        // Ensure logout state is set even on error
        dispatch(logoutAuthActions());
      }
    } else {
      // Network error or no response - still logout locally
      dispatch(logoutAuthActions());
    }
  }
};
