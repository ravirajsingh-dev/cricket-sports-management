import React from "react";
import { Button, Badge, Container } from "react-bootstrap";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { RiDeleteBin5Line, RiEyeLine } from "react-icons/ri";

import CustomDataTable from "@src/components/common/DataTable/CustomDataTable";
import AppBreadCrumb from "@src/components/common/AppBreadCrumb";
import MainCard from "@src/components/common/MainCard";
import VerificationConfirmModal from "@src/features/settings/components/VerificationConfirmModal";
import { hasPermission } from "@src/utils/permissions";

import {
  getContactMessages,
  resetComponentStore,
  deleteContactMessage,
} from "@src/features/cms/contact-messages/contactMessageActions";
import ContactMessageModal from "./ContactMessageModal";

const formatDateTime = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "-";
  }
};

const ContactMessageList = ({
  loggedInUser,
  contactMessageList: { data, count },
  getContactMessages,
  loadingContactMessageList,
  resetComponentStore,
  deleteContactMessage,
}) => {
  const loggedInAdmin = loggedInUser;
  const [onlyOnce, setOnce] = React.useState(true);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [showViewModal, setShowViewModal] = React.useState(false);
  const [selectedMessage, setSelectedMessage] = React.useState(null);

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
      width: "18%",
      wrap: true,
    },
    {
      name: "Email",
      selector: (row) => row.email || "-",
      sortable: true,
      sortField: "email",
      width: "22%",
      wrap: true,
    },
    {
      name: "Message",
      selector: (row) => {
        const message = row.message || "-";
        return message.length > 100 ? `${message.slice(0, 100)}…` : message;
      },
      sortable: false,
      width: "28%",
      wrap: true,
    },
    {
      name: "Status",
      selector: (row) => (
        <Badge bg={row.isRead ? "secondary" : "primary"}>
          {row.isRead ? "Read" : "Unread"}
        </Badge>
      ),
      sortable: true,
      sortField: "isRead",
      width: "10%",
    },
    {
      name: "Received",
      selector: (row) => formatDateTime(row.createdAt),
      sortable: true,
      sortField: "createdAt",
      width: "12%",
      wrap: true,
    },
    {
      name: "Actions",
      width: "10%",
      cell: (row) => (
        <div className="d-flex gap-2">
          {hasPermission(loggedInAdmin, "contact-messages", "list") && (
            <Button
              variant="primary"
              size="sm"
              title="View"
              onClick={() => {
                setSelectedMessage(row);
                setShowViewModal(true);
              }}
            >
              <RiEyeLine />
            </Button>
          )}
          {hasPermission(loggedInAdmin, "contact-messages", "delete") && (
            <Button
              variant="danger"
              size="sm"
              title="Delete"
              onClick={() => {
                setSelectedMessage(row);
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

    getContactMessages(listParams);
  }, [getContactMessages, listParams, resetComponentStore, loggedInUser, onlyOnce]);

  const handleConfirmDeletion = (txnPassword) => {
    if (selectedMessage && txnPassword) {
      deleteContactMessage(selectedMessage._id, txnPassword);
      setShowDeleteModal(false);
      setSelectedMessage(null);
    }
  };

  return (
    <Container>
      <AppBreadCrumb breadcrumbs={[{ name: "Contact Messages" }]} />

      <MainCard>
        <CustomDataTable
          columns={columns}
          data={data}
          count={count}
          params={listParams}
          setParams={setListParams}
          pagination
          responsive
          striped={true}
          progressPending={loadingContactMessageList}
          highlightOnHover
          persistTableHead={true}
          paginationServer
        />
      </MainCard>

      <VerificationConfirmModal
        show={showDeleteModal}
        handleClose={() => {
          setShowDeleteModal(false);
          setSelectedMessage(null);
        }}
        handleConfirm={handleConfirmDeletion}
        title="Confirm Deletion"
        body="Are you sure you want to delete this contact message? This action cannot be undone. Please enter your transaction password to confirm."
        submitBtnText="Delete"
      />

      <ContactMessageModal
        show={showViewModal}
        handleClose={() => {
          setShowViewModal(false);
          setSelectedMessage(null);
        }}
        messageId={selectedMessage?._id}
      />
    </Container>
  );
};

ContactMessageList.propTypes = {
  getContactMessages: PropTypes.func.isRequired,
  resetComponentStore: PropTypes.func.isRequired,
  deleteContactMessage: PropTypes.func.isRequired,
  loadingContactMessageList: PropTypes.bool,
  contactMessageList: PropTypes.object,
  loggedInUser: PropTypes.object,
};

const mapStateToProps = (state) => ({
  contactMessageList: state.contactMessages.contactMessageList,
  loadingContactMessageList: state.contactMessages.loadingContactMessageList,
  loggedInUser: state.adminAuth.admin,
});

export default connect(mapStateToProps, {
  getContactMessages,
  resetComponentStore,
  deleteContactMessage,
})(ContactMessageList);
