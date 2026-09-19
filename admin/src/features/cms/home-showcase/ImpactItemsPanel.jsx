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
  createImpactItem,
  updateImpactItem,
  deleteImpactItem,
  removeHomeShowcaseErrors,
} from "@src/features/cms/home-showcase/homeShowcaseActions";
import { MAX_IMPACT_ITEMS } from "@src/features/cms/home-showcase/homeShowcaseConstants";
import ImpactStatModal from "@src/features/cms/home-showcase/ImpactStatModal";

const ImpactItemsPanel = ({
  loggedInUser,
  showcase,
  createImpactItem,
  updateImpactItem,
  deleteImpactItem,
  removeHomeShowcaseErrors,
  setErrors,
}) => {
  const canEdit = hasPermission(loggedInUser, "home-showcase", "edit");
  const items = showcase?.impact?.items || [];
  const hasTitle = Boolean(String(showcase?.impact?.title || "").trim());

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
    await createImpactItem(data, closeModal);
    setSaving(false);
  };

  const handleConfirmUpdate = async (txnPassword) => {
    if (!pendingUpdate || !txnPassword || !editingItem?.id) return;
    setSaving(true);
    await updateImpactItem(
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
    await deleteImpactItem(deleteTarget.id, txnPassword, () => {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    });
    setSaving(false);
  };

  const columns = useMemo(
    () => [
      {
        name: "Label",
        selector: (row) => row.label || "-",
        sortable: true,
        sortField: "label",
        width: "28%",
        wrap: true,
      },
      {
        name: "Value",
        selector: (row) => row.value || "-",
        sortable: true,
        sortField: "value",
        width: "22%",
        wrap: true,
      },
      {
        name: "Icon",
        selector: (row) => row.icon || "-",
        sortable: false,
        width: "20%",
        wrap: true,
      },
      {
        name: "Actions",
        width: "30%",
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
          <span className="d-block">Impact — Stats</span>
          <small className="text-muted fw-normal">
            Add / edit / delete saves immediately.
          </small>
        </div>
        {canEdit ? (
          <Button
            type="button"
            variant={null}
            className="btn btn--theme btn-sm"
            disabled={
              saving || !hasTitle || items.length >= MAX_IMPACT_ITEMS
            }
            onClick={() => {
              setEditingItem(null);
              setShowModal(true);
            }}
          >
            <FaPlus className="me-1" />
            Add Stat
          </Button>
        ) : null}
      </Card.Header>
      <Card.Body>
        {!hasTitle ? (
          <p className="text-muted small mb-3">
            Save the section title above before adding stats.
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

      <ImpactStatModal
        show={showModal}
        onHide={closeModal}
        item={editingItem}
        items={items}
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
        title="Confirm Stat Update"
        body="Please enter your transaction password to update this stat."
        submitBtnText="Update"
      />

      <VerificationConfirmModal
        show={showDeleteModal}
        handleClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        handleConfirm={handleConfirmDelete}
        title="Confirm Stat Delete"
        body={`Delete "${deleteTarget?.label || "this stat"}"?`}
        submitBtnText="Delete"
      />
    </Card>
  );
};

ImpactItemsPanel.propTypes = {
  loggedInUser: PropTypes.object,
  showcase: PropTypes.object,
  createImpactItem: PropTypes.func.isRequired,
  updateImpactItem: PropTypes.func.isRequired,
  deleteImpactItem: PropTypes.func.isRequired,
  removeHomeShowcaseErrors: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  loggedInUser: state.adminAuth.admin,
  showcase: state.homeShowcase.showcase,
});

export default connect(mapStateToProps, {
  createImpactItem,
  updateImpactItem,
  deleteImpactItem,
  removeHomeShowcaseErrors,
  setErrors,
})(ImpactItemsPanel);
