import React from "react";
import {
  Col,
  Form,
  InputGroup,
  Row,
  Button,
  Container,
  Tabs,
  Tab,
} from "react-bootstrap";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import { AiOutlineEyeInvisible, AiOutlineEye } from "react-icons/ai";

import {
  changePassword,
  changeTxnPassword,
  removeAllErrors,
  setErrors,
} from "@src/features/auth";
import Errors from "@src/notifications/Errors";
import MainCard from "@src/components/common/MainCard";
import AppBreadCrumb from "@src/components/common/AppBreadCrumb";
import { useChangePasswordController } from "./hooks/useChangePasswordController";

const PasswordVisibilityToggle = ({ shown, onToggle }) => (
  <InputGroup.Text
    className="show-password-icon text-muted"
    onClick={onToggle}
  >
    {shown ? <AiOutlineEye size={20} /> : <AiOutlineEyeInvisible size={20} />}
  </InputGroup.Text>
);

PasswordVisibilityToggle.propTypes = {
  shown: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

const ChangePassword = ({
  errorList,
  setErrors,
  changePassword,
  changeTxnPassword,
  removeAllErrors,
  adminAuth: { loadingOnChangePassword },
}) => {
  const ctrl = useChangePasswordController({
    changePassword,
    changeTxnPassword,
    removeAllErrors,
    setErrors,
    loadingOnChangePassword,
  });

  const submitLabel = (idle) =>
    ctrl.loadingOnChangePassword ? "Saving..." : idle;

  return (
    <Container>
      <AppBreadCrumb
        breadcrumbs={[
          { name: "Dashboard", path: "/admin/dashboard" },
          { name: "Change Password" },
        ]}
      />
      <Row>
        <Col xs={12} sm={8} md={6}>
          <MainCard>
            <Tabs
              activeKey={ctrl.activeTab}
              onSelect={ctrl.onSelectTab}
              className="mb-3"
            >
              <Tab eventKey="password" title="Change Password">
                <Form
                  noValidate
                  validated={ctrl.validated}
                  onSubmit={ctrl.onSubmitPassword}
                  className="p-2"
                >
                  <Row className="mb-4 mt-3">
                    <Form.Group controlId="currentPassword" as={Col} md="12">
                      <Form.Label className="form-sub-label">
                        Current Password <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <Form.Control
                          required
                          type={ctrl.showCurrentPassword ? "text" : "password"}
                          value={ctrl.passwordFormData.currentPassword}
                          name="currentPassword"
                          className={`text-muted ${
                            errorList.currentPassword ? "form-input-invalid" : ""
                          }`}
                          onChange={ctrl.onPasswordChange}
                          placeholder="Enter current password"
                        />
                        <PasswordVisibilityToggle
                          shown={ctrl.showCurrentPassword}
                          onToggle={ctrl.toggleShowCurrentPassword}
                        />
                        <Errors
                          current_key="currentPassword"
                          key="currentPassword"
                        />
                      </InputGroup>
                    </Form.Group>
                  </Row>
                  <Row className="mb-4">
                    <Form.Group controlId="newPassword" as={Col} md="12">
                      <Form.Label className="form-sub-label">
                        New Password <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <Form.Control
                          required
                          type={ctrl.showNewPassword ? "text" : "password"}
                          value={ctrl.passwordFormData.newPassword}
                          name="newPassword"
                          className={`text-muted ${
                            errorList.newPassword ? "form-input-invalid" : ""
                          }`}
                          onChange={ctrl.onPasswordChange}
                          placeholder="Enter new password"
                        />
                        <PasswordVisibilityToggle
                          shown={ctrl.showNewPassword}
                          onToggle={ctrl.toggleShowNewPassword}
                        />
                        <Errors current_key="newPassword" key="newPassword" />
                      </InputGroup>
                    </Form.Group>
                  </Row>
                  <Row className="mb-4">
                    <Form.Group controlId="confirmPassword" as={Col} md="12">
                      <Form.Label className="form-sub-label">
                        Confirm Password <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <Form.Control
                          required
                          type={ctrl.showConfirmPassword ? "text" : "password"}
                          value={ctrl.passwordFormData.confirmPassword}
                          name="confirmPassword"
                          className={`text-muted ${
                            errorList.confirmPassword || !ctrl.passwordMatch
                              ? "form-input-invalid"
                              : ""
                          }`}
                          onChange={ctrl.onPasswordChange}
                          placeholder="Confirm new password"
                          isInvalid={!ctrl.passwordMatch}
                        />
                        <PasswordVisibilityToggle
                          shown={ctrl.showConfirmPassword}
                          onToggle={ctrl.toggleShowConfirmPassword}
                        />
                        <Form.Control.Feedback type="invalid">
                          {ctrl.passwordMatch
                            ? "Please provide a valid password."
                            : "Passwords do not match."}
                        </Form.Control.Feedback>
                        <Errors
                          current_key="confirmPassword"
                          key="confirmPassword"
                        />
                      </InputGroup>
                    </Form.Group>
                  </Row>
                  <Row>
                    <Col className="d-flex justify-content-center mt-3">
                      <Button
                        type="submit"
                        className="float-end"
                        disabled={ctrl.loadingOnChangePassword}
                      >
                        {submitLabel("Change Password")}
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Tab>

              <Tab eventKey="txnPassword" title="Change Txn Password">
                <Form
                  noValidate
                  validated={ctrl.validated}
                  onSubmit={ctrl.onSubmitTxnPassword}
                  className="p-2"
                >
                  <Row className="mb-4 mt-3">
                    <Form.Group controlId="currentTxnPassword" as={Col} md="12">
                      <Form.Label className="form-sub-label">
                        Current Transaction Password{" "}
                        <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <Form.Control
                          required
                          type={
                            ctrl.showCurrentTxnPassword ? "text" : "password"
                          }
                          value={ctrl.txnPasswordFormData.currentTxnPassword}
                          name="currentTxnPassword"
                          className={`text-muted ${
                            errorList.currentTxnPassword
                              ? "form-input-invalid"
                              : ""
                          }`}
                          onChange={ctrl.onTxnPasswordChange}
                          placeholder="Enter current transaction password"
                        />
                        <PasswordVisibilityToggle
                          shown={ctrl.showCurrentTxnPassword}
                          onToggle={ctrl.toggleShowCurrentTxnPassword}
                        />
                        <Errors
                          current_key="currentTxnPassword"
                          key="currentTxnPassword"
                        />
                      </InputGroup>
                    </Form.Group>
                  </Row>
                  <Row className="mb-4">
                    <Form.Group controlId="newTxnPassword" as={Col} md="12">
                      <Form.Label className="form-sub-label">
                        New Transaction Password{" "}
                        <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <Form.Control
                          required
                          type={ctrl.showNewTxnPassword ? "text" : "password"}
                          value={ctrl.txnPasswordFormData.newTxnPassword}
                          name="newTxnPassword"
                          className={`text-muted ${
                            errorList.newTxnPassword ? "form-input-invalid" : ""
                          }`}
                          onChange={ctrl.onTxnPasswordChange}
                          placeholder="Enter new transaction password"
                        />
                        <PasswordVisibilityToggle
                          shown={ctrl.showNewTxnPassword}
                          onToggle={ctrl.toggleShowNewTxnPassword}
                        />
                        <Errors
                          current_key="newTxnPassword"
                          key="newTxnPassword"
                        />
                      </InputGroup>
                    </Form.Group>
                  </Row>
                  <Row className="mb-4">
                    <Form.Group controlId="confirmTxnPassword" as={Col} md="12">
                      <Form.Label className="form-sub-label">
                        Confirm Transaction Password{" "}
                        <span className="text-danger">*</span>
                      </Form.Label>
                      <InputGroup>
                        <Form.Control
                          required
                          type={
                            ctrl.showConfirmTxnPassword ? "text" : "password"
                          }
                          value={ctrl.txnPasswordFormData.confirmTxnPassword}
                          name="confirmTxnPassword"
                          className={`text-muted ${
                            errorList.confirmTxnPassword ||
                            !ctrl.txnPasswordMatch
                              ? "form-input-invalid"
                              : ""
                          }`}
                          onChange={ctrl.onTxnPasswordChange}
                          placeholder="Confirm new transaction password"
                          isInvalid={!ctrl.txnPasswordMatch}
                        />
                        <PasswordVisibilityToggle
                          shown={ctrl.showConfirmTxnPassword}
                          onToggle={ctrl.toggleShowConfirmTxnPassword}
                        />
                        <Form.Control.Feedback type="invalid">
                          {ctrl.txnPasswordMatch
                            ? "Please provide a valid transaction password."
                            : "Transaction passwords do not match."}
                        </Form.Control.Feedback>
                        <Errors
                          current_key="confirmTxnPassword"
                          key="confirmTxnPassword"
                        />
                      </InputGroup>
                    </Form.Group>
                  </Row>
                  <Row>
                    <Col className="d-flex justify-content-center mt-3">
                      <Button
                        type="submit"
                        className="float-end"
                        disabled={ctrl.loadingOnChangePassword}
                      >
                        {submitLabel("Change Transaction Password")}
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </Tab>
            </Tabs>
          </MainCard>
        </Col>
      </Row>
    </Container>
  );
};

ChangePassword.propTypes = {
  changePassword: PropTypes.func.isRequired,
  changeTxnPassword: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired,
  removeAllErrors: PropTypes.func.isRequired,
  errorList: PropTypes.object.isRequired,
  adminAuth: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
  errorList: state.errors,
  adminAuth: state.adminAuth,
});

export default connect(mapStateToProps, {
  setErrors,
  changePassword,
  changeTxnPassword,
  removeAllErrors,
})(ChangePassword);
