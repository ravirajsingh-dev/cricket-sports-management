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
  createSelectorPerson,
  updateSelectorPerson,
  deleteSelectorPerson,
  removeHomeShowcaseErrors,
} from "@src/features/cms/home-showcase/homeShowcaseActions";
import SelectorPersonModal from "@src/features/cms/home-showcase/SelectorPersonModal";

const SelectorsPeoplePanel = ({
  loggedInUser,
  showcase,
  createSelectorPerson,
  updateSelectorPerson,
  deleteSelectorPerson,
  removeHomeShowcaseErrors,
  setErrors,
}) => {
  const canEdit = hasPermission(loggedInUser, "home-showcase", "edit");
  const people = showcase?.selectors?.people || [];
  const badges = showcase?.selectors?.badges || [];
  const hasTitle = Boolean(String(showcase?.selectors?.title || "").trim());

  const [showPersonModal, setShowPersonModal] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [saving, setSaving] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState(null);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [peopleParams, setPeopleParams] = useState({
    limit: 10,
    page: 1,
    orderBy: "order",
    ascending: "asc",
    query: "",
  });

  const rows = useMemo(() => {
    const list = [...people];
    const { orderBy, ascending } = peopleParams;
    if (orderBy) {
      list.sort((a, b) => {
        const left = String(a[orderBy] ?? "").toLowerCase();
        const right = String(b[orderBy] ?? "").toLowerCase();
        if (left < right) return ascending === "desc" ? 1 : -1;
        if (left > right) return ascending === "desc" ? -1 : 1;
        return 0;
      });
    }
    return list;
  }, [people, peopleParams]);

  const pageData = useMemo(() => {
    const start = (peopleParams.page - 1) * peopleParams.limit;
    return rows.slice(start, start + peopleParams.limit);
  }, [rows, peopleParams.page, peopleParams.limit]);

  const closePersonModal = () => {
    if (saving) return;
    setShowPersonModal(false);
    setEditingPerson(null);
    removeHomeShowcaseErrors();
  };

  const buildPersonFormData = (personData, txnPassword = null) => {
    const body = new FormData();
    body.append("name", personData.name);
    body.append("role", personData.role);
    body.append("badgeId", personData.badgeId);
    if (personData.imageFile) {
      body.append("image", personData.imageFile);
    }
    if (txnPassword) {
      body.append("txn_password", txnPassword);
    }
    return body;
  };

  const onPersonSave = async (personData) => {
    if (editingPerson?.id) {
      setPendingUpdate(personData);
      setShowUpdateConfirm(true);
      return;
    }

    setSaving(true);
    await createSelectorPerson(buildPersonFormData(personData), () => {
      closePersonModal();
    });
    setSaving(false);
  };

  const handleConfirmUpdate = async (txnPassword) => {
    if (!pendingUpdate || !txnPassword || !editingPerson?.id) return;
    setSaving(true);
    await updateSelectorPerson(
      editingPerson.id,
      buildPersonFormData(pendingUpdate, txnPassword),
      () => {
        setShowUpdateConfirm(false);
        setPendingUpdate(null);
        closePersonModal();
      },
    );
    setSaving(false);
  };

  const handleConfirmDelete = async (txnPassword) => {
    if (!deleteTarget || !txnPassword) return;
    setSaving(true);
    await deleteSelectorPerson(deleteTarget.id, txnPassword, () => {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    });
    setSaving(false);
  };

  const columns = useMemo(
    () => [
      {
        name: "Photo",
        width: "12%",
        cell: (row) =>
          row.imageUrl ? (
            <img
              src={row.imageUrl}
              alt={row.name || "Person"}
              className="rounded-circle"
              style={{ width: 48, height: 48, objectFit: "cover" }}
            />
          ) : (
            "-"
          ),
      },
      {
        name: "Name",
        selector: (row) => row.name || "-",
        sortable: true,
        sortField: "name",
        width: "22%",
        wrap: true,
      },
      {
        name: "Role",
        selector: (row) => row.role || "-",
        sortable: true,
        sortField: "role",
        width: "28%",
        wrap: true,
      },
      {
        name: "Badge",
        selector: (row) => row.badge || "-",
        sortable: true,
        sortField: "badge",
        width: "18%",
        wrap: true,
      },
      {
        name: "Actions",
        width: "20%",
        cell: (row) =>
          canEdit ? (
            <div className="d-flex gap-2">
              <Button
                type="button"
                variant={null}
                className="btn btn--theme btn-sm"
                disabled={saving}
                onClick={() => {
                  setEditingPerson(row);
                  setShowPersonModal(true);
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
          <span className="d-block">Mentors & Selectors — People</span>
          <small className="text-muted fw-normal">
            Add / edit / delete saves immediately. Badge is required.
          </small>
        </div>
        {canEdit ? (
          <Button
            type="button"
            variant={null}
            className="btn btn--theme btn-sm"
            disabled={saving || !hasTitle || badges.length === 0}
            onClick={() => {
              setEditingPerson(null);
              setShowPersonModal(true);
            }}
          >
            <FaPlus className="me-1" />
            Add Person
          </Button>
        ) : null}
      </Card.Header>
      <Card.Body>
        {!hasTitle ? (
          <p className="text-muted small mb-3">
            Save the section title above before adding people.
          </p>
        ) : null}
        {badges.length === 0 ? (
          <p className="text-muted small mb-3">
            Create at least one badge before adding people.
          </p>
        ) : null}

        <CustomDataTable
          columns={columns}
          data={pageData}
          count={rows.length}
          params={peopleParams}
          setParams={setPeopleParams}
          pagination
          responsive
          striped
          progressPending={false}
          highlightOnHover
          persistTableHead
          paginationServer
        />
      </Card.Body>

      <SelectorPersonModal
        show={showPersonModal}
        onHide={closePersonModal}
        person={editingPerson}
        badges={badges}
        onSave={onPersonSave}
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
        title="Confirm Person Update"
        body="Please enter your transaction password to update this person."
        submitBtnText="Update"
      />

      <VerificationConfirmModal
        show={showDeleteModal}
        handleClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        handleConfirm={handleConfirmDelete}
        title="Confirm Person Delete"
        body={`Delete "${deleteTarget?.name || "this person"}"?`}
        submitBtnText="Delete"
      />
    </Card>
  );
};

SelectorsPeoplePanel.propTypes = {
  loggedInUser: PropTypes.object,
  showcase: PropTypes.object,
  createSelectorPerson: PropTypes.func.isRequired,
  updateSelectorPerson: PropTypes.func.isRequired,
  deleteSelectorPerson: PropTypes.func.isRequired,
  removeHomeShowcaseErrors: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  loggedInUser: state.adminAuth.admin,
  showcase: state.homeShowcase.showcase,
});

export default connect(mapStateToProps, {
  createSelectorPerson,
  updateSelectorPerson,
  deleteSelectorPerson,
  removeHomeShowcaseErrors,
  setErrors,
})(SelectorsPeoplePanel);
