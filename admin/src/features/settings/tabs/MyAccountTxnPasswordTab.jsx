import PropTypes from "prop-types";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaRegEye } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import Errors from "@src/notifications/Errors";

const PasswordVisibilityToggle = ({ show, onToggle }) => (
  <InputGroup.Text
    className="show-password-icon text-muted"
    onClick={onToggle}
  >
    {show ? <AiOutlineEye size={20} /> : <AiOutlineEyeInvisible size={20} />}
  </InputGroup.Text>
);

PasswordVisibilityToggle.propTypes = {
  show: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

const MyAccountTxnPasswordTab = ({
  isTxnSet,
  txnPasswordForm,
  setTxnForm,
  errorList,
  isTxnPasswordEditable,
  loadingOnChangePassword,
  showCurrentTxnPassword,
  showNewTxnPassword,
  showConfirmTxnPassword,
  showSetTxnPassword,
  showSetTxnConfirmPassword,
  setTxnPasswordForm,
  setSetTxnForm,
  setShowCurrentTxnPassword,
  setShowNewTxnPassword,
  setShowConfirmTxnPassword,
  setShowSetTxnPassword,
  setShowSetTxnConfirmPassword,
  onSubmit,
  onToggleEdit,
  onCancel,
}) => (
  <Form onSubmit={onSubmit}>
    <Row className="mb-3 align-items-center">
      <Col>
        <h4 className="mb-1">Change Transaction Password</h4>
      </Col>
      <Col xs="auto">
        <Button
          type="button"
          variant={null}
          className={`btn btn-sm ${
            isTxnPasswordEditable ? "btn--outline" : "btn--theme"
          }`}
          onClick={onToggleEdit}
          disabled={loadingOnChangePassword}
        >
          {isTxnPasswordEditable ? (
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

    {isTxnSet ? (
      <>
        <Row className="mb-3">
          <Form.Group controlId="currentTxnPassword" as={Col} md="12">
            <Form.Label className="form-sub-label">
              Current transaction password
            </Form.Label>
            <InputGroup>
              <Form.Control
                type={showCurrentTxnPassword ? "text" : "password"}
                value={txnPasswordForm.currentTxnPassword}
                name="currentTxnPassword"
                className={`text-muted ${
                  errorList.currentTxnPassword ? "form-input-invalid" : ""
                }`}
                onChange={(e) =>
                  setTxnPasswordForm((prev) => ({
                    ...prev,
                    currentTxnPassword: e.target.value,
                  }))
                }
                placeholder="Enter current transaction password"
                disabled={!isTxnPasswordEditable}
              />
              <PasswordVisibilityToggle
                show={showCurrentTxnPassword}
                onToggle={() => setShowCurrentTxnPassword((prev) => !prev)}
              />
              <Errors current_key="currentTxnPassword" />
            </InputGroup>
          </Form.Group>
        </Row>

        <Row className="mb-3">
          <Form.Group controlId="newTxnPassword" as={Col} md="12">
            <Form.Label className="form-sub-label">
              New transaction password
            </Form.Label>
            <InputGroup>
              <Form.Control
                type={showNewTxnPassword ? "text" : "password"}
                value={txnPasswordForm.newTxnPassword}
                name="newTxnPassword"
                className={`text-muted ${
                  errorList.newTxnPassword ? "form-input-invalid" : ""
                }`}
                onChange={(e) =>
                  setTxnPasswordForm((prev) => ({
                    ...prev,
                    newTxnPassword: e.target.value,
                  }))
                }
                placeholder="Enter new transaction password"
                disabled={!isTxnPasswordEditable}
              />
              <PasswordVisibilityToggle
                show={showNewTxnPassword}
                onToggle={() => setShowNewTxnPassword((prev) => !prev)}
              />
              <Errors current_key="newTxnPassword" />
            </InputGroup>
          </Form.Group>
        </Row>

        <Row className="mb-3">
          <Form.Group controlId="confirmTxnPassword" as={Col} md="12">
            <Form.Label className="form-sub-label">
              Confirm transaction password
            </Form.Label>
            <InputGroup>
              <Form.Control
                type={showConfirmTxnPassword ? "text" : "password"}
                value={txnPasswordForm.confirmTxnPassword}
                name="confirmTxnPassword"
                className={`text-muted ${
                  errorList.confirmTxnPassword ? "form-input-invalid" : ""
                }`}
                onChange={(e) =>
                  setTxnPasswordForm((prev) => ({
                    ...prev,
                    confirmTxnPassword: e.target.value,
                  }))
                }
                placeholder="Confirm new transaction password"
                disabled={!isTxnPasswordEditable}
              />
              <PasswordVisibilityToggle
                show={showConfirmTxnPassword}
                onToggle={() => setShowConfirmTxnPassword((prev) => !prev)}
              />
              <Errors current_key="confirmTxnPassword" />
            </InputGroup>
          </Form.Group>
        </Row>
      </>
    ) : (
      <>
        <Row className="mb-3">
          <Form.Group controlId="txn_password" as={Col} md="12">
            <Form.Label className="form-sub-label">
              Set transaction password
            </Form.Label>
            <InputGroup>
              <Form.Control
                type={showSetTxnPassword ? "text" : "password"}
                value={setTxnForm.txn_password}
                name="txn_password"
                className={`text-muted ${
                  errorList.txn_password ? "form-input-invalid" : ""
                }`}
                onChange={(e) =>
                  setSetTxnForm((prev) => ({
                    ...prev,
                    txn_password: e.target.value,
                  }))
                }
                placeholder="Enter transaction password"
                disabled={!isTxnPasswordEditable}
              />
              <PasswordVisibilityToggle
                show={showSetTxnPassword}
                onToggle={() => setShowSetTxnPassword((prev) => !prev)}
              />
              <Errors current_key="txn_password" />
            </InputGroup>
          </Form.Group>
        </Row>

        <Row className="mb-3">
          <Form.Group controlId="setConfirmTxnPassword" as={Col} md="12">
            <Form.Label className="form-sub-label">
              Confirm transaction password
            </Form.Label>
            <InputGroup>
              <Form.Control
                type={showSetTxnConfirmPassword ? "text" : "password"}
                value={setTxnForm.confirmTxnPassword}
                name="confirmTxnPassword"
                className={`text-muted ${
                  errorList.confirmTxnPassword ? "form-input-invalid" : ""
                }`}
                onChange={(e) =>
                  setSetTxnForm((prev) => ({
                    ...prev,
                    confirmTxnPassword: e.target.value,
                  }))
                }
                placeholder="Confirm transaction password"
                disabled={!isTxnPasswordEditable}
              />
              <PasswordVisibilityToggle
                show={showSetTxnConfirmPassword}
                onToggle={() => setShowSetTxnConfirmPassword((prev) => !prev)}
              />
              <Errors current_key="confirmTxnPassword" />
            </InputGroup>
          </Form.Group>
        </Row>
      </>
    )}

    <div className="d-flex justify-content-end gap-2 mt-3">
      <Button
        type="submit"
        variant={null}
        className="btn btn--theme"
        disabled={!isTxnPasswordEditable || loadingOnChangePassword}
      >
        {loadingOnChangePassword ? "Saving…" : "Save"}
      </Button>
      <Button
        type="button"
        variant={null}
        className="btn btn--danger"
        onClick={onCancel}
        disabled={!isTxnPasswordEditable || loadingOnChangePassword}
      >
        Cancel
      </Button>
    </div>
  </Form>
);

MyAccountTxnPasswordTab.propTypes = {
  isTxnSet: PropTypes.bool.isRequired,
  txnPasswordForm: PropTypes.object.isRequired,
  setTxnForm: PropTypes.object.isRequired,
  errorList: PropTypes.object.isRequired,
  isTxnPasswordEditable: PropTypes.bool.isRequired,
  loadingOnChangePassword: PropTypes.bool,
  showCurrentTxnPassword: PropTypes.bool.isRequired,
  showNewTxnPassword: PropTypes.bool.isRequired,
  showConfirmTxnPassword: PropTypes.bool.isRequired,
  showSetTxnPassword: PropTypes.bool.isRequired,
  showSetTxnConfirmPassword: PropTypes.bool.isRequired,
  setTxnPasswordForm: PropTypes.func.isRequired,
  setSetTxnForm: PropTypes.func.isRequired,
  setShowCurrentTxnPassword: PropTypes.func.isRequired,
  setShowNewTxnPassword: PropTypes.func.isRequired,
  setShowConfirmTxnPassword: PropTypes.func.isRequired,
  setShowSetTxnPassword: PropTypes.func.isRequired,
  setShowSetTxnConfirmPassword: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onToggleEdit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default MyAccountTxnPasswordTab;
