import { useEffect, useState } from "react";
import { validateForm } from "@src/utils/validation";

const initialPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const initialTxnPasswordForm = {
  currentTxnPassword: "",
  newTxnPassword: "",
  confirmTxnPassword: "",
};

/**
 * Controller hook for admin Change Password page (login + txn tabs).
 */
export const useChangePasswordController = ({
  changePassword,
  changeTxnPassword,
  removeAllErrors,
  setErrors,
  loadingOnChangePassword,
}) => {
  const [activeTab, setActiveTab] = useState("password");
  const [passwordFormData, setPasswordFormData] = useState(initialPasswordForm);
  const [txnPasswordFormData, setTxnPasswordFormData] = useState(
    initialTxnPasswordForm,
  );
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [txnPasswordMatch, setTxnPasswordMatch] = useState(true);
  const [validated, setValidated] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentTxnPassword, setShowCurrentTxnPassword] = useState(false);
  const [showNewTxnPassword, setShowNewTxnPassword] = useState(false);
  const [showConfirmTxnPassword, setShowConfirmTxnPassword] = useState(false);

  useEffect(() => {
    removeAllErrors();
  }, [removeAllErrors]);

  const onSelectTab = (key) => {
    setActiveTab(key);
    removeAllErrors();
  };

  const onPasswordChange = (e) => {
    if (!e.target) return;
    const { name, value } = e.target;
    const next = { ...passwordFormData, [name]: value };
    setPasswordFormData(next);
    if (name === "newPassword" || name === "confirmPassword") {
      setPasswordMatch(next.newPassword === next.confirmPassword);
    }
  };

  const onTxnPasswordChange = (e) => {
    if (!e.target) return;
    const { name, value } = e.target;
    const next = { ...txnPasswordFormData, [name]: value };
    setTxnPasswordFormData(next);
    if (name === "newTxnPassword" || name === "confirmTxnPassword") {
      setTxnPasswordMatch(next.newTxnPassword === next.confirmTxnPassword);
    }
  };

  const onSubmitPassword = (e) => {
    e.preventDefault();
    removeAllErrors();

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
    }

    setValidated(true);

    const errors = validateForm(passwordFormData, [
      { path: "currentPassword", msg: "Please provide your current password." },
      { path: "newPassword", msg: "Please provide a valid new password." },
      { path: "confirmPassword", msg: "Please confirm your new password." },
    ]);

    if (errors.length) {
      setErrors(errors);
      return;
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setErrors([
        { path: "confirmPassword", msg: "Passwords do not match." },
      ]);
      return;
    }

    changePassword({
      currentPassword: passwordFormData.currentPassword,
      newPassword: passwordFormData.newPassword,
      confirmPassword: passwordFormData.confirmPassword,
    });
  };

  const onSubmitTxnPassword = (e) => {
    e.preventDefault();
    removeAllErrors();

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
    }

    setValidated(true);

    const errors = validateForm(txnPasswordFormData, [
      {
        path: "currentTxnPassword",
        msg: "Please provide your current transaction password.",
      },
      {
        path: "newTxnPassword",
        msg: "Please provide a valid new transaction password.",
      },
      {
        path: "confirmTxnPassword",
        msg: "Please confirm your new transaction password.",
      },
    ]);

    if (errors.length) {
      setErrors(errors);
      return;
    }

    if (
      txnPasswordFormData.newTxnPassword !==
      txnPasswordFormData.confirmTxnPassword
    ) {
      setErrors([
        {
          path: "confirmTxnPassword",
          msg: "Transaction passwords do not match.",
        },
      ]);
      return;
    }

    changeTxnPassword({
      currentTxnPassword: txnPasswordFormData.currentTxnPassword,
      newTxnPassword: txnPasswordFormData.newTxnPassword,
      confirmTxnPassword: txnPasswordFormData.confirmTxnPassword,
    });
  };

  return {
    activeTab,
    onSelectTab,
    passwordFormData,
    txnPasswordFormData,
    passwordMatch,
    txnPasswordMatch,
    validated,
    loadingOnChangePassword,
    showCurrentPassword,
    showNewPassword,
    showConfirmPassword,
    showCurrentTxnPassword,
    showNewTxnPassword,
    showConfirmTxnPassword,
    toggleShowCurrentPassword: () =>
      setShowCurrentPassword((v) => !v),
    toggleShowNewPassword: () => setShowNewPassword((v) => !v),
    toggleShowConfirmPassword: () => setShowConfirmPassword((v) => !v),
    toggleShowCurrentTxnPassword: () =>
      setShowCurrentTxnPassword((v) => !v),
    toggleShowNewTxnPassword: () => setShowNewTxnPassword((v) => !v),
    toggleShowConfirmTxnPassword: () =>
      setShowConfirmTxnPassword((v) => !v),
    onPasswordChange,
    onTxnPasswordChange,
    onSubmitPassword,
    onSubmitTxnPassword,
  };
};
