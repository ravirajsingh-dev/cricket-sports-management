import React from "react";
import { Button, Badge, Container, Row, Col } from "react-bootstrap";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { RiDeleteBin5Line, RiEditLine } from "react-icons/ri";

import CustomDataTable from "@src/components/common/DataTable/CustomDataTable";
import AppBreadCrumb from "@src/components/common/AppBreadCrumb";
import MainCard from "@src/components/common/MainCard";
import VerificationConfirmModal from "@src/features/settings/components/VerificationConfirmModal";
import { hasPermission } from "@src/utils/permissions";

import {
  getPlayingRoles,
  resetComponentStore,
  deletePlayingRole,
} from "@src/features/cms/playing-roles/playingRoleActions";
import PlayingRoleModal from "./PlayingRoleModal";

const formatAmount = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";
  return `₹${amount.toLocaleString("en-IN")}`;
};

const PlayingRoleList = ({
  loggedInUser,
  playingRoleList: { data, count },
  getPlayingRoles,
  loadingPlayingRoleList,
  resetComponentStore,
  deletePlayingRole,
}) => {
  const loggedInAdmin = loggedInUser;
  const [onlyOnce, setOnce] = React.useState(true);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState(null);

  const initialSortingParams = {
    limit: 10,
    page: 1,
    orderBy: "createdAt",
    ascending: "desc",
    query: "",
  };

  const [listParams, setListParams] = React.useState(initialSortingParams);

  const columns = [
    {
      name: "Name",
      selector: (row) => row.name || "-",
      sortable: true,
      sortField: "name",
      width: "35%",
      wrap: true,
    },
    {
      name: "Amount",
      selector: (row) => formatAmount(row.amount),
      sortable: true,
      sortField: "amount",
      width: "25%",
    },
    {
      name: "Status",
      selector: (row) => (
        <Badge bg={row.isActive ? "success" : "secondary"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
      sortable: true,
      sortField: "isActive",
      width: "20%",
    },
    {
      name: "Actions",
      width: "20%",
      cell: (row) => (
        <div className="d-flex gap-2">
          {hasPermission(loggedInAdmin, "playing-roles", "edit") && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedRole(row);
                setShowEditModal(true);
              }}
            >
              <RiEditLine />
            </Button>
          )}
          {hasPermission(loggedInAdmin, "playing-roles", "delete") && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setSelectedRole(row);
                setShowDeleteModal(true);
              }}
            >
              <RiDeleteBin5Line />
            </Button>
          )}
        </div>
      ),
    },
  ];

  React.useEffect(() => {
    if (onlyOnce) {
      resetComponentStore();
      setOnce(false);
    }

    if (!loggedInUser) return;

    getPlayingRoles(listParams);
  }, [getPlayingRoles, listParams, resetComponentStore, loggedInUser, onlyOnce]);

  const handleConfirmDeletion = (txnPassword) => {
    if (selectedRole && txnPassword) {
      deletePlayingRole(selectedRole._id, txnPassword);
      setShowDeleteModal(false);
      setSelectedRole(null);
    }
  };

  const handleCreateClick = (e) => {
    e.preventDefault();
    setSelectedRole(null);
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setSelectedRole(null);
    getPlayingRoles(listParams);
  };

  return (
    <Container>
      <AppBreadCrumb breadcrumbs={[{ name: "Select Your Role" }]} />

      <MainCard>
        <div className="table-filter-section mb-3">
          <Row className="d-flex justify-content-between">
            <Col md="4">
              {hasPermission(loggedInAdmin, "playing-roles", "create") && (
                <Button type="button" variant="primary" onClick={handleCreateClick}>
                  Add Role
                </Button>
              )}
            </Col>
          </Row>
        </div>

        <CustomDataTable
          columns={columns}
          data={data}
          count={count}
          params={listParams}
          setParams={setListParams}
          pagination
          responsive
          striped={true}
          progressPending={loadingPlayingRoleList}
          highlightOnHover
          persistTableHead={true}
          paginationServer
        />
      </MainCard>

      <VerificationConfirmModal
        show={showDeleteModal}
        handleClose={() => {
          setShowDeleteModal(false);
          setSelectedRole(null);
        }}
        handleConfirm={handleConfirmDeletion}
        title="Confirm Deletion"
        body="Are you sure you want to delete this role? This action cannot be undone. Please enter your transaction password to confirm."
        submitBtnText="Delete"
      />

      <PlayingRoleModal
        show={showEditModal}
        handleClose={handleModalClose}
        role={selectedRole}
      />
    </Container>
  );
};

PlayingRoleList.propTypes = {
  getPlayingRoles: PropTypes.func.isRequired,
  resetComponentStore: PropTypes.func.isRequired,
  deletePlayingRole: PropTypes.func.isRequired,
  loadingPlayingRoleList: PropTypes.bool,
  playingRoleList: PropTypes.object,
  loggedInUser: PropTypes.object,
};

const mapStateToProps = (state) => ({
  playingRoleList: state.playingRoles.playingRoleList,
  loadingPlayingRoleList: state.playingRoles.loadingPlayingRoleList,
  loggedInUser: state.adminAuth.admin,
});

export default connect(mapStateToProps, {
  getPlayingRoles,
  resetComponentStore,
  deletePlayingRole,
})(PlayingRoleList);
