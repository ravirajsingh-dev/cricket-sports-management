import React from "react";
import { Button, Card, Collapse, Container, Badge, Dropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router";
import { PropTypes } from "prop-types";
import { connect } from "react-redux";
import { format, parseISO } from "date-fns";

import { RiDeleteBin5Line } from "react-icons/ri";
import { FiPlus } from "react-icons/fi";
import { MdEdit } from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";

import UserFilters from "./UserFilters";
import CustomDataTable from "@src/components/common/DataTable/CustomDataTable";
import AppBreadCrumb from "@src/components/common/AppBreadCrumb";
import VerificationConfirmModal from "@src/features/settings/components/VerificationConfirmModal";
import CopyIcon from "@src/components/common/CopyIcon";

import {
  getUsersList,
  deleteUser,
  resetComponentStore,
  blockUser,
  unblockUser,
} from "@src/features/users/userActions";
import { setAlert } from "@src/app/state/actions/alert";

import { UserStatuses } from "@src/constants/CustomSelectValues";
import { hasPermission } from "@src/utils/permissions";
import { getMemberIdPhonePart } from "@src/utils/memberIdFormatter";

const EMPTY_FILTERS = {
  memberId: "",
  name: "",
  phone: "",
  email: "",
  status: "",
  fromDate: "",
  toDate: "",
};

const pushTextFilter = (nextFilters, nextQuery, key, value, type = "String") => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return;
  nextFilters.push(key);
  nextQuery[key] = { value: trimmed, type };
};

