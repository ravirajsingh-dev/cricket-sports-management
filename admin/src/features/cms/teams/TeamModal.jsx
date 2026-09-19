import React, { useEffect, useMemo, useState } from "react";
import { Form, Row, Col, Button } from "react-bootstrap";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import CustomModal from "@src/components/common/Modal/CustomModal";
import CustomSelect from "@src/components/common/CustomSelect";
import Errors from "@src/notifications/Errors";
import BouncingLoader from "@src/components/common/Loaders/BouncingLoader";
import { validateForm } from "@src/utils/validation";
import { setErrors } from "@src/features/auth";
import { getOptionByValue } from "@src/constants/CustomSelectValues";
import {
  createTeam,
  updateTeam,
  removeTeamErrors,
} from "@src/features/cms/teams/teamActions";
import VerificationConfirmModal from "@src/features/settings/components/VerificationConfirmModal";
import {
  MAX_IMAGE_SIZE_BYTES,
  IMAGE_SIZE_ERROR,
} from "@src/constants/imageUpload";

const buildFormFromTeam = (team, nextOrder, defaultGroupId = "") => {
  if (team) {
    return {
      name: team.name || "",
      group: team.group?._id || team.group || "",
      order: team.order || 1,
      isActive: team.isActive !== undefined ? team.isActive : true,
      image: null,
      clearImage: false,
    };
  }

  return {
    name: "",
    group: defaultGroupId,
    order: nextOrder,
    isActive: true,
    image: null,
    clearImage: false,
  };
};

