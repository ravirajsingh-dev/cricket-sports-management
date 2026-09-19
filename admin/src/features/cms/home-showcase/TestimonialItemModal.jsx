import React, { useEffect, useState } from "react";
import { Form, Row, Col } from "react-bootstrap";
import PropTypes from "prop-types";
import CustomModal from "@src/components/common/Modal/CustomModal";
import Errors from "@src/notifications/Errors";

const TestimonialItemModal = ({
  show,
  onHide,
  item,
  onSave,
  setErrors,
  removeErrors,
  saving = false,
}) => {
  const [formData, setFormData] = useState({
    quote: "",
    name: "",
    text: "",
    rating: 5,
  });
  const isEdit = Boolean(item?.id);

  useEffect(() => {
    if (!show) return;
    removeErrors?.();
    setFormData({
      quote: item?.quote || "",
      name: item?.name || "",
      text: item?.text || "",
      rating: item?.rating || 5,
    });
  }, [show, item, removeErrors]);

  const onChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    removeErrors?.();
    const errors = [];
    if (!String(formData.quote || "").trim()) {
      errors.push({ path: "quote", msg: "Quote is required" });
    }
    if (!String(formData.name || "").trim()) {
      errors.push({ path: "name", msg: "Name is required" });
    }
    if (!String(formData.text || "").trim()) {
      errors.push({ path: "text", msg: "Text is required" });
    }
    if (errors.length) {
      setErrors(errors);
      return;
    }
    onSave({
      id: item?.id,
      quote: String(formData.quote).replace(/\r\n/g, "\n").trim(),
      name: String(formData.name).trim(),
      text: String(formData.text).replace(/\r\n/g, "\n").trim(),
      rating: Number(formData.rating) || 5,
    });
  };

  return (
    <CustomModal
      show={show}
      onHide={onHide}
      title={isEdit ? "Edit Testimonial" : "Add Testimonial"}
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
          <Col md={12}>
            <Form.Group>
              <Form.Label>Quote *</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={formData.quote}
                onChange={(e) => onChange("quote", e.target.value)}
                disabled={saving}
                maxLength={500}
              />
              <Form.Text className="text-muted">
                {formData.quote.length}/500 characters
              </Form.Text>
              <Errors current_key="quote" />
            </Form.Group>
          </Col>
          <Col md={5}>
            <Form.Group>
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
          <Col md={4}>
            <Form.Group>
              <Form.Label>Text *</Form.Label>
              <Form.Control
                value={formData.text}
                onChange={(e) => onChange("text", e.target.value)}
                disabled={saving}
                placeholder="e.g. U-19 Player, Lucknow"
              />
              <Errors current_key="text" />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group>
              <Form.Label>Rating (1–5)</Form.Label>
              <Form.Control
                type="number"
                min="1"
                max="5"
                value={formData.rating}
                onChange={(e) => onChange("rating", e.target.value)}
                disabled={saving}
              />
            </Form.Group>
          </Col>
        </Row>
      </Form>
    </CustomModal>
  );
};

TestimonialItemModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func.isRequired,
  item: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired,
  removeErrors: PropTypes.func,
  saving: PropTypes.bool,
};

export default TestimonialItemModal;
