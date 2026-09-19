import React, { useEffect, useState } from "react";
import { Form, Button, InputGroup } from "react-bootstrap";
import { useNavigate, Link } from "react-router";
import { connect } from "react-redux";

import { validateForm } from "@src/utils/validation";
import Errors from "@src/notifications/Errors";
import {
  login,
  setErrors,
  removeRegistrationErrors,
  verifyForgotPasswordEmailMemberId,
  sendForgotPasswordEmailOtp,
  resendForgotPasswordEmailOtp,
  verifyForgotPasswordEmailOtp,
  resetPasswordWithEmailOtp,
} from "@src/features/auth";
import { setAlert } from "@src/app/state/actions/alert";
import {
  createMemberIdChangeHandler,
  createMemberIdPasteHandler,
  isValidMemberIdFormat,
  getMemberIdHint,
  getMemberIdPhonePart,
  getMemberIdPhonePlaceholder,
  normalizeAbbreviation,
  MEMBER_ID_PHONE_LENGTH,
} from "@src/utils/memberIdFormatter";
import { AiOutlineEyeInvisible, AiOutlineEye } from "react-icons/ai";
import { BiLockAlt } from "react-icons/bi";
import { FaRegUser } from "react-icons/fa";
import { getUserCredentials } from "@src/utils/credentialsHelper";
import ForgotPasswordEmailOtpModal from "./ForgotPasswordEmailOtpModal";
import AuthShell from "@src/features/auth/AuthShell";
import BouncingLoader from "@src/components/common/Loaders/BouncingLoader";