const TeamModal = ({
  show,
  handleClose,
  team,
  nextOrder = 1,
  groups = [],
  createTeam,
  updateTeam,
  removeTeamErrors,
  setErrors,
  errorList,
  loadingTeamList,
}) => {
  const defaultGroupId = groups[0]?._id || "";
  const groupOptions = useMemo(
    () =>
      (groups || []).map((group) => ({
        label: group.name,
        value: group._id,
      })),
    [groups],
  );
  const [formData, setFormData] = useState(() =>
    buildFormFromTeam(team, nextOrder, defaultGroupId),
  );
  const [imagePreview, setImagePreview] = useState(() => team?.logoUrl || null);
  const [formReady, setFormReady] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  useEffect(() => {
    if (!show) {
      setFormReady(false);
      return;
    }

    setFormData(buildFormFromTeam(team, nextOrder, defaultGroupId));
    setImagePreview(team?.logoUrl || null);
    setFormReady(true);
    removeTeamErrors();
  }, [team, show, nextOrder, defaultGroupId, removeTeamErrors]);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        setErrors([{ path: "image", msg: IMAGE_SIZE_ERROR }]);
        return;
      }

      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setErrors([
          {
            path: "image",
            msg: "Only jpg, jpeg, png, and webp images are allowed",
          },
        ]);
        return;
      }

      setFormData({ ...formData, image: file, clearImage: false });

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image: null, clearImage: true });
    setImagePreview(null);
  };

  const buildFormData = () => {
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name.trim());
    formDataToSend.append("group", formData.group);
    formDataToSend.append("order", formData.order);
    formDataToSend.append("isActive", formData.isActive);
    if (formData.image) {
      formDataToSend.append("image", formData.image);
    }
    if (formData.clearImage) {
      formDataToSend.append("clearImage", "true");
    }
    return formDataToSend;
  };

  const onSubmit = () => {
    removeTeamErrors();

    const validationRules = [
      { path: "name", msg: "Team name is required" },
      { path: "group", msg: "Team group is required" },
    ];

    if (!team) {
      validationRules.push({
        path: "image",
        msg: "Team logo is required",
        validator: (value) => Boolean(value),
      });
    } else if (!formData.image && (formData.clearImage || !imagePreview)) {
      validationRules.push({
        path: "image",
        msg: "Team logo is required",
        validator: () => false,
      });
    }

    const errors = validateForm(formData, validationRules);
    if (errors.length) {
      setErrors(errors);
      return;
    }

    if (team) {
      setPendingFormData(buildFormData());
      setShowConfirmModal(true);
      return;
    }

    createTeam(buildFormData(), handleClose);
  };

  const handleConfirmEdit = (txnPassword) => {
    if (!pendingFormData || !txnPassword) {
      return;
    }

    pendingFormData.append("txn_password", txnPassword);
    updateTeam(pendingFormData, team._id, () => {
      setShowConfirmModal(false);
      setPendingFormData(null);
      handleClose();
    });
  };

  return (
    <>
      <CustomModal
        show={show}
        onHide={handleClose}
        title={team ? "Edit Team" : "Add Team"}
        size="lg"
        closeButton
        bodyClassName="common-modal-body--start"
        actions={[
          {
            label: "Cancel",
            onClick: handleClose,
            className: "btn btn--outline",
            colSize: 5,
            disabled: loadingTeamList || !formReady,
          },
          {
            label: loadingTeamList ? "Saving..." : team ? "Update" : "Create",
            onClick: onSubmit,
            className: "btn btn--theme",
            colSize: 7,
            disabled: loadingTeamList || !formReady || groups.length === 0,
          },
        ]}
      >
        {!formReady ? (
          <BouncingLoader className="bouncing-loader-container--compact" />
        ) : (
          <Form onSubmit={(e) => e.preventDefault()}>
            {groups.length === 0 ? (
              <p className="text-danger mb-3">
                Create at least one team group before adding teams.
              </p>
            ) : null}

            <Row>
              <Col md="12" className="mb-3">
                <Form.Group controlId="name">
                  <Form.Label>Team Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={onChange}
                    placeholder="e.g. TRISHUL TITANS"
                    className={errorList.name ? "invalid" : ""}
                  />
                  <Errors current_key="name" />
                </Form.Group>
              </Col>

              <Col md="6" className="mb-3">
                <Form.Group controlId="group">
                  <Form.Label>Group *</Form.Label>
                  <CustomSelect
                    options={groupOptions}
                    value={getOptionByValue(groupOptions, formData.group)}
                    onChange={(option) =>
                      setFormData((prev) => ({
                        ...prev,
                        group: option?.value ?? "",
                      }))
                    }
                    isRequired
                    isDisabled={groups.length === 0}
                    placeholder="Select group"
                    error={errorList.group || null}
                  />
                  <Errors current_key="group" />
                </Form.Group>
              </Col>

              <Col md="3" className="mb-3">
                <Form.Group controlId="order">
                  <Form.Label>Display Order</Form.Label>
                  <Form.Control
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={onChange}
                    min="1"
                  />
                </Form.Group>
              </Col>

              <Col md="3" className="mb-3">
                <Form.Group controlId="isActive">
                  <Form.Check
                    type="switch"
                    name="isActive"
                    label="Active"
                    checked={formData.isActive}
                    onChange={onChange}
                    className="mt-4"
                  />
                </Form.Group>
              </Col>

              <Col md="12" className="mb-3">
                <Form.Group controlId="image">
                  <Form.Label>
                    Logo {team ? "(Optional - leave empty to keep current)" : "*"}
                  </Form.Label>
                  <Form.Control
                    type="file"
                    name="image"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={onFileChange}
                    className={errorList.image ? "invalid" : ""}
                  />
                  <Errors current_key="image" />
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Team logo preview"
                        className="image-preview rounded-circle"
                        style={{
                          width: 96,
                          height: 96,
                          objectFit: "cover",
                        }}
                      />
                      <div className="mt-2">
                        <Button
                          type="button"
                          variant="outline-danger"
                          size="sm"
                          onClick={handleRemoveImage}
                        >
                          Remove Logo
                        </Button>
                      </div>
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>
          </Form>
        )}
      </CustomModal>

      <VerificationConfirmModal
        show={showConfirmModal}
        handleClose={() => {
          setShowConfirmModal(false);
          setPendingFormData(null);
        }}
        handleConfirm={handleConfirmEdit}
        title="Confirm Team Update"
        body="Please enter your transaction password to update this team."
        submitBtnText="Update"
      />
    </>
  );
};

TeamModal.propTypes = {
  show: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  team: PropTypes.object,
  nextOrder: PropTypes.number,
  groups: PropTypes.array,
};

const mapStateToProps = (state) => ({
  errorList: state.errors,
  loadingTeamList: state.teams.loadingTeamList,
});

export default connect(mapStateToProps, {
  createTeam,
  updateTeam,
  removeTeamErrors,
  setErrors,
})(TeamModal);
