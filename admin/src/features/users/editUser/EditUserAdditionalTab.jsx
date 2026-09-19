import React from "react";
import PropTypes from "prop-types";
import { Col, Form, Row } from "react-bootstrap";

import Errors from "@src/notifications/Errors";
import CustomSelect from "@src/components/common/CustomSelect";
import {
  GenderOptions,
  getOptionByValue,
} from "@src/constants/CustomSelectValues";
import { formSelectFieldChange } from "./editUserUtils";
import EditTabActions from "./components/EditTabActions";

const EditUserAdditionalTab = ({
  formData,
  onChange,
  isDisabled,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  submitting,
  errorList,
}) => (
  <>
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
          />
          <Errors current_key="dob" />
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
            onChange={formSelectFieldChange("gender", onChange)}
            isDisabled={isDisabled}
            isRequired
            placeholder="Select gender"
            error={errorList.gender}
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
      onEdit={onEdit}
      onSave={onSave}
      onCancel={onCancel}
      submitting={submitting}
    />
  </>
);

EditUserAdditionalTab.propTypes = {
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

export default React.memo(EditUserAdditionalTab);
