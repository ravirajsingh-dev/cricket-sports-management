import api from "@src/utils/axiosSetup";
import { setAlert, removeAlert } from "@src/app/state/actions/alert";
import { setErrorsList } from "@src/app/state/actions/errors";
import { removeErrors } from "@src/app/state/reducers/errors";
import {
  setLoadingOnForgotPasswordEmailVerifyMemberId,
  forgotPasswordEmailVerifyMemberIdSuccess,
  forgotPasswordEmailVerifyMemberIdError,
  setLoadingOnForgotPasswordEmailSendOtp,
  forgotPasswordEmailSendOtpSuccess,
  forgotPasswordEmailSendOtpError,
  setLoadingOnForgotPasswordEmailResendOtp,
  forgotPasswordEmailResendOtpSuccess,
  forgotPasswordEmailResendOtpError,
  setLoadingOnForgotPasswordEmailVerifyOtp,
  forgotPasswordEmailVerifyOtpSuccess,
  forgotPasswordEmailVerifyOtpError,
  setLoadingOnForgotPasswordEmailReset,
  forgotPasswordEmailResetSuccess,
  forgotPasswordEmailResetError,
} from "@src/features/auth/authReducer";

export const verifyForgotPasswordEmailMemberId =
  (memberId) => async (dispatch) => {
    try {
      dispatch(removeErrors());
      dispatch(setLoadingOnForgotPasswordEmailVerifyMemberId());
      dispatch(removeAlert());

      const config = {
        headers: {
          "Content-Type": "application/json",
        },
        allowDuplicates: true,
      };

      const res = await api.post(
        `/api/auth/forgot-password-email/verify-member-id`,
        { memberId },
        config,
      );

      if (res.data.status === true) {
        dispatch(forgotPasswordEmailVerifyMemberIdSuccess(res.data.response));
        return res.data.response;
      } else {
        dispatch(forgotPasswordEmailVerifyMemberIdError());
        const errors = res.data.errors;
        if (errors && errors.length > 0) {
          const userMessage =
            errors[0].msg || res.data.message || "Invalid Member ID";
          dispatch(setAlert(userMessage, "danger"));
          errors.forEach((error) => {
            dispatch(setErrorsList(error.msg, error.path));
          });
        }
        throw new Error(
          errors && errors.length > 0
            ? errors[0].msg
            : res.data.message || "Invalid Member ID",
        );
      }
    } catch (err) {
      dispatch(forgotPasswordEmailVerifyMemberIdError());
      const errors = err.response?.data?.errors;
      if (errors && errors.length > 0) {
        const userMessage =
          errors[0].msg || err.response?.data?.message || "Invalid Member ID";
        dispatch(setAlert(userMessage, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
        throw new Error(userMessage);
      } else {
        const userMessage =
          err.response?.data?.message || err.message || "Invalid Member ID";
        dispatch(setAlert(userMessage, "danger"));
        throw new Error(userMessage);
      }
    }
  };

export const sendForgotPasswordEmailOtp =
  (memberId, email) => async (dispatch) => {
    try {
      dispatch(removeErrors());
      dispatch(setLoadingOnForgotPasswordEmailSendOtp());
      dispatch(removeAlert());

      const config = {
        headers: {
          "Content-Type": "application/json",
        },
        allowDuplicates: true,
      };

      const res = await api.post(
        `/api/auth/forgot-password-email/send-otp`,
        { memberId, email },
        config,
      );

      if (res.data.status === true) {
        dispatch(forgotPasswordEmailSendOtpSuccess(res.data.response));
        return res.data.response;
      } else {
        dispatch(forgotPasswordEmailSendOtpError());
        const errors = res.data.errors;
        if (errors && errors.length > 0) {
          const userMessage =
            errors[0].msg || res.data.message || "Failed to send OTP";
          dispatch(setAlert(userMessage, "danger"));
          errors.forEach((error) => {
            dispatch(setErrorsList(error.msg, error.path));
          });
        }
        throw new Error(
          errors && errors.length > 0
            ? errors[0].msg
            : res.data.message || "Failed to send OTP",
        );
      }
    } catch (err) {
      dispatch(forgotPasswordEmailSendOtpError());
      const errors = err.response?.data?.errors;
      if (errors && errors.length > 0) {
        const userMessage =
          errors[0].msg || err.response?.data?.message || "Failed to send OTP";
        dispatch(setAlert(userMessage, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
        throw new Error(userMessage);
      } else {
        const userMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to send OTP. Please try again.";
        dispatch(setAlert(userMessage, "danger"));
        throw new Error(userMessage);
      }
    }
  };

export const resendForgotPasswordEmailOtp = (memberId) => async (dispatch) => {
  try {
    dispatch(removeErrors());
    dispatch(setLoadingOnForgotPasswordEmailResendOtp());
    dispatch(removeAlert());

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      allowDuplicates: true,
    };

    const res = await api.post(
      `/api/auth/forgot-password-email/resend-otp`,
      { memberId },
      config,
    );

    if (res.data.status === true) {
      dispatch(forgotPasswordEmailResendOtpSuccess(res.data.response));
      return res.data.response;
    } else {
      dispatch(forgotPasswordEmailResendOtpError());
      const errors = res.data.errors;
      if (errors && errors.length > 0) {
        const userMessage =
          errors[0].msg ||
          res.data.message ||
          "Failed to resend OTP. Please try again.";
        dispatch(setAlert(userMessage, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
      }
      throw new Error(
        errors && errors.length > 0
          ? errors[0].msg
          : res.data.message || "Failed to resend OTP. Please try again.",
      );
    }
  } catch (err) {
    dispatch(forgotPasswordEmailResendOtpError());
    const errors = err.response?.data?.errors;
    if (errors && errors.length > 0) {
      const userMessage =
        errors[0].msg ||
        err.response?.data?.message ||
        "Failed to resend OTP. Please try again.";
      dispatch(setAlert(userMessage, "danger"));
      errors.forEach((error) => {
        dispatch(setErrorsList(error.msg, error.path));
      });
      throw new Error(userMessage);
    } else {
      const userMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to resend OTP. Please try again.";
      dispatch(setAlert(userMessage, "danger"));
      throw new Error(userMessage);
    }
  }
};

export const verifyForgotPasswordEmailOtp =
  (memberId, otp) => async (dispatch) => {
    try {
      dispatch(removeErrors());
      dispatch(setLoadingOnForgotPasswordEmailVerifyOtp());
      dispatch(removeAlert());

      const config = {
        headers: {
          "Content-Type": "application/json",
        },
        allowDuplicates: true,
      };

      const res = await api.post(
        `/api/auth/forgot-password-email/verify-otp`,
        { memberId, otp },
        config,
      );

      if (res.data.status === true) {
        dispatch(forgotPasswordEmailVerifyOtpSuccess(res.data.response));
        return res.data.response;
      } else {
        dispatch(forgotPasswordEmailVerifyOtpError());
        const errors = res.data.errors;
        if (errors && errors.length > 0) {
          const userMessage =
            errors[0].msg || res.data.message || "Invalid or expired OTP";
          dispatch(setAlert(userMessage, "danger"));
          errors.forEach((error) => {
            dispatch(setErrorsList(error.msg, error.path));
          });
        }
        throw new Error(
          errors && errors.length > 0
            ? errors[0].msg
            : res.data.message || "Invalid or expired OTP",
        );
      }
    } catch (err) {
      dispatch(forgotPasswordEmailVerifyOtpError());
      const errors = err.response?.data?.errors;
      if (errors && errors.length > 0) {
        const userMessage =
          errors[0].msg ||
          err.response?.data?.message ||
          "Invalid or expired OTP";
        dispatch(setAlert(userMessage, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
        throw new Error(userMessage);
      } else {
        const userMessage =
          err.response?.data?.message ||
          err.message ||
          "Invalid or expired OTP";
        dispatch(setAlert(userMessage, "danger"));
        throw new Error(userMessage);
      }
    }
  };

export const resetPasswordWithEmailOtp =
  (memberId, otp, password, confirmPassword) => async (dispatch) => {
    try {
      dispatch(removeErrors());
      dispatch(setLoadingOnForgotPasswordEmailReset());
      dispatch(removeAlert());

      const config = {
        headers: {
          "Content-Type": "application/json",
        },
        allowDuplicates: true,
      };

      const res = await api.post(
        `/api/auth/forgot-password-email/reset`,
        { memberId, otp, password, confirmPassword },
        config,
      );

      if (res.data.status === true) {
        dispatch(forgotPasswordEmailResetSuccess(res.data.response));
        return res.data.response;
      } else {
        dispatch(forgotPasswordEmailResetError());
        const errors = res.data.errors;
        if (errors && errors.length > 0) {
          const userMessage =
            errors[0].msg ||
            res.data.message ||
            "Password reset failed. Please try again.";
          dispatch(setAlert(userMessage, "danger"));
          errors.forEach((error) => {
            dispatch(setErrorsList(error.msg, error.path));
          });
        }
        throw new Error(
          errors && errors.length > 0
            ? errors[0].msg
            : res.data.message || "Password reset failed. Please try again.",
        );
      }
    } catch (err) {
      dispatch(forgotPasswordEmailResetError());
      const errors = err.response?.data?.errors;
      if (errors && errors.length > 0) {
        const userMessage =
          errors[0].msg ||
          err.response?.data?.message ||
          "Password reset failed. Please try again.";
        dispatch(setAlert(userMessage, "danger"));
        errors.forEach((error) => {
          dispatch(setErrorsList(error.msg, error.path));
        });
        throw new Error(userMessage);
      } else {
        const userMessage =
          err.response?.data?.message ||
          err.message ||
          "Password reset failed. Please try again.";
        dispatch(setAlert(userMessage, "danger"));
        throw new Error(userMessage);
      }
    }
  };
