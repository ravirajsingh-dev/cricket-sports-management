import React, { useEffect, useState } from "react";
import { Badge, Button, Col, Form, Row, Table } from "react-bootstrap";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { RiDeleteBin5Line, RiEditLine } from "react-icons/ri";
import MainCard from "@src/components/common/MainCard";
import BouncingLoader from "@src/components/common/Loaders/BouncingLoader";
import Errors from "@src/notifications/Errors";
import VerificationConfirmModal from "@src/features/settings/components/VerificationConfirmModal";
import { validateForm } from "@src/utils/validation";
import { setErrors } from "@src/features/auth";
import { hasPermission } from "@src/utils/permissions";
import {
  getTeamGroups,
  createTeamGroup,
  updateTeamGroup,
  deleteTeamGroup,
  removeTeamErrors,
} from "@src/features/cms/teams/teamActions";

const emptyForm = (nextOrder = 1) => ({
  name: "",
  order: nextOrder,
  isActive: true,
});

const TeamGroupsPanel = ({
  loggedInUser,
  teamGroups,
  loadingTeamGroups,
  getTeamGroups,
  createTeamGroup,
  updateTeamGroup,
  deleteTeamGroup,
  removeTeamErrors,
  setErrors,
}) => {
  const canCreate = hasPermission(loggedInUser, "teams", "create");
  const canEdit = hasPermission(loggedInUser, "teams", "edit");
  const canDelete = hasPermission(loggedInUser, "teams", "delete");

  const [formData, setFormData] = useState(emptyForm());
  const [editingGroup, setEditingGroup] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getTeamGroups();
  }, [getTeamGroups]);

  useEffect(() => {
    if (!editingGroup) {
      setFormData(emptyForm(teamGroups.nextOrder || 1));
    }
  }, [teamGroups.nextOrder, editingGroup]);

  const resetForm = () => {
    setEditingGroup(null);
    setFormData(emptyForm(teamGroups.nextOrder || 1));
    removeTeamErrors();
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const startEdit = (group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name || "",
      order: group.order || 1,
      isActive: group.isActive !== undefined ? group.isActive : true,
    });
    removeTeamErrors();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    removeTeamErrors();

    const errors = validateForm(formData, [
      { path: "name", msg: "Group name is required" },
    ]);
    if (errors.length) {
      setErrors(errors);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      order: formData.order,
      isActive: formData.isActive,
    };

    if (editingGroup) {
      setPendingPayload(payload);
      setShowConfirmModal(true);
      return;
    }

    setSaving(true);
    await createTeamGroup(payload, resetForm);
    setSaving(false);
  };

  const handleConfirmEdit = async (txnPassword) => {
    if (!pendingPayload || !txnPassword || !editingGroup) return;
    setSaving(true);
    await updateTeamGroup(
      editingGroup._id,
      { ...pendingPayload, txn_password: txnPassword },
      () => {
        setShowConfirmModal(false);
        setPendingPayload(null);
        resetForm();
      },
    );
    setSaving(false);
  };

  const handleConfirmDelete = async (txnPassword) => {
    if (!deleteTarget || !txnPassword) return;
    await deleteTeamGroup(deleteTarget._id, txnPassword);
    setShowDeleteModal(false);
    setDeleteTarget(null);
    if (editingGroup?._id === deleteTarget._id) {
      resetForm();
    }
  };

  return (
    <MainCard className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="mb-1">Team Groups</h5>
          <p className="text-muted mb-0 small">
            Create pools like POOL A / POOL B. Teams are shown under these groups
            on the homepage.
          </p>
        </div>
      </div>

      {(canCreate || canEdit) && (
        <Form onSubmit={onSubmit} className="mb-4">
          <Row className="g-3 align-items-end">
            <Col md="5">
              <Form.Group controlId="groupName">
                <Form.Label>Group Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={onChange}
                  placeholder="e.g. POOL A"
                />
                <Errors current_key="name" />
              </Form.Group>
            </Col>
            <Col md="2">
              <Form.Group controlId="groupOrder">
                <Form.Label>Order</Form.Label>
                <Form.Control
                  type="number"
                  name="order"
                  min="1"
                  value={formData.order}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>
            <Col md="2">
              <Form.Group controlId="groupActive">
                <Form.Check
                  type="switch"
                  name="isActive"
                  label="Active"
                  checked={formData.isActive}
                  onChange={onChange}
                />
              </Form.Group>
            </Col>
            <Col md="3" className="d-flex gap-2">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingGroup
                    ? "Update Group"
                    : "Add Group"}
              </Button>
              {editingGroup ? (
                <Button type="button" variant="outline-secondary" onClick={resetForm}>
                  Cancel
                </Button>
              ) : null}
            </Col>
          </Row>
        </Form>
      )}

      {loadingTeamGroups ? (
        <BouncingLoader className="bouncing-loader-container--compact" />
      ) : (
        <Table responsive hover className="mb-0 align-middle">
          <thead>
            <tr>
              <th>Name</th>
              <th>Order</th>
              <th>Teams</th>
              <th>Status</th>
              <th style={{ width: "120px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(teamGroups.data || []).length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted text-center py-4">
                  No groups yet. Add POOL A / POOL B to start assigning teams.
                </td>
              </tr>
            ) : (
              teamGroups.data.map((group) => (
                <tr key={group._id}>
                  <td className="fw-semibold">{group.name}</td>
                  <td>{group.order}</td>
                  <td>{group.teamCount || 0}</td>
                  <td>
                    <Badge bg={group.isActive ? "success" : "secondary"}>
                      {group.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td>
                    <div className="d-flex gap-2">
                      {canEdit && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => startEdit(group)}
                        >
                          <RiEditLine />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setDeleteTarget(group);
                            setShowDeleteModal(true);
                          }}
                        >
                          <RiDeleteBin5Line />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}

      <VerificationConfirmModal
        show={showConfirmModal}
        handleClose={() => {
          setShowConfirmModal(false);
          setPendingPayload(null);
        }}
        handleConfirm={handleConfirmEdit}
        title="Confirm Group Update"
        body="Please enter your transaction password to update this team group."
        submitBtnText="Update"
      />

      <VerificationConfirmModal
        show={showDeleteModal}
        handleClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        handleConfirm={handleConfirmDelete}
        title="Confirm Group Deletion"
        body={`Delete "${deleteTarget?.name || "this group"}"? Groups with teams cannot be deleted. Enter your transaction password to confirm.`}
        submitBtnText="Delete"
      />
    </MainCard>
  );
};

TeamGroupsPanel.propTypes = {
  loggedInUser: PropTypes.object,
  teamGroups: PropTypes.object,
  loadingTeamGroups: PropTypes.bool,
  getTeamGroups: PropTypes.func.isRequired,
  createTeamGroup: PropTypes.func.isRequired,
  updateTeamGroup: PropTypes.func.isRequired,
  deleteTeamGroup: PropTypes.func.isRequired,
  removeTeamErrors: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  loggedInUser: state.adminAuth.admin,
  teamGroups: state.teams.teamGroups,
  loadingTeamGroups: state.teams.loadingTeamGroups,
});

export default connect(mapStateToProps, {
  getTeamGroups,
  createTeamGroup,
  updateTeamGroup,
  deleteTeamGroup,
  removeTeamErrors,
  setErrors,
})(TeamGroupsPanel);
