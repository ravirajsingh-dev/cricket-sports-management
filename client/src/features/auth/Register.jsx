import React, { useState, useEffect, useMemo } from "react";
import { Form, Button } from "react-bootstrap";
import { useNavigate, Link } from "react-router";
import { connect } from "react-redux";

import { AiOutlineEyeInvisible, AiOutlineEye } from "react-icons/ai";
import { BiLockAlt } from "react-icons/bi";
import { FaRegUser, FaCheckCircle, FaBullseye, FaMapMarkerAlt } from "react-icons/fa";
import { MdOutlinePhone, MdLocationCity } from "react-icons/md";
import { IoMailOpenOutline } from "react-icons/io5";

import { validateForm } from "@src/utils/validation";
import Errors from "@src/notifications/Errors";
import {
  register,
  setErrors,
  removeRegistrationErrors,
} from "@src/features/auth";
import { setAlert } from "@src/app/state/actions/alert";
import { handleNumberInput } from "@src/utils/helper";
import AdvancedModal from "@src/components/common/Modal/AdvancedModal";
import CopyIcon from "@src/components/common/CopyIcon";
import BouncingLoader from "@src/components/common/Loaders/BouncingLoader";
import CommonSpinner from "@src/components/common/Loaders/CommonSpinner";
import CustomSelect from "@src/components/common/CustomSelect";
import { getOptionByValue } from "@src/constants/CustomSelectValues";
import AuthShell from "@src/features/auth/AuthShell";
import api from "@src/utils/axiosSetup";
import { getMemberIdPhonePart } from "@src/utils/memberIdFormatter";
import { DEFAULT_COUNTRY } from "@src/utils/locationData";
import useIndiaLocationOptions from "./useIndiaLocationOptions";

