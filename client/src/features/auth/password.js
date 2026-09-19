import api from "@src/utils/axiosSetup";
import { sanitizeApiAlert } from "@src/utils/sanitizeError";
import { setAlert, removeAlert } from "@src/app/state/actions/alert";
import { setErrorsList } from "@src/app/state/actions/errors";
import { removeErrors } from "@src/app/state/reducers/errors";
import {
  setLoadingOnChangePassword,
  changePasswordSuccess,
  changePasswordError,
} from "@src/features/auth/authReducer";

const alertFromResponse = (payload, fallback) =>
  sanitizeApiAlert(payload, fallback);

// Change password
export const changePassword = (formData) => async (dispatch) => {
  try {
    dispatch(removeErrors());
    dispatch(setLoadingOnChangePassword());
    dispatch(removeAlert());
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const res = await api.post(`/api/auth/change-password`, formData, config);

    if (res.data.status === true) {
      dispatch(changePasswordSuccess(res.data.response));
    } else {
      dispatch(changePasswordError());
      const errors = res.data.errors;
      if (errors?.length > 0) {
        dispatch(
          setAlert(
            alertFromResponse(res.data, "Unable to change password."),
            "danger",
          ),
        );
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      } else if (res.data.message) {
        dispatch(setAlert(alertFromResponse(res.data), "danger"));
      }
    }
  } catch (err) {
    const errors = err.response?.data?.errors;
    if (errors?.length > 0) {
      dispatch(setAlert(alertFromResponse(err), "danger"));
      errors.forEach((error) => {
        dispatch(setErrorsList(error.msg, error.path));
      });
    }
    dispatch(changePasswordError());
  }
};
