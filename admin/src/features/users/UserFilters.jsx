import { useCallback, useMemo } from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import { useSelector } from "react-redux";

import CustomSelect from "@src/components/common/CustomSelect";
import MemberIdInput from "@src/components/common/MemberIdInput";
import {
  UserStatuses,
  getStatusOptionByValue,
} from "@src/constants/CustomSelectValues";
import {
  isValidEmail,
  isValidName,
  sanitizeEmail,
  sanitizeName,
  sanitizePhone,
} from "@src/utils/inputValidation";

const UserFilters = ({ values, onChange, onSearch, onReset }) => {
  const abbreviation = useSelector(
    (state) => state.adminCommonSettings?.commonSettings?.abbreviation || "",
  );
  const loadStatusOptions = useCallback(() => UserStatuses, []);

  const setField = (name, value) => {
    onChange({ target: { name, value } });
  };

  const handleNameChange = (e) => {
    setField("name", sanitizeName(e.target.value));
  };

  const handlePhoneChange = (e) => {
    setField("phone", sanitizePhone(e.target.value));
  };

  const handleEmailChange = (e) => {
    setField("email", sanitizeEmail(e.target.value));
  };

  const filterErrors = useMemo(() => {
    const errors = {};
    if (values.name?.trim() && !isValidName(values.name)) {
      errors.name = "Name must be 3-50 characters and in valid format.";
    }
    if (
      values.phone?.trim() &&
      values.phone.trim().length > 0 &&
      values.phone.trim().length < 10
    ) {
      errors.phone = "Phone must be exactly 10 digits.";
    }
    if (values.email?.trim() && !isValidEmail(values.email)) {
      errors.email = "Please enter a valid email format.";
    }
    if (values.fromDate && values.toDate && values.fromDate > values.toDate) {
      errors.toDate = "To Date must be greater than or equal to From Date.";
    }
    return errors;
  }, [values]);

  const isFilterValid = Object.keys(filterErrors).length === 0;

  return (
    <Card className="common-panel-card mb-3">
      <Card.Body>
        <Row className="g-3 align-items-start">
          <Col xs={12}>
            <h6 className="text-muted mb-0">Text Search</h6>
          </Col>
          <Col md={6} lg={4}>
            <MemberIdInput
              id="memberId"
              name="memberId"
              value={values.memberId}
              onChange={onChange}
              abbreviation={abbreviation}
            />
          </Col>
          <Col md={6} lg={4}>
            <Form.Group controlId="name">
              <Form.Label>Name</Form.Label>
              <Form.Control
                name="name"
                value={values.name}
                onChange={handleNameChange}
                placeholder="Filter by name"
                maxLength={50}
              />
              <div className="form-field-feedback" aria-live="polite">
                {filterErrors.name ? (
                  <Form.Text className="form-error-message">
                    {filterErrors.name}
                  </Form.Text>
                ) : null}
              </div>
            </Form.Group>
          </Col>
          <Col md={6} lg={4}>
            <Form.Group controlId="phone">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                name="phone"
                value={values.phone}
                onChange={handlePhoneChange}
                placeholder="Filter by phone"
                inputMode="numeric"
                maxLength={10}
              />
              <div className="form-field-feedback" aria-live="polite">
                {filterErrors.phone ? (
                  <Form.Text className="form-error-message">
                    {filterErrors.phone}
                  </Form.Text>
                ) : null}
              </div>
            </Form.Group>
          </Col>
          <Col md={6} lg={4}>
            <Form.Group controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                name="email"
                value={values.email}
                onChange={handleEmailChange}
                placeholder="Filter by email"
                type="email"
                maxLength={254}
              />
              <div className="form-field-feedback" aria-live="polite">
                {filterErrors.email ? (
                  <Form.Text className="form-error-message">
                    {filterErrors.email}
                  </Form.Text>
                ) : null}
              </div>
            </Form.Group>
          </Col>

          <Col xs={12} className="mt-1">
            <h6 className="text-muted mb-0">Account</h6>
          </Col>
          <Col md={6} lg={4}>
            <Form.Group controlId="status">
              <Form.Label>Status</Form.Label>
              <CustomSelect
                className="entity-form__select"
                value={getStatusOptionByValue(values.status)}
                onChange={(option) => setField("status", option?.value ?? "")}
                loadOptions={loadStatusOptions}
                placeholder="All statuses"
              />
            </Form.Group>
          </Col>
          <Col md={6} lg={4}>
            <Form.Group controlId="fromDate">
              <Form.Label>From Date</Form.Label>
              <Form.Control
                type="date"
                name="fromDate"
                value={values.fromDate}
                onChange={onChange}
              />
            </Form.Group>
          </Col>
          <Col md={6} lg={4}>
            <Form.Group controlId="toDate">
              <Form.Label>To Date</Form.Label>
              <Form.Control
                type="date"
                name="toDate"
                value={values.toDate}
                onChange={onChange}
              />
              <div className="form-field-feedback" aria-live="polite">
                {filterErrors.toDate ? (
                  <Form.Text className="form-error-message">
                    {filterErrors.toDate}
                  </Form.Text>
                ) : null}
              </div>
            </Form.Group>
          </Col>

          <Col xs={12} className="d-flex justify-content-end gap-2 mt-3">
            <Button
              type="button"
              className="btn btn--outline"
              onClick={onReset}
            >
              Reset
            </Button>
            <Button
              type="button"
              className="btn btn--theme btn--disabled-theme"
              onClick={onSearch}
              disabled={!isFilterValid}
            >
              Search
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default UserFilters;
