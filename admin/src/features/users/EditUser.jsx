import React from "react";
import { Button, Col, Container, Row, Tab, Tabs } from "react-bootstrap";
import { FaRegEye } from "react-icons/fa";
import { MdEdit } from "react-icons/md";

import AppBreadCrumb from "@src/components/common/AppBreadCrumb";
import SimpleConfirmModal from "@src/features/settings/components/SimpleConfirmModal";
import VerificationConfirmModal from "@src/features/settings/components/VerificationConfirmModal";
import { TAB_KEYS, TAB_LABELS } from "./editUser/editUserConstants";
import { useEditUserController } from "./editUser/hooks/useEditUserController";
import EditUserCoreTab from "./editUser/EditUserCoreTab";
import EditUserAdditionalTab from "./editUser/EditUserAdditionalTab";
import EditUserLocationTab from "./editUser/EditUserLocationTab";
import EditUserLoadingSkeleton from "./editUser/components/EditUserLoadingSkeleton";
import EditUserTabErrorBoundary from "./editUser/components/EditUserTabErrorBoundary";

const EditUser = () => {
  const {
    activeTab,
    activeTabLabel,
    additionalSectionComplete,
    locationSectionComplete,
    currentUser,
    discardPrompt,
    errorList,
    formData,
    handleCancelDiscard,
    handleConfirmDiscard,
    handleConfirmSave,
    handleTabSelect,
    isTabDisabled,
    onFieldChange,
    pendingTabKey,
    setFormData,
    setShowPasswordField,
    showConfirmModal,
    showPasswordField,
    closeConfirmModal,
    submitting,
    tabCallbacks,
    userLoaded,
    editingTab,
  } = useEditUserController();

  const renderActiveTab = () => {
    switch (activeTab) {
      case TAB_KEYS.core:
        return (
          <EditUserTabErrorBoundary tabLabel={TAB_LABELS.core}>
            <EditUserCoreTab
              currentUser={currentUser}
              formData={formData}
              onChange={onFieldChange}
              isDisabled={isTabDisabled(TAB_KEYS.core)}
              isEditing={editingTab === TAB_KEYS.core}
              onEdit={tabCallbacks[TAB_KEYS.core].onEdit}
              onCancel={tabCallbacks[TAB_KEYS.core].onCancel}
              onSave={tabCallbacks[TAB_KEYS.core].onSave}
              submitting={submitting}
              errorList={errorList}
              showPasswordField={showPasswordField}
              setShowPasswordField={setShowPasswordField}
              setFormData={setFormData}
            />
          </EditUserTabErrorBoundary>
        );
      case TAB_KEYS.additional:
        return (
          <EditUserTabErrorBoundary tabLabel={TAB_LABELS.additional}>
            {!additionalSectionComplete && (
              <p className="text-muted small mb-3">
                Optional until you start filling. Once saved, required fields
                cannot be cleared.
              </p>
            )}
            <EditUserAdditionalTab
              formData={formData}
              onChange={onFieldChange}
              isDisabled={isTabDisabled(TAB_KEYS.additional)}
              isEditing={editingTab === TAB_KEYS.additional}
              onEdit={tabCallbacks[TAB_KEYS.additional].onEdit}
              onCancel={tabCallbacks[TAB_KEYS.additional].onCancel}
              onSave={tabCallbacks[TAB_KEYS.additional].onSave}
              submitting={submitting}
              errorList={errorList}
            />
          </EditUserTabErrorBoundary>
        );
      case TAB_KEYS.location:
        return (
          <EditUserTabErrorBoundary tabLabel={TAB_LABELS.location}>
            {!locationSectionComplete && (
              <p className="text-muted small mb-3">
                Optional until you start filling. Once saved, required fields
                cannot be cleared.
              </p>
            )}
            <EditUserLocationTab
              formData={formData}
              onChange={onFieldChange}
              isDisabled={isTabDisabled(TAB_KEYS.location)}
              isEditing={editingTab === TAB_KEYS.location}
              onEdit={tabCallbacks[TAB_KEYS.location].onEdit}
              onCancel={tabCallbacks[TAB_KEYS.location].onCancel}
              onSave={tabCallbacks[TAB_KEYS.location].onSave}
              submitting={submitting}
              errorList={errorList}
              setFormData={setFormData}
            />
          </EditUserTabErrorBoundary>
        );
      default:
        return null;
    }
  };

  return (
    <Container>
      <AppBreadCrumb
        breadcrumbs={[
          { name: "Users", path: "/admin/users-list" },
          { name: "Edit User" },
          { name: activeTabLabel },
        ]}
      />

      <Row className="justify-content-center p-2">
        <Col xs={12}>
          <div className="common-form-card user-profile-card">
            <Row>
              <Col className="custom-heading-theam">Edit User</Col>
            </Row>

            {userLoaded ? (
              <>
                <Tabs
                  activeKey={activeTab}
                  onSelect={handleTabSelect}
                  className="mb-3 user-profile-tabs"
                >
                  <Tab eventKey={TAB_KEYS.core} title="Core Information" />
                  <Tab eventKey={TAB_KEYS.additional} title="Additional Details" />
                  <Tab eventKey={TAB_KEYS.location} title="Location Details" />
                </Tabs>
                <Row className="mb-3 align-items-center">
                  <Col>
                    <h4 className="mb-1">{activeTabLabel}</h4>
                  </Col>
                  <Col xs="auto">
                    <Button
                      type="button"
                      variant={null}
                      className={`btn btn-sm ${
                        editingTab === activeTab ? "btn--outline" : "btn--theme"
                      }`}
                      onClick={
                        editingTab === activeTab
                          ? tabCallbacks[activeTab].onCancel
                          : tabCallbacks[activeTab].onEdit
                      }
                      disabled={submitting}
                    >
                      {editingTab === activeTab ? (
                        <>
                          <FaRegEye className="me-1" />
                          View mode
                        </>
                      ) : (
                        <>
                          <MdEdit className="me-1" />
                          Edit
                        </>
                      )}
                    </Button>
                  </Col>
                </Row>
                {renderActiveTab()}
              </>
            ) : (
              <EditUserLoadingSkeleton />
            )}
          </div>
        </Col>
      </Row>

      <VerificationConfirmModal
        show={showConfirmModal}
        handleClose={closeConfirmModal}
        handleConfirm={handleConfirmSave}
        title="Confirm Update"
        body={`Are you sure you want to save changes in ${TAB_LABELS[pendingTabKey] || "this section"}? Please enter your transaction password to confirm.`}
        submitBtnText="Save Changes"
      />

      <SimpleConfirmModal
        show={Boolean(discardPrompt)}
        onHide={handleCancelDiscard}
        onConfirm={handleConfirmDiscard}
        title="Discard unsaved changes?"
        body="You have unsaved edits in this section. Discard them and continue?"
        confirmLabel="Discard changes"
      />
    </Container>
  );
};

export default EditUser;
