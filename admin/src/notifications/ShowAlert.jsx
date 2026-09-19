import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const EMPTY_ALERTS = [];

const ShowAlert = ({ toastOptions = {} }) => {
  const alerts = useSelector((state) => state.alert) ?? EMPTY_ALERTS;

  useEffect(() => {
    if (!alerts?.length) return;

    alerts.forEach((alert) => {
      const { msg: message, alertType: type } = alert;
      if (!type || !message) return;

      switch (type) {
        case "info":
          toast.info(message, toastOptions);
          break;
        case "success":
          toast.success(message, toastOptions);
          break;
        case "warning":
          toast.warning(message, toastOptions);
          break;
        case "error":
        case "danger":
          toast.error(message, toastOptions);
          break;
        default:
          break;
      }
    });
  }, [alerts, toastOptions]);

  return <ToastContainer />;
};

ShowAlert.propTypes = {
  toastOptions: PropTypes.object,
};

export default ShowAlert;
