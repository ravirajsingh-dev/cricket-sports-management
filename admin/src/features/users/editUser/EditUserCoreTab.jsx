import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Button, Col, Form, InputGroup, Row } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";

import Errors from "@src/notifications/Errors";
import CustomSelect from "@src/components/common/CustomSelect";
import CopyIcon from "@src/components/common/CopyIcon";
import {
  UserStatuses,
  getStatusOptionByValue,
} from "@src/constants/CustomSelectValues";
import { setAlert } from "@src/app/state/actions/alert";
import { getMemberIdPhonePart } from "@src/utils/memberIdFormatter";
import { formSelectFieldChange } from "./editUserUtils";
import EditTabActions from "./components/EditTabActions";

const EditUserCoreTab = ({
  formData,
  onChange,
  isDisabled,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  submitting,
  errorList,
  showPasswordField,
  setShowPasswordField,
  setFormData,
  currentUser,
}) => {
  const dispatch = useDispatch();
  const abbreviation = useSelector(
    (state) =>
      state.adminCommonSettings?.commonSettings?.abbreviation || "",
  );
  const memberIdCopyValue = useMemo(
    () => getMemberIdPhonePart(currentUser?.memberId, abbreviation),
    [currentUser?.memberId, abbreviation],
  );

  return (
    <>
      <Row className="row-gap-3 mb-3">
        <Col xs={12} md={6}>
          <Form.Group controlId="member-id">
            <Form.Label className="form-sub-label">Member ID</Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                value={currentUser?.memberId || "-"}
                disabled
                readOnly
                className="text-muted"
              />
              {memberIdCopyValue ? (
                <InputGroup.Text className="bg-transparent">
                  <CopyIcon
                    textToCopy={memberIdCopyValue}
                    iconSize={18}
                    onCopy={() =>
                      dispatch(
                        setAlert("Member ID copied to clipboard", "success"),
                      )
                    }
                  />
                </InputGroup.Text>
              ) : null}
            </InputGroup>
          </Form.Group>
        </Col>

        <Col xs={12} md={6}>
          <Form.Group controlId="phone">
            <Form.Label className="form-sub-label">
              Phone <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              className={`text-muted ${errorList.phone ? "form-input-invalid" : ""}`}
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={onChange}
              disabled={isDisabled}
              maxLength={10}
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key)) e.preventDefault();
              }}
            />
            <Errors current_key="phone" />
          </Form.Group>
        </Col>

        <Col xs={12} md={6}>
          <Form.Group controlId="name">
            <Form.Label className="form-sub-label">
              Full Name <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              className={`text-muted ${errorList.name ? "form-input-invalid" : ""}`}
              type="text"
              name="name"
              value={formData.name}
              onChange={onChange}
              disabled={isDisabled}
              maxLength={50}
            />
            <Errors current_key="name" />
          </Form.Group>
        </Col>

        <Col xs={12} md={6}>
          <Form.Group controlId="email">
            <Form.Label className="form-sub-label">
              Email <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              className={`text-muted ${errorList.email ? "form-input-invalid" : ""}`}
              type="email"
              name="email"
              value={formData.email}
              onChange={onChange}
              disabled={isDisabled}
            />
            <Errors current_key="email" />
          </Form.Group>
        </Col>

        <Col xs={12} md={6}>
          <Form.Group controlId="status">
            <Form.Label className="form-sub-label">
              Status <span className="text-danger">*</span>
            </Form.Label>
            <CustomSelect
              options={UserStatuses}
              value={getStatusOptionByValue(formData.status)}
              onChange={formSelectFieldChange("status", onChange, {
                stringify: true,
              })}
              isDisabled={isDisabled}
              isRequired
              placeholder="Select status"
              error={errorList.status}
            />
            <Errors current_key="status" />
          </Form.Group>
        </Col>
      </Row>

      <Row className="row-gap-3 mb-3">
        <Col xs={12}>
          <h6 className="text-muted mb-0">User Password</h6>
          <Form.Text className="text-muted d-block mb-2">
            Existing passwords cannot be viewed. Set a new password below if
            needed.
          </Form.Text>
        </Col>

        <Col xs={12} md={6}>
          <Form.Group controlId="change-password">
            <Form.Label className="form-sub-label">
              Change Password{" "}
              {showPasswordField && <span className="text-danger">*</span>}
            </Form.Label>
            {showPasswordField ? (
              <div className="d-flex gap-2">
                <Form.Control
                  className={`text-muted ${errorList.password ? "form-input-invalid" : ""}`}
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={onChange}
                  disabled={isDisabled}
                  placeholder="Enter new password (min 8 characters)"
                  minLength={8}
                  maxLength={128}
                />
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    setShowPasswordField(false);
                    setFormData((prev) => ({ ...prev, password: "" }));
                  }}
                  disabled={isDisabled}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Form.Control
                  type="text"
                  value="Enter new password to change"
                  disabled
                  readOnly
                  className="text-muted"
                />
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowPasswordField(true)}
                  disabled={isDisabled}
                >
                  Change
                </Button>
              </div>
            )}
            {showPasswordField && (
              <Form.Text className="text-warning">
                This will change the user&apos;s login password and invalidate
                all sessions.
              </Form.Text>
            )}
            <Errors current_key="password" />
          </Form.Group>
        </Col>
      </Row>

      <EditTabActions
        isEditing={isEditing}
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
        submitting={submitting}
      />
    </>
  );
};

EditUserCoreTab.propTypes = {
  currentUser: PropTypes.object,
  formData: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  isDisabled: PropTypes.bool.isRequired,
  isEditing: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
  errorList: PropTypes.object.isRequired,
  showPasswordField: PropTypes.bool.isRequired,
  setShowPasswordField: PropTypes.func.isRequired,
  setFormData: PropTypes.func.isRequired,
};

export default React.memo(EditUserCoreTab);
