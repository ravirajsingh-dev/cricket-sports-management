import React, { useMemo, useState } from "react";
import { Button, Card } from "react-bootstrap";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { FaPlus } from "react-icons/fa";
import { RiDeleteBin5Line, RiEditLine } from "react-icons/ri";
import CustomDataTable from "@src/components/common/DataTable/CustomDataTable";
import VerificationConfirmModal from "@src/features/settings/components/VerificationConfirmModal";
import { setErrors } from "@src/features/auth";
import { hasPermission } from "@src/utils/permissions";
import {
  createTestimonialItem,
  updateTestimonialItem,
  deleteTestimonialItem,
  removeHomeShowcaseErrors,
} from "@src/features/cms/home-showcase/homeShowcaseActions";
import TestimonialItemModal from "@src/features/cms/home-showcase/TestimonialItemModal";

const TestimonialsItemsPanel = ({
  loggedInUser,
  showcase,
  createTestimonialItem,
  updateTestimonialItem,
  deleteTestimonialItem,
  removeHomeShowcaseErrors,
  setErrors,
}) => {
  const canEdit = hasPermission(loggedInUser, "home-showcase", "edit");
  const items = showcase?.testimonials?.items || [];
  const hasTitle = Boolean(
    String(showcase?.testimonials?.title || "").trim(),
  );

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [params, setParams] = useState({
    limit: 10,
    page: 1,
    orderBy: "order",
    ascending: "asc",
    query: "",
  });

  const rows = useMemo(() => [...items], [items]);
  const pageData = useMemo(() => {
    const start = (params.page - 1) * params.limit;
    return rows.slice(start, start + params.limit);
  }, [rows, params.page, params.limit]);

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingItem(null);
    removeHomeShowcaseErrors();
  };

  const onSave = async (data) => {
    if (editingItem?.id) {
      setPendingUpdate(data);
      setShowUpdateConfirm(true);
      return;
    }
    setSaving(true);
    await createTestimonialItem(data, closeModal);
    setSaving(false);
  };

  const handleConfirmUpdate = async (txnPassword) => {
    if (!pendingUpdate || !txnPassword || !editingItem?.id) return;
    setSaving(true);
    await updateTestimonialItem(
      editingItem.id,
      { ...pendingUpdate, txn_password: txnPassword },
      () => {
        setShowUpdateConfirm(false);
        setPendingUpdate(null);
        closeModal();
      },
    );
    setSaving(false);
  };

  const handleConfirmDelete = async (txnPassword) => {
    if (!deleteTarget || !txnPassword) return;
    setSaving(true);
    await deleteTestimonialItem(deleteTarget.id, txnPassword, () => {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    });
    setSaving(false);
  };

  const columns = useMemo(
    () => [
      {
        name: "Name",
        selector: (row) => row.name || "-",
        sortable: true,
        sortField: "name",
        width: "18%",
        wrap: true,
      },
      {
        name: "Quote",
        selector: (row) => {
          const quote = row.quote || "-";
          return quote.length > 80 ? `${quote.slice(0, 80)}…` : quote;
        },
        sortable: false,
        width: "36%",
        wrap: true,
      },
      {
        name: "Text",
        selector: (row) => row.text || "-",
        sortable: false,
        width: "18%",
        wrap: true,
      },
      {
        name: "Rating",
        selector: (row) => row.rating || "-",
        sortable: true,
        sortField: "rating",
        width: "10%",
      },
      {
        name: "Actions",
        width: "18%",
        cell: (row) =>
          canEdit ? (
            <div className="d-flex gap-2">
              <Button
                type="button"
                variant={null}
                className="btn btn--theme btn-sm"
                disabled={saving}
                onClick={() => {
                  setEditingItem(row);
                  setShowModal(true);
                }}
              >
                <RiEditLine />
              </Button>
              <Button
                type="button"
                variant={null}
                className="btn btn--danger btn-sm"
                disabled={saving}
                onClick={() => {
                  setDeleteTarget(row);
                  setShowDeleteModal(true);
                }}
              >
                <RiDeleteBin5Line />
              </Button>
            </div>
          ) : (
            <span className="text-muted small">View only</span>
          ),
      },
    ],
    [canEdit, saving],
  );

  return (
    <Card className="common-panel-card mb-4">
      <Card.Header className="d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div>
          <span className="d-block">Testimonials — Stories</span>
          <small className="text-muted fw-normal">
            Add / edit / delete saves immediately.
          </small>
        </div>
        {canEdit ? (
          <Button
            type="button"
            variant={null}
            className="btn btn--theme btn-sm"
            disabled={saving || !hasTitle}
            onClick={() => {
              setEditingItem(null);
              setShowModal(true);
            }}
          >
            <FaPlus className="me-1" />
            Add Testimonial
          </Button>
        ) : null}
      </Card.Header>
      <Card.Body>
        {!hasTitle ? (
          <p className="text-muted small mb-3">
            Save the section title above before adding stories.
          </p>
        ) : null}
        <CustomDataTable
          columns={columns}
          data={pageData}
          count={rows.length}
          params={params}
          setParams={setParams}
          pagination
          responsive
          striped
          progressPending={false}
          highlightOnHover
          persistTableHead
          paginationServer
        />
      </Card.Body>

      <TestimonialItemModal
        show={showModal}
        onHide={closeModal}
        item={editingItem}
        onSave={onSave}
        setErrors={setErrors}
        removeErrors={removeHomeShowcaseErrors}
        saving={saving}
      />

      <VerificationConfirmModal
        show={showUpdateConfirm}
        handleClose={() => {
          setShowUpdateConfirm(false);
          setPendingUpdate(null);
        }}
        handleConfirm={handleConfirmUpdate}
        title="Confirm Testimonial Update"
        body="Please enter your transaction password to update this story."
        submitBtnText="Update"
      />

      <VerificationConfirmModal
        show={showDeleteModal}
        handleClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        handleConfirm={handleConfirmDelete}
        title="Confirm Testimonial Delete"
        body={`Delete story from "${deleteTarget?.name || "this person"}"?`}
        submitBtnText="Delete"
      />
    </Card>
  );
};

TestimonialsItemsPanel.propTypes = {
  loggedInUser: PropTypes.object,
  showcase: PropTypes.object,
  createTestimonialItem: PropTypes.func.isRequired,
  updateTestimonialItem: PropTypes.func.isRequired,
  deleteTestimonialItem: PropTypes.func.isRequired,
  removeHomeShowcaseErrors: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  loggedInUser: state.adminAuth.admin,
  showcase: state.homeShowcase.showcase,
});

export default connect(mapStateToProps, {
  createTestimonialItem,
  updateTestimonialItem,
  deleteTestimonialItem,
  removeHomeShowcaseErrors,
  setErrors,
})(TestimonialsItemsPanel);
