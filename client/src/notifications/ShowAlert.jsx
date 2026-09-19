import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { removeAlert } from "@src/app/state/actions/alert";

const EMPTY_ALERTS = [];

const defaultToastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "colored",
};

const ShowAlert = ({ toastOptions = {} }) => {
  const dispatch = useDispatch();
  const alerts = useSelector((state) => state.alert) ?? EMPTY_ALERTS;

  useEffect(() => {
    if (!alerts?.length) {
      return;
    }

    alerts.forEach((alert) => {
      const message = alert.msg;
      const normalizedType =
        alert.alertType === "danger" ? "error" : alert.alertType;
      const toastId = `${normalizedType}:${message}`;
      const finalOptions = {
        ...defaultToastOptions,
        ...toastOptions,
        toastId,
      };

      switch (normalizedType) {
        case "info":
          toast.info(message, finalOptions);
          break;
        case "success":
          toast.success(message, finalOptions);
          break;
        case "warning":
          toast.warning(message, finalOptions);
          break;
        case "error":
          toast.error(message, finalOptions);
          break;
        default:
          toast(message, finalOptions);
          break;
      }
    });
    dispatch(removeAlert());
  }, [alerts, toastOptions, dispatch]);

  return <ToastContainer />;
};

ShowAlert.propTypes = {
  toastOptions: PropTypes.object,
};

export default ShowAlert;
