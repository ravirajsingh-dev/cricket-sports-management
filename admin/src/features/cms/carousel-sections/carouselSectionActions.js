import api from "@src/utils/axiosSetup";
import { setAlert } from "@src/app/state/actions/alert";
import { setErrorsList } from "@src/app/state/actions/errors";
import { removeErrors } from "@src/app/state/reducers/errors";
import { adminLogout } from "@src/features/auth";
import {
  itemCreated,
  resetCarouselSections,
  itemListUpdated,
  itemUpdated,
  itemDeleted,
  itemError,
  searchParameterUpdate,
  loadingOnItemSubmit,
  loadingItemList,
  loadingGroups,
  groupsUpdated,
} from "@src/features/cms/carousel-sections/carouselSectionReducer";

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

export const getCarouselItems = (itemParams) => async (dispatch) => {
  try {
    const config = buildParamsConfig(itemParams);
    dispatch(loadingItemList());

    const res = await api.get(`/api/admin/carousel-sections`, config);

    if (res.data?.status && res.data.response?.[0]) {
      dispatch(searchParameterUpdate(itemParams));
      dispatch(itemListUpdated(res.data.response[0]));
    } else if (res.data?.status === false) {
      const errorMsg = res.data.message || "Error fetching carousel items";
      dispatch(itemError({ msg: errorMsg, status: 400 }));
      dispatch(setAlert(errorMsg, "danger"));
    }
  } catch (err) {
    if (err.response?.data && err.response.data.tokenStatus === 0) {
      dispatch(adminLogout());
    } else if (err.response) {
      dispatch(
        itemError({
          msg: err.response.statusText,
          status: err.response.status,
        }),
      );
      dispatch(
        setAlert(
          err.response?.data?.message || "Error fetching carousel items",
          "danger",
        ),
      );
    }
  }
};

export const createCarouselItem = (formData, onSuccess) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    dispatch(loadingOnItemSubmit());

    const res = await api.post(`/api/admin/carousel-sections`, formData, config);
    if (res.data.status === true) {
      dispatch(itemCreated(res.data.response));
      dispatch(setAlert("Carousel item created successfully.", "success"));
      if (onSuccess) onSuccess();
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(itemError());
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
          itemError({
            msg: err.response.statusText,
            status: err.response.status,
          }),
        );
      dispatch(
        setAlert(
          err.response?.data?.message || "Error creating carousel item",
          "danger",
        ),
      );
    }
  }
};

export const updateCarouselItem =
  (formData, id, onSuccess) => async (dispatch) => {
    dispatch(removeErrors());
    try {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };
      dispatch(loadingOnItemSubmit());
      const res = await api.put(
        `/api/admin/carousel-sections/${id}`,
        formData,
        config,
      );
      if (res.data.status === true) {
        dispatch(itemUpdated(res.data.response));
        dispatch(setAlert("Carousel item updated successfully.", "success"));
        if (onSuccess) onSuccess();
      } else {
        const errors = res.data.errors;
        if (errors) {
          dispatch(itemError());
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
            itemError({
              msg: err.response.statusText,
              status: err.response.status,
            }),
          );
        dispatch(
          setAlert(
            err.response?.data?.message || "Error updating carousel item",
            "danger",
          ),
        );
      }
    }
  };

export const deleteCarouselItem = (id, txn_password) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        txn_password,
      },
    };
    await api.delete(`/api/admin/carousel-sections/${id}`, config);

    dispatch(itemDeleted(id));
    dispatch(setAlert("Carousel item deleted successfully", "success"));
  } catch (err) {
    err.response &&
      dispatch(
        itemError({
          msg: err.response.statusText,
          status: err.response.status,
        }),
      );
    dispatch(
      setAlert(
        err.response?.data?.message || "Error deleting carousel item",
        "danger",
      ),
    );
  }
};

export const getCarouselGroups = () => async (dispatch) => {
  try {
    dispatch(loadingGroups());
    const res = await api.get("/api/admin/carousel-sections/groups");

    if (res.data?.status && res.data.response) {
      dispatch(groupsUpdated(res.data.response));
    } else if (res.data?.status === false) {
      const errorMsg = res.data.message || "Error fetching carousel groups";
      dispatch(itemError({ msg: errorMsg, status: 400 }));
      dispatch(setAlert(errorMsg, "danger"));
    }
  } catch (err) {
    if (err.response?.data && err.response.data.tokenStatus === 0) {
      dispatch(adminLogout());
    } else if (err.response) {
      dispatch(
        itemError({
          msg: err.response.statusText,
          status: err.response.status,
        }),
      );
      dispatch(
        setAlert(
          err.response?.data?.message || "Error fetching carousel groups",
          "danger",
        ),
      );
    }
  }
};

export const createCarouselGroup = (payload, onSuccess) => async (dispatch) => {
  dispatch(removeErrors());
  try {
    const res = await api.post("/api/admin/carousel-sections/groups", payload);
    if (res.data?.status === true) {
      dispatch(setAlert("Carousel group created successfully.", "success"));
      dispatch(getCarouselGroups());
      if (onSuccess) onSuccess();
    } else {
      const errors = res.data?.errors || [];
      dispatch(setAlert(res.data?.message || "Error creating group", "danger"));
      errors.forEach((error) => {
        dispatch(setErrorsList(error.msg, error.path));
      });
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    if (err.response?.data && err.response.data.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      dispatch(
        setAlert(
          err.response?.data?.message || "Error creating carousel group",
          "danger",
        ),
      );
    }
  }
};

export const updateCarouselGroup =
  (id, payload, onSuccess) => async (dispatch) => {
    dispatch(removeErrors());
    try {
      const res = await api.put(
        `/api/admin/carousel-sections/groups/${id}`,
        payload,
      );
      if (res.data?.status === true) {
        dispatch(setAlert("Carousel group updated successfully.", "success"));
        dispatch(getCarouselGroups());
        if (onSuccess) onSuccess();
      } else {
        const errors = res.data?.errors || [];
        dispatch(
          setAlert(res.data?.message || "Error updating group", "danger"),
        );
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
      return res.data ? res.data : { status: false };
    } catch (err) {
      if (err.response?.data && err.response.data.tokenStatus === 0) {
        dispatch(adminLogout());
      } else {
        dispatch(
          setAlert(
            err.response?.data?.message || "Error updating carousel group",
            "danger",
          ),
        );
      }
    }
  };

export const deleteCarouselGroup = (id, txn_password) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        txn_password,
      },
    };
    const res = await api.delete(
      `/api/admin/carousel-sections/groups/${id}`,
      config,
    );
    if (res.data?.status === false) {
      dispatch(setAlert(res.data.message || "Error deleting group", "danger"));
      return;
    }
    dispatch(setAlert("Carousel group deleted successfully", "success"));
    dispatch(getCarouselGroups());
  } catch (err) {
    dispatch(
      setAlert(
        err.response?.data?.message || "Error deleting carousel group",
        "danger",
      ),
    );
  }
};

export const resetComponentStore = () => async (dispatch) => {
  await dispatch(resetCarouselSections());
};

export const removeCarouselErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};
