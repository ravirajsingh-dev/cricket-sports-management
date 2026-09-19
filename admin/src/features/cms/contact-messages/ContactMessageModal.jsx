import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Badge } from "react-bootstrap";
import CustomModal from "@src/components/common/Modal/CustomModal";
import BouncingLoader from "@src/components/common/Loaders/BouncingLoader";
import {
  getContactMessageById,
  clearContactMessageDetail,
} from "@src/features/cms/contact-messages/contactMessageActions";

const formatDateTime = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "-";
  }
};

const ContactMessageModal = ({
  show,
  handleClose,
  messageId,
  selectedContactMessage,
  loadingContactMessageDetail,
  getContactMessageById,
  clearContactMessageDetail,
}) => {
  React.useEffect(() => {
    if (!show || !messageId) return;
    getContactMessageById(messageId);
  }, [show, messageId, getContactMessageById]);

  const onHide = () => {
    clearContactMessageDetail();
    handleClose();
  };

  const detail = selectedContactMessage;
  const isLoading = loadingContactMessageDetail || !detail;

  return (
    <CustomModal
      show={show}
      onHide={onHide}
      title="Contact Message"
      size="md"
      closeButton
      bodyClassName="common-modal-body--start"
      actions={[
        {
          label: "Close",
          onClick: onHide,
          className: "btn btn--outline",
          colSize: 12,
        },
      ]}
    >
      {isLoading ? (
        <BouncingLoader className="bouncing-loader-container--compact" />
      ) : (
        <div className="contact-message-detail">
          <div className="mb-3 d-flex align-items-center gap-2 flex-wrap">
            <Badge bg={detail.isRead ? "secondary" : "primary"}>
              {detail.isRead ? "Read" : "Unread"}
            </Badge>
            <span className="text-muted small">
              {formatDateTime(detail.createdAt)}
            </span>
          </div>

          <div className="mb-3">
            <div className="text-uppercase small text-muted mb-1">Name</div>
            <div className="fw-semibold">{detail.name || "-"}</div>
          </div>

          <div className="mb-3">
            <div className="text-uppercase small text-muted mb-1">Email</div>
            <div>
              {detail.email ? (
                <a href={`mailto:${detail.email}`}>{detail.email}</a>
              ) : (
                "-"
              )}
            </div>
          </div>

          <div className="mb-0">
            <div className="text-uppercase small text-muted mb-1">Message</div>
            <div style={{ whiteSpace: "pre-wrap" }}>
              {detail.message || "-"}
            </div>
          </div>
        </div>
      )}
    </CustomModal>
  );
};

ContactMessageModal.propTypes = {
  show: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  messageId: PropTypes.string,
  selectedContactMessage: PropTypes.object,
  loadingContactMessageDetail: PropTypes.bool,
  getContactMessageById: PropTypes.func.isRequired,
  clearContactMessageDetail: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  selectedContactMessage: state.contactMessages.selectedContactMessage,
  loadingContactMessageDetail: state.contactMessages.loadingContactMessageDetail,
});

export default connect(mapStateToProps, {
  getContactMessageById,
  clearContactMessageDetail,
})(ContactMessageModal);
