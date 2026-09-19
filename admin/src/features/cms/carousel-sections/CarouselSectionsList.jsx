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
  getCarouselItems,
  resetComponentStore,
  deleteCarouselItem,
  getCarouselGroups,
} from "@src/features/cms/carousel-sections/carouselSectionActions";
import CarouselItemModal from "./CarouselItemModal";
import CarouselGroupsPanel from "./CarouselGroupsPanel";

const CarouselSectionsList = ({
  loggedInUser,
  itemList: { data, count, nextOrder = 1 },
  groups,
  getCarouselItems,
  getCarouselGroups,
  loadingItemList,
  resetComponentStore,
  deleteCarouselItem,
}) => {
  const loggedInAdmin = loggedInUser;
  const [onlyOnce, setOnce] = React.useState(true);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState(null);

  const initialSortingParams = {
    limit: 10,
    page: 1,
    orderBy: "order",
    ascending: "asc",
    query: "",
    group: "",
  };

  const [itemParams, setItemParams] = React.useState(initialSortingParams);

  const columns = [
    {
      name: "Image",
      selector: (row) =>
        row.imageUrl ? (
          <img
            src={row.imageUrl}
            alt={row.name || "Carousel item"}
            className="slider-image-preview"
            style={{
              width: 72,
              height: 48,
              objectFit: "cover",
              borderRadius: 6,
            }}
          />
        ) : (
          <span className="text-muted">—</span>
        ),
      sortable: false,
      width: "12%",
      wrap: true,
    },
    {
      name: "Name",
      selector: (row) => row.name || "—",
      sortable: true,
      sortField: "name",
      width: "22%",
      wrap: true,
    },
    {
      name: "Short Desc",
      selector: (row) => row.shortDesc || "—",
      sortable: false,
      width: "20%",
      wrap: true,
    },
    {
      name: "Group",
      selector: (row) => row.group?.name || "—",
      sortable: false,
      width: "16%",
      wrap: true,
    },
    {
      name: "Order",
      selector: (row) => row.order,
      sortable: true,
      sortField: "order",
      width: "8%",
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
      width: "10%",
      wrap: true,
    },
    {
      name: "Actions",
      width: "12%",
      cell: (row) => (
        <div className="d-flex gap-2">
          {hasPermission(loggedInAdmin, "carousel-sections", "edit") && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedItem(row);
                setShowEditModal(true);
              }}
            >
              <RiEditLine />
            </Button>
          )}
          {hasPermission(loggedInAdmin, "carousel-sections", "delete") && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setSelectedItem(row);
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

    getCarouselGroups();
    getCarouselItems(itemParams);
  }, [
    getCarouselItems,
    getCarouselGroups,
    itemParams,
    resetComponentStore,
    loggedInUser,
    onlyOnce,
  ]);

  const handleConfirmDeletion = (txnPassword) => {
    if (selectedItem && txnPassword) {
      deleteCarouselItem(selectedItem._id, txnPassword);
      setShowDeleteModal(false);
      setSelectedItem(null);
    }
  };

  const handleCreateClick = (e) => {
    e.preventDefault();
    setSelectedItem(null);
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setSelectedItem(null);
    getCarouselItems(itemParams);
    getCarouselGroups();
  };

  const activeGroups = (groups.data || []).filter((g) => g.isActive !== false);

  return (
    <Container>
      <AppBreadCrumb breadcrumbs={[{ name: "Carousel Sections" }]} />

      {hasPermission(loggedInAdmin, "carousel-sections", "list") && (
        <CarouselGroupsPanel />
      )}

      <MainCard>
        <div className="table-filter-section mb-3">
          <Row className="d-flex justify-content-between align-items-end g-3">
            <Col md="4">
              {hasPermission(loggedInAdmin, "carousel-sections", "create") && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleCreateClick}
                  disabled={activeGroups.length === 0}
                >
                  Add Item
                </Button>
              )}
            </Col>
            <Col md="4">
              <Form.Group controlId="filterCarouselGroup">
                <Form.Label>Filter by Group</Form.Label>
                <Form.Select
                  value={itemParams.group || ""}
                  onChange={(e) =>
                    setItemParams((prev) => ({
                      ...prev,
                      page: 1,
                      group: e.target.value,
                    }))
                  }
                >
                  <option value="">All groups</option>
                  {(groups.data || []).map((group) => (
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
          params={itemParams}
          setParams={setItemParams}
          pagination
          responsive
          striped={true}
          progressPending={loadingItemList}
          highlightOnHover
          persistTableHead={true}
          paginationServer
        />
      </MainCard>

      <VerificationConfirmModal
        show={showDeleteModal}
        handleClose={() => {
          setShowDeleteModal(false);
          setSelectedItem(null);
        }}
        handleConfirm={handleConfirmDeletion}
        title="Confirm Deletion"
        body={`Are you sure you want to delete "${selectedItem?.name || "this item"}"? This action cannot be undone. Please enter your transaction password to confirm.`}
        submitBtnText="Delete"
      />

      <CarouselItemModal
        show={showEditModal}
        handleClose={handleModalClose}
        item={selectedItem}
        nextOrder={nextOrder}
        groups={activeGroups}
      />
    </Container>
  );
};

CarouselSectionsList.propTypes = {
  getCarouselItems: PropTypes.func.isRequired,
  getCarouselGroups: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  itemList: state.carouselSections.itemList,
  groups: state.carouselSections.groups,
  loadingItemList: state.carouselSections.loadingItemList,
  loggedInUser: state.adminAuth.admin,
});

export default connect(mapStateToProps, {
  getCarouselItems,
  getCarouselGroups,
  resetComponentStore,
  deleteCarouselItem,
})(CarouselSectionsList);
