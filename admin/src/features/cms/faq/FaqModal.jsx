import React, { useEffect, useState } from "react";
import { Form, Row, Col } from "react-bootstrap";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import CustomModal from "@src/components/common/Modal/CustomModal";
import Errors from "@src/notifications/Errors";
import BouncingLoader from "@src/components/common/Loaders/BouncingLoader";
import { validateForm } from "@src/utils/validation";
import { setErrors } from "@src/features/auth";
import {
  createFaq,
  updateFaq,
  removeFaqErrors,
} from "@src/features/cms/faq/faqActions";
import VerificationConfirmModal from "@src/features/settings/components/VerificationConfirmModal";

const buildFormFromFaq = (faq, nextOrder) => {
  if (faq) {
    return {
      question: faq.question || "",
      answer: faq.answer || "",
      order: faq.order || 1,
      isActive: faq.isActive !== undefined ? faq.isActive : true,
    };
  }

  return {
    question: "",
    answer: "",
    order: nextOrder,
    isActive: true,
  };
};

const FaqModal = ({
  show,
  handleClose,
  faq,
  nextOrder = 1,
  createFaq,
  updateFaq,
  removeFaqErrors,
  setErrors,
  errorList,
  loadingFaqList,
}) => {
  const [formData, setFormData] = useState(() =>
    buildFormFromFaq(faq, nextOrder),
  );
  const [formReady, setFormReady] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  useEffect(() => {
    if (!show) {
      setFormReady(false);
      return;
    }

    setFormData(buildFormFromFaq(faq, nextOrder));
    setFormReady(true);
    removeFaqErrors();
  }, [faq, show, nextOrder, removeFaqErrors]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const onSubmit = () => {
    removeFaqErrors();

    const errors = validateForm(formData, [
      { path: "question", msg: "Question is required" },
      { path: "answer", msg: "Answer is required" },
    ]);
    if (errors.length) {
      setErrors(errors);
      return;
    }

    const payload = {
      question: formData.question.trim(),
      answer: formData.answer.trim(),
      order: formData.order,
      isActive: formData.isActive,
    };

    if (faq) {
      setPendingPayload(payload);
      setShowConfirmModal(true);
      return;
    }

    createFaq(payload, handleClose);
  };

  const handleConfirmEdit = (txnPassword) => {
    if (!pendingPayload || !txnPassword) {
      return;
    }

    updateFaq(
      { ...pendingPayload, txn_password: txnPassword },
      faq._id,
      () => {
        setShowConfirmModal(false);
        setPendingPayload(null);
        handleClose();
      },
    );
  };

  return (
    <>
      <CustomModal
        show={show}
        onHide={handleClose}
        title={faq ? "Edit FAQ" : "Add FAQ"}
        size="lg"
        closeButton
        bodyClassName="common-modal-body--start"
        actions={[
          {
            label: "Cancel",
            onClick: handleClose,
            className: "btn btn--outline",
            colSize: 5,
            disabled: loadingFaqList || !formReady,
          },
          {
            label: loadingFaqList ? "Saving..." : faq ? "Update" : "Create",
            onClick: onSubmit,
            className: "btn btn--theme",
            colSize: 7,
            disabled: loadingFaqList || !formReady,
          },
        ]}
      >
        {!formReady ? (
          <BouncingLoader className="bouncing-loader-container--compact" />
        ) : (
          <Form onSubmit={(e) => e.preventDefault()}>
            <Row>
              <Col md="12" className="mb-3">
                <Form.Group controlId="question">
                  <Form.Label>Question *</Form.Label>
                  <Form.Control
                    type="text"
                    name="question"
                    value={formData.question}
                    onChange={onChange}
                    placeholder="e.g. Is this league only for players from Kashi?"
                    className={errorList.question ? "invalid" : ""}
                  />
                  <Errors current_key="question" />
                </Form.Group>
              </Col>

              <Col md="12" className="mb-3">
                <Form.Group controlId="answer">
                  <Form.Label>Answer *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="answer"
                    value={formData.answer}
                    onChange={onChange}
                    placeholder="Enter the answer"
                    className={errorList.answer ? "invalid" : ""}
                  />
                  <Errors current_key="answer" />
                </Form.Group>
              </Col>

              <Col md="6" className="mb-3">
                <Form.Group controlId="order">
                  <Form.Label>Display Order</Form.Label>
                  <Form.Control
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={onChange}
                    min="1"
                  />
                </Form.Group>
              </Col>

              <Col md="6" className="mb-3">
                <Form.Group controlId="isActive">
                  <Form.Check
                    type="switch"
                    name="isActive"
                    label="Active"
                    checked={formData.isActive}
                    onChange={onChange}
                    className="mt-4"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        )}
      </CustomModal>

      <VerificationConfirmModal
        show={showConfirmModal}
        handleClose={() => {
          setShowConfirmModal(false);
          setPendingPayload(null);
        }}
        handleConfirm={handleConfirmEdit}
        title="Confirm FAQ Update"
        body="Please enter your transaction password to update this FAQ."
        submitBtnText="Update"
      />
    </>
  );
};

FaqModal.propTypes = {
  show: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  faq: PropTypes.object,
  nextOrder: PropTypes.number,
};

const mapStateToProps = (state) => ({
  errorList: state.errors,
  loadingFaqList: state.faq.loadingFaqList,
});

export default connect(mapStateToProps, {
  createFaq,
  updateFaq,
  removeFaqErrors,
  setErrors,
})(FaqModal);
