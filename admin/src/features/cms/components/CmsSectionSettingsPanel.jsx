import React, { useEffect, useState } from "react";
import { Card, Col, Form, Row, Button } from "react-bootstrap";
import PropTypes from "prop-types";
import { FaRegEye } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import Errors from "@src/notifications/Errors";
import BouncingLoader from "@src/components/common/Loaders/BouncingLoader";
import VerificationConfirmModal from "@src/features/settings/components/VerificationConfirmModal";
import { validateForm } from "@src/utils/validation";

const buildFormDataFromSettings = (settings = {}) => ({
  title: settings.title || "",
  description: settings.description || "",
});

/**
 * Shared CMS section settings panel (Gallery / Video / News homepage sections).
 */
const CmsSectionSettingsPanel = ({
  sectionLabel,
  titlePlaceholder,
  descriptionPlaceholder,
  confirmTitle,
  confirmBody,
  titleRequiredMsg,
  descriptionRequiredMsg,
  controlIdPrefix,
  helperText,
  settings,
  loading,
  saving,
  canEdit = false,
  getSettings,
  updateSettings,
  removeErrors,
  setErrors,
}) => {
  const [formData, setFormData] = useState(null);
  const [isDisabled, setDisabled] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const toggleEdit = () => setDisabled((prev) => !prev);
  const isReadOnly = isDisabled || !canEdit;
  const formReady = formData !== null;

  useEffect(() => {
    getSettings();
  }, [getSettings]);

  useEffect(() => {
    if (!loading && settings) {
      setFormData(buildFormDataFromSettings(settings));
    }
  }, [settings, loading]);

  const onFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSaveClick = () => {
    removeErrors();

    const validationRules = [
      { path: "title", msg: titleRequiredMsg },
      { path: "description", msg: descriptionRequiredMsg },
    ];

    const errors = validateForm(formData, validationRules);
    if (errors.length) {
      setErrors(errors);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSave = (txnPassword) => {
    if (!txnPassword) {
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.replace(/\r\n/g, "\n"),
      txn_password: txnPassword,
    };

    updateSettings(payload, () => {
      setShowConfirmModal(false);
      setDisabled(true);
    });
  };

  const onClickCancel = () => {
    setFormData(buildFormDataFromSettings(settings));
    removeErrors();
    setDisabled(true);
  };

  return (
    <>
      <Card className="common-panel-card mb-4">
        <Card.Header className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>{sectionLabel} — Section Content</span>
          {canEdit && formReady ? (
            <Button
              type="button"
              variant={null}
              className={`btn btn-sm ${isDisabled ? "btn--theme" : "btn--outline"}`}
              onClick={toggleEdit}
              disabled={loading || saving}
            >
              {isDisabled ? (
                <>
                  <MdEdit className="me-1" />
                  Edit
                </>
              ) : (
                <>
                  <FaRegEye className="me-1" />
                  View Mode
                </>
              )}
            </Button>
          ) : null}
        </Card.Header>
        <Card.Body>
          {!formReady ? (
            <BouncingLoader className="bouncing-loader-container--compact" />
          ) : (
            <>
              <p className="text-muted small mb-3">{helperText}</p>

              <Row className="g-3">
                <Col md={12}>
                  <Form.Group controlId={`${controlIdPrefix}Title`}>
                    <Form.Label>Title</Form.Label>
                    <Form.Control
                      name="title"
                      value={formData.title}
                      onChange={onFieldChange}
                      placeholder={titlePlaceholder}
                      disabled={isReadOnly || loading || saving}
                    />
                    <Errors current_key="title" />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group controlId={`${controlIdPrefix}Description`}>
                    <Form.Label>Short Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      value={formData.description}
                      onChange={onFieldChange}
                      placeholder={descriptionPlaceholder}
                      disabled={isReadOnly || loading || saving}
                    />
                    <Errors current_key="description" />
                  </Form.Group>
                </Col>
              </Row>

              {canEdit ? (
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <Button
                    type="button"
                    className="btn btn--theme"
                    onClick={onSaveClick}
                    disabled={isDisabled || loading || saving}
                  >
                    {saving ? "Saving..." : "Save Section Content"}
                  </Button>
                  <Button
                    type="button"
                    className="btn btn--danger"
                    onClick={onClickCancel}
                    disabled={isDisabled || loading || saving}
                  >
                    Cancel
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </Card.Body>
      </Card>

      <VerificationConfirmModal
        show={showConfirmModal}
        handleClose={() => setShowConfirmModal(false)}
        handleConfirm={handleConfirmSave}
        title={confirmTitle}
        body={confirmBody}
        submitBtnText="Save"
      />
    </>
  );
};

CmsSectionSettingsPanel.propTypes = {
  sectionLabel: PropTypes.string.isRequired,
  titlePlaceholder: PropTypes.string.isRequired,
  descriptionPlaceholder: PropTypes.string.isRequired,
  confirmTitle: PropTypes.string.isRequired,
  confirmBody: PropTypes.string.isRequired,
  titleRequiredMsg: PropTypes.string.isRequired,
  descriptionRequiredMsg: PropTypes.string.isRequired,
  controlIdPrefix: PropTypes.string.isRequired,
  helperText: PropTypes.string.isRequired,
  settings: PropTypes.object,
  loading: PropTypes.bool,
  saving: PropTypes.bool,
  canEdit: PropTypes.bool,
  getSettings: PropTypes.func.isRequired,
  updateSettings: PropTypes.func.isRequired,
  removeErrors: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired,
};

export default CmsSectionSettingsPanel;
