import React from "react";
import { Button, Row, Col, Container, Badge } from "react-bootstrap";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { RiDeleteBin5Line, RiEditLine } from "react-icons/ri";

import CustomDataTable from "@src/components/common/DataTable/CustomDataTable";
import AppBreadCrumb from "@src/components/common/AppBreadCrumb";
import MainCard from "@src/components/common/MainCard";
import VerificationConfirmModal from "../../../features/settings/components/VerificationConfirmModal";
import { hasPermission } from "@src/utils/permissions";

import {
  getFaqs,
  resetComponentStore,
  deleteFaq,
} from "@src/features/cms/faq/faqActions";
import FaqModal from "./FaqModal";
import FaqSettingsPanel from "./FaqSettingsPanel";

const FaqList = ({
  loggedInUser,
  faqList: { data, count, nextOrder = 1 },
  getFaqs,
  loadingFaqList,
  resetComponentStore,
  deleteFaq,
}) => {
  const loggedInAdmin = loggedInUser;
  const [onlyOnce, setOnce] = React.useState(true);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [selectedFaq, setSelectedFaq] = React.useState(null);

  const initialSortingParams = {
    limit: 10,
    page: 1,
    orderBy: "order",
    ascending: "asc",
    query: "",
  };

  const [faqParams, setFaqParams] = React.useState(initialSortingParams);

  const columns = [
    {
      name: "Question",
      selector: (row) => row.question || "-",
      sortable: true,
      sortField: "question",
      width: "40%",
      wrap: true,
    },
    {
      name: "Answer",
      selector: (row) => {
        const answer = row.answer || "-";
        return answer.length > 120 ? `${answer.slice(0, 120)}…` : answer;
      },
      sortable: false,
      width: "28%",
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
      width: "10%",
      wrap: true,
    },
    {
      name: "Actions",
      width: "12%",
      cell: (row) => (
        <div className="d-flex gap-2">
          {hasPermission(loggedInAdmin, "faq", "edit") && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedFaq(row);
                setShowEditModal(true);
              }}
            >
              <RiEditLine />
            </Button>
          )}
          {hasPermission(loggedInAdmin, "faq", "delete") && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setSelectedFaq(row);
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

    getFaqs(faqParams);
  }, [getFaqs, faqParams, resetComponentStore, loggedInUser, onlyOnce]);

  const handleConfirmDeletion = (txnPassword) => {
    if (selectedFaq && txnPassword) {
      deleteFaq(selectedFaq._id, txnPassword);
      setShowDeleteModal(false);
      setSelectedFaq(null);
    }
  };

  const handleCreateClick = (e) => {
    e.preventDefault();
    setSelectedFaq(null);
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
    setSelectedFaq(null);
    getFaqs(faqParams);
  };

  return (
    <Container>
      <AppBreadCrumb breadcrumbs={[{ name: "FAQ" }]} />

      {hasPermission(loggedInAdmin, "faq", "list") && (
        <FaqSettingsPanel canEdit={hasPermission(loggedInAdmin, "faq", "edit")} />
      )}

      <MainCard>
        <div className="table-filter-section mb-3">
          <Row className="d-flex justify-content-between">
            <Col md="4">
              {hasPermission(loggedInAdmin, "faq", "create") && (
                <Button type="button" variant="primary" onClick={handleCreateClick}>
                  Add FAQ
                </Button>
              )}
            </Col>
          </Row>
        </div>

        <CustomDataTable
          columns={columns}
          data={data}
          count={count}
          params={faqParams}
          setParams={setFaqParams}
          pagination
          responsive
          striped={true}
          progressPending={loadingFaqList}
          highlightOnHover
          persistTableHead={true}
          paginationServer
        />
      </MainCard>

      <VerificationConfirmModal
        show={showDeleteModal}
        handleClose={() => {
          setShowDeleteModal(false);
          setSelectedFaq(null);
        }}
        handleConfirm={handleConfirmDeletion}
        title="Confirm Deletion"
        body={`Are you sure you want to delete this FAQ? This action cannot be undone. Please enter your transaction password to confirm.`}
        submitBtnText="Delete"
      />

      <FaqModal
        show={showEditModal}
        handleClose={handleModalClose}
        faq={selectedFaq}
        nextOrder={nextOrder}
      />
    </Container>
  );
};

FaqList.propTypes = {
  getFaqs: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  faqList: state.faq.faqList,
  loadingFaqList: state.faq.loadingFaqList,
  loggedInUser: state.adminAuth.admin,
});

export default connect(mapStateToProps, {
  getFaqs,
  resetComponentStore,
  deleteFaq,
})(FaqList);
