import api from "@src/utils/axiosSetup";
import { setAlert, removeAlert } from "@src/app/state/actions/alert";
import { setErrorsList } from "@src/app/state/actions/errors";
import { normalizeErrors } from "@src/utils/helper";
import { normalizeApiError } from "@src/utils/apiError";
import { removeErrors } from "@src/app/state/reducers/errors";
import {
  setLoadingOnChangePassword,
  changePasswordSuccess,
  changePasswordError,
} from "@src/features/auth/authReducer";
import { loadAdmin, logoutAuthActions } from "./session";

const LOGIN_PATH = "/";

const dispatchFieldErrors = (dispatch, message, errors) => {
  const fieldErrors = normalizeErrors(errors);
  if (fieldErrors.length > 0) {
    dispatch(setAlert(message, "danger"));
    fieldErrors.forEach((error) => {
      dispatch(setErrorsList(error.msg, error.path));
    });
    return;
  }
  dispatch(setAlert(message, "danger"));
};

// Change password
export const changePassword = (formData) => async (dispatch) => {
  try {
    dispatch(removeErrors());
    dispatch(setLoadingOnChangePassword());
    dispatch(removeAlert());
    const config = {
      "Content-Type": "application/json",
    };

    const res = await api.post(
      `/api/auth/admin/change-password`,
      formData,
      config,
    );

    if (res.data.status === true) {
      dispatch(changePasswordSuccess(res.data.response));
      dispatch(
        setAlert(
          res.data.message ||
            "Password changed successfully. Please log in again.",
          "success",
        ),
      );
      // All sessions are invalidated on backend (global logout)
      setTimeout(() => {
        dispatch(logoutAuthActions());
        window.location.href = LOGIN_PATH;
      }, 2000);
    } else {
      dispatch(changePasswordError());
      dispatchFieldErrors(
        dispatch,
        res.data.message || "Unable to change password.",
        res.data.errors,
      );
    }
  } catch (err) {
    const { message, errors, tokenStatus } = normalizeApiError(
      err,
      "Unable to change password.",
    );
    if (tokenStatus === 0) {
      dispatch(logoutAuthActions());
      return;
    }
    dispatchFieldErrors(dispatch, message, errors);
    dispatch(changePasswordError());
  }
};

export const setTxnPassword = (formData) => async (dispatch) => {
  try {
    dispatch(removeErrors());
    dispatch(setLoadingOnChangePassword());
    dispatch(removeAlert());
    const config = {
      "Content-Type": "application/json",
    };
    const res = await api.post(
      `/api/auth/admin/set-txn-password`,
      formData,
      config,
    );

    if (res.data.status === true) {
      dispatch(changePasswordSuccess(res.data.response));
      dispatch(setAlert(res.data.message, "success"));
      dispatch(loadAdmin());
    } else {
      dispatch(changePasswordError());
      dispatchFieldErrors(
        dispatch,
        res.data.message || "Unable to set transaction password.",
        res.data.errors,
      );
    }
  } catch (err) {
    const { message, errors, tokenStatus } = normalizeApiError(
      err,
      "Unable to set transaction password.",
    );
    if (tokenStatus === 0) {
      dispatch(logoutAuthActions());
      return;
    }
    dispatchFieldErrors(dispatch, message, errors);
    dispatch(changePasswordError());
  }
};

export const changeTxnPassword = (formData) => async (dispatch) => {
  try {
    dispatch(removeErrors());
    dispatch(setLoadingOnChangePassword());
    dispatch(removeAlert());
    const config = {
      "Content-Type": "application/json",
    };

    const res = await api.post(
      `/api/auth/admin/change-txn-password`,
      formData,
      config,
    );

    if (res.data.status === true) {
      dispatch(changePasswordSuccess(res.data.response));
      dispatch(
        setAlert(
          res.data.message ||
            "Transaction password changed successfully. Please log in again.",
          "success",
        ),
      );
      setTimeout(() => {
        dispatch(logoutAuthActions());
        window.location.href = LOGIN_PATH;
      }, 2000);
    } else {
      dispatch(changePasswordError());
      dispatchFieldErrors(
        dispatch,
        res.data.message || "Unable to change transaction password.",
        res.data.errors,
      );
    }
  } catch (err) {
    const { message, errors, tokenStatus } = normalizeApiError(
      err,
      "Unable to change transaction password.",
    );
    if (tokenStatus === 0) {
      dispatch(logoutAuthActions());
      return;
    }
    dispatchFieldErrors(dispatch, message, errors);
    dispatch(changePasswordError());
  }
};
