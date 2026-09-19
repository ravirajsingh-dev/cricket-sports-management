import api from "@src/utils/axiosSetup";
import { setAlert } from "@src/app/state/actions/alert";
import { setErrorsList } from "@src/app/state/actions/errors";
import { removeErrors } from "@src/app/state/reducers/errors";

export const submitContactMessage = (formData, onSuccess) => async (dispatch) => {
  dispatch(removeErrors());

  try {
    const res = await api.post("/api/common/contact-messages", formData);

    if (res.data?.status === true) {
      dispatch(
        setAlert(
          res.data.message ||
            "Message sent successfully. We will get back to you soon.",
          "success",
        ),
      );
      if (onSuccess) onSuccess(res.data.response);
      return res.data;
    }

    const errors = res.data?.errors || [];
    dispatch(
      setAlert(res.data?.message || "Unable to send message", "danger"),
    );
    errors.forEach((error) => {
      dispatch(setErrorsList(error.msg, error.path));
    });
    return res.data || { status: false };
  } catch (err) {
    const errors = err.response?.data?.errors || [];
    dispatch(
      setAlert(
        err.response?.data?.message || "Unable to send message",
        "danger",
      ),
    );
    errors.forEach((error) => {
      dispatch(setErrorsList(error.msg, error.path));
    });
    return { status: false };
  }
};

export const clearContactMessageErrors = () => (dispatch) => {
  dispatch(removeErrors());
};
