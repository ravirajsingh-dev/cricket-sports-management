import api from "@src/utils/axiosSetup";
import { setAlert } from "@src/app/state/actions/alert";
import { setErrorsList } from "@src/app/state/actions/errors";
import { removeErrors } from "@src/app/state/reducers/errors";
import { adminLogout } from "@src/features/auth";
import {
  teamCreated,
  resetTeams,
  teamListUpdated,
  teamUpdated,
  teamDeleted,
  teamError,
  teamSearchParameterUpdate,
  loadingOnTeamSubmit,
  loadingTeamList,
  loadingTeamGroups,
  teamGroupsUpdated,
  teamSettingsUpdated,
  loadingTeamSettings,
  savingTeamSettings,
} from "@src/features/cms/teams/teamReducer";

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

export const getTeams = (teamParams) => async (dispatch) => {
  try {
    const config = buildParamsConfig(teamParams);
    dispatch(loadingTeamList());

    const res = await api.get(`/api/admin/teams`, config);

    if (res.data && res.data.status && res.data.response && res.data.response[0]) {
      dispatch(teamSearchParameterUpdate(teamParams));
      dispatch(teamListUpdated(res.data.response[0]));
    } else if (res.data && res.data.status === false) {
      const errorMsg = res.data.message || "Error fetching teams";
      dispatch(teamError({ msg: errorMsg, status: 400 }));
      dispatch(setAlert(errorMsg, "danger"));
    }
  } catch (err) {
    if (err.response?.data && err.response.data.tokenStatus === 0) {
      dispatch(adminLogout());
    } else if (err.response) {
      dispatch(
        teamError({
          msg: err.response.statusText,
          status: err.response.status,
        }),
      );
      const errorMsg =
        err.response?.data?.message || err.response?.message || "Error fetching teams";
      dispatch(setAlert(errorMsg, "danger"));
    }
  }
};

export const createTeam = (formData, onSuccess) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    dispatch(loadingOnTeamSubmit());

    const res = await api.post(`/api/admin/teams`, formData, config);
    if (res.data.status === true) {
      dispatch(teamCreated(res.data.response));
      dispatch(setAlert("Team created successfully.", "success"));
      if (onSuccess) {
        onSuccess();
      }
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(teamError());
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
          teamError({
            msg: err.response.statusText,
            status: err.response.status,
          }),
        );
      dispatch(
        setAlert(err.response?.data?.message || "Error creating team", "danger"),
      );
    }
  }
};

export const updateTeam = (formData, id, onSuccess) => async (dispatch) => {
  dispatch(removeErrors());
  try {
    const config = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };
    dispatch(loadingOnTeamSubmit());
    const res = await api.put(`/api/admin/teams/${id}`, formData, config);
    if (res.data.status === true) {
      dispatch(teamUpdated(res.data.response));
      dispatch(setAlert("Team updated successfully.", "success"));
      if (onSuccess) {
        onSuccess();
      }
    } else {
      const errors = res.data.errors;
      if (errors) {
        dispatch(teamError());
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
          teamError({
            msg: err.response.statusText,
            status: err.response.status,
          }),
        );
      dispatch(
        setAlert(err.response?.data?.message || "Error updating team", "danger"),
      );
    }
  }
};

export const deleteTeam = (id, txn_password) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        txn_password,
      },
    };
    await api.delete(`/api/admin/teams/${id}`, config);

    dispatch(teamDeleted(id));
    dispatch(setAlert("Team deleted successfully", "success"));
  } catch (err) {
    err.response &&
      dispatch(
        teamError({
          msg: err.response.statusText,
          status: err.response.status,
        }),
      );
    dispatch(
      setAlert(err.response?.data?.message || "Error deleting team", "danger"),
    );
  }
};

