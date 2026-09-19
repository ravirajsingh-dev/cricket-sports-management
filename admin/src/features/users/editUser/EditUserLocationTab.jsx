import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Col, Form, Row } from "react-bootstrap";

import Errors from "@src/notifications/Errors";
import CustomSelect from "@src/components/common/CustomSelect";
import TableLoadingSkeleton from "@src/components/common/Loaders/TableLoadingSkeleton";
import { DEFAULT_COUNTRY } from "@src/utils/locationData";
import useIndiaLocationOptions from "../useIndiaLocationOptions";
import EditTabActions from "./components/EditTabActions";

const findLocationOption = (options, value) => {
  if (value == null || value === "") return null;
  return (
    options.find((item) => String(item.value) === String(value)) || null
  );
};

const EditUserLocationTab = ({
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
}) => {
  const { stateOptions, cityOptions, loadingStates, loadingCities } =
    useIndiaLocationOptions(formData.stateId);

  const locationLoading =
    loadingStates || (Boolean(formData.stateId) && loadingCities);

  const stateValue = useMemo(
    () =>
      locationLoading
        ? null
        : findLocationOption(stateOptions, formData.stateId),
    [locationLoading, stateOptions, formData.stateId],
  );

  const cityValue = useMemo(
    () =>
      locationLoading
        ? null
        : findLocationOption(cityOptions, formData.cityId),
    [locationLoading, cityOptions, formData.cityId],
  );

  return (
    <>
      {locationLoading ? (
        <div className="mb-3">
          <TableLoadingSkeleton
            rows={3}
            columns={3}
            label="Loading location"
          />
        </div>
      ) : (
        <Row className="row-gap-3 mb-3">
          <Col xs={12}>
            <Form.Group controlId="address">
              <Form.Label className="form-sub-label">Full Address</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                className={`text-muted ${errorList.address ? "form-input-invalid" : ""}`}
                name="address"
                value={formData.address || ""}
                onChange={onChange}
                disabled={isDisabled}
                placeholder="House / street, landmark, area"
                maxLength={500}
              />
              <Errors current_key="address" />
            </Form.Group>
          </Col>

          <Col xs={12} md={4}>
            <Form.Group controlId="country">
              <Form.Label className="form-sub-label">Country</Form.Label>
              <Form.Control
                type="text"
                value={formData.country || DEFAULT_COUNTRY.name}
                disabled
                readOnly
                className="text-muted"
              />
            </Form.Group>
          </Col>

          <Col xs={12} md={4}>
            <Form.Group controlId="state">
              <Form.Label className="form-sub-label">
                State <span className="text-danger">*</span>
              </Form.Label>
              <CustomSelect
                id="state"
                options={stateOptions}
                value={stateValue}
                onChange={(option) => {
                  setFormData((prev) => ({
                    ...prev,
                    stateId: option?.value ?? "",
                    state: option?.label ?? "",
                    cityId: "",
                    city: "",
                  }));
                }}
                isDisabled={isDisabled}
                isRequired
                placeholder="Select state"
                error={errorList.state}
                noOptionsMessage="No states found"
              />
              <Errors current_key="state" />
            </Form.Group>
          </Col>

          <Col xs={12} md={4}>
            <Form.Group controlId="city">
              <Form.Label className="form-sub-label">
                City <span className="text-danger">*</span>
              </Form.Label>
              <CustomSelect
                id="city"
                options={cityOptions}
                value={cityValue}
                onChange={(option) => {
                  setFormData((prev) => ({
                    ...prev,
                    cityId: option?.value ?? "",
                    city: option?.label ?? "",
                  }));
                }}
                isDisabled={isDisabled || !formData.stateId}
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
        </Row>
      )}

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

EditUserLocationTab.propTypes = {
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
};

export default React.memo(EditUserLocationTab);
