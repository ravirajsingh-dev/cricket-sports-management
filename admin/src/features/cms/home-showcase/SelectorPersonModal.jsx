import React, { useEffect, useState } from "react";
import { Form, Row, Col } from "react-bootstrap";
import PropTypes from "prop-types";
import CustomModal from "@src/components/common/Modal/CustomModal";
import CustomSelect from "@src/components/common/CustomSelect";
import Errors from "@src/notifications/Errors";
import { getOptionByValue } from "@src/constants/CustomSelectValues";
import {
  MAX_IMAGE_SIZE_BYTES,
  IMAGE_SIZE_ERROR,
} from "@src/constants/imageUpload";
import { toBadgeSelectOptions } from "@src/features/cms/home-showcase/homeShowcaseConstants";

const SelectorPersonModal = ({
  show,
  onHide,
  person,
  badges = [],
  onSave,
  setErrors,
  removeErrors,
  saving = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    badgeId: "",
    badge: "",
    imageFile: null,
    imagePreview: null,
    imageUrl: "",
    imageKey: "",
  });

  const badgeOptions = toBadgeSelectOptions(badges);
  const isEdit = Boolean(person?.id);

  useEffect(() => {
    if (!show) return;
    removeErrors?.();
    setFormData({
      name: person?.name || "",
      role: person?.role || "",
      badgeId: person?.badgeId || "",
      badge: person?.badge || "",
      imageFile: null,
      imagePreview: person?.imagePreview || person?.imageUrl || null,
      imageUrl: person?.imageUrl || "",
      imageKey: person?.imageKey || "",
    });
  }, [show, person, removeErrors]);

  const onChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onBadgeChange = (option) => {
    const badgeId = option?.value || "";
    const badge = badgeOptions.find((entry) => entry.value === badgeId);
    setFormData((prev) => ({
      ...prev,
      badgeId,
      badge: badge?.label || "",
    }));
  };

  const onImageChange = (file) => {
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setErrors([{ path: "image", msg: IMAGE_SIZE_ERROR }]);
      return;
    }
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setErrors([
        {
          path: "image",
          msg: "Only jpg, jpeg, png, and webp images are allowed",
        },
      ]);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    removeErrors?.();
    const errors = [];
    if (!String(formData.name || "").trim()) {
      errors.push({ path: "name", msg: "Name is required" });
    }
    if (!String(formData.role || "").trim()) {
      errors.push({ path: "role", msg: "Role is required" });
    }
    if (!formData.badgeId) {
      errors.push({ path: "badgeId", msg: "Badge is required" });
    }
    if (!formData.imageFile && !formData.imagePreview) {
      errors.push({ path: "image", msg: "Photo is required" });
    }
    if (errors.length) {
      setErrors(errors);
      return;
    }

    onSave({
      id: person?.id,
      name: String(formData.name).trim(),
      role: String(formData.role).trim(),
      badgeId: formData.badgeId,
      badge: formData.badge,
      imageFile: formData.imageFile,
      imagePreview: formData.imagePreview,
      imageUrl: formData.imageUrl || "",
      imageKey: formData.imageKey || "",
      clearImage: false,
    });
  };

  return (
    <CustomModal
      show={show}
      onHide={onHide}
      title={isEdit ? "Edit Person" : "Add Person"}
      size="lg"
      closeButton
      bodyClassName="common-modal-body--start"
      actions={[
        {
          label: "Cancel",
          onClick: onHide,
          className: "btn btn--outline",
          colSize: 5,
          disabled: saving,
        },
        {
          label: saving ? "Saving..." : "Save",
          onClick: handleSave,
          className: "btn btn--theme",
          colSize: 7,
          disabled: saving || badgeOptions.length === 0,
        },
      ]}
    >
      <Form onSubmit={(e) => e.preventDefault()}>
        <Row className="g-3">
          <Col md={6}>
            <Form.Group controlId="selectorPersonName">
              <Form.Label>Name *</Form.Label>
              <Form.Control
                value={formData.name}
                onChange={(e) => onChange("name", e.target.value)}
                disabled={saving}
                placeholder="e.g. Rahul Sharma"
              />
              <Errors current_key="name" />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="selectorPersonRole">
              <Form.Label>Role *</Form.Label>
              <Form.Control
                value={formData.role}
                onChange={(e) => onChange("role", e.target.value)}
                disabled={saving}
                placeholder="e.g. IPL Player | First-Class Cricketer"
              />
              <Errors current_key="role" />
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Group controlId="selectorPersonBadge">
              <Form.Label>Badge *</Form.Label>
              <CustomSelect
                options={badgeOptions}
                value={getOptionByValue(badgeOptions, formData.badgeId)}
                onChange={onBadgeChange}
                isDisabled={saving || badgeOptions.length === 0}
                isRequired
                placeholder={
                  badgeOptions.length === 0
                    ? "Create badges in Selector Badges panel first"
                    : "Select badge"
                }
              />
              <Errors current_key="badgeId" />
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Group controlId="selectorPersonPhoto">
              <Form.Label>Photo *</Form.Label>
              <Form.Control
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                disabled={saving}
                onChange={(e) => onImageChange(e.target.files?.[0])}
              />
              <Errors current_key="image" />
              {formData.imagePreview ? (
                <img
                  src={formData.imagePreview}
                  alt={formData.name || "Selector"}
                  className="mt-2 rounded-circle"
                  style={{ width: 72, height: 72, objectFit: "cover" }}
                />
              ) : null}
            </Form.Group>
          </Col>
        </Row>
      </Form>
    </CustomModal>
  );
};

SelectorPersonModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  person: PropTypes.object,
  badges: PropTypes.array,
  onSave: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired,
  removeErrors: PropTypes.func,
  saving: PropTypes.bool,
};

export default SelectorPersonModal;