export const getTeamGroups = () => async (dispatch) => {
  try {
    dispatch(loadingTeamGroups());
    const res = await api.get("/api/admin/teams/groups");

    if (res.data?.status && res.data.response) {
      dispatch(teamGroupsUpdated(res.data.response));
    } else if (res.data?.status === false) {
      const errorMsg = res.data.message || "Error fetching team groups";
      dispatch(teamError({ msg: errorMsg, status: 400 }));
      dispatch(setAlert(errorMsg, "danger"));
    }
  } catch (err) {
    if (err.response?.data && err.response.data.tokenStatus === 0) {
      dispatch(adminLogout());
    } else if (err.response) {
      dispatch(
        teamError({
          msg: err.response.statusText,
          status: err.response.status,
        }),
      );
      dispatch(
        setAlert(
          err.response?.data?.message || "Error fetching team groups",
          "danger",
        ),
      );
    }
  }
};

export const createTeamGroup = (payload, onSuccess) => async (dispatch) => {
  dispatch(removeErrors());
  try {
    const res = await api.post("/api/admin/teams/groups", payload);
    if (res.data?.status === true) {
      dispatch(setAlert("Team group created successfully.", "success"));
      dispatch(getTeamGroups());
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
          err.response?.data?.message || "Error creating team group",
          "danger",
        ),
      );
    }
  }
};

export const updateTeamGroup = (id, payload, onSuccess) => async (dispatch) => {
  dispatch(removeErrors());
  try {
    const res = await api.put(`/api/admin/teams/groups/${id}`, payload);
    if (res.data?.status === true) {
      dispatch(setAlert("Team group updated successfully.", "success"));
      dispatch(getTeamGroups());
      if (onSuccess) onSuccess();
    } else {
      const errors = res.data?.errors || [];
      dispatch(setAlert(res.data?.message || "Error updating group", "danger"));
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
          err.response?.data?.message || "Error updating team group",
          "danger",
        ),
      );
    }
  }
};

export const deleteTeamGroup = (id, txn_password) => async (dispatch) => {
  try {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        txn_password,
      },
    };
    const res = await api.delete(`/api/admin/teams/groups/${id}`, config);
    if (res.data?.status === false) {
      dispatch(setAlert(res.data.message || "Error deleting group", "danger"));
      return;
    }
    dispatch(setAlert("Team group deleted successfully", "success"));
    dispatch(getTeamGroups());
  } catch (err) {
    dispatch(
      setAlert(
        err.response?.data?.message || "Error deleting team group",
        "danger",
      ),
    );
  }
};

export const getTeamSettings = () => async (dispatch) => {
  try {
    dispatch(loadingTeamSettings());
    const res = await api.get("/api/admin/teams/settings");

    if (res.data?.status && res.data.response) {
      dispatch(teamSettingsUpdated(res.data.response));
    } else {
      const errorMsg = res.data?.message || "Error fetching team settings";
      dispatch(teamError({ msg: errorMsg, status: 400 }));
      dispatch(setAlert(errorMsg, "danger"));
    }
  } catch (err) {
    if (err.response?.data && err.response.data.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      const errorMsg =
        err.response?.data?.message || "Error fetching team settings";
      dispatch(setAlert(errorMsg, "danger"));
    }
  }
};

export const updateTeamSettings = (payload, onSuccess) => async (dispatch) => {
  dispatch(removeErrors());
  try {
    dispatch(savingTeamSettings());
    const res = await api.put("/api/admin/teams/settings", payload);

    if (res.data?.status) {
      dispatch(teamSettingsUpdated(res.data.response));
      dispatch(setAlert("Teams settings updated successfully.", "success"));
      if (onSuccess) {
        onSuccess();
      }
    } else {
      const errors = res.data?.errors || [];
      dispatch(teamError());
      dispatch(
        setAlert(res.data?.message || "Error updating teams settings", "danger"),
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
        teamError({
          msg: err.response?.statusText,
          status: err.response?.status,
        }),
      );
      dispatch(
        setAlert(
          err.response?.data?.message || "Error updating teams settings",
          "danger",
        ),
      );
    }
  }
};

export const resetComponentStore = () => async (dispatch) => {
  await dispatch(resetTeams());
};

export const removeTeamErrors = () => async (dispatch) => {
  dispatch(removeErrors());
};
