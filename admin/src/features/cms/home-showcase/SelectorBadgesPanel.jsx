import React, { useEffect, useState } from "react";
import { Button, Card, Form, Table } from "react-bootstrap";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { FaPlus } from "react-icons/fa";
import { RiDeleteBin5Line, RiEditLine } from "react-icons/ri";
import CustomModal from "@src/components/common/Modal/CustomModal";
import CustomSelect from "@src/components/common/CustomSelect";
import Errors from "@src/notifications/Errors";
import VerificationConfirmModal from "@src/features/settings/components/VerificationConfirmModal";
import { setErrors } from "@src/features/auth";
import { hasPermission } from "@src/utils/permissions";
import { getOptionByValue } from "@src/constants/CustomSelectValues";
import {
  BADGE_DIRECTION_OPTIONS,
} from "@src/features/cms/home-showcase/homeShowcaseConstants";
import {
  createSelectorBadge,
  updateSelectorBadge,
  deleteSelectorBadge,
  removeHomeShowcaseErrors,
} from "@src/features/cms/home-showcase/homeShowcaseActions";

const emptyForm = () => ({ label: "", direction: "ltr" });

const SelectorBadgesPanel = ({
  loggedInUser,
  showcase,
  createSelectorBadge,
  updateSelectorBadge,
  deleteSelectorBadge,
  removeHomeShowcaseErrors,
  setErrors,
}) => {
  const canEdit = hasPermission(loggedInUser, "home-showcase", "edit");
  const badges = showcase?.selectors?.badges || [];

  const [showFormModal, setShowFormModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm());
  const [editingBadge, setEditingBadge] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!showFormModal) {
      setFormData(emptyForm());
      setEditingBadge(null);
    }
  }, [showFormModal]);

  const closeFormModal = () => {
    if (saving) return;
    setShowFormModal(false);
    setFormData(emptyForm());
    setEditingBadge(null);
    removeHomeShowcaseErrors();
  };

  const openAddModal = () => {
    removeHomeShowcaseErrors();
    setEditingBadge(null);
    setFormData(emptyForm());
    setShowFormModal(true);
  };

  const openEditModal = (badge) => {
    removeHomeShowcaseErrors();
    setEditingBadge(badge);
    setFormData({
      label: badge.label || "",
      direction: badge.direction === "rtl" ? "rtl" : "ltr",
    });
    setShowFormModal(true);
  };

  const onSave = async () => {
    removeHomeShowcaseErrors();

    const label = String(formData.label || "").trim();
    if (!label) {
      setErrors([{ path: "label", msg: "Badge label is required" }]);
      return;
    }

    const payload = {
      label: label.toUpperCase(),
      direction: formData.direction === "rtl" ? "rtl" : "ltr",
    };

    if (editingBadge) {
      setPendingPayload(payload);
      setShowConfirmModal(true);
      return;
    }

    setSaving(true);
    await createSelectorBadge(payload, () => {
      setShowFormModal(false);
      setFormData(emptyForm());
      setEditingBadge(null);
    });
    setSaving(false);
  };

  const handleConfirmEdit = async (txnPassword) => {
    if (!pendingPayload || !txnPassword || !editingBadge) return;
    setSaving(true);
    await updateSelectorBadge(
      editingBadge.id,
      { ...pendingPayload, txn_password: txnPassword },
      () => {
        setShowConfirmModal(false);
        setPendingPayload(null);
        setShowFormModal(false);
        setFormData(emptyForm());
        setEditingBadge(null);
      },
    );
    setSaving(false);
  };

  const handleConfirmDelete = async (txnPassword) => {
    if (!deleteTarget || !txnPassword) return;
    setSaving(true);
    await deleteSelectorBadge(deleteTarget.id, txnPassword, () => {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    });
    setSaving(false);
  };

  return (
    <Card className="common-panel-card mb-4">
      <Card.Header className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div>
          <span className="d-block">Selector Badges</span>
          <small className="text-muted fw-normal">
            Create badges like MENTOR, SELECTOR, CHIEF GUEST, CORE TEAM. People
            pick from this list. Scroll direction applies when a badge group
            auto-scrolls.
          </small>
        </div>
        {canEdit ? (
          <Button
            type="button"
            variant={null}
            className="btn btn--theme btn-sm"
            onClick={openAddModal}
            disabled={saving}
          >
            <FaPlus className="me-1" />
            Add Badge
          </Button>
        ) : null}
      </Card.Header>
      <Card.Body>
        <Table responsive hover className="mb-0 align-middle">
          <thead>
            <tr>
              <th>Badge</th>
              <th>Scroll Direction</th>
              <th style={{ width: 140 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {badges.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-muted text-center py-4">
                  No badges yet. Click Add Badge to create MENTOR / SELECTOR.
                </td>
              </tr>
            ) : (
              badges.map((badge) => (
                <tr key={badge.id}>
                  <td className="fw-semibold">{badge.label}</td>
                  <td>
                    {badge.direction === "rtl"
                      ? "Right → Left"
                      : "Left → Right"}
                  </td>
                  <td>
                    {canEdit ? (
                      <div className="d-flex gap-2">
                        <Button
                          type="button"
                          variant={null}
                          className="btn btn--theme btn-sm"
                          onClick={() => openEditModal(badge)}
                          disabled={saving}
                          aria-label={`Edit ${badge.label}`}
                        >
                          <RiEditLine />
                        </Button>
                        <Button
                          type="button"
                          variant={null}
                          className="btn btn--danger btn-sm"
                          onClick={() => {
                            setDeleteTarget(badge);
                            setShowDeleteModal(true);
                          }}
                          disabled={saving}
                          aria-label={`Delete ${badge.label}`}
                        >
                          <RiDeleteBin5Line />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted small">View only</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card.Body>

      <CustomModal
        show={showFormModal}
        onHide={closeFormModal}
        title={editingBadge ? "Edit Badge" : "Add Badge"}
        size="sm"
        closeButton
        actions={[
          {
            label: "Cancel",
            onClick: closeFormModal,
            className: "btn btn--outline",
            colSize: 6,
            disabled: saving,
          },
          {
            label: saving ? "Saving..." : "Save",
            onClick: onSave,
            className: "btn btn--theme",
            colSize: 6,
            disabled: saving,
          },
        ]}
      >
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          <Form.Group controlId="selectorBadgeLabel" className="mb-3">
            <Form.Label>Badge label *</Form.Label>
            <Form.Control
              type="text"
              value={formData.label}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  label: String(e.target.value || "").toUpperCase(),
                }))
              }
              placeholder="e.g. MENTOR / CHIEF GUEST"
              disabled={saving}
              autoFocus
            />
            <Errors current_key="label" />
          </Form.Group>

          <Form.Group controlId="selectorBadgeDirection">
            <Form.Label>Scroll Direction</Form.Label>
            <CustomSelect
              options={BADGE_DIRECTION_OPTIONS}
              value={getOptionByValue(
                BADGE_DIRECTION_OPTIONS,
                formData.direction,
              )}
              onChange={(option) =>
                setFormData((prev) => ({
                  ...prev,
                  direction: option?.value === "rtl" ? "rtl" : "ltr",
                }))
              }
              placeholder="Select direction"
              isDisabled={saving}
            />
            <Errors current_key="direction" />
          </Form.Group>
        </Form>
      </CustomModal>

      <VerificationConfirmModal
        show={showConfirmModal}
        handleClose={() => {
          setShowConfirmModal(false);
          setPendingPayload(null);
        }}
        handleConfirm={handleConfirmEdit}
        title="Confirm Badge Update"
        body="Please enter your transaction password to update this badge."
        submitBtnText="Update"
      />

      <VerificationConfirmModal
        show={showDeleteModal}
        handleClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        handleConfirm={handleConfirmDelete}
        title="Confirm Badge Delete"
        body={`Delete badge "${deleteTarget?.label || ""}"? People using it will lose the badge.`}
        submitBtnText="Delete"
      />
    </Card>
  );
};

SelectorBadgesPanel.propTypes = {
  loggedInUser: PropTypes.object,
  showcase: PropTypes.object,
  createSelectorBadge: PropTypes.func.isRequired,
  updateSelectorBadge: PropTypes.func.isRequired,
  deleteSelectorBadge: PropTypes.func.isRequired,
  removeHomeShowcaseErrors: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  loggedInUser: state.adminAuth.admin,
  showcase: state.homeShowcase.showcase,
});

export default connect(mapStateToProps, {
  createSelectorBadge,
  updateSelectorBadge,
  deleteSelectorBadge,
  removeHomeShowcaseErrors,
  setErrors,
})(SelectorBadgesPanel);
