import React, { useEffect, useState } from "react";
import { Badge, Button, Col, Form, Row, Table } from "react-bootstrap";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { RiDeleteBin5Line, RiEditLine } from "react-icons/ri";
import MainCard from "@src/components/common/MainCard";
import CustomSelect from "@src/components/common/CustomSelect";
import BouncingLoader from "@src/components/common/Loaders/BouncingLoader";
import Errors from "@src/notifications/Errors";
import VerificationConfirmModal from "@src/features/settings/components/VerificationConfirmModal";
import { validateForm } from "@src/utils/validation";
import { setErrors } from "@src/features/auth";
import { hasPermission } from "@src/utils/permissions";
import { getOptionByValue } from "@src/constants/CustomSelectValues";
import {
  getCarouselGroups,
  createCarouselGroup,
  updateCarouselGroup,
  deleteCarouselGroup,
  removeCarouselErrors,
} from "@src/features/cms/carousel-sections/carouselSectionActions";

const DIRECTION_OPTIONS = [
  { label: "Left → Right", value: "ltr" },
  { label: "Right → Left", value: "rtl" },
];

const emptyForm = (nextOrder = 1) => ({
  name: "",
  direction: "ltr",
  order: nextOrder,
  isActive: true,
});

const CarouselGroupsPanel = ({
  loggedInUser,
  groups,
  loadingGroups,
  getCarouselGroups,
  createCarouselGroup,
  updateCarouselGroup,
  deleteCarouselGroup,
  removeCarouselErrors,
  setErrors,
}) => {
  const canCreate = hasPermission(loggedInUser, "carousel-sections", "create");
  const canEdit = hasPermission(loggedInUser, "carousel-sections", "edit");
  const canDelete = hasPermission(loggedInUser, "carousel-sections", "delete");

  const [formData, setFormData] = useState(emptyForm());
  const [editingGroup, setEditingGroup] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCarouselGroups();
  }, [getCarouselGroups]);

  useEffect(() => {
    if (!editingGroup) {
      setFormData(emptyForm(groups.nextOrder || 1));
    }
  }, [groups.nextOrder, editingGroup]);

  const resetForm = () => {
    setEditingGroup(null);
    setFormData(emptyForm(groups.nextOrder || 1));
    removeCarouselErrors();
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
      direction: group.direction === "rtl" ? "rtl" : "ltr",
      order: group.order || 1,
      isActive: group.isActive !== undefined ? group.isActive : true,
    });
    removeCarouselErrors();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    removeCarouselErrors();

    const errors = validateForm(formData, [
      { path: "name", msg: "Group name is required" },
    ]);
    if (errors.length) {
      setErrors(errors);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      direction: formData.direction === "rtl" ? "rtl" : "ltr",
      order: formData.order,
      isActive: formData.isActive,
    };

    if (editingGroup) {
      setPendingPayload(payload);
      setShowConfirmModal(true);
      return;
    }

    setSaving(true);
    await createCarouselGroup(payload, resetForm);
    setSaving(false);
  };

  const handleConfirmEdit = async (txnPassword) => {
    if (!pendingPayload || !txnPassword || !editingGroup) return;
    setSaving(true);
    await updateCarouselGroup(
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
    await deleteCarouselGroup(deleteTarget._id, txnPassword);
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
          <h5 className="mb-1">Section Groups</h5>
          <p className="text-muted mb-0 small">
            Create groups like Upcoming Trials, Completed Trials, or Information.
            Each active group becomes its own carousel on the homepage.
          </p>
        </div>
      </div>

      {(canCreate || canEdit) && (
        <Form onSubmit={onSubmit} className="mb-4">
          <Row className="g-3 align-items-end">
            <Col md="4">
              <Form.Group controlId="carouselGroupName">
                <Form.Label>Group Name *</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={onChange}
                  placeholder="e.g. Upcoming Trials"
                />
                <Errors current_key="name" />
              </Form.Group>
            </Col>
            <Col md="2">
              <Form.Group controlId="carouselGroupDirection">
                <Form.Label>Scroll Direction</Form.Label>
                <CustomSelect
                  options={DIRECTION_OPTIONS}
                  value={getOptionByValue(DIRECTION_OPTIONS, formData.direction)}
                  onChange={(option) =>
                    setFormData((prev) => ({
                      ...prev,
                      direction: option?.value === "rtl" ? "rtl" : "ltr",
                    }))
                  }
                  placeholder="Select direction"
                  isRequired
                  selectProps={{ isSearchable: false }}
                />
              </Form.Group>
            </Col>
            <Col md="2">
              <Form.Group controlId="carouselGroupOrder">
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
            <Col md="1">
              <Form.Group controlId="carouselGroupActive">
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
                <Button
                  type="button"
                  variant="outline-secondary"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              ) : null}
            </Col>
          </Row>
        </Form>
      )}

      {loadingGroups ? (
        <BouncingLoader className="bouncing-loader-container--compact" />
      ) : (
        <Table responsive hover className="mb-0 align-middle">
          <thead>
            <tr>
              <th>Name</th>
              <th>Direction</th>
              <th>Order</th>
              <th>Items</th>
              <th>Status</th>
              <th style={{ width: "120px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(groups.data || []).length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted text-center py-4">
                  No groups yet. Add Upcoming Trials / Information to start.
                </td>
              </tr>
            ) : (
              groups.data.map((group) => (
                <tr key={group._id}>
                  <td className="fw-semibold">{group.name}</td>
                  <td>
                    {group.direction === "rtl"
                      ? "Right → Left"
                      : "Left → Right"}
                  </td>
                  <td>{group.order}</td>
                  <td>{group.itemCount || 0}</td>
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
        body="Please enter your transaction password to update this section group."
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
        body={`Delete "${deleteTarget?.name || "this group"}"? Groups with items cannot be deleted. Enter your transaction password to confirm.`}
        submitBtnText="Delete"
      />
    </MainCard>
  );
};

CarouselGroupsPanel.propTypes = {
  loggedInUser: PropTypes.object,
  groups: PropTypes.object,
  loadingGroups: PropTypes.bool,
  getCarouselGroups: PropTypes.func.isRequired,
  createCarouselGroup: PropTypes.func.isRequired,
  updateCarouselGroup: PropTypes.func.isRequired,
  deleteCarouselGroup: PropTypes.func.isRequired,
  removeCarouselErrors: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  loggedInUser: state.adminAuth.admin,
  groups: state.carouselSections.groups,
  loadingGroups: state.carouselSections.loadingGroups,
});

export default connect(mapStateToProps, {
  getCarouselGroups,
  createCarouselGroup,
  updateCarouselGroup,
  deleteCarouselGroup,
  removeCarouselErrors,
  setErrors,
})(CarouselGroupsPanel);
