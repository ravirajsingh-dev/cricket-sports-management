import React from "react";
import PropTypes from "prop-types";
import { Col, Form, Row } from "react-bootstrap";

import Errors from "@src/notifications/Errors";
import CustomSelect from "@src/components/common/CustomSelect";
import {
  GenderOptions,
  getOptionByValue,
} from "@src/constants/CustomSelectValues";
import AccountEditHeader from "../components/AccountEditHeader";
import EditTabActions from "../components/EditTabActions";

const MyAccountAdditionalTab = ({
  formData,
  onChange,
  isDisabled,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  submitting,
  errorList,
  setFormData,
  sectionComplete,
}) => (
  <>
    <AccountEditHeader
      title="Additional Details"
      isEditing={isEditing}
      onEdit={onEdit}
      onPreview={onCancel}
      submitting={submitting}
    />

    {!sectionComplete && (
      <p className="text-muted small mb-3">
        Optional until you start filling. Once saved, required fields cannot
        be cleared.
      </p>
    )}

    <Row className="row-gap-3 mb-3">
      <Col xs={12} md={6}>
        <Form.Group controlId="dob">
          <Form.Label className="form-sub-label">
            Date of Birth <span className="text-danger">*</span>
          </Form.Label>
          <Form.Control
            className={`text-muted ${errorList.dob ? "form-input-invalid" : ""}`}
            type="date"
            name="dob"
            value={formData.dob}
            onChange={onChange}
            disabled={isDisabled}
            max={(() => {
              const today = new Date();
              const minDate = new Date(today);
              minDate.setFullYear(today.getFullYear() - 3);
              return minDate.toISOString().split("T")[0];
            })()}
          />
          <Errors current_key="dob" />
          <Form.Text className="text-muted">
            Minimum age must be 3 years. Future dates are not allowed.
          </Form.Text>
        </Form.Group>
      </Col>

      <Col xs={12} md={6}>
        <Form.Group controlId="gender">
          <Form.Label className="form-sub-label">
            Gender <span className="text-danger">*</span>
          </Form.Label>
          <CustomSelect
            options={GenderOptions}
            value={getOptionByValue(GenderOptions, formData.gender)}
            onChange={(option) =>
              setFormData((prev) => ({
                ...prev,
                gender: option?.value ?? "",
              }))
            }
            isDisabled={isDisabled}
            isRequired
            placeholder="Select gender"
            error={errorList.gender || null}
          />
          <Errors current_key="gender" />
        </Form.Group>
      </Col>

      <Col xs={12} md={6}>
        <Form.Group controlId="height">
          <Form.Label className="form-sub-label">Height (cm)</Form.Label>
          <Form.Control
            className={`text-muted ${errorList.height ? "form-input-invalid" : ""}`}
            type="number"
            name="height"
            value={formData.height}
            onChange={onChange}
            disabled={isDisabled}
            min={0}
            max={300}
            step={1}
            placeholder="e.g. 170"
          />
          <Errors current_key="height" />
        </Form.Group>
      </Col>

      <Col xs={12} md={6}>
        <Form.Group controlId="weight">
          <Form.Label className="form-sub-label">Weight (kg)</Form.Label>
          <Form.Control
            className={`text-muted ${errorList.weight ? "form-input-invalid" : ""}`}
            type="number"
            name="weight"
            value={formData.weight}
            onChange={onChange}
            disabled={isDisabled}
            min={0}
            max={500}
            step={0.1}
            placeholder="e.g. 65"
          />
          <Errors current_key="weight" />
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

MyAccountAdditionalTab.propTypes = {
  formData: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  isDisabled: PropTypes.bool.isRequired,
  isEditing: PropTypes.bool.isRequired,
  onEdit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  submitting: PropTypes.bool.isRequired,
  errorList: PropTypes.object.isRequired,
  setFormData: PropTypes.func.isRequired,
  sectionComplete: PropTypes.bool.isRequired,
};

export default React.memo(MyAccountAdditionalTab);
