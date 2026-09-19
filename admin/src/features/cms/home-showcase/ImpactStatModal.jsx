import React, { useEffect, useState } from "react";
import { Form, Row, Col } from "react-bootstrap";
import PropTypes from "prop-types";
import CustomModal from "@src/components/common/Modal/CustomModal";
import CustomSelect from "@src/components/common/CustomSelect";
import Errors from "@src/notifications/Errors";
import { getOptionByValue } from "@src/constants/CustomSelectValues";
import {
  IMPACT_ICON_OPTIONS,
  getAvailableImpactIconOptions,
  suggestImpactIcon,
} from "@src/features/cms/home-showcase/homeShowcaseConstants";

const ImpactStatModal = ({
  show,
  onHide,
  item,
  items = [],
  onSave,
  setErrors,
  removeErrors,
  saving = false,
}) => {
  const [formData, setFormData] = useState({
    label: "",
    value: "",
    icon: "trophy",
  });
  const isEdit = Boolean(item?.id);
  const currentIndex = isEdit
    ? items.findIndex((entry) => entry.id === item.id)
    : -1;

  useEffect(() => {
    if (!show) return;
    removeErrors?.();
    setFormData({
      label: item?.label || "",
      value: item?.value || "",
      icon: item?.icon || "trophy",
    });
  }, [show, item, removeErrors]);

  const onField = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "label" || field === "value") {
        const used = items
          .map((entry, i) => (i === currentIndex ? null : entry.icon))
          .filter(Boolean);
        next.icon = suggestImpactIcon(
          field === "label" ? value : next.label,
          field === "value" ? value : next.value,
          used,
        );
      }
      return next;
    });
  };

  const handleSave = () => {
    removeErrors?.();
    const errors = [];
    if (!String(formData.label || "").trim()) {
      errors.push({ path: "label", msg: "Label is required" });
    }
    if (!String(formData.value || "").trim()) {
      errors.push({ path: "value", msg: "Value is required" });
    }
    if (!formData.icon) {
      errors.push({ path: "icon", msg: "Icon is required" });
    }
    if (errors.length) {
      setErrors(errors);
      return;
    }
    onSave({
      id: item?.id,
      label: String(formData.label).trim(),
      value: String(formData.value).trim(),
      icon: formData.icon,
    });
  };

  return (
    <CustomModal
      show={show}
      onHide={onHide}
      title={isEdit ? "Edit Stat" : "Add Stat"}
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
          disabled: saving,
        },
      ]}
    >
      <Form onSubmit={(e) => e.preventDefault()}>
        <Row className="g-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Label *</Form.Label>
              <Form.Control
                value={formData.label}
                onChange={(e) => onField("label", e.target.value)}
                disabled={saving}
                placeholder="e.g. TOTAL PRIZE POOL"
              />
              <Errors current_key="label" />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Value *</Form.Label>
              <Form.Control
                value={formData.value}
                onChange={(e) => onField("value", e.target.value)}
                disabled={saving}
                placeholder="e.g. ₹1 Cr"
              />
              <Errors current_key="value" />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Icon *</Form.Label>
              <CustomSelect
                options={getAvailableImpactIconOptions(items, currentIndex)}
                value={getOptionByValue(IMPACT_ICON_OPTIONS, formData.icon)}
                onChange={(option) =>
                  onField("icon", option?.value || "trophy")
                }
                isDisabled={saving}
                isRequired
                placeholder="Select icon"
              />
              <Errors current_key="icon" />
            </Form.Group>
          </Col>
        </Row>
      </Form>
    </CustomModal>
  );
};

ImpactStatModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  item: PropTypes.object,
  items: PropTypes.array,
  onSave: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired,
  removeErrors: PropTypes.func,
  saving: PropTypes.bool,
};

export default ImpactStatModal;
