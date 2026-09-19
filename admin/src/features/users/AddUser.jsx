import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { useNavigate } from "react-router";
import { Button, Form, Row, Col, Container, InputGroup } from "react-bootstrap";
import { AiOutlineEyeInvisible, AiOutlineEye } from "react-icons/ai";

import { validateForm } from "@src/utils/validation";
import { isValidEmail } from "@src/utils/inputValidation";
import Errors from "@src/notifications/Errors";
import CustomSelect from "@src/components/common/CustomSelect";
import { getOptionByValue } from "@src/constants/CustomSelectValues";
import { DEFAULT_COUNTRY } from "@src/utils/locationData";
import useIndiaLocationOptions from "./useIndiaLocationOptions";

import {
  createUser,
  setErrors,
  removeUserErrors,
} from "@src/features/users/userActions";
import MainCard from "@src/components/common/MainCard";
import AppBreadCrumb from "@src/components/common/AppBreadCrumb";

const handleNumberInput = (event) => {
  const allowedKeys = ["Backspace", "Tab", "ArrowLeft", "ArrowRight"];
  if (!/[0-9]/.test(event.key) && !allowedKeys.includes(event.key)) {
    event.preventDefault();
  }
};

const AddUser = ({
  createUser,
  errorList,
  setErrors,
  removeUserErrors,
  loadingUser,
}) => {
  const navigate = useNavigate();

  const initialFormData = {
    name: "",
    phone: "",
    email: "",
    password: "",
    country: DEFAULT_COUNTRY.name,
    countryId: DEFAULT_COUNTRY.id,
    state: "",
    stateId: "",
    city: "",
    cityId: "",
  };

  const [formData, setFormData] = React.useState(initialFormData);
  const [submitting, setSubmitting] = React.useState(false);
  const [validated, setValidated] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const { stateOptions, cityOptions, loadingStates, loadingCities } =
    useIndiaLocationOptions(formData.stateId);

  const onChange = (e) => {
    if (!e.target) return;
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    removeUserErrors();
    setValidated(true);

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.stopPropagation();
      return;
    }

    const validationRules = [
      {
        path: "name",
        msg: "Please provide a valid name.",
      },
      {
        path: "phone",
        msg: "Please provide a valid phone number.",
        validator: (value) => value.length === 10,
      },
      {
        path: "email",
        msg: "Please provide a valid email address.",
        validator: (value) => value && isValidEmail(value),
      },
      {
        path: "state",
        msg: "Please select a state.",
        validator: () =>
          Boolean(String(formData.state || "").trim()) &&
          Boolean(Number(formData.stateId)),
      },
      {
        path: "city",
        msg: "Please select a city.",
        validator: () =>
          Boolean(String(formData.city || "").trim()) &&
          Boolean(Number(formData.cityId)),
      },
      {
        path: "password",
        msg: "Password must be at least 6 characters.",
        validator: (value) => value.length >= 6,
      },
    ];

    const errors = validateForm(formData, validationRules);
    if (errors.length) {
      setErrors(errors);
      return;
    }

    const submitData = {
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      password: formData.password,
      country: DEFAULT_COUNTRY.name,
      countryId: DEFAULT_COUNTRY.id,
      state: formData.state,
      stateId: Number(formData.stateId),
      city: formData.city,
      cityId: Number(formData.cityId),
    };

    setSubmitting(true);
    createUser(submitData, navigate).then(() => {
      setSubmitting(false);
    });
  };

  const onClickCancel = (e) => {
    e.preventDefault();
    navigate("/admin/users-list");
  };

  return (
    <Container>
      <AppBreadCrumb
        breadcrumbs={[
          { name: "Users", path: "/admin/users-list" },
          { name: "Add User" },
        ]}
      />

      <MainCard className="card-body">
        <Form
          noValidate
          validated={validated}
          onSubmit={onSubmit}
          autoComplete="off"
        >
          <Row className="row-gap-3 mb-4">
            <Col xs={12}>
              <h5>Core Information</h5>
            </Col>

            <Col xs={12} md={6} lg={4}>
              <Form.Group controlId="name">
                <Form.Label>
                  Name <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  required
                  className={errorList.name ? "invalid" : ""}
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={onChange}
                  placeholder="Enter full name"
                />
                <Errors current_key="name" />
              </Form.Group>
            </Col>

            <Col xs={12} md={6} lg={4}>
              <Form.Group controlId="phone">
                <Form.Label>
                  Phone <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  required
                  className={errorList.phone ? "invalid" : ""}
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={onChange}
                  maxLength={10}
                  minLength={10}
                  placeholder="Enter phone number"
                  onKeyDown={handleNumberInput}
                />
                <Errors current_key="phone" />
              </Form.Group>
            </Col>

            <Col xs={12} md={6} lg={4}>
              <Form.Group controlId="email">
                <Form.Label>
                  Email <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  required
                  className={errorList.email ? "invalid" : ""}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={onChange}
                  placeholder="Enter email address"
                />
                <Errors current_key="email" />
              </Form.Group>
            </Col>

            <Col xs={12} md={6} lg={4}>
              <Form.Group controlId="country">
                <Form.Label>Country</Form.Label>
                <Form.Control
                  type="text"
                  value={DEFAULT_COUNTRY.name}
                  disabled
                  readOnly
                  className="text-muted"
                />
              </Form.Group>
            </Col>

            <Col xs={12} md={6} lg={4}>
              <Form.Group controlId="state">
                <Form.Label>
                  State <span className="text-danger">*</span>
                </Form.Label>
                <CustomSelect
                  id="state"
                  options={stateOptions}
                  value={getOptionByValue(stateOptions, formData.stateId)}
                  onChange={(option) => {
                    setFormData((prev) => ({
                      ...prev,
                      stateId: option?.value ?? "",
                      state: option?.label ?? "",
                      cityId: "",
                      city: "",
                    }));
                  }}
                  isLoading={loadingStates}
                  isRequired
                  placeholder="Select state"
                  error={errorList.state}
                  noOptionsMessage="No states found"
                />
                <Errors current_key="state" />
              </Form.Group>
            </Col>

            <Col xs={12} md={6} lg={4}>
              <Form.Group controlId="city">
                <Form.Label>
                  City <span className="text-danger">*</span>
                </Form.Label>
                <CustomSelect
                  id="city"
                  options={cityOptions}
                  value={getOptionByValue(cityOptions, formData.cityId)}
                  onChange={(option) => {
                    setFormData((prev) => ({
                      ...prev,
                      cityId: option?.value ?? "",
                      city: option?.label ?? "",
                    }));
                  }}
                  isDisabled={!formData.stateId}
                  isLoading={loadingCities}
                  isRequired
                  placeholder={
                    formData.stateId ? "Select city" : "Select state first"
                  }
                  error={errorList.city}
                  noOptionsMessage="No cities found"
                />
                <Errors current_key="city" />
              </Form.Group>
            </Col>

            <Col xs={12} md={6} lg={4}>
              <Form.Group controlId="password">
                <Form.Label>
                  Password <span className="text-danger">*</span>
                </Form.Label>
                <InputGroup>
                  <Form.Control
                    required
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={onChange}
                    placeholder="Enter password (min 6 characters)"
                    className={errorList.password ? "invalid" : ""}
                    minLength={6}
                  />
                  <InputGroup.Text
                    className="show-password-icon text-muted input-group-text--clickable"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <AiOutlineEye size={20} />
                    ) : (
                      <AiOutlineEyeInvisible size={20} />
                    )}
                  </InputGroup.Text>
                </InputGroup>
                <Errors current_key="password" />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col xs={12} className="text-end">
              <Button
                className="m-2"
                type="submit"
                variant="primary"
                disabled={submitting || loadingUser}
              >
                {submitting || loadingUser ? "Creating..." : "Create User"}
              </Button>
              <Button
                className="m-2"
                type="button"
                variant="secondary"
                onClick={onClickCancel}
                disabled={submitting || loadingUser}
              >
                Cancel
              </Button>
            </Col>
          </Row>
        </Form>
      </MainCard>
    </Container>
  );
};

AddUser.propTypes = {
  createUser: PropTypes.func.isRequired,
  errorList: PropTypes.object.isRequired,
  setErrors: PropTypes.func.isRequired,
  removeUserErrors: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  errorList: state.errors,
  loadingUser: state.adminUsers.loadingUser,
});

export default connect(mapStateToProps, {
  createUser,
  setErrors,
  removeUserErrors,
})(AddUser);
