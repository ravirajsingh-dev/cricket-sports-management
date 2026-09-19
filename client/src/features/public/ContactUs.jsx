import { Fragment, useEffect, useState } from "react";
import { Col, Container, Form, Row } from "react-bootstrap";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { Helmet } from "react-helmet-async";
import { FaRegCommentDots, FaRegUser } from "react-icons/fa";
import { IoMailOpenOutline } from "react-icons/io5";

import { getCommonSettings } from "@src/app/state/actions/commonActions";
import { setErrors } from "@src/features/auth";
import {
  clearContactMessageErrors,
  submitContactMessage,
} from "@src/features/public/contactMessageActions";
import BouncingLoader from "@src/components/common/Loaders/BouncingLoader";
import CommonSpinner from "@src/components/common/Loaders/CommonSpinner";
import NoRecordsFound from "@src/components/common/NoRecordsFound/NoRecordsFound";
import SocialIcons from "@src/components/common/SocialIcons/SocialIcons";
import { hasSocialLinks } from "@src/components/common/SocialIcons/socialPlatforms";
import CopyIcon from "@src/components/common/CopyIcon";
import Errors from "@src/notifications/Errors";
import { validateForm } from "@src/utils/validation";

const formatTel = (value) => String(value || "").replace(/\s/g, "");

const EMPTY_FORM = {
  name: "",
  email: "",
  message: "",
};

const isContactFormComplete = (formData) =>
  Boolean(
    formData.name?.trim() &&
      formData.email?.trim() &&
      formData.message?.trim(),
  );

const MultilineText = ({ text }) => {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;

  return trimmed.split("\n").map((line, i, arr) => (
    <Fragment key={i}>
      {line}
      {i < arr.length - 1 ? <br /> : null}
    </Fragment>
  ));
};

