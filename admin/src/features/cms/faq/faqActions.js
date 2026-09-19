import api from "@src/utils/axiosSetup";
import { setAlert } from "@src/app/state/actions/alert";
import { setErrorsList } from "@src/app/state/actions/errors";
import { removeErrors } from "@src/app/state/reducers/errors";
import { adminLogout } from "@src/features/auth";
import {
  faqCreated,
  resetFaq,
  faqListUpdated,
  faqUpdated,
  faqDeleted,
  faqError,
  faqSearchParameterUpdate,
  loadingOnFaqSubmit,
  loadingFaqList,
  faqSettingsUpdated,
  loadingFaqSettings,
  savingFaqSettings,
} from "@src/features/cms/faq/faqReducer";

const buildParamsConfig = (params) => ({
  "Content-Type": "application/json",
  params,
  paramsSerializer: {
    serialize: (value) => {
      const searchParams = new URLSearchParams();
      Object.keys(value).forEach((key) => {
        const entry = value[key];
        if (entry === null || entry === undefined || entry === "") return;
        searchParams.append(
          key,
          typeof entry === "object" ? JSON.stringify(entry) : String(entry),
        );
      });
      return searchParams.toString();
    },
  },
});

export const getFaqs = (faqParams) => async (dispatch) => {
  try {
    const config = buildParamsConfig(faqParams);
    dispatch(loadingFaqList());

    const res = await api.get(`/api/admin/faq`, config);

    if (res.data && res.data.status && res.data.response && res.data.response[0]) {
      dispatch(faqSearchParameterUpdate(faqParams));
      dispatch(faqListUpdated(res.data.response[0]));
    } else if (res.data && res.data.status === false) {
      const errorMsg = res.data.message || "Error fetching FAQs";
      dispatch(faqError({ msg: errorMsg, status: 400 }));
      dispatch(setAlert(errorMsg, "danger"));
    }
  } catch (err) {
    if (err.response?.data && err.response.data.tokenStatus === 0) {
      dispatch(adminLogout());
    } else if (err.response) {
      dispatch(
        faqError({
          msg: err.response.statusText,
          status: err.response.status,
        }),
      );
      dispatch(
        setAlert(
          err.response?.data?.message || err.response?.message || "Error fetching FAQs",
          "danger",
        ),
      );
    }
  }
};

export const createFaq = (payload, onSuccess) => async (dispatch) => {
  try {
    dispatch(loadingOnFaqSubmit());
    const res = await api.post(`/api/admin/faq`, payload);
    if (res.data.status === true) {
      dispatch(faqCreated(res.data.response));
      dispatch(setAlert("FAQ created successfully.", "success"));
      if (onSuccess) onSuccess();
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(faqError());
        dispatch(setAlert(res.data.message, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    if (err.response?.data && err.response.data.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      err.response &&
        dispatch(
          faqError({
            msg: err.response.statusText,
            status: err.response.status,
          }),
        );
      dispatch(
        setAlert(err.response?.data?.message || "Error creating FAQ", "danger"),
      );
    }
  }
};

export const updateFaq = (payload, id, onSuccess) => async (dispatch) => {
  dispatch(removeErrors());
  try {
    dispatch(loadingOnFaqSubmit());
    const res = await api.put(`/api/admin/faq/${id}`, payload);
    if (res.data.status === true) {
      dispatch(faqUpdated(res.data.response));
      dispatch(setAlert("FAQ updated successfully.", "success"));
      if (onSuccess) onSuccess();
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(faqError());
        dispatch(setAlert(res.data.message, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    if (err.response?.data && err.response.data.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      err.response &&
        dispatch(
          faqError({
            msg: err.response.statusText,
            status: err.response.status,
          }),
        );
      dispatch(
        setAlert(err.response?.data?.message || "Error updating FAQ", "danger"),
      );
    }
  }
};

export const deleteFaq = (id, txn_password) => async (dispatch) => {
  try {
    const config = {
      headers: { "Content-Type": "application/json" },
      data: { txn_password },
    };
    await api.delete(`/api/admin/faq/${id}`, config);
    dispatch(faqDeleted(id));
    dispatch(setAlert("FAQ deleted successfully", "success"));
  } catch (err) {
    err.response &&
      dispatch(
        faqError({
          msg: err.response.statusText,
          status: err.response.status,
        }),
      );
    dispatch(
      setAlert(err.response?.data?.message || "Error deleting FAQ", "danger"),
    );
  }
};

export const getFaqSettings = () => async (dispatch) => {
  try {
    dispatch(loadingFaqSettings());
    const res = await api.get("/api/admin/faq/settings");

    if (res.data?.status && res.data.response) {
      dispatch(faqSettingsUpdated(res.data.response));
    } else {
      const errorMsg = res.data?.message || "Error fetching FAQ settings";
      dispatch(faqError({ msg: errorMsg, status: 400 }));
      dispatch(setAlert(errorMsg, "danger"));
    }
  } catch (err) {
    if (err.response?.data && err.response.data.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      dispatch(
        setAlert(
          err.response?.data?.message || "Error fetching FAQ settings",
          "danger",
        ),
      );
    }
  }
};

export const updateFaqSettings = (payload, onSuccess) => async (dispatch) => {
  dispatch(removeErrors());
  try {
    dispatch(savingFaqSettings());
    const res = await api.put("/api/admin/faq/settings", payload);

    if (res.data?.status) {
      dispatch(faqSettingsUpdated(res.data.response));
      dispatch(setAlert("FAQ settings updated successfully.", "success"));
      if (onSuccess) onSuccess();
    } else {
      const errors = res.data?.errors || [];
      dispatch(faqError());
      dispatch(
        setAlert(res.data?.message || "Error updating FAQ settings", "danger"),
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
        faqError({
          msg: err.response?.statusText,
          status: err.response?.status,
        }),
      );
      dispatch(
        setAlert(
          err.response?.data?.message || "Error updating FAQ settings",
          "danger",
        ),
      );
    }
  }
};

export const resetComponentStore = () => async (dispatch) => {
  await dispatch(resetFaq());
};

export const removeFaqErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};
