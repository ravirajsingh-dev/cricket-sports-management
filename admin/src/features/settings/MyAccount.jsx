import { connect } from "react-redux";
import PropTypes from "prop-types";
import { Col, Container, Row, Tab, Tabs } from "react-bootstrap";

import AppBreadCrumb from "@src/components/common/AppBreadCrumb";
import BouncingLoader from "@src/components/common/Loaders/BouncingLoader";
import {
  changePassword,
  changeTxnPassword,
  removeAllErrors,
  setErrors,
  setTxnPassword,
} from "@src/features/auth";
import { getMyProfile, updateMyProfile } from "@src/features/auth/profileActions";
import { TAB_KEYS } from "./myAccountConstants";
import { useMyAccountController } from "./hooks/useMyAccountController";
import MyAccountProfileTab from "./tabs/MyAccountProfileTab";
import MyAccountLoginPasswordTab from "./tabs/MyAccountLoginPasswordTab";
import MyAccountTxnPasswordTab from "./tabs/MyAccountTxnPasswordTab";

const MyAccount = ({
  adminAuth,
  errorList,
  setErrors,
  removeAllErrors,
  getMyProfile,
  updateMyProfile,
  changePassword,
  changeTxnPassword,
  setTxnPassword,
}) => {
  const ctrl = useMyAccountController({
    adminAuth,
    setErrors,
    removeAllErrors,
    getMyProfile,
    updateMyProfile,
    changePassword,
    changeTxnPassword,
    setTxnPassword,
  });

  return (
    <Container>
      <AppBreadCrumb
        breadcrumbs={[{ name: "My Account" }, { name: ctrl.activeTabLabel }]}
      />

      <Row className="justify-content-center p-2">
        <Col xs={12} sm={10} md={8} lg={7}>
          <div className="common-form-card user-profile-card">
            <Row>
              <Col className="custom-heading-theam">My Account</Col>
            </Row>

            {!ctrl.profileLoaded ? (
              <BouncingLoader />
            ) : (
              <Tabs
                activeKey={ctrl.activeTab}
                onSelect={ctrl.handleTabSelect}
                className="mb-3 user-profile-tabs"
              >
                <Tab eventKey={TAB_KEYS.profile} title="Profile">
                  <MyAccountProfileTab
                    formData={ctrl.formData}
                    errorList={errorList}
                    visibleLocalErrors={ctrl.visibleLocalErrors}
                    isSubAdmin={ctrl.isSubAdmin}
                    isProfileEditable={ctrl.isProfileEditable}
                    isSavingProfile={ctrl.isSavingProfile}
                    onChange={ctrl.onChange}
                    onBlur={ctrl.onBlur}
                    onSubmit={ctrl.onProfileSubmit}
                    onToggleEdit={
                      ctrl.isProfileEditable
                        ? ctrl.resetProfileForm
                        : () => ctrl.setIsProfileEditable(true)
                    }
                    onCancel={ctrl.resetProfileForm}
                  />
                </Tab>

                <Tab
                  eventKey={TAB_KEYS.loginPassword}
                  title="Change Login Password"
                >
                  <MyAccountLoginPasswordTab
                    loginPasswordForm={ctrl.loginPasswordForm}
                    errorList={errorList}
                    isLoginPasswordEditable={ctrl.isLoginPasswordEditable}
                    loadingOnChangePassword={ctrl.loadingOnChangePassword}
                    showCurrentPassword={ctrl.showCurrentPassword}
                    showNewPassword={ctrl.showNewPassword}
                    showConfirmPassword={ctrl.showConfirmPassword}
                    setLoginPasswordForm={ctrl.setLoginPasswordForm}
                    setShowCurrentPassword={ctrl.setShowCurrentPassword}
                    setShowNewPassword={ctrl.setShowNewPassword}
                    setShowConfirmPassword={ctrl.setShowConfirmPassword}
                    onSubmit={ctrl.onLoginPasswordSubmit}
                    onToggleEdit={
                      ctrl.isLoginPasswordEditable
                        ? ctrl.resetLoginPasswordForm
                        : () => ctrl.setIsLoginPasswordEditable(true)
                    }
                    onCancel={ctrl.resetLoginPasswordForm}
                  />
                </Tab>

                <Tab
                  eventKey={TAB_KEYS.txnPassword}
                  title="Change Transaction Password"
                >
                  <MyAccountTxnPasswordTab
                    isTxnSet={ctrl.isTxnSet}
                    txnPasswordForm={ctrl.txnPasswordForm}
                    setTxnForm={ctrl.setTxnForm}
                    errorList={errorList}
                    isTxnPasswordEditable={ctrl.isTxnPasswordEditable}
                    loadingOnChangePassword={ctrl.loadingOnChangePassword}
                    showCurrentTxnPassword={ctrl.showCurrentTxnPassword}
                    showNewTxnPassword={ctrl.showNewTxnPassword}
                    showConfirmTxnPassword={ctrl.showConfirmTxnPassword}
                    showSetTxnPassword={ctrl.showSetTxnPassword}
                    showSetTxnConfirmPassword={ctrl.showSetTxnConfirmPassword}
                    setTxnPasswordForm={ctrl.setTxnPasswordForm}
                    setSetTxnForm={ctrl.setSetTxnForm}
                    setShowCurrentTxnPassword={ctrl.setShowCurrentTxnPassword}
                    setShowNewTxnPassword={ctrl.setShowNewTxnPassword}
                    setShowConfirmTxnPassword={ctrl.setShowConfirmTxnPassword}
                    setShowSetTxnPassword={ctrl.setShowSetTxnPassword}
                    setShowSetTxnConfirmPassword={
                      ctrl.setShowSetTxnConfirmPassword
                    }
                    onSubmit={ctrl.onTxnPasswordSubmit}
                    onToggleEdit={
                      ctrl.isTxnPasswordEditable
                        ? ctrl.resetTxnPasswordForm
                        : () => ctrl.setIsTxnPasswordEditable(true)
                    }
                    onCancel={ctrl.resetTxnPasswordForm}
                  />
                </Tab>
              </Tabs>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

MyAccount.propTypes = {
  adminAuth: PropTypes.object.isRequired,
  errorList: PropTypes.object.isRequired,
  setErrors: PropTypes.func.isRequired,
  removeAllErrors: PropTypes.func.isRequired,
  getMyProfile: PropTypes.func.isRequired,
  updateMyProfile: PropTypes.func.isRequired,
  changePassword: PropTypes.func.isRequired,
  changeTxnPassword: PropTypes.func.isRequired,
  setTxnPassword: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  adminAuth: state.adminAuth,
  errorList: state.errors,
});

export default connect(mapStateToProps, {
  setErrors,
  removeAllErrors,
  getMyProfile,
  updateMyProfile,
  changePassword,
  changeTxnPassword,
  setTxnPassword,
})(MyAccount);
