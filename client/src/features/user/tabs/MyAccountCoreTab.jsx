import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Col, Form, InputGroup, Row } from "react-bootstrap";
import { useDispatch, useSelector } from "react-redux";

import Errors from "@src/notifications/Errors";
import CopyIcon from "@src/components/common/CopyIcon";
import { setAlert } from "@src/app/state/actions/alert";
import { getMemberIdPhonePart } from "@src/utils/memberIdFormatter";
import AccountEditHeader from "../components/AccountEditHeader";
import EditTabActions from "../components/EditTabActions";

const MyAccountCoreTab = ({
  formData,
  onChange,
  isDisabled,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  submitting,
  errorList,
}) => {
  const dispatch = useDispatch();
  const abbreviation = useSelector(
    (state) => state.common?.commonSettings?.abbreviation || "",
  );
  const memberIdCopyValue = useMemo(
    () => getMemberIdPhonePart(formData.memberId, abbreviation),
    [formData.memberId, abbreviation],
  );

  return (
    <>
      <AccountEditHeader
        title="Core Information"
        isEditing={isEditing}
        onEdit={onEdit}
        onPreview={onCancel}
        submitting={submitting}
      />

      <Row className="row-gap-3 mb-3">
        <Col xs={12} md={6}>
          <Form.Group controlId="memberId">
            <Form.Label className="form-sub-label">Member ID</Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                value={formData.memberId || "-"}
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
            <Form.Text className="text-muted">
              Member ID cannot be changed
            </Form.Text>
          </Form.Group>
        </Col>

        <Col xs={12} md={6}>
          <Form.Group controlId="phone">
            <Form.Label className="form-sub-label">Phone</Form.Label>
            <Form.Control
              type="tel"
              value={formData.phone || "-"}
              disabled
              readOnly
              className="text-muted"
            />
            <Form.Text className="text-muted">
              Phone number cannot be changed
            </Form.Text>
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
              placeholder="Enter your name"
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
              placeholder="Enter your email"
            />
            <Errors current_key="email" />
          </Form.Group>
        </Col>
      </Row>

      <EditTabActions
        isEditing={isEditing}
        onSave={onSave}
        onCancel={onCancel}
        submitting={submitting}
      />
    </>
  );
};

MyAccountCoreTab.propTypes = {
  formData: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  isDisabled: PropTypes.bool.isRequired,
  isEditing: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
  errorList: PropTypes.object.isRequired,
};

export default React.memo(MyAccountCoreTab);
