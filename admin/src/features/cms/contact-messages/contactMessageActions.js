import api from "@src/utils/axiosSetup";
import { setAlert } from "@src/app/state/actions/alert";
import { adminLogout } from "@src/features/auth";
import {
  resetContactMessages,
  contactMessageListUpdated,
  contactMessageDetailUpdated,
  contactMessageDeleted,
  contactMessageError,
  contactMessageSearchParameterUpdate,
  loadingContactMessageList,
  loadingContactMessageDetail,
  clearSelectedContactMessage,
} from "@src/features/cms/contact-messages/contactMessageReducer";

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

export const getContactMessages = (params) => async (dispatch) => {
  try {
    const config = buildParamsConfig(params);
    dispatch(loadingContactMessageList());

    const res = await api.get(`/api/admin/contact-messages`, config);

    if (res.data?.status && res.data.response?.[0]) {
      dispatch(contactMessageSearchParameterUpdate(params));
      dispatch(contactMessageListUpdated(res.data.response[0]));
    } else if (res.data?.status === false) {
      const errorMsg = res.data.message || "Error fetching contact messages";
      dispatch(contactMessageError({ msg: errorMsg, status: 400 }));
      dispatch(setAlert(errorMsg, "danger"));
    }
  } catch (err) {
    if (err.response?.data?.tokenStatus === 0) {
      dispatch(adminLogout());
    } else if (err.response) {
      dispatch(
        contactMessageError({
          msg: err.response.statusText,
          status: err.response.status,
        }),
      );
      dispatch(
        setAlert(
          err.response?.data?.message || "Error fetching contact messages",
          "danger",
        ),
      );
    }
  }
};

export const getContactMessageById = (id) => async (dispatch) => {
  try {
    dispatch(loadingContactMessageDetail());
    const res = await api.get(`/api/admin/contact-messages/${id}`);

    if (res.data?.status) {
      dispatch(contactMessageDetailUpdated(res.data.response));
    } else {
      const errorMsg = res.data?.message || "Error fetching contact message";
      dispatch(contactMessageError({ msg: errorMsg, status: 400 }));
      dispatch(setAlert(errorMsg, "danger"));
    }
  } catch (err) {
    if (err.response?.data?.tokenStatus === 0) {
      dispatch(adminLogout());
    } else {
      dispatch(
        contactMessageError({
          msg: err.response?.statusText,
          status: err.response?.status,
        }),
      );
      dispatch(
        setAlert(
          err.response?.data?.message || "Error fetching contact message",
          "danger",
        ),
      );
    }
  }
};

export const deleteContactMessage = (id, txn_password) => async (dispatch) => {
  try {
    const config = {
      headers: { "Content-Type": "application/json" },
      data: { txn_password },
    };
    await api.delete(`/api/admin/contact-messages/${id}`, config);
    dispatch(contactMessageDeleted(id));
    dispatch(setAlert("Contact message deleted successfully", "success"));
  } catch (err) {
    err.response &&
      dispatch(
        contactMessageError({
          msg: err.response.statusText,
          status: err.response.status,
        }),
      );
    dispatch(
      setAlert(
        err.response?.data?.message || "Error deleting contact message",
        "danger",
      ),
    );
  }
};

export const resetComponentStore = () => async (dispatch) => {
  await dispatch(resetContactMessages());
};

export const clearContactMessageDetail = () => (dispatch) => {
  dispatch(clearSelectedContactMessage());
};
