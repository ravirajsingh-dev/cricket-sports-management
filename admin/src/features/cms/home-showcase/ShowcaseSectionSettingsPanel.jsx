import React, { useEffect, useState } from "react";
import { Button, Card, Col, Form, Row } from "react-bootstrap";
import PropTypes from "prop-types";
import { FaRegEye } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import Errors from "@src/notifications/Errors";
import VerificationConfirmModal from "@src/features/settings/components/VerificationConfirmModal";
import {
  TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
} from "@src/features/cms/home-showcase/homeShowcaseConstants";

const ShowcaseSectionSettingsPanel = ({
  sectionKey,
  sectionLabel,
  titlePlaceholder,
  descriptionPlaceholder,
  helperText,
  settings,
  loading,
  saving,
  canEdit = false,
  updateSettings,
  removeErrors,
  setErrors,
}) => {
  const [formData, setFormData] = useState(null);
  const [isDisabled, setDisabled] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const formReady = formData !== null;
  const isReadOnly = isDisabled || !canEdit;

  useEffect(() => {
    if (!loading && settings) {
      setFormData({
        title: settings.title || "",
        description: settings.description || "",
      });
    }
  }, [settings, loading]);

  const onChange = (e) => {
    const { name, value } = e.target;
    let next = value;
    if (name === "title" && next.length > TITLE_MAX_LENGTH) {
      next = next.slice(0, TITLE_MAX_LENGTH);
    }
    if (
      name === "description" &&
      next.length > DESCRIPTION_MAX_LENGTH
    ) {
      next = next.slice(0, DESCRIPTION_MAX_LENGTH);
    }
    setFormData((prev) => ({ ...prev, [name]: next }));
  };

  const onCancel = () => {
    setFormData({
      title: settings?.title || "",
      description: settings?.description || "",
    });
    removeErrors();
    setDisabled(true);
  };

  const onSaveClick = () => {
    removeErrors();
    const title = String(formData.title || "").trim();
    const description = String(formData.description || "")
      .replace(/\r\n/g, "\n")
      .trim();
    const errors = [];
    if (!title) {
      errors.push({ path: "title", msg: "Title is required" });
    }
    if (title.length > TITLE_MAX_LENGTH) {
      errors.push({
        path: "title",
        msg: `Title must be at most ${TITLE_MAX_LENGTH} characters`,
      });
    }
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      errors.push({
        path: "description",
        msg: `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`,
      });
    }
    if (errors.length) {
      setErrors(errors);
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSave = (txnPassword) => {
    if (!txnPassword) return;
    updateSettings(
      sectionKey,
      {
        title: formData.title.trim(),
        description: formData.description.replace(/\r\n/g, "\n").trim(),
        txn_password: txnPassword,
      },
      () => {
        setShowConfirmModal(false);
        setDisabled(true);
      },
    );
  };

  return (
    <>
      <Card className="common-panel-card mb-4">
        <Card.Header className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <span className="d-block">{sectionLabel} — Title</span>
            <small className="text-muted fw-normal">
              {helperText ||
                "Set once, then edit anytime. Saves separately from items."}
            </small>
          </div>
          {canEdit && formReady ? (
            <Button
              type="button"
              variant={null}
              className={`btn btn-sm ${isDisabled ? "btn--theme" : "btn--outline"}`}
              onClick={() => setDisabled((prev) => !prev)}
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
            <p className="text-muted mb-0">Loading...</p>
          ) : (
            <>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group controlId={`${sectionKey}SettingsTitle`}>
                    <Form.Label>Title *</Form.Label>
                    <Form.Control
                      name="title"
                      value={formData.title}
                      onChange={onChange}
                      disabled={isReadOnly || saving}
                      maxLength={TITLE_MAX_LENGTH}
                      placeholder={titlePlaceholder}
                    />
                    <Form.Text className="text-muted">
                      {formData.title.length}/{TITLE_MAX_LENGTH}{" "}
                      characters
                    </Form.Text>
                    <Errors current_key="title" />
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group controlId={`${sectionKey}SettingsDescription`}>
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      value={formData.description}
                      onChange={onChange}
                      disabled={isReadOnly || saving}
                      maxLength={DESCRIPTION_MAX_LENGTH}
                      placeholder={descriptionPlaceholder}
                    />
                    <Form.Text className="text-muted">
                      {formData.description.length}/
                      {DESCRIPTION_MAX_LENGTH} characters
                    </Form.Text>
                    <Errors current_key="description" />
                  </Form.Group>
                </Col>
              </Row>

              {canEdit && !isDisabled ? (
                <div className="d-flex flex-wrap justify-content-end gap-2 mt-4">
                  <Button
                    type="button"
                    variant={null}
                    className="btn btn--outline"
                    onClick={onCancel}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant={null}
                    className="btn btn--theme"
                    onClick={onSaveClick}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save"}
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
        title={`Confirm ${sectionLabel} Settings`}
        body="Please enter your transaction password to save title and description."
        submitBtnText="Save"
      />
    </>
  );
};

ShowcaseSectionSettingsPanel.propTypes = {
  sectionKey: PropTypes.string.isRequired,
  sectionLabel: PropTypes.string.isRequired,
  titlePlaceholder: PropTypes.string,
  descriptionPlaceholder: PropTypes.string,
  helperText: PropTypes.string,
  settings: PropTypes.object,
  loading: PropTypes.bool,
  saving: PropTypes.bool,
  canEdit: PropTypes.bool,
  updateSettings: PropTypes.func.isRequired,
  removeErrors: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired,
};

export default ShowcaseSectionSettingsPanel;
