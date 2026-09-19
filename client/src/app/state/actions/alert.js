import { setAlertMsg, removeAlertMsg } from "@src/app/state/reducers/alert";

export const setAlert = (msg, alertType, err_key = "") => {
  return (dispatch) => {
    const id = "";
    dispatch(setAlertMsg({ msg, alertType, err_key, id }));
  };
};

export const removeAlert = () => (dispatch) => {
  dispatch(removeAlertMsg());
};
