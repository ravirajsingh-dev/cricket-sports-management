import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { validateForm } from "@src/utils/validation";
import {
  TAB_KEYS,
  TAB_LABELS,
  initialFormData,
  initialLoginPasswordForm,
  initialTxnPasswordForm,
  initialSetTxnForm,
} from "../myAccountConstants";

export const useMyAccountController = ({
  adminAuth,
  setErrors,
  removeAllErrors,
  getMyProfile,
  updateMyProfile,
  changePassword,
  changeTxnPassword,
  setTxnPassword,
}) => {
  const admin = adminAuth?.admin;
  const isSubAdmin = Boolean(admin?.isSubAdmin);
  const loadingOnChangePassword = adminAuth?.loadingOnChangePassword;

  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [formData, setFormData] = useState(initialFormData);
  const [fieldTouched, setFieldTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState(
    initialTab && Object.values(TAB_KEYS).includes(initialTab)
      ? initialTab
      : TAB_KEYS.profile,
  );
  const [isProfileEditable, setIsProfileEditable] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [loginPasswordForm, setLoginPasswordForm] = useState(
    initialLoginPasswordForm,
  );
  const [txnPasswordForm, setTxnPasswordForm] = useState(initialTxnPasswordForm);
  const [setTxnForm, setSetTxnForm] = useState(initialSetTxnForm);
  const [isTxnSet, setIsTxnSet] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentTxnPassword, setShowCurrentTxnPassword] = useState(false);
  const [showNewTxnPassword, setShowNewTxnPassword] = useState(false);
  const [showConfirmTxnPassword, setShowConfirmTxnPassword] = useState(false);
  const [showSetTxnPassword, setShowSetTxnPassword] = useState(false);
  const [showSetTxnConfirmPassword, setShowSetTxnConfirmPassword] =
    useState(false);
  const [isLoginPasswordEditable, setIsLoginPasswordEditable] = useState(false);
  const [isTxnPasswordEditable, setIsTxnPasswordEditable] = useState(false);

  useEffect(() => {
    removeAllErrors();
  }, [removeAllErrors]);

  useEffect(() => {
    const run = async () => {
      setProfileLoaded(false);
      const result = await getMyProfile();
      if (result?.status && result?.data) {
        setFormData({
          name: result.data.name || "",
          phone: result.data.phone || "",
          email: result.data.email || "",
        });
        setIsTxnSet(
          Boolean(result.data.isTxnPassSet) || Boolean(admin?.isTxnPassSet),
        );
      } else {
        setFormData({
          name: admin?.name || "",
          phone: admin?.phone || "",
          email: admin?.email || "",
        });
        setIsTxnSet(Boolean(admin?.isTxnPassSet));
      }
      setFieldTouched({});
      setSubmitAttempted(false);
      setIsProfileEditable(false);
      setProfileLoaded(true);
    };

    run();
  }, [getMyProfile]);

  const profileValidationRules = useMemo(() => {
    const rules = [
      { path: "name", msg: "Please enter a valid name." },
      { path: "email", msg: "Please enter a valid email address." },
    ];
    if (!isSubAdmin) {
      rules.push({ path: "phone", msg: "Please enter a valid phone number." });
    }
    return rules;
  }, [isSubAdmin]);

  const localValidationErrors = useMemo(() => {
    const errors = {};
    const validationErrors = validateForm(formData, profileValidationRules);
    validationErrors.forEach((error) => {
      errors[error.path] = error.msg;
    });

    if (formData.name && formData.name.trim().length < 3) {
      errors.name = "Name must be at least 3 characters.";
    }

    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      errors.email = "Please enter a valid email address.";
    }

    if (
      !isSubAdmin &&
      formData.phone &&
      !/^\d{10}$/.test(formData.phone.trim())
    ) {
      errors.phone = "Phone must be a 10-digit number.";
    }

    return errors;
  }, [formData, isSubAdmin, profileValidationRules]);

  const visibleLocalErrors = useMemo(() => {
    const errors = {};
    Object.entries(localValidationErrors).forEach(([path, msg]) => {
      if (fieldTouched[path] || submitAttempted) errors[path] = msg;
    });
    return errors;
  }, [fieldTouched, localValidationErrors, submitAttempted]);

  const activeTabLabel = useMemo(
    () => TAB_LABELS[activeTab] || TAB_LABELS[TAB_KEYS.profile],
    [activeTab],
  );

  const onChange = (e) => {
    if (!e?.target) return;
    const { name, value } = e.target;
    let sanitizedValue = value;
    if (name === "name") sanitizedValue = value.replace(/[^\w\s.-]/g, "");
    if (name === "phone") sanitizedValue = value.replace(/\D/g, "").slice(0, 10);
    if (name === "email") sanitizedValue = value.trim().toLowerCase();
    setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
  };

  const onBlur = (e) => {
    const name = e?.target?.name;
    if (!name) return;
    setFieldTouched((prev) => ({ ...prev, [name]: true }));
  };

  const resetProfileForm = () => {
    setFormData({
      name: admin?.name || "",
      phone: admin?.phone || "",
      email: admin?.email || "",
    });
    setFieldTouched({});
    setSubmitAttempted(false);
    removeAllErrors();
    setIsProfileEditable(false);
  };

  const resetLoginPasswordForm = () => {
    setLoginPasswordForm(initialLoginPasswordForm);
    removeAllErrors();
    setIsLoginPasswordEditable(false);
  };

  const resetTxnPasswordForm = () => {
    setTxnPasswordForm(initialTxnPasswordForm);
    setSetTxnForm(initialSetTxnForm);
    removeAllErrors();
    setIsTxnPasswordEditable(false);
  };

  const onProfileSubmit = async (e) => {
    e.preventDefault();
    const submitIntent =
      e?.nativeEvent?.submitter?.getAttribute("data-submit-intent") || "";
    if (submitIntent !== "save-profile") return;
    if (!isProfileEditable) return;

    removeAllErrors();
    setSubmitAttempted(true);

    const errors = validateForm(formData, profileValidationRules);
    if (errors.length) {
      setErrors(errors);
      return;
    }

    if (Object.keys(localValidationErrors).length) {
      setErrors(
        Object.entries(localValidationErrors).map(([path, msg]) => ({
          path,
          msg,
        })),
      );
      return;
    }

    setIsSavingProfile(true);
    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
    };
    if (!isSubAdmin) {
      payload.phone = formData.phone.trim();
    }

    const result = await updateMyProfile(payload);
    if (result?.status) {
      setIsProfileEditable(false);
    }
    setIsSavingProfile(false);
  };

  const onLoginPasswordSubmit = async (e) => {
    e.preventDefault();
    removeAllErrors();

    const errors = validateForm(loginPasswordForm, [
      { path: "currentPassword", msg: "Please provide your current password." },
      { path: "newPassword", msg: "Please provide a valid new password." },
      { path: "confirmPassword", msg: "Please confirm your new password." },
    ]);
    if (errors.length) {
      setErrors(errors);
      return;
    }
    if (loginPasswordForm.newPassword !== loginPasswordForm.confirmPassword) {
      setErrors([{ path: "confirmPassword", msg: "Passwords do not match." }]);
      return;
    }

    await changePassword(loginPasswordForm);
    resetLoginPasswordForm();
  };

  const onTxnPasswordSubmit = async (e) => {
    e.preventDefault();
    removeAllErrors();

    if (!isTxnSet) {
      const setErrorsList = validateForm(setTxnForm, [
        {
          path: "txn_password",
          msg: "Please provide a valid transaction password.",
        },
        {
          path: "confirmTxnPassword",
          msg: "Please confirm your transaction password.",
        },
      ]);
      if (setErrorsList.length) {
        setErrors(setErrorsList);
        return;
      }
      if (setTxnForm.txn_password !== setTxnForm.confirmTxnPassword) {
        setErrors([
          {
            path: "confirmTxnPassword",
            msg: "Transaction passwords do not match.",
          },
        ]);
        return;
      }

      await setTxnPassword({ txn_password: setTxnForm.txn_password });
      setIsTxnSet(true);
      resetTxnPasswordForm();
      return;
    }

    const errors = validateForm(txnPasswordForm, [
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
    if (txnPasswordForm.newTxnPassword !== txnPasswordForm.confirmTxnPassword) {
      setErrors([
        {
          path: "confirmTxnPassword",
          msg: "Transaction passwords do not match.",
        },
      ]);
      return;
    }

    await changeTxnPassword(txnPasswordForm);
    resetTxnPasswordForm();
  };

  const handleTabSelect = (tabKey) => {
    if (activeTab === TAB_KEYS.profile && isProfileEditable) {
      resetProfileForm();
    }
    if (activeTab === TAB_KEYS.loginPassword && isLoginPasswordEditable) {
      resetLoginPasswordForm();
    }
    if (activeTab === TAB_KEYS.txnPassword && isTxnPasswordEditable) {
      resetTxnPasswordForm();
    }
    setActiveTab(tabKey || TAB_KEYS.profile);
    removeAllErrors();
  };

  return {
    activeTab,
    activeTabLabel,
    formData,
    isSubAdmin,
    isProfileEditable,
    isSavingProfile,
    isLoginPasswordEditable,
    isTxnPasswordEditable,
    isTxnSet,
    loadingOnChangePassword,
    profileLoaded,
    loginPasswordForm,
    txnPasswordForm,
    setTxnForm,
    showCurrentPassword,
    showNewPassword,
    showConfirmPassword,
    showCurrentTxnPassword,
    showNewTxnPassword,
    showConfirmTxnPassword,
    showSetTxnPassword,
    showSetTxnConfirmPassword,
    visibleLocalErrors,
    setLoginPasswordForm,
    setTxnPasswordForm,
    setSetTxnForm,
    setShowCurrentPassword,
    setShowNewPassword,
    setShowConfirmPassword,
    setShowCurrentTxnPassword,
    setShowNewTxnPassword,
    setShowConfirmTxnPassword,
    setShowSetTxnPassword,
    setShowSetTxnConfirmPassword,
    onChange,
    onBlur,
    onProfileSubmit,
    onLoginPasswordSubmit,
    onTxnPasswordSubmit,
    handleTabSelect,
    resetProfileForm,
    resetLoginPasswordForm,
    resetTxnPasswordForm,
    setIsProfileEditable,
    setIsLoginPasswordEditable,
    setIsTxnPasswordEditable,
  };
};
