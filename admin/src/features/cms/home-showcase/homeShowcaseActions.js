import api from "@src/utils/axiosSetup";
import { setAlert } from "@src/app/state/actions/alert";
import { setErrorsList } from "@src/app/state/actions/errors";
import { removeErrors } from "@src/app/state/reducers/errors";
import { adminLogout } from "@src/features/auth";
import {
  homeShowcaseError,
  homeShowcaseLoaded,
  loadingHomeShowcase,
  savingHomeShowcase,
  homeShowcaseSaved,
} from "@src/features/cms/home-showcase/homeShowcaseReducer";

const SECTION_LABELS = {
  impact: "Impact",
  selectors: "Mentors & Selectors",
  testimonials: "Testimonials",
};

export const getHomeShowcase = () => async (dispatch) => {
  try {
    dispatch(loadingHomeShowcase());
    const res = await api.get("/api/admin/home-showcase");

    if (res.data?.status && res.data.response) {
      dispatch(homeShowcaseLoaded(res.data.response));
    } else {
      const errorMsg = res.data?.message || "Error fetching home showcase";
      dispatch(homeShowcaseError({ msg: errorMsg, status: 400 }));
      dispatch(setAlert(errorMsg, "danger"));
    }
  } catch (err) {
    if (err.response?.data && err.response.data.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      dispatch(
        setAlert(
          err.response?.data?.message || "Error fetching home showcase",
          "danger",
        ),
      );
      dispatch(homeShowcaseError());
    }
  }
};

export const updateHomeShowcase =
  (formData, onSuccess, section = null) =>
  async (dispatch) => {
    dispatch(removeErrors());
    try {
      dispatch(savingHomeShowcase(section));
      const res = await api.put("/api/admin/home-showcase", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.status) {
        dispatch(homeShowcaseSaved(res.data.response));
        const label = SECTION_LABELS[section] || "Section";
        dispatch(
          setAlert(
            res.data?.message || `${label} updated successfully.`,
            "success",
          ),
        );
        if (onSuccess) onSuccess();
      } else {
        const errors = res.data?.errors || [];
        dispatch(homeShowcaseError());
        dispatch(
          setAlert(
            res.data?.message || "Error updating home showcase",
            "danger",
          ),
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
          homeShowcaseError({
            msg: err.response?.statusText,
            status: err.response?.status,
          }),
        );
        const errors = err.response?.data?.errors || [];
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
        dispatch(
          setAlert(
            err.response?.data?.message || "Error updating home showcase",
            "danger",
          ),
        );
      }
    }
  };

export const removeHomeShowcaseErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};

