import PropTypes from "prop-types";
import { Button, Col, Form, Row } from "react-bootstrap";
import { FaRegEye } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import Errors from "@src/notifications/Errors";

const MyAccountProfileTab = ({
  formData,
  errorList,
  visibleLocalErrors,
  isSubAdmin,
  isProfileEditable,
  isSavingProfile,
  onChange,
  onBlur,
  onSubmit,
  onToggleEdit,
  onCancel,
}) => (
  <Form onSubmit={onSubmit}>
    <Row className="mb-3 align-items-center">
      <Col>
        <h4 className="mb-1">Profile</h4>
      </Col>
      <Col xs="auto">
        <Button
          type="button"
          variant={null}
          className={`btn btn-sm ${
            isProfileEditable ? "btn--outline" : "btn--theme"
          }`}
          onClick={onToggleEdit}
          disabled={isSavingProfile}
        >
          {isProfileEditable ? (
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
      <Form.Group controlId="name" as={Col} md="12">
        <Form.Label className="form-sub-label">Name</Form.Label>
        <Form.Control
          name="name"
          value={formData.name}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="Enter your name"
          disabled={!isProfileEditable}
          maxLength={isSubAdmin ? 50 : 20}
          className={`text-muted ${
            errorList.name || visibleLocalErrors.name
              ? "form-input-invalid"
              : ""
          }`}
        />
        {visibleLocalErrors.name && (
          <Form.Text className="text-danger">
            {visibleLocalErrors.name}
          </Form.Text>
        )}
        <Errors current_key="name" />
      </Form.Group>
    </Row>

    {!isSubAdmin && (
      <Row className="mb-3">
        <Form.Group controlId="phone" as={Col} md="12">
          <Form.Label className="form-sub-label">Phone</Form.Label>
          <Form.Control
            name="phone"
            value={formData.phone}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="Enter your phone number"
            disabled={!isProfileEditable}
            maxLength={10}
            className={`text-muted ${
              errorList.phone || visibleLocalErrors.phone
                ? "form-input-invalid"
                : ""
            }`}
          />
          {visibleLocalErrors.phone && (
            <Form.Text className="text-danger">
              {visibleLocalErrors.phone}
            </Form.Text>
          )}
          <Errors current_key="phone" />
        </Form.Group>
      </Row>
    )}

    <Row className="mb-3">
      <Form.Group controlId="email" as={Col} md="12">
        <Form.Label className="form-sub-label">Email</Form.Label>
        <Form.Control
          name="email"
          type="email"
          value={formData.email}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="Enter your email"
          disabled={!isProfileEditable}
          className={`text-muted ${
            errorList.email || visibleLocalErrors.email
              ? "form-input-invalid"
              : ""
          }`}
        />
        {visibleLocalErrors.email && (
          <Form.Text className="text-danger">
            {visibleLocalErrors.email}
          </Form.Text>
        )}
        <Errors current_key="email" />
      </Form.Group>
    </Row>

    <div className="d-flex justify-content-end gap-2 mt-3">
      <Button
        type="submit"
        data-submit-intent="save-profile"
        variant={null}
        className="btn btn--theme"
        disabled={!isProfileEditable || isSavingProfile}
      >
        {isSavingProfile ? "Saving…" : "Save"}
      </Button>
      <Button
        type="button"
        variant={null}
        className="btn btn--danger"
        onClick={onCancel}
        disabled={!isProfileEditable || isSavingProfile}
      >
        Cancel
      </Button>
    </div>
  </Form>
);

MyAccountProfileTab.propTypes = {
  formData: PropTypes.object.isRequired,
  errorList: PropTypes.object.isRequired,
  visibleLocalErrors: PropTypes.object.isRequired,
  isSubAdmin: PropTypes.bool.isRequired,
  isProfileEditable: PropTypes.bool.isRequired,
  isSavingProfile: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onToggleEdit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default MyAccountProfileTab;
