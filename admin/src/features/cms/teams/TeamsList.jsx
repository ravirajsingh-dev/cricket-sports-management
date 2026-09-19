import React from "react";
import { Button, Row, Col, Container, Badge, Form } from "react-bootstrap";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { RiDeleteBin5Line, RiEditLine } from "react-icons/ri";

import CustomDataTable from "@src/components/common/DataTable/CustomDataTable";
import AppBreadCrumb from "@src/components/common/AppBreadCrumb";
import MainCard from "@src/components/common/MainCard";
import VerificationConfirmModal from "../../../features/settings/components/VerificationConfirmModal";
import { hasPermission } from "@src/utils/permissions";

import {
  getTeams,
  resetComponentStore,
  deleteTeam,
  getTeamGroups,
} from "@src/features/cms/teams/teamActions";
import TeamModal from "./TeamModal";
import TeamsSettingsPanel from "./TeamsSettingsPanel";
import TeamGroupsPanel from "./TeamGroupsPanel";

const TeamsList = ({
  loggedInUser,
  teamList: { data, count, nextOrder = 1 },
  teamGroups,
  getTeams,
  getTeamGroups,
  loadingTeamList,
  resetComponentStore,
  deleteTeam,
}) => {
  const loggedInAdmin = loggedInUser;
  const [onlyOnce, setOnce] = React.useState(true);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [selectedTeam, setSelectedTeam] = React.useState(null);

  const initialSortingParams = {
    limit: 10,
    page: 1,
    orderBy: "order",
    ascending: "asc",
    query: "",
    group: "",
  };

  const [teamParams, setTeamParams] = React.useState(initialSortingParams);

  const columns = [
    {
      name: "Logo",
      selector: (row) => (
        <img
          src={row.logoUrl}
          alt={row.name || "Team"}
          className="slider-image-preview rounded-circle"
          style={{ width: 56, height: 56, objectFit: "cover" }}
        />
      ),
      sortable: false,
      width: "12%",
      wrap: true,
    },
    {
      name: "Name",
      selector: (row) => row.name || "-",
      sortable: true,
      sortField: "name",
      width: "28%",
      wrap: true,
    },
    {
      name: "Group",
      selector: (row) => row.group?.name || "-",
      sortable: false,
      width: "18%",
      wrap: true,
    },
    {
      name: "Order",
      selector: (row) => row.order,
      sortable: true,
      sortField: "order",
      width: "10%",
      wrap: true,
    },
    {
      name: "Status",
      selector: (row) => (
        <Badge bg={row.isActive ? "success" : "secondary"}>
          {row.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
      sortable: false,
      width: "12%",
      wrap: true,
    },
    {
      name: "Actions",
      width: "20%",
      cell: (row) => (
        <div className="d-flex gap-2">
          {hasPermission(loggedInAdmin, "teams", "edit") && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedTeam(row);
                setShowEditModal(true);
              }}
            >
              <RiEditLine />
            </Button>
          )}
          {hasPermission(loggedInAdmin, "teams", "delete") && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setSelectedTeam(row);
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

    getTeamGroups();
    getTeams(teamParams);
  }, [
    getTeams,
    getTeamGroups,
    teamParams,
    resetComponentStore,
    loggedInUser,
    onlyOnce,
  ]);

  const handleConfirmDeletion = (txnPassword) => {
    if (selectedTeam && txnPassword) {
      deleteTeam(selectedTeam._id, txnPassword);
      setShowDeleteModal(false);
      setSelectedTeam(null);
    }
  };

  const handleCreateTeamClick = (e) => {
    e.preventDefault();
    setSelectedTeam(null);
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setSelectedTeam(null);
    getTeams(teamParams);
    getTeamGroups();
  };

  const activeGroups = (teamGroups.data || []).filter((g) => g.isActive !== false);

  return (
    <Container>
      <AppBreadCrumb breadcrumbs={[{ name: "Official Teams" }]} />

      {hasPermission(loggedInAdmin, "teams", "list") && (
        <TeamsSettingsPanel
          canEdit={hasPermission(loggedInAdmin, "teams", "edit")}
        />
      )}

      {hasPermission(loggedInAdmin, "teams", "list") && <TeamGroupsPanel />}

      <MainCard>
        <div className="table-filter-section mb-3">
          <Row className="d-flex justify-content-between align-items-end g-3">
            <Col md="4">
              {hasPermission(loggedInAdmin, "teams", "create") && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleCreateTeamClick}
                  disabled={activeGroups.length === 0}
                >
                  Add Team
                </Button>
              )}
            </Col>
            <Col md="4">
              <Form.Group controlId="filterGroup">
                <Form.Label>Filter by Group</Form.Label>
                <Form.Select
                  value={teamParams.group || ""}
                  onChange={(e) =>
                    setTeamParams((prev) => ({
                      ...prev,
                      page: 1,
                      group: e.target.value,
                    }))
                  }
                >
                  <option value="">All groups</option>
                  {(teamGroups.data || []).map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </div>

        <CustomDataTable
          columns={columns}
          data={data}
          count={count}
          params={teamParams}
          setParams={setTeamParams}
          pagination
          responsive
          striped={true}
          progressPending={loadingTeamList}
          highlightOnHover
          persistTableHead={true}
          paginationServer
        />
      </MainCard>

      <VerificationConfirmModal
        show={showDeleteModal}
        handleClose={() => {
          setShowDeleteModal(false);
          setSelectedTeam(null);
        }}
        handleConfirm={handleConfirmDeletion}
        title="Confirm Deletion"
        body={`Are you sure you want to delete "${selectedTeam?.name || "this team"}"? This action cannot be undone. Please enter your transaction password to confirm.`}
        submitBtnText="Delete"
      />

      <TeamModal
        show={showEditModal}
        handleClose={handleModalClose}
        team={selectedTeam}
        nextOrder={nextOrder}
        groups={activeGroups}
      />
    </Container>
  );
};

TeamsList.propTypes = {
  getTeams: PropTypes.func.isRequired,
  getTeamGroups: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  teamList: state.teams.teamList,
  teamGroups: state.teams.teamGroups,
  loadingTeamList: state.teams.loadingTeamList,
  loggedInUser: state.adminAuth.admin,
});

export default connect(mapStateToProps, {
  getTeams,
  getTeamGroups,
  resetComponentStore,
  deleteTeam,
})(TeamsList);