const Login = ({
  errorList,
  setErrors,
  removeRegistrationErrors,
  login,
  verifyForgotPasswordEmailMemberId,
  sendForgotPasswordEmailOtp,
  resendForgotPasswordEmailOtp,
  verifyForgotPasswordEmailOtp,
  resetPasswordWithEmailOtp,
  auth,
  common: { commonSettings, loadingCommonSettings },
}) => {
  const navigate = useNavigate();

  const initialFormData = {
    memberId: "",
    password: "",
    rememberPassword: false,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [validated, setValidated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordEmailOtpModal, setShowForgotPasswordEmailOtpModal] =
    useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState("");

  const { memberId, password, rememberPassword } = formData;
  const abbreviation = normalizeAbbreviation(commonSettings?.abbreviation);
  const memberIdPhone = getMemberIdPhonePart(memberId, abbreviation);

  const isVerifyingMemberId = auth.forgotPasswordEmailVerifyMemberIdLoading;
  const isSendingOtp = auth.forgotPasswordEmailSendOtpLoading;
  const isResendingOtp = auth.forgotPasswordEmailResendOtpLoading;
  const isVerifyingOtp = auth.forgotPasswordEmailVerifyOtpLoading;
  const isResettingPassword = auth.forgotPasswordEmailResetLoading;

  const onChange = (e) => {
    if (!e.target) return;
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData({ ...formData, [name]: newValue });
  };

  const handleMemberIdChange = createMemberIdChangeHandler(
    onChange,
    "memberId",
    abbreviation,
  );
  const handleMemberIdPaste = createMemberIdPasteHandler(abbreviation);

  const toggleShowPassword = () => setShowPassword(!showPassword);

  useEffect(() => {
    const storedCredentials = getUserCredentials();
    if (storedCredentials?.rememberPassword && storedCredentials?.memberId) {
      setFormData({
        ...formData,
        memberId: storedCredentials.memberId,
        password: "",
        rememberPassword: true,
      });
    }
  }, []);

  // Already authenticated — bounce off the login page
  useEffect(() => {
    if (auth?.isAuthenticated === true) {
      navigate("/user/dashboard", { replace: true });
    }
  }, [auth?.isAuthenticated, navigate]);

  // Once abbreviation loads, keep phone digits but rebuild full Member ID prefix
  useEffect(() => {
    if (!abbreviation || !memberId) return;
    const phoneDigits = getMemberIdPhonePart(memberId, abbreviation);
    if (!phoneDigits) return;
    const rebuilt = `${abbreviation}${phoneDigits}`;
    if (rebuilt !== memberId && phoneDigits.length > 0) {
      // Only rebuild when stored/typed value has phone but missing/wrong prefix
      if (!memberId.startsWith(abbreviation)) {
        setFormData((prev) => ({ ...prev, memberId: rebuilt }));
      }
    }
  }, [abbreviation]);

  if (auth?.isAuthenticated === null) {
    return <BouncingLoader />;
  }

  if (auth?.isAuthenticated === true) {
    return <BouncingLoader />;
  }

  const onSubmit = (e) => {
    e.preventDefault();
    removeRegistrationErrors();

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
    }

    setValidated(true);

    const validationRules = [
      {
        path: "memberId",
        msg: "Please enter your 10-digit phone number.",
        validator: (value) => isValidMemberIdFormat(value, abbreviation),
      },
      { path: "password", msg: "Please provide a valid password." },
    ];

    const errors = validateForm(formData, validationRules);
    if (errors.length) {
      setErrors(errors);
      return;
    }

    const submitData = Object.fromEntries(
      Object.entries(formData).filter(
        ([_, v]) => v !== "" && v !== null && v !== undefined,
      ),
    );

    login(submitData, navigate);
  };

  const handleVerifyMemberId = async (memberId) => {
    try {
      const response = await verifyForgotPasswordEmailMemberId(memberId);
      return response;
    } catch (err) {
      throw err;
    }
  };

  const handleSendEmailOtp = async (memberId, email) => {
    try {
      const response = await sendForgotPasswordEmailOtp(memberId, email);
      return response;
    } catch (err) {
      throw err;
    }
  };

  const handleResendEmailOtp = async (memberId) => {
    try {
      const response = await resendForgotPasswordEmailOtp(memberId);
      return response;
    } catch (err) {
      throw err;
    }
  };

  const handleVerifyEmailOtp = async (memberId, otp) => {
    try {
      const response = await verifyForgotPasswordEmailOtp(memberId, otp);
      return response;
    } catch (err) {
      throw err;
    }
  };

  const handleResetPasswordWithEmailOtp = async (
    memberId,
    otp,
    password,
    confirmPassword,
  ) => {
    try {
      await resetPasswordWithEmailOtp(memberId, otp, password, confirmPassword);
      setForgotPasswordSuccess(
        "Password reset successfully! You can now login with your new password.",
      );
    } catch (err) {
      throw err;
    }
  };

  const handleCloseEmailOtpModal = () => {
    setShowForgotPasswordEmailOtpModal(false);
    setTimeout(() => {
      setForgotPasswordSuccess("");
    }, 300);
  };

  const pageTitle = loadingCommonSettings
    ? "Loading..."
    : commonSettings?.abbreviation
      ? `Welcome to ${commonSettings.abbreviation}`
      : "Welcome Back";

  return (
    <>
      <AuthShell
        title={pageTitle}
        subtitle="Sign in with your Member ID to access the community portal"
        loading={loadingCommonSettings}
        footer={
          commonSettings?.registerEnabled !== false ? (
            <>
              Don&apos;t have an account?{" "}
              <Link to="/register" className="auth-link">
                Register
              </Link>
            </>
          ) : null
        }
      >
        <Form noValidate validated={validated} onSubmit={onSubmit} className="auth-form">
          <div className="auth-field">
            <Form.Label htmlFor="memberId" className="auth-field__label">
              <span className="auth-field__label-icon">
                <FaRegUser size={14} />
              </span>
              Member ID <span className="auth-field__required">*</span>
            </Form.Label>
            <InputGroup
              className={`auth-field__member-id ${errorList.memberId ? "is-invalid" : ""}`}
            >
              {abbreviation ? (
                <InputGroup.Text className="auth-field__prefix" title="Abbreviation">
                  {abbreviation}
                </InputGroup.Text>
              ) : null}
              <Form.Control
                required
                type="text"
                id="memberId"
                name="memberId"
                value={memberIdPhone}
                onChange={handleMemberIdChange}
                onPaste={handleMemberIdPaste}
                placeholder={getMemberIdPhonePlaceholder()}
                maxLength={MEMBER_ID_PHONE_LENGTH}
                inputMode="numeric"
                autoComplete="username"
                aria-invalid={Boolean(errorList.memberId)}
                aria-describedby={
                  errorList.memberId ? "memberId-error" : undefined
                }
                disabled={!abbreviation || loadingCommonSettings}
                className={`auth-field__control ${errorList.memberId ? "form-input-invalid" : ""}`}
              />
            </InputGroup>
            <p className="auth-field__hint">{getMemberIdHint(abbreviation)}</p>
            <Errors current_key="memberId" key="memberId" />
          </div>

          <div className="auth-field">
            <Form.Label htmlFor="password" className="auth-field__label">
              <span className="auth-field__label-icon">
                <BiLockAlt size={15} />
              </span>
              Password <span className="auth-field__required">*</span>
            </Form.Label>
            <div className="auth-input-wrap">
              <Form.Control
                required
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                name="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errorList.password)}
                aria-describedby={
                  errorList.password ? "password-error" : undefined
                }
                className={`auth-field__control ${
                  errorList.password ? "form-input-invalid" : ""
                }`}
                onChange={onChange}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="auth-input-wrap__toggle"
                onClick={toggleShowPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <AiOutlineEye size={18} />
                ) : (
                  <AiOutlineEyeInvisible size={18} />
                )}
              </button>
            </div>
            <Errors current_key="password" key="password" />
          </div>

          <div className="auth-row">
            <Form.Group
              htmlFor="rememberPassword"
              className="auth-checkbox auth-checkbox--inline mb-0"
            >
              <Form.Check
                label="Remember me"
                id="rememberPassword"
                name="rememberPassword"
                checked={rememberPassword}
                onChange={onChange}
              />
            </Form.Group>

            <Button
              variant="link"
              className="auth-link--muted p-0"
              onClick={() => setShowForgotPasswordEmailOtpModal(true)}
            >
              Forgot Password?
            </Button>
          </div>

          <div className="auth-actions">
            <Button type="submit" className="auth-btn auth-btn--primary">
              Sign In
            </Button>
          </div>
        </Form>
      </AuthShell>

      <ForgotPasswordEmailOtpModal
        show={showForgotPasswordEmailOtpModal}
        onHide={handleCloseEmailOtpModal}
        onVerifyMemberId={handleVerifyMemberId}
        onSendOtp={handleSendEmailOtp}
        onResendOtp={handleResendEmailOtp}
        onVerifyOtp={handleVerifyEmailOtp}
        onResetPassword={handleResetPasswordWithEmailOtp}
        isVerifyingMemberId={isVerifyingMemberId}
        isSendingOtp={isSendingOtp}
        isResendingOtp={isResendingOtp}
        isVerifyingOtp={isVerifyingOtp}
        isResetting={isResettingPassword}
        successMessage={forgotPasswordSuccess}
      />
    </>
  );
};

const mapStateToProps = (state) => ({
  errorList: state.errors,
  auth: state.auth,
  common: state.common,
});

export default connect(mapStateToProps, {
  setErrors,
  removeRegistrationErrors,
  login,
  setAlert,
  verifyForgotPasswordEmailMemberId,
  sendForgotPasswordEmailOtp,
  resendForgotPasswordEmailOtp,
  verifyForgotPasswordEmailOtp,
  resetPasswordWithEmailOtp,
})(Login);