const ContactMessageForm = ({
  formData,
  onChange,
  onSubmit,
  submitting,
  errorList,
}) => {
  const canSubmit = isContactFormComplete(formData) && !submitting;

  return (
    <section className="contact-us-form-section">
      <div className="contact-us-form-card">
        <h2 className="contact-us-form-section__title">Send us a Message</h2>
        <Form className="contact-us-form" onSubmit={onSubmit} noValidate>
          <div className="auth-field">
            <Form.Label htmlFor="contact-name" className="auth-field__label">
              <span className="auth-field__label-icon">
                <FaRegUser size={14} />
              </span>
              Your Name <span className="auth-field__required">*</span>
            </Form.Label>
            <Form.Control
              required
              type="text"
              id="contact-name"
              name="name"
              value={formData.name}
              onChange={onChange}
              placeholder="Enter your full name"
              maxLength={150}
              autoComplete="name"
              disabled={submitting}
              className={`auth-field__control ${errorList.name ? "form-input-invalid" : ""}`}
            />
            <Errors current_key="name" key="name" />
          </div>

          <div className="auth-field">
            <Form.Label htmlFor="contact-email" className="auth-field__label">
              <span className="auth-field__label-icon">
                <IoMailOpenOutline size={14} />
              </span>
              Email Address <span className="auth-field__required">*</span>
            </Form.Label>
            <Form.Control
              required
              type="email"
              id="contact-email"
              name="email"
              value={formData.email}
              onChange={onChange}
              placeholder="you@example.com"
              maxLength={254}
              autoComplete="email"
              disabled={submitting}
              className={`auth-field__control ${errorList.email ? "form-input-invalid" : ""}`}
            />
            <Errors current_key="email" key="email" />
          </div>

          <div className="auth-field">
            <Form.Label htmlFor="contact-message" className="auth-field__label">
              <span className="auth-field__label-icon">
                <FaRegCommentDots size={14} />
              </span>
              Message <span className="auth-field__required">*</span>
            </Form.Label>
            <Form.Control
              required
              as="textarea"
              rows={5}
              id="contact-message"
              name="message"
              value={formData.message}
              onChange={onChange}
              placeholder="How can we help you?"
              maxLength={500}
              disabled={submitting}
              className={`auth-field__control ${errorList.message ? "form-input-invalid" : ""}`}
            />
            <Errors current_key="message" key="message" />
          </div>

          <div className="contact-us-form__actions">
            <button
              type="submit"
              className="home-btn home-btn--primary home-btn--compact"
              disabled={!canSubmit}
            >
              {submitting ? (
                <>
                  <CommonSpinner
                    size="sm"
                    className="common-spinner--button me-2"
                  />
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </button>
          </div>
        </Form>
      </div>
    </section>
  );
};

ContactMessageForm.propTypes = {
  formData: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
  errorList: PropTypes.object.isRequired,
};

const ContactUs = ({
  common: { commonSettings, loadingCommonSettings },
  getCommonSettings,
  submitContactMessage,
  clearContactMessageErrors,
  setErrors,
  errorList,
}) => {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!commonSettings?.contactUsPage) {
      getCommonSettings();
    }
  }, [getCommonSettings, commonSettings]);

  useEffect(() => {
    clearContactMessageErrors();
    return () => clearContactMessageErrors();
  }, [clearContactMessageErrors]);

  if (loadingCommonSettings) {
    return (
      <div className="contact-us-page">
        <Container>
          <BouncingLoader minHeight="500px" />
        </Container>
      </div>
    );
  }

  const contactUsPage = commonSettings?.contactUsPage || {};
  const socialMedia = commonSettings?.socialMedia || {};
  const orgName = commonSettings?.name?.trim() || "";

  const phone = contactUsPage.phone || "";
  const secondaryPhone = contactUsPage.secondaryPhone || "";
  const email = contactUsPage.email || "";
  const address = contactUsPage.address || "";
  const businessHours = contactUsPage.businessHours || "";

  const hasContent =
    phone || email || address || businessHours || secondaryPhone;

  const hasSocial = hasSocialLinks(socialMedia);

  const pageTitle = contactUsPage.title?.trim() || "Contact Us";
  const intro =
    contactUsPage.intro?.trim() ||
    "We would love to hear from you. Get in touch using the information below.";

  const renderPhone = (phoneNumber, key) => {
    const tel = formatTel(phoneNumber);
    return (
      <span key={key} className="contact-us-copy-row">
        <a
          href={tel ? `tel:${tel}` : undefined}
          className="contact-us-link contact-us-link--plain"
        >
          {phoneNumber}
        </a>
        <CopyIcon
          textToCopy={phoneNumber}
          iconSize={16}
          className="contact-us-copy-btn"
        />
      </span>
    );
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!isContactFormComplete(formData) || submitting) return;

    clearContactMessageErrors();

    const validationErrors = validateForm(formData, [
      { path: "name", msg: "Please provide your name." },
      {
        path: "email",
        msg: "Please provide a valid email address.",
        validator: (value) => value && /\S+@\S+\.\S+/.test(value),
      },
      { path: "message", msg: "Please enter your message." },
    ]);

    if (validationErrors.length) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    await submitContactMessage(
      {
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      },
      () => setFormData(EMPTY_FORM),
    );
    setSubmitting(false);
  };

  const messageForm = (
    <ContactMessageForm
      formData={formData}
      onChange={onChange}
      onSubmit={onSubmit}
      submitting={submitting}
      errorList={errorList}
    />
  );

  const contactInfo = (
    <address className="contact-us-connect">
      {phone || secondaryPhone ? (
        <div className="contact-us-row">
          <span className="contact-us-label">Phone</span>
          <div className="contact-us-phones">
            {phone ? renderPhone(phone, "primary") : null}
            {phone && secondaryPhone ? (
              <span className="contact-us-phone-sep" aria-hidden="true">
                |
              </span>
            ) : null}
            {secondaryPhone ? renderPhone(secondaryPhone, "secondary") : null}
          </div>
        </div>
      ) : null}

      {email ? (
        <div className="contact-us-row">
          <span className="contact-us-label">Email</span>
          <p className="contact-us-email contact-us-copy-row">
            <a
              href={`mailto:${email}`}
              className="contact-us-link contact-us-link--plain"
            >
              {email}
            </a>
            <CopyIcon
              textToCopy={email}
              iconSize={16}
              className="contact-us-copy-btn"
            />
          </p>
        </div>
      ) : null}

      {address ? (
        <div className="contact-us-row">
          <span className="contact-us-label">Address</span>
          <p className="contact-us-address contact-us-copy-row">
            <span className="contact-us-text">
              <MultilineText text={address} />
            </span>
            <CopyIcon
              textToCopy={address.trim()}
              iconSize={16}
              className="contact-us-copy-btn"
            />
          </p>
        </div>
      ) : null}

      {businessHours ? (
        <div className="contact-us-row">
          <span className="contact-us-label">Hours</span>
          <p className="contact-us-hours">
            <span className="contact-us-text">
              <MultilineText text={businessHours} />
            </span>
          </p>
        </div>
      ) : null}

      {hasSocial ? (
        <div className="contact-us-social">
          <span className="contact-us-label">Follow us</span>
          <SocialIcons socialMedia={socialMedia} />
        </div>
      ) : null}
    </address>
  );

  if (!hasContent) {
    return (
      <div className="contact-us-page">
        <Container>
          <NoRecordsFound
            title="Contact information is being updated. Please check back soon."
            compact
          />
          <div className="contact-us-layout contact-us-layout--form-only">
            {messageForm}
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="contact-us-page">
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>

      <section className="contact-us-hero">
        <Container>
          <div className="contact-us-hero__inner">
            <h1 className="contact-us-hero__title">{pageTitle}</h1>
            <p className="contact-us-hero__intro">{intro}</p>
            <span
              className="home-section-header__line contact-us-hero__line"
              aria-hidden="true"
            />
          </div>
        </Container>
      </section>

      {orgName ? (
        <p className="contact-us-name">{orgName}</p>
      ) : null}

      <section className="contact-us-body">
        <Container>
          <Row className="contact-us-layout g-4 g-lg-4">
            <Col lg={8} className="contact-us-layout__info">
              {contactInfo}
            </Col>
            <Col lg={4} className="contact-us-layout__form">
              {messageForm}
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

ContactUs.propTypes = {
  common: PropTypes.object.isRequired,
  getCommonSettings: PropTypes.func.isRequired,
  submitContactMessage: PropTypes.func.isRequired,
  clearContactMessageErrors: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired,
  errorList: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  common: state.common,
  errorList: state.errors,
});

export default connect(mapStateToProps, {
  getCommonSettings,
  submitContactMessage,
  clearContactMessageErrors,
  setErrors,
})(ContactUs);