const UsersList = ({
  loggedInAdmin,
  usersList: { data, count },
  getUsersList,
  deleteUser,
  blockUser,
  unblockUser,
  loadingUsersList,
  resetComponentStore,
  setAlert,
  abbreviation,
}) => {
  const [onlyOnce, setOnce] = React.useState(true);
  const [showFilters, setShowFilters] = React.useState(false);
  const [filters, setFilters] = React.useState(EMPTY_FILTERS);
  const [userParams, setUserParams] = React.useState({
    limit: 20,
    page: 1,
    orderBy: "createdAt",
    ascending: "desc",
    query: {},
    filters: [],
  });
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [blockAction, setBlockAction] = React.useState(null);
  const [blockLoading, setBlockLoading] = React.useState(false);
  const navigate = useNavigate();

  const canEditUsers = hasPermission(loggedInAdmin, "users", "edit");

  const getStatusBadge = (status) => {
    const statusOption = UserStatuses.find((s) => s.value === status);
    const statusLabel = statusOption ? statusOption.label : "Unknown";
    let bgColor = "secondary";
    if (status === 1) bgColor = "success";
    else if (status === 2) bgColor = "secondary";
    else if (status === 3) bgColor = "info";
    else if (status === 4) bgColor = "danger";
    return <Badge bg={bgColor}>{statusLabel}</Badge>;
  };

  const openBlockAction = (user, action) => {
    setSelectedUser(user);
    setBlockAction(action);
  };

  const columns = [
    {
      name: "Member ID",
      selector: (row) => (row.memberId ? row.memberId : "-"),
      sortable: true,
      sortField: "memberId",
      width: "170px",
      wrap: true,
      cell: (row) => {
        if (!row.memberId) return "-";
        const digits = getMemberIdPhonePart(row.memberId, abbreviation);
        return (
          <div className="d-flex align-items-center gap-1">
            <span>{row.memberId}</span>
            {digits ? (
              <CopyIcon
                textToCopy={digits}
                iconSize={16}
                onCopy={() =>
                  setAlert("Member ID copied to clipboard", "success")
                }
              />
            ) : null}
          </div>
        );
      },
    },
    {
      name: "Name",
      selector: (row) => row.name,
      sortable: true,
      sortField: "name",
      width: "140px",
      wrap: true,
    },
    {
      name: "Phone",
      selector: (row) => row.phone || "-",
      sortable: true,
      sortField: "phone",
      width: "130px",
      wrap: true,
    },
    {
      name: "Role",
      selector: (row) => row.playingRole?.name || "-",
      sortable: false,
      width: "140px",
      wrap: true,
    },
    {
      name: "Status",
      selector: (row) => getStatusBadge(row.status),
      sortable: true,
      sortField: "status",
      width: "120px",
      wrap: true,
    },
    {
      name: "Created At",
      selector: (row) =>
        row.createdAt
          ? format(parseISO(row.createdAt), "dd/MM/yyyy, hh:mm a")
          : "-",
      sortable: true,
      sortField: "createdAt",
      width: "180px",
      wrap: true,
    },
    {
      name: "Actions",
      width: "150px",
      cell: (row) => (
        <div className="d-flex gap-2 align-items-center justify-content-center">
          {hasPermission(loggedInAdmin, "users", "list") && (
            <Link
              to={`/admin/users/edit/${row._id}`}
              title="View/Edit User"
              className="text-primary"
            >
              <MdEdit size={20} />
            </Link>
          )}
          {canEditUsers && (
            <Dropdown align="end">
              <Dropdown.Toggle
                as={Button}
                variant="link"
                className="text-success p-0 border-0 shadow-none no-caret"
                id={`user-actions-${row._id}`}
                title="User actions"
              >
                <BsThreeDotsVertical size={20} />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {row.status !== 3 ? (
                  <Dropdown.Item onClick={() => openBlockAction(row, "block")}>
                    Block User
                  </Dropdown.Item>
                ) : (
                  <Dropdown.Item onClick={() => openBlockAction(row, "unblock")}>
                    Unblock User
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown>
          )}
          {hasPermission(loggedInAdmin, "users", "delete") && (
            <Button
              variant="link"
              className="text-danger p-0"
              onClick={() => {
                setSelectedUser(row);
                setShowDeleteModal(true);
              }}
              title="Delete User"
            >
              <RiDeleteBin5Line size={20} />
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

    if (!loggedInAdmin) return;

    getUsersList(userParams);
  }, [getUsersList, userParams, resetComponentStore, loggedInAdmin, onlyOnce]);

  const applyFilters = (nextFiltersData) => {
    const nextQuery = {};
    const nextFilters = [];

    const memberId = String(nextFiltersData.memberId || "").trim();
    const name = String(nextFiltersData.name || "").trim();
    const phone = String(nextFiltersData.phone || "").trim();
    const email = String(nextFiltersData.email || "").trim();
    const fromDate = String(nextFiltersData.fromDate || "").trim();
    const toDate = String(nextFiltersData.toDate || "").trim();
    const statusValue =
      nextFiltersData.status !== "" && nextFiltersData.status !== null
        ? Number(nextFiltersData.status)
        : null;

    pushTextFilter(nextFilters, nextQuery, "memberId", memberId);
    pushTextFilter(nextFilters, nextQuery, "name", name);
    pushTextFilter(nextFilters, nextQuery, "phone", phone);
    pushTextFilter(nextFilters, nextQuery, "email", email);

    if (statusValue !== null && !Number.isNaN(statusValue)) {
      nextFilters.push("status");
      nextQuery.status = { value: statusValue, type: "Number" };
    }
    if (fromDate && toDate) {
      nextFilters.push("createdAt");
      nextQuery.createdAt = { value: `${fromDate}|${toDate}`, type: "Date" };
    }

    setUserParams((prev) => ({
      ...prev,
      page: 1,
      filters: nextFilters,
      query: nextQuery,
    }));
  };

  const onFilterChange = (eOrPatch) => {
    if (eOrPatch?.target) {
      const { name, value } = eOrPatch.target;
      setFilters((prev) => ({ ...prev, [name]: value }));
      return;
    }
    setFilters((prev) => ({ ...prev, ...eOrPatch }));
  };

  const onSearch = () => {
    applyFilters(filters);
  };

  const onResetFilters = () => {
    setFilters(EMPTY_FILTERS);
    applyFilters(EMPTY_FILTERS);
  };

  const handleConfirmDelete = (txnPassword) => {
    if (selectedUser && txnPassword) {
      deleteUser(selectedUser._id, txnPassword);
      setShowDeleteModal(false);
      setSelectedUser(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const handleCloseBlockModal = () => {
    if (blockLoading) return;
    setBlockAction(null);
    setSelectedUser(null);
  };

  const handleConfirmBlockAction = async (txnPassword) => {
    if (!selectedUser || !blockAction || !txnPassword) return;

    const actionFn = blockAction === "block" ? blockUser : unblockUser;
    setBlockLoading(true);
    try {
      const result = await actionFn(selectedUser._id, {
        txn_password: txnPassword,
      });
      if (result?.status) {
        setBlockAction(null);
        setSelectedUser(null);
        getUsersList(userParams);
      }
    } finally {
      setBlockLoading(false);
    }
  };

  const blockModalTitle =
    blockAction === "unblock" ? "Unblock User" : "Block User";
  const blockModalBody =
    blockAction === "unblock"
      ? `Are you sure you want to unblock user "${selectedUser?.name || ""}" (${selectedUser?.memberId || ""})? Please enter your transaction password to confirm.`
      : `Are you sure you want to block user "${selectedUser?.name || ""}" (${selectedUser?.memberId || ""})? Please enter your transaction password to confirm.`;

  return (
    <Container>
      <AppBreadCrumb breadcrumbs={[{ name: "Users" }]} />

      <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
        <Button
          type="button"
          className="btn btn--outline"
          onClick={() => setShowFilters((prev) => !prev)}
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
        {hasPermission(loggedInAdmin, "users", "create") && (
          <Button
            type="button"
            className="btn btn--theme"
            onClick={() => navigate("/admin/users/add")}
          >
            <FiPlus className="me-2" />
            Add User
          </Button>
        )}
      </div>

      <Collapse in={showFilters}>
        <div>
          <UserFilters
            values={filters}
            onChange={onFilterChange}
            onSearch={onSearch}
            onReset={onResetFilters}
          />
        </div>
      </Collapse>

      <Card className="common-panel-card">
        <Card.Body>
          {count > 0 && (
            <p className="text-muted mb-3">Total Users: {count}</p>
          )}
          <CustomDataTable
            columns={columns}
            data={data}
            count={count}
            params={userParams}
            setParams={setUserParams}
            pagination
            responsive
            striped
            progressPending={loadingUsersList}
            highlightOnHover
            persistTableHead
            paginationServer
          />
        </Card.Body>
      </Card>

      <VerificationConfirmModal
        show={showDeleteModal}
        handleClose={handleCloseDeleteModal}
        handleConfirm={handleConfirmDelete}
        title="Delete User"
        body={`Are you sure you want to delete user "${selectedUser?.name || ""}" (${selectedUser?.memberId || ""})? This action cannot be undone. Please enter your transaction password to confirm.`}
        submitBtnText="Delete"
      />

      <VerificationConfirmModal
        show={Boolean(blockAction && selectedUser)}
        handleClose={handleCloseBlockModal}
        handleConfirm={handleConfirmBlockAction}
        title={blockModalTitle}
        body={blockModalBody}
        submitBtnText={blockAction === "unblock" ? "Unblock" : "Block"}
      />
    </Container>
  );
};

UsersList.propTypes = {
  getUsersList: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  usersList: state.adminUsers.usersList,
  loadingUsersList: state.adminUsers.loadingUsersList,
  loggedInAdmin: state.adminAuth.admin,
  abbreviation:
    state.adminCommonSettings?.commonSettings?.abbreviation || "",
});

export default connect(mapStateToProps, {
  getUsersList,
  deleteUser,
  resetComponentStore,
  blockUser,
  unblockUser,
  setAlert,
})(UsersList);
