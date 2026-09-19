import PropTypes from "prop-types";
import { connect } from "react-redux";
import { TiWarning } from "react-icons/ti";
import AdvancedModal from "@src/components/common/Modal/AdvancedModal";
import { logoutAuthActions } from "@src/features/auth";

const ChangePasswordLogoutModal = ({
  show,
  onHide = () => {},
  logoutAuthActions,
}) => {
  const handleLogout = async () => {
    await logoutAuthActions();
  };

  return (
    <AdvancedModal
      show={show}
      onHide={onHide}
      className="logout-modal"
      backdrop="static"
      keyboard={false}
      closeButton={false}
      icon={<TiWarning className="logout-icon" size={32} />}
      bodyClassName="logout-modal-body"
      actions={[
        {
          label: "Confirm",
          onClick: handleLogout,
          className: "btn-logout-confirm p-2",
        },
      ]}
    >
      Your password has been changed successfully. Please log out and log back in
      to apply the changes.
    </AdvancedModal>
  );
};

ChangePasswordLogoutModal.propTypes = {
  logoutAuthActions: PropTypes.func.isRequired,
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func,
};

export default connect(null, { logoutAuthActions })(ChangePasswordLogoutModal);