const Register = ({
  errorList,
  setErrors,
  removeRegistrationErrors,
  register,
  loadingRegister,
  setAlert,
  auth,
  common: { commonSettings, loadingCommonSettings },
}) => {
  const navigate = useNavigate();

  const initialFormData = {
    name: "",
    phone: "",
    email: "",
    playingRole: "",
    country: DEFAULT_COUNTRY.name,
    countryId: DEFAULT_COUNTRY.id,
    state: "",
    stateId: "",
    city: "",
    cityId: "",
    password: "",
    confirmPassword: "",
    terms_accepted: false,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [validated, setValidated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    memberId: "",
    name: "",
    password: "",
  });
  const [playingRoleOptions, setPlayingRoleOptions] = useState([]);
  const [loadingPlayingRoles, setLoadingPlayingRoles] = useState(true);

  const {
    name,
    phone,
    email,
    playingRole,
    state,
    stateId,
    city,
    cityId,
    password,
    confirmPassword,
    terms_accepted,
  } = formData;

  const { stateOptions, cityOptions, loadingStates, loadingCities } =
    useIndiaLocationOptions(stateId);

  const registrationAvailable = useMemo(() => {
    if (loadingCommonSettings) return null;
    if (commonSettings?.registerEnabled === false) {
      return {
        allowed: false,
        message:
          "New registrations are currently disabled. Please try again later.",
      };
    }
    return { allowed: true, message: "" };
  }, [commonSettings, loadingCommonSettings]);

  useEffect(() => {
    return () => {
      removeRegistrationErrors();
    };
  }, [removeRegistrationErrors]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoadingPlayingRoles(true);
        const res = await api.get("/api/common/playing-roles");
        if (cancelled) return;

        const roles = Array.isArray(res.data?.response)
          ? res.data.response
          : [];
        setPlayingRoleOptions(
          roles.map((role) => ({
            value: role._id,
            label: `${role.name} - ₹${Number(role.amount || 0).toLocaleString("en-IN")}`,
          })),
        );
      } catch {
        if (!cancelled) {
          setPlayingRoleOptions([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingPlayingRoles(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Already authenticated — bounce off the register page
  useEffect(() => {
    if (auth?.isAuthenticated === true) {
      navigate("/user/dashboard", { replace: true });
    }
  }, [auth?.isAuthenticated, navigate]);

  if (auth?.isAuthenticated === null) {
    return <BouncingLoader />;
  }

  if (auth?.isAuthenticated === true) {
    return <BouncingLoader />;
  }

  const onChange = (e) => {
    if (!e.target) return;
    const { name: fieldName, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    setFormData({ ...formData, [fieldName]: newValue });
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowConfirmPassword = () =>
    setShowConfirmPassword(!showConfirmPassword);

  const validateRegistration = () => {
    removeRegistrationErrors();
    const validationRules = [
      { path: "name", msg: "Please provide a valid name." },
      {
        path: "phone",
        msg: "Please provide a valid phone number.",
        validator: (value) => value.length === 10,
      },
      {
        path: "email",
        msg: "Please provide a valid email address.",
        validator: (value) => value && /\S+@\S+\.\S+/.test(value),
      },
      {
        path: "playingRole",
        msg: "Please select your role.",
        validator: (value) => Boolean(value),
      },
      {
        path: "state",
        msg: "Please select your state.",
        validator: () => Boolean(String(state || "").trim()) && Boolean(Number(stateId)),
      },
      {
        path: "city",
        msg: "Please select your city.",
        validator: () => Boolean(String(city || "").trim()) && Boolean(Number(cityId)),
      },
      {
        path: "password",
        msg: "Password must be at least 6 characters.",
        validator: (value) => value.length >= 6,
      },
      {
        path: "confirmPassword",
        msg: "Passwords do not match.",
        validator: (value) => value === formData.password,
      },
      {
        path: "terms_accepted",
        msg: "You must accept the terms and conditions.",
        validator: (value) => value === true,
      },
    ];

    const errors = validateForm(formData, validationRules);

    if (errors.length) {
      setErrors(errors);
      setValidated(true);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateRegistration()) return;

    setValidated(true);
    setIsProcessing(true);

    try {
      const submitData = {
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
        email: formData.email,
        playingRole: formData.playingRole,
        country: DEFAULT_COUNTRY.name,
        countryId: DEFAULT_COUNTRY.id,
        state: formData.state,
        stateId: Number(formData.stateId),
        city: formData.city,
        cityId: Number(formData.cityId),
      };

      const registerResult = await register(submitData);
      if (registerResult?.status !== true) {
        setIsProcessing(false);
        return;
      }

      const credentials = registerResult.response?.credentials;
      const user = registerResult.response?.user;

      setRegistrationData({
        memberId: credentials?.memberId || user?.memberId || "",
        name: formData.name,
        password: credentials?.password || formData.password,
      });
      setShowWelcomeModal(true);
    } catch {
      setAlert("Something went wrong during registration.", "danger");
    } finally {
      setIsProcessing(false);
    }
  };

  const isBusy = isProcessing || loadingRegister;

  const appName = commonSettings?.abbreviation || "";

  const registerTitle = loadingCommonSettings
    ? "Loading..."
    : commonSettings?.abbreviation
      ? `Begin Your ${commonSettings.abbreviation} Journey`
      : "Begin Your Journey";

  const memberIdCopyValue = getMemberIdPhonePart(
    registrationData.memberId,
    commonSettings?.abbreviation,
  );

  const handleCopyMemberId = () => {
    setAlert("Member ID copied to clipboard", "success");
  };

  const handleCopyPassword = () => {
    setAlert("Password copied to clipboard", "success");
  };

  const handleWelcomeModalClose = () => {
    setShowWelcomeModal(false);
    navigate("/login");
  };

  return (
    <>
      <AuthShell
        title={registerTitle}
        wide
        footer={
          <>
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Login
            </Link>
          </>
        }
      >
        {registrationAvailable?.allowed === false ? (
          <div className="alert alert-warning mb-0" role="alert">
            {registrationAvailable?.message}
            <div className="mt-3">
              <Link to="/login" className="auth-link">
                Go to Login
              </Link>
            </div>
          </div>
        ) : registrationAvailable === null ? (
          <BouncingLoader minHeight="120px" message="Loading..." />
        ) : (
          <Form
            noValidate
            validated={validated}
            className="auth-form auth-form--grid"
            onSubmit={handleSubmit}
          >
            <div className="auth-field auth-field--span">
              <Form.Label htmlFor="name" className="auth-field__label">
                <span className="auth-field__label-icon">
                  <FaRegUser size={14} />
                </span>
                Full Name <span className="auth-field__required">*</span>
              </Form.Label>
              <Form.Control
                required
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={onChange}
                placeholder="Enter your full name"
                className={`auth-field__control ${errorList.name ? "form-input-invalid" : ""}`}
              />
              <Errors current_key="name" key="name" />
            </div>

            <div className="auth-field">
              <Form.Label htmlFor="phone" className="auth-field__label">
                <span className="auth-field__label-icon">
                  <MdOutlinePhone size={15} />
                </span>
                Phone Number <span className="auth-field__required">*</span>
              </Form.Label>
              <Form.Control
                required
                type="tel"
                id="phone"
                name="phone"
                value={phone}
                onChange={onChange}
                maxLength="10"
                minLength="10"
                placeholder="10-digit mobile number"
                className={`auth-field__control ${errorList.phone ? "form-input-invalid" : ""}`}
                onKeyDown={handleNumberInput}
              />
              <Errors current_key="phone" key="phone" />
            </div>

            <div className="auth-field">
              <Form.Label htmlFor="email" className="auth-field__label">
                <span className="auth-field__label-icon">
                  <IoMailOpenOutline size={14} />
                </span>
                Email <span className="auth-field__required">*</span>
              </Form.Label>
              <Form.Control
                required
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={onChange}
                placeholder="you@example.com"
                className={`auth-field__control ${errorList.email ? "form-input-invalid" : ""}`}
              />
              <Errors current_key="email" key="email" />
            </div>

            <div className="auth-field">
              <Form.Label htmlFor="state" className="auth-field__label">
                <span className="auth-field__label-icon">
                  <FaMapMarkerAlt size={14} />
                </span>
                State <span className="auth-field__required">*</span>
              </Form.Label>
              <CustomSelect
                id="state"
                options={stateOptions}
                value={getOptionByValue(stateOptions, stateId)}
                onChange={(option) =>
                  setFormData((prev) => ({
                    ...prev,
                    stateId: option?.value ?? "",
                    state: option?.label ?? "",
                    cityId: "",
                    city: "",
                  }))
                }
                isRequired
                isLoading={loadingStates}
                placeholder="Select your state"
                error={errorList.state || null}
                noOptionsMessage="No states found"
              />
              <Errors current_key="state" key="state" />
            </div>

            <div className="auth-field">
              <Form.Label htmlFor="city" className="auth-field__label">
                <span className="auth-field__label-icon">
                  <MdLocationCity size={15} />
                </span>
                City <span className="auth-field__required">*</span>
              </Form.Label>
              <CustomSelect
                id="city"
                options={cityOptions}
                value={getOptionByValue(cityOptions, cityId)}
                onChange={(option) =>
                  setFormData((prev) => ({
                    ...prev,
                    cityId: option?.value ?? "",
                    city: option?.label ?? "",
                  }))
                }
                isRequired
                isDisabled={!stateId}
                isLoading={loadingCities}
                placeholder={stateId ? "Select your city" : "Select state first"}
                error={errorList.city || null}
                noOptionsMessage="No cities found"
              />
              <Errors current_key="city" key="city" />
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
                  name="password"
                  value={password}
                  onChange={onChange}
                  placeholder="Min. 6 characters"
                  className={`auth-field__control ${errorList.password ? "form-input-invalid" : ""}`}
                  minLength={6}
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

            <div className="auth-field">
              <Form.Label
                htmlFor="confirmPassword"
                className="auth-field__label"
              >
                <span className="auth-field__label-icon">
                  <BiLockAlt size={15} />
                </span>
                Confirm Password <span className="auth-field__required">*</span>
              </Form.Label>
              <div className="auth-input-wrap">
                <Form.Control
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={onChange}
                  placeholder="Re-enter password"
                  className={`auth-field__control ${errorList.confirmPassword ? "form-input-invalid" : ""}`}
                  minLength={6}
                />
                <button
                  type="button"
                  className="auth-input-wrap__toggle"
                  onClick={toggleShowConfirmPassword}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <AiOutlineEye size={18} />
                  ) : (
                    <AiOutlineEyeInvisible size={18} />
                  )}
                </button>
              </div>
              <Errors current_key="confirmPassword" key="confirmPassword" />
            </div>

            <div className="auth-field auth-field--span">
              <Form.Label htmlFor="playingRole" className="auth-field__label">
                <span className="auth-field__label-icon">
                  <FaBullseye size={14} />
                </span>
                Select Your Role <span className="auth-field__required">*</span>
              </Form.Label>
              <CustomSelect
                id="playingRole"
                options={playingRoleOptions}
                value={getOptionByValue(playingRoleOptions, playingRole)}
                onChange={(option) =>
                  setFormData((prev) => ({
                    ...prev,
                    playingRole: option?.value ?? "",
                  }))
                }
                isRequired
                isLoading={loadingPlayingRoles}
                placeholder="Choose your playing role"
                error={errorList.playingRole || null}
                noOptionsMessage="No roles available"
              />
              <Errors current_key="playingRole" key="playingRole" />
            </div>

            <Form.Group
              htmlFor="terms_accepted"
              className="auth-checkbox auth-checkbox--centered auth-field--span"
            >
              <Form.Check
                type="checkbox"
                id="terms_accepted"
                name="terms_accepted"
                checked={terms_accepted}
                onChange={onChange}
                label="I accept the terms and conditions *"
                className={errorList.terms_accepted ? "form-input-invalid" : ""}
              />
              <Errors current_key="terms_accepted" key="terms_accepted" />
            </Form.Group>

            <div className="auth-actions auth-field--span">
              <Button
                type="submit"
                className="auth-btn auth-btn--primary"
                disabled={isBusy}
              >
                {isBusy ? (
                  <>
                    <CommonSpinner
                      size="sm"
                      className="common-spinner--button me-2"
                    />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </div>
          </Form>
        )}
      </AuthShell>

      <AdvancedModal
        show={showWelcomeModal}
        onHide={handleWelcomeModalClose}
        className="welcome-modal"
        size="md"
        backdrop="static"
        keyboard={false}
        closeButton={false}
        icon={
          <div
            className="welcome-modal__icon-ring welcome-modal__icon-ring--success"
            aria-hidden
          >
            <FaCheckCircle className="welcome-modal__icon" />
          </div>
        }
        bodyClassName="welcome-modal__body"
        actions={[
          {
            label: "Go to Login",
            onClick: handleWelcomeModalClose,
            className: "welcome-modal__cta",
          },
        ]}
      >
        <div className="welcome-modal__content">
          <h2 className="welcome-modal__title">
            Congratulations{" "}
            <span className="welcome-modal__name">{registrationData.name}</span>!
          </h2>

          <p className="welcome-modal__subtitle">
            You have successfully registered for the Community Portal
            {appName && (
              <>
                {" "}
                by <strong>{appName.toUpperCase()}</strong>
              </>
            )}
            .
          </p>

          <p className="welcome-modal__message">
            Your account is now active. You can log in and start using the
            portal.
          </p>

          <div className="welcome-modal__credentials">
            <div className="welcome-modal__credential-card">
              <span className="welcome-modal__credential-label">Member ID</span>
              <div className="welcome-modal__credential-value">
                <code>{registrationData.memberId}</code>
                <CopyIcon
                  textToCopy={memberIdCopyValue}
                  onCopy={handleCopyMemberId}
                  className="welcome-modal__copy"
                />
              </div>
            </div>

            {registrationData.password && (
              <div className="welcome-modal__credential-card">
                <span className="welcome-modal__credential-label">Password</span>
                <div className="welcome-modal__credential-value">
                  <code>{registrationData.password}</code>
                  <CopyIcon
                    textToCopy={registrationData.password}
                    onCopy={handleCopyPassword}
                    className="welcome-modal__copy"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="welcome-modal__status welcome-modal__status--success">
            <span className="welcome-modal__status-dot" aria-hidden />
            Status: ACTIVE
          </div>

          <div className="welcome-modal__note">
            <p>
              Thank you for joining our community platform! Together, we can
              unite communities, support education, sports, culture, and make a
              meaningful impact through social initiatives.
            </p>
          </div>
        </div>
      </AdvancedModal>
    </>
  );
};

const mapStateToProps = (state) => ({
  errorList: state.errors,
  loadingRegister: state.auth.loadingRegister,
  auth: state.auth,
  common: state.common,
});

export default connect(mapStateToProps, {
  setErrors,
  removeRegistrationErrors,
  register,
  setAlert,
})(Register);
