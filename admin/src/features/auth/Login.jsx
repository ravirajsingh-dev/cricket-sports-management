import React, { useEffect, useState } from "react";
import { Row, Col, Button, Form, InputGroup, Container } from "react-bootstrap";
import { useNavigate } from "react-router";
import { connect } from "react-redux";

// Custom Imports
import { validateForm } from "@src/utils/validation";
import Errors from "@src/notifications/Errors";
import {
  adminLogin,
  setErrors,
  removeAdminLoginErrors,
  verifyForgotPasswordEmailAdminId,
  sendForgotPasswordEmailOtp,
  resendForgotPasswordEmailOtp,
  verifyForgotPasswordEmailOtp,
  resetPasswordWithEmailOtp,
} from "@src/features/auth";
import { getAdminCredentials } from "@src/utils/credentialsHelper";
import AdminForgotPasswordEmailOtpModal from "@src/features/auth/ForgotPasswordEmailOtpModal";
import { getFirstAllowedRoute } from "@src/utils/permissions";
import BouncingLoader from "@src/components/common/Loaders/BouncingLoader";

// Icons
import { AiOutlineEyeInvisible, AiOutlineEye } from "react-icons/ai";
import { FaRegUser } from "react-icons/fa";
import { BiLockAlt } from "react-icons/bi";

