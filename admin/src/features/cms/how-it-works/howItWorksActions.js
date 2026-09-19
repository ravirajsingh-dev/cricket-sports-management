import api from "@src/utils/axiosSetup";
import { setAlert } from "@src/app/state/actions/alert";
import { setErrorsList } from "@src/app/state/actions/errors";
import { removeErrors } from "@src/app/state/reducers/errors";
import { adminLogout } from "@src/features/auth";
import {
  howItWorksSettingsLoaded,
  loadingHowItWorksSettings,
  savingHowItWorksSettings,
  howItWorksSettingsSaved,
  howItWorksError,
} from "@src/features/cms/how-it-works/howItWorksReducer";

export const getHowItWorksSettings = () => async (dispatch) => {
  try {
    dispatch(loadingHowItWorksSettings());
    const res = await api.get("/api/admin/how-it-works/settings");

    if (res.data?.status && res.data.response) {
      dispatch(howItWorksSettingsLoaded(res.data.response));
    } else {
      const errorMsg = res.data?.message || "Error fetching how it works settings";
      dispatch(howItWorksError({ msg: errorMsg, status: 400 }));
      dispatch(setAlert(errorMsg, "danger"));
    }
  } catch (err) {
    if (err.response?.data && err.response.data.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      const errorMsg =
        err.response?.data?.message || "Error fetching how it works settings";
      dispatch(setAlert(errorMsg, "danger"));
      dispatch(howItWorksError());
    }
  }
};

export const updateHowItWorksSettings = (payload, onSuccess) => async (dispatch) => {
  dispatch(removeErrors());
  try {
    dispatch(savingHowItWorksSettings());
    const res = await api.put("/api/admin/how-it-works/settings", payload);

    if (res.data?.status) {
      dispatch(howItWorksSettingsSaved(res.data.response));
      dispatch(setAlert("How it works settings updated successfully.", "success"));
      if (onSuccess) {
        onSuccess();
      }
    } else {
      const errors = res.data?.errors || [];
      dispatch(howItWorksError());
      dispatch(
        setAlert(res.data?.message || "Error updating how it works settings", "danger")
      );
      errors.forEach((error) => {
        dispatch(setErrorsList(error.msg, error.path));
      });
    }
  } catch (err) {
    if (err.response?.data && err.response.data.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      dispatch(
        howItWorksError({
          msg: err.response?.statusText,
          status: err.response?.status,
        })
      );
      const errors = err.response?.data?.errors || [];
      errors.forEach((error) => {
        dispatch(setErrorsList(error.msg, error.path));
      });
      dispatch(
        setAlert(
          err.response?.data?.message || "Error updating how it works settings",
          "danger"
        )
      );
    }
  }
};

export const removeHowItWorksErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};