export const createSelectorBadge =
  (payload, onSuccess) => async (dispatch) => {
    dispatch(removeErrors());
    try {
      const res = await api.post("/api/admin/home-showcase/badges", payload);
      if (res.data?.status) {
        dispatch(homeShowcaseSaved(res.data.response));
        dispatch(setAlert("Badge created successfully.", "success"));
        if (onSuccess) onSuccess();
      } else {
        const errors = res.data?.errors || [];
        dispatch(
          setAlert(res.data?.message || "Error creating badge", "danger"),
        );
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    } catch (err) {
      if (err.response?.data && err.response.data.tokenStatus === 0) {
        dispatch(adminLogout());
      } else {
        const errors = err.response?.data?.errors || [];
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
        dispatch(
          setAlert(
            err.response?.data?.message || "Error creating badge",
            "danger",
          ),
        );
      }
    }
  };

export const updateSelectorBadge =
  (id, payload, onSuccess) => async (dispatch) => {
    dispatch(removeErrors());
    try {
      const res = await api.put(`/api/admin/home-showcase/badges/${id}`, payload);
      if (res.data?.status) {
        dispatch(homeShowcaseSaved(res.data.response));
        dispatch(setAlert("Badge updated successfully.", "success"));
        if (onSuccess) onSuccess();
      } else {
        const errors = res.data?.errors || [];
        dispatch(
          setAlert(res.data?.message || "Error updating badge", "danger"),
        );
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    } catch (err) {
      if (err.response?.data && err.response.data.tokenStatus === 0) {
        dispatch(adminLogout());
      } else {
        const errors = err.response?.data?.errors || [];
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
        dispatch(
          setAlert(
            err.response?.data?.message || "Error updating badge",
            "danger",
          ),
        );
      }
    }
  };

export const deleteSelectorBadge =
  (id, txnPassword, onSuccess) => async (dispatch) => {
    dispatch(removeErrors());
    try {
      const res = await api.delete(`/api/admin/home-showcase/badges/${id}`, {
        data: { txn_password: txnPassword },
      });
      if (res.data?.status) {
        dispatch(homeShowcaseSaved(res.data.response));
        dispatch(setAlert("Badge deleted successfully.", "success"));
        if (onSuccess) onSuccess();
      } else {
        const errors = res.data?.errors || [];
        dispatch(
          setAlert(res.data?.message || "Error deleting badge", "danger"),
        );
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    } catch (err) {
      if (err.response?.data && err.response.data.tokenStatus === 0) {
        dispatch(adminLogout());
      } else {
        const errors = err.response?.data?.errors || [];
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
        dispatch(
          setAlert(
            err.response?.data?.message || "Error deleting badge",
            "danger",
          ),
        );
      }
    }
  };

export const updateShowcaseSectionSettings =
  (section, payload, onSuccess) => async (dispatch) => {
    dispatch(removeErrors());
    try {
      dispatch(savingHomeShowcase(`${section}-settings`));
      const res = await api.put(
        `/api/admin/home-showcase/${section}/settings`,
        payload,
      );
      if (res.data?.status) {
        dispatch(homeShowcaseSaved(res.data.response));
        dispatch(
          setAlert(
            res.data?.message || "Section settings updated successfully.",
            "success",
          ),
        );
        if (onSuccess) onSuccess();
      } else {
        const errors = res.data?.errors || [];
        dispatch(homeShowcaseError());
        dispatch(
          setAlert(res.data?.message || "Error updating settings", "danger"),
        );
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    } catch (err) {
      if (err.response?.data && err.response.data.tokenStatus === 0) {
        dispatch(adminLogout());
      } else {
        dispatch(homeShowcaseError());
        const errors = err.response?.data?.errors || [];
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
        dispatch(
          setAlert(
            err.response?.data?.message || "Error updating settings",
            "danger",
          ),
        );
      }
    }
  };

export const updateSelectorsSettings = (payload, onSuccess) =>
  updateShowcaseSectionSettings("selectors", payload, onSuccess);

const handleShowcaseApiResult = (dispatch, res, successMsg, onSuccess) => {
  if (res.data?.status) {
    dispatch(homeShowcaseSaved(res.data.response));
    dispatch(setAlert(res.data?.message || successMsg, "success"));
    if (onSuccess) onSuccess();
    return true;
  }
  const errors = res.data?.errors || [];
  dispatch(setAlert(res.data?.message || "Request failed", "danger"));
  errors.forEach((error) => {
    dispatch(setErrorsList(error.msg, error.path));
  });
  return false;
};

const handleShowcaseApiError = (dispatch, err) => {
  if (err.response?.data && err.response.data.tokenStatus === 0) {
    dispatch(adminLogout());
    return;
  }
  const errors = err.response?.data?.errors || [];
  errors.forEach((error) => {
    dispatch(setErrorsList(error.msg, error.path));
  });
  dispatch(
    setAlert(err.response?.data?.message || "Request failed", "danger"),
  );
};

export const createSelectorPerson =
  (formData, onSuccess) => async (dispatch) => {
    dispatch(removeErrors());
    try {
      const res = await api.post("/api/admin/home-showcase/people", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      handleShowcaseApiResult(
        dispatch,
        res,
        "Person added successfully.",
        onSuccess,
      );
    } catch (err) {
      handleShowcaseApiError(dispatch, err);
    }
  };

export const updateSelectorPerson =
  (id, formData, onSuccess) => async (dispatch) => {
    dispatch(removeErrors());
    try {
      const res = await api.put(
        `/api/admin/home-showcase/people/${id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      handleShowcaseApiResult(
        dispatch,
        res,
        "Person updated successfully.",
        onSuccess,
      );
    } catch (err) {
      handleShowcaseApiError(dispatch, err);
    }
  };

export const deleteSelectorPerson =
  (id, txnPassword, onSuccess) => async (dispatch) => {
    dispatch(removeErrors());
    try {
      const res = await api.delete(`/api/admin/home-showcase/people/${id}`, {
        data: { txn_password: txnPassword },
      });
      handleShowcaseApiResult(
        dispatch,
        res,
        "Person deleted successfully.",
        onSuccess,
      );
    } catch (err) {
      handleShowcaseApiError(dispatch, err);
    }
  };

export const createImpactItem = (payload, onSuccess) => async (dispatch) => {
  dispatch(removeErrors());
  try {
    const res = await api.post("/api/admin/home-showcase/impact/items", payload);
    handleShowcaseApiResult(dispatch, res, "Impact stat added successfully.", onSuccess);
  } catch (err) {
    handleShowcaseApiError(dispatch, err);
  }
};

export const updateImpactItem =
  (id, payload, onSuccess) => async (dispatch) => {
    dispatch(removeErrors());
    try {
      const res = await api.put(
        `/api/admin/home-showcase/impact/items/${id}`,
        payload,
      );
      handleShowcaseApiResult(
        dispatch,
        res,
        "Impact stat updated successfully.",
        onSuccess,
      );
    } catch (err) {
      handleShowcaseApiError(dispatch, err);
    }
  };

export const deleteImpactItem =
  (id, txnPassword, onSuccess) => async (dispatch) => {
    dispatch(removeErrors());
    try {
      const res = await api.delete(
        `/api/admin/home-showcase/impact/items/${id}`,
        { data: { txn_password: txnPassword } },
      );
      handleShowcaseApiResult(
        dispatch,
        res,
        "Impact stat deleted successfully.",
        onSuccess,
      );
    } catch (err) {
      handleShowcaseApiError(dispatch, err);
    }
  };

export const createTestimonialItem =
  (payload, onSuccess) => async (dispatch) => {
    dispatch(removeErrors());
    try {
      const res = await api.post(
        "/api/admin/home-showcase/testimonials/items",
        payload,
      );
      handleShowcaseApiResult(
        dispatch,
        res,
        "Testimonial added successfully.",
        onSuccess,
      );
    } catch (err) {
      handleShowcaseApiError(dispatch, err);
    }
  };

export const updateTestimonialItem =
  (id, payload, onSuccess) => async (dispatch) => {
    dispatch(removeErrors());
    try {
      const res = await api.put(
        `/api/admin/home-showcase/testimonials/items/${id}`,
        payload,
      );
      handleShowcaseApiResult(
        dispatch,
        res,
        "Testimonial updated successfully.",
        onSuccess,
      );
    } catch (err) {
      handleShowcaseApiError(dispatch, err);
    }
  };

export const deleteTestimonialItem =
  (id, txnPassword, onSuccess) => async (dispatch) => {
    dispatch(removeErrors());
    try {
      const res = await api.delete(
        `/api/admin/home-showcase/testimonials/items/${id}`,
        { data: { txn_password: txnPassword } },
      );
      handleShowcaseApiResult(
        dispatch,
        res,
        "Testimonial deleted successfully.",
        onSuccess,
      );
    } catch (err) {
      handleShowcaseApiError(dispatch, err);
    }
  };