const AdminLogin = ({
  errorList,
  setErrors,
  removeAdminLoginErrors,
  adminLogin,
  adminAuth,
  verifyForgotPasswordEmailAdminId,
  sendForgotPasswordEmailOtp,
  resendForgotPasswordEmailOtp,
  verifyForgotPasswordEmailOtp,
  resetPasswordWithEmailOtp,
}) => {
  const navigate = useNavigate();

  const initialFormData = {
    admin_id: "",
    password: "",
    rememberPassword: false,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [validated, setValidated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordEmailOtpModal, setShowForgotPasswordEmailOtpModal] =
    useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState("");

  const { admin_id, password, rememberPassword } = formData;

  // Get loading states from Redux
  const isVerifyingAdminId = adminAuth.forgotPasswordEmailVerifyAdminIdLoading;
  const isSendingOtp = adminAuth.forgotPasswordEmailSendOtpLoading;
  const isResendingOtp = adminAuth.forgotPasswordEmailResendOtpLoading;
  const isVerifyingOtp = adminAuth.forgotPasswordEmailVerifyOtpLoading;
  const isResettingPassword = adminAuth.forgotPasswordEmailResetLoading;

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const handleCloseModal = () => {
    setShowForgotPasswordEmailOtpModal(false);
    setForgotPasswordSuccess("");
  };

  const handleVerifyAdminId = async (adminId) => {
    try {
      const response = await verifyForgotPasswordEmailAdminId(adminId);
      return response;
    } catch (err) {
      throw err;
    }
  };

  const handleSendOtp = async (adminId, email) => {
    try {
      const response = await sendForgotPasswordEmailOtp(adminId, email);
      return response;
    } catch (err) {
      throw err;
    }
  };

  const handleResendOtp = async (adminId) => {
    try {
      const response = await resendForgotPasswordEmailOtp(adminId);
      return response;
    } catch (err) {
      throw err;
    }
  };

  const handleVerifyOtp = async (adminId, otp) => {
    try {
      const response = await verifyForgotPasswordEmailOtp(adminId, otp);
      return response;
    } catch (err) {
      throw err;
    }
  };

  const handleResetPassword = async (
    adminId,
    otp,
    password,
    confirmPassword,
  ) => {
    try {
      const response = await resetPasswordWithEmailOtp(
        adminId,
        otp,
        password,
        confirmPassword,
      );
      if (response && response.msg) {
        setForgotPasswordSuccess(response.msg);
      }
      return response;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    const storedCredentials = getAdminCredentials();
    if (storedCredentials?.rememberPassword && storedCredentials?.admin_id) {
      setFormData({
        ...formData,
        admin_id: storedCredentials.admin_id,
        password: "",
        rememberPassword: true,
      });
    }
  }, []);

  // Already authenticated — bounce off the login page
  useEffect(() => {
    if (adminAuth?.isAdminAuthenticated === true && adminAuth?.admin) {
      const firstRoute =
        getFirstAllowedRoute(adminAuth.admin) || "/admin/no-access";
      navigate(firstRoute, { replace: true });
    }
  }, [adminAuth?.isAdminAuthenticated, adminAuth?.admin, navigate]);

  if (adminAuth?.isAdminAuthenticated === null) {
    return <BouncingLoader minHeight="100vh" />;
  }

  if (adminAuth?.isAdminAuthenticated === true && adminAuth?.admin) {
    return <BouncingLoader minHeight="100vh" />;
  }

  const onChange = (e) => {
    if (!e.target) {
      return;
    }
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    const newFormData = { ...formData, [name]: newValue };
    setFormData(newFormData);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    removeAdminLoginErrors();

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
    }

    setValidated(true);

    let validationRules = [
      {
        path: "admin_id",
        msg: "Please provide a valid Admin ID.",
      },
      {
        path: "password",
        msg: "Please provide a valid password.",
      },
    ];

    const errors = validateForm(formData, validationRules);

    if (errors.length) {
      setErrors(errors);
      return;
    }

    const submitData = {};

    for (let i in formData) {
      if (
        formData[i] === "" ||
        formData[i] === null ||
        formData[i] === undefined
      )
        continue;
      submitData[i] = formData[i];
    }

    // do validation here
    adminLogin(submitData, navigate);
  };

  return (
    <Container className="auth-container" fluid>
      <Row className="auth-login ">
        <Col xs={11} sm={11} md={6} lg={4} className="auth-login-card mt-0">
          <Form
            noValidate
            validated={validated}
            onSubmit={onSubmit}
            className="p-2 my-2 registration-form"
          >
            <Row className="mb-4">
              <Col xs={12} className="user-auth-heading  ">
                <span className="secondary-color-border">Admin Login</span>
              </Col>
              <Form.Group controlId="admin_id" as={Col} md="12">
                <Form.Label className="auth-lable">
                  <FaRegUser size={20} className="auth-lable-icon" />
                  Admin ID
                </Form.Label>
                <Row>
                  <Col xs={12}>
                    <Form.Control
                      required
                      type="text"
                      name="admin_id"
                      value={admin_id.toUpperCase()}
                      maxLength="15"
                      minLength="8"
                      onChange={(e) => onChange(e)}
                      placeholder="Please enter Admin ID"
                      autoComplete="username"
                      aria-invalid={Boolean(errorList.admin_id)}
                      aria-describedby={
                        errorList.admin_id ? "admin_id-error" : undefined
                      }
                      className={`text-muted ${
                        errorList.admin_id ? "invalid" : ""
                      }`}
                    />
                    <Errors current_key="admin_id" key="admin_id" />
                  </Col>
                </Row>
              </Form.Group>
            </Row>
            <Row className="mb-3">
              <Form.Group controlId="password" as={Col} md="12">
                <Form.Label className="auth-lable">
                  <BiLockAlt size={23} className="auth-lable-icon" />
                  Password
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    name="password"
                    autoComplete="current-password"
                    aria-invalid={Boolean(errorList.password)}
                    aria-describedby={
                      errorList.password ? "password-error" : undefined
                    }
                    className={`text-muted ${
                      errorList.password ? "invalid" : ""
                    }`}
                    onChange={(e) => onChange(e)}
                    placeholder="Password"
                  />
                  <InputGroup.Text
                    as="button"
                    type="button"
                    className="show-password-icon text-muted"
                    onClick={toggleShowPassword}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <AiOutlineEye size={20} />
                    ) : (
                      <AiOutlineEyeInvisible size={20} />
                    )}
                  </InputGroup.Text>
                  <Errors current_key="password" key="password" />
                </InputGroup>
              </Form.Group>
            </Row>

            <Form.Group
              controlId="rememberPassword"
              className="mb-3 remember-me"
            >
              <Form.Check
                label="Remember me"
                className="text-muted"
                name="rememberPassword"
                checked={rememberPassword}
                onChange={(e) => onChange(e)}
              />
            </Form.Group>

            <Row>
              <Col xs={12} className="text-center">
                <Button type="submit" className="btn-auth-default">
                  Login
                </Button>
              </Col>
            </Row>

            <Row>
              <Col xs={12} className="text-center">
                <Button
                  variant="link"
                  onClick={() => setShowForgotPasswordEmailOtpModal(true)}
                >
                  Forgot Password?
                </Button>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>

      {/* Admin Forgot Password via Email OTP Modal */}
      <AdminForgotPasswordEmailOtpModal
        show={showForgotPasswordEmailOtpModal}
        onHide={handleCloseModal}
        onVerifyAdminId={handleVerifyAdminId}
        onSendOtp={handleSendOtp}
        onResendOtp={handleResendOtp}
        onVerifyOtp={handleVerifyOtp}
        onResetPassword={handleResetPassword}
        isVerifyingAdminId={isVerifyingAdminId}
        isSendingOtp={isSendingOtp}
        isResendingOtp={isResendingOtp}
        isVerifyingOtp={isVerifyingOtp}
        isResetting={isResettingPassword}
        successMessage={forgotPasswordSuccess}
      />
    </Container>
  );
};

const mapStateToProps = (state) => ({
  errorList: state.errors,
  adminAuth: state.adminAuth,
});

export default connect(mapStateToProps, {
  setErrors,
  removeAdminLoginErrors,
  adminLogin,
  verifyForgotPasswordEmailAdminId,
  sendForgotPasswordEmailOtp,
  resendForgotPasswordEmailOtp,
  verifyForgotPasswordEmailOtp,
  resetPasswordWithEmailOtp,
})(AdminLogin);
