import PropTypes from "prop-types";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaRegEye } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import Errors from "@src/notifications/Errors";

const MyAccountLoginPasswordTab = ({
  loginPasswordForm,
  errorList,
  isLoginPasswordEditable,
  loadingOnChangePassword,
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  setLoginPasswordForm,
  setShowCurrentPassword,
  setShowNewPassword,
  setShowConfirmPassword,
  onSubmit,
  onToggleEdit,
  onCancel,
}) => (
  <Form onSubmit={onSubmit}>
    <Row className="mb-3 align-items-center">
      <Col>
        <h4 className="mb-1">Change Login Password</h4>
      </Col>
      <Col xs="auto">
        <Button
          type="button"
          variant={null}
          className={`btn btn-sm ${
            isLoginPasswordEditable ? "btn--outline" : "btn--theme"
          }`}
          onClick={onToggleEdit}
          disabled={loadingOnChangePassword}
        >
          {isLoginPasswordEditable ? (
            <>
              <FaRegEye className="me-1" />
              View mode
            </>
          ) : (
            <>
              <MdEdit className="me-1" />
              Edit
            </>
          )}
        </Button>
      </Col>
    </Row>

    <Row className="mb-3">
      <Form.Group controlId="currentPassword" as={Col} md="12">
        <Form.Label className="form-sub-label">Current password</Form.Label>
        <InputGroup>
          <Form.Control
            type={showCurrentPassword ? "text" : "password"}
            value={loginPasswordForm.currentPassword}
            name="currentPassword"
            className={`text-muted ${
              errorList.currentPassword ? "form-input-invalid" : ""
            }`}
            onChange={(e) =>
              setLoginPasswordForm((prev) => ({
                ...prev,
                currentPassword: e.target.value,
              }))
            }
            placeholder="Enter current password"
            disabled={!isLoginPasswordEditable}
          />
          <InputGroup.Text
            className="show-password-icon text-muted"
            onClick={() => setShowCurrentPassword((prev) => !prev)}
          >
            {showCurrentPassword ? (
              <AiOutlineEye size={20} />
            ) : (
              <AiOutlineEyeInvisible size={20} />
            )}
          </InputGroup.Text>
          <Errors current_key="currentPassword" />
        </InputGroup>
      </Form.Group>
    </Row>

    <Row className="mb-3">
      <Form.Group controlId="newPassword" as={Col} md="12">
        <Form.Label className="form-sub-label">New password</Form.Label>
        <InputGroup>
          <Form.Control
            type={showNewPassword ? "text" : "password"}
            value={loginPasswordForm.newPassword}
            name="newPassword"
            className={`text-muted ${
              errorList.newPassword ? "form-input-invalid" : ""
            }`}
            onChange={(e) =>
              setLoginPasswordForm((prev) => ({
                ...prev,
                newPassword: e.target.value,
              }))
            }
            placeholder="Enter new password"
            disabled={!isLoginPasswordEditable}
          />
          <InputGroup.Text
            className="show-password-icon text-muted"
            onClick={() => setShowNewPassword((prev) => !prev)}
          >
            {showNewPassword ? (
              <AiOutlineEye size={20} />
            ) : (
              <AiOutlineEyeInvisible size={20} />
            )}
          </InputGroup.Text>
          <Errors current_key="newPassword" />
        </InputGroup>
      </Form.Group>
    </Row>

    <Row className="mb-3">
      <Form.Group controlId="confirmPassword" as={Col} md="12">
        <Form.Label className="form-sub-label">Confirm password</Form.Label>
        <InputGroup>
          <Form.Control
            type={showConfirmPassword ? "text" : "password"}
            value={loginPasswordForm.confirmPassword}
            name="confirmPassword"
            className={`text-muted ${
              errorList.confirmPassword ? "form-input-invalid" : ""
            }`}
            onChange={(e) =>
              setLoginPasswordForm((prev) => ({
                ...prev,
                confirmPassword: e.target.value,
              }))
            }
            placeholder="Confirm new password"
            disabled={!isLoginPasswordEditable}
          />
          <InputGroup.Text
            className="show-password-icon text-muted"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
          >
            {showConfirmPassword ? (
              <AiOutlineEye size={20} />
            ) : (
              <AiOutlineEyeInvisible size={20} />
            )}
          </InputGroup.Text>
          <Errors current_key="confirmPassword" />
        </InputGroup>
      </Form.Group>
    </Row>

    <div className="d-flex justify-content-end gap-2 mt-3">
      <Button
        type="submit"
        variant={null}
        className="btn btn--theme"
        disabled={!isLoginPasswordEditable || loadingOnChangePassword}
      >
        {loadingOnChangePassword ? "Saving…" : "Save"}
      </Button>
      <Button
        type="button"
        variant={null}
        className="btn btn--danger"
        onClick={onCancel}
        disabled={!isLoginPasswordEditable || loadingOnChangePassword}
      >
        Cancel
      </Button>
    </div>
  </Form>
);

MyAccountLoginPasswordTab.propTypes = {
  loginPasswordForm: PropTypes.object.isRequired,
  errorList: PropTypes.object.isRequired,
  isLoginPasswordEditable: PropTypes.bool.isRequired,
  loadingOnChangePassword: PropTypes.bool,
  showCurrentPassword: PropTypes.bool.isRequired,
  showNewPassword: PropTypes.bool.isRequired,
  showConfirmPassword: PropTypes.bool.isRequired,
  setLoginPasswordForm: PropTypes.func.isRequired,
  setShowCurrentPassword: PropTypes.func.isRequired,
  setShowNewPassword: PropTypes.func.isRequired,
  setShowConfirmPassword: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onToggleEdit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default MyAccountLoginPasswordTab;
