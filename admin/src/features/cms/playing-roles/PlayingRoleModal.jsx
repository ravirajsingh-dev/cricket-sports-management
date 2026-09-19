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
  createPlayingRole,
  updatePlayingRole,
  removePlayingRoleErrors,
} from "@src/features/cms/playing-roles/playingRoleActions";
import VerificationConfirmModal from "@src/features/settings/components/VerificationConfirmModal";

const buildFormFromRole = (role) => {
  if (role) {
    return {
      name: role.name || "",
      amount: role.amount ?? "",
      isActive: role.isActive !== undefined ? role.isActive : true,
    };
  }

  return {
    name: "",
    amount: "",
    isActive: true,
  };
};

const PlayingRoleModal = ({
  show,
  handleClose,
  role,
  createPlayingRole,
  updatePlayingRole,
  removePlayingRoleErrors,
  setErrors,
  errorList,
  loadingPlayingRoleList,
}) => {
  const [formData, setFormData] = useState(() => buildFormFromRole(role));
  const [formReady, setFormReady] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  useEffect(() => {
    if (!show) {
      setFormReady(false);
      return;
    }

    setFormData(buildFormFromRole(role));
    setFormReady(true);
    removePlayingRoleErrors();
  }, [role, show, removePlayingRoleErrors]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const onSubmit = () => {
    removePlayingRoleErrors();

    const errors = validateForm(formData, [
      { path: "name", msg: "Name is required" },
      {
        path: "amount",
        msg: "Valid amount is required",
        validator: (value) =>
          value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0,
      },
    ]);
    if (errors.length) {
      setErrors(errors);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      amount: Number(formData.amount),
      isActive: formData.isActive,
    };

    if (role) {
      setPendingPayload(payload);
      setShowConfirmModal(true);
      return;
    }

    createPlayingRole(payload, handleClose);
  };

  const handleConfirmEdit = (txnPassword) => {
    if (!pendingPayload || !txnPassword) {
      return;
    }

    updatePlayingRole(
      { ...pendingPayload, txn_password: txnPassword },
      role._id,
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
        title={role ? "Edit Role" : "Add Role"}
        size="md"
        closeButton
        bodyClassName="common-modal-body--start"
        actions={[
          {
            label: "Cancel",
            onClick: handleClose,
            className: "btn btn--outline",
            colSize: 5,
            disabled: loadingPlayingRoleList || !formReady,
          },
          {
            label: loadingPlayingRoleList
              ? "Saving..."
              : role
                ? "Update"
                : "Create",
            onClick: onSubmit,
            className: "btn btn--theme",
            colSize: 7,
            disabled: loadingPlayingRoleList || !formReady,
          },
        ]}
      >
        {!formReady ? (
          <BouncingLoader className="bouncing-loader-container--compact" />
        ) : (
          <Form onSubmit={(e) => e.preventDefault()}>
            <Row>
              <Col md="12" className="mb-3">
                <Form.Group controlId="name">
                  <Form.Label>Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={onChange}
                    placeholder="e.g. Batter"
                    maxLength={100}
                    className={errorList.name ? "invalid" : ""}
                  />
                  <Errors current_key="name" />
                </Form.Group>
              </Col>

              <Col md="12" className="mb-3">
                <Form.Group controlId="amount">
                  <Form.Label>Amount (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={onChange}
                    placeholder="e.g. 999"
                    min={0}
                    step="1"
                    className={errorList.amount ? "invalid" : ""}
                  />
                  <Errors current_key="amount" />
                </Form.Group>
              </Col>

              <Col md="12">
                <Form.Group controlId="isActive">
                  <Form.Check
                    type="switch"
                    name="isActive"
                    label="Active"
                    checked={formData.isActive}
                    onChange={onChange}
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
        title="Confirm Update"
        body="Please enter your transaction password to update this role."
        submitBtnText="Update"
      />
    </>
  );
};

PlayingRoleModal.propTypes = {
  show: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  role: PropTypes.object,
  createPlayingRole: PropTypes.func.isRequired,
  updatePlayingRole: PropTypes.func.isRequired,
  removePlayingRoleErrors: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired,
  errorList: PropTypes.object,
  loadingPlayingRoleList: PropTypes.bool,
};

const mapStateToProps = (state) => ({
  loadingPlayingRoleList: state.playingRoles.loadingPlayingRoleList,
  errorList: state.errors,
});

export default connect(mapStateToProps, {
  createPlayingRole,
  updatePlayingRole,
  removePlayingRoleErrors,
  setErrors,
})(PlayingRoleModal);
