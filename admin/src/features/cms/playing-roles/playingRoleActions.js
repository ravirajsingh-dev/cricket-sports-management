import api from "@src/utils/axiosSetup";
import { setAlert } from "@src/app/state/actions/alert";
import { setErrorsList } from "@src/app/state/actions/errors";
import { removeErrors } from "@src/app/state/reducers/errors";
import { adminLogout } from "@src/features/auth";
import {
  playingRoleCreated,
  resetPlayingRoles,
  playingRoleListUpdated,
  playingRoleUpdated,
  playingRoleDeleted,
  playingRoleError,
  playingRoleSearchParameterUpdate,
  loadingOnPlayingRoleSubmit,
  loadingPlayingRoleList,
} from "@src/features/cms/playing-roles/playingRoleReducer";

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

export const getPlayingRoles = (params) => async (dispatch) => {
  try {
    const config = buildParamsConfig(params);
    dispatch(loadingPlayingRoleList());

    const res = await api.get(`/api/admin/playing-roles`, config);

    if (res.data?.status && res.data.response?.[0]) {
      dispatch(playingRoleSearchParameterUpdate(params));
      dispatch(playingRoleListUpdated(res.data.response[0]));
    } else if (res.data?.status === false) {
      const errorMsg = res.data.message || "Error fetching playing roles";
      dispatch(playingRoleError({ msg: errorMsg, status: 400 }));
      dispatch(setAlert(errorMsg, "danger"));
    }
  } catch (err) {
    if (err.response?.data?.tokenStatus === 0) {
      dispatch(adminLogout());
    } else if (err.response) {
      dispatch(
        playingRoleError({
          msg: err.response.statusText,
          status: err.response.status,
        }),
      );
      dispatch(
        setAlert(
          err.response?.data?.message || "Error fetching playing roles",
          "danger",
        ),
      );
    }
  }
};

export const createPlayingRole = (payload, onSuccess) => async (dispatch) => {
  try {
    dispatch(loadingOnPlayingRoleSubmit());
    const res = await api.post(`/api/admin/playing-roles`, payload);
    if (res.data.status === true) {
      dispatch(playingRoleCreated(res.data.response));
      dispatch(setAlert("Playing role created successfully.", "success"));
      if (onSuccess) onSuccess();
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(playingRoleError());
        dispatch(setAlert(res.data.message, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    if (err.response?.data?.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      err.response &&
        dispatch(
          playingRoleError({
            msg: err.response.statusText,
            status: err.response.status,
          }),
        );
      dispatch(
        setAlert(
          err.response?.data?.message || "Error creating playing role",
          "danger",
        ),
      );
    }
  }
};

export const updatePlayingRole = (payload, id, onSuccess) => async (dispatch) => {
  dispatch(removeErrors());
  try {
    dispatch(loadingOnPlayingRoleSubmit());
    const res = await api.put(`/api/admin/playing-roles/${id}`, payload);
    if (res.data.status === true) {
      dispatch(playingRoleUpdated(res.data.response));
      dispatch(setAlert("Playing role updated successfully.", "success"));
      if (onSuccess) onSuccess();
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(playingRoleError());
        dispatch(setAlert(res.data.message, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
    }
    return res.data ? res.data : { status: false };
  } catch (err) {
    if (err.response?.data?.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      err.response &&
        dispatch(
          playingRoleError({
            msg: err.response.statusText,
            status: err.response.status,
          }),
        );
      dispatch(
        setAlert(
          err.response?.data?.message || "Error updating playing role",
          "danger",
        ),
      );
    }
  }
};

export const deletePlayingRole = (id, txn_password) => async (dispatch) => {
  try {
    const config = {
      headers: { "Content-Type": "application/json" },
      data: { txn_password },
    };
    await api.delete(`/api/admin/playing-roles/${id}`, config);
    dispatch(playingRoleDeleted(id));
    dispatch(setAlert("Playing role deleted successfully", "success"));
  } catch (err) {
    err.response &&
      dispatch(
        playingRoleError({
          msg: err.response.statusText,
          status: err.response.status,
        }),
      );
    dispatch(
      setAlert(
        err.response?.data?.message || "Error deleting playing role",
        "danger",
      ),
    );
  }
};

export const resetComponentStore = () => async (dispatch) => {
  await dispatch(resetPlayingRoles());
};

export const removePlayingRoleErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};
