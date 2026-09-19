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
  createCarouselItem,
  updateCarouselItem,
  removeCarouselErrors,
} from "@src/features/cms/carousel-sections/carouselSectionActions";
import VerificationConfirmModal from "@src/features/settings/components/VerificationConfirmModal";
import {
  MAX_IMAGE_SIZE_BYTES,
  IMAGE_SIZE_ERROR,
} from "@src/constants/imageUpload";

const SHORT_DESC_MAX_LENGTH = 80;
const NAME_MAX_LENGTH = 50;

const buildFormFromItem = (item, nextOrder, defaultGroupId = "") => {
  if (item) {
    return {
      name: item.name || "",
      shortDesc: item.shortDesc || "",
      group: item.group?._id || item.group || "",
      order: item.order || 1,
      isActive: item.isActive !== undefined ? item.isActive : true,
      image: null,
      clearImage: false,
    };
  }

  return {
    name: "",
    shortDesc: "",
    group: defaultGroupId,
    order: nextOrder,
    isActive: true,
    image: null,
    clearImage: false,
  };
};

const CarouselItemModal = ({
  show,
  handleClose,
  item,
  nextOrder = 1,
  groups = [],
  createCarouselItem,
  updateCarouselItem,
  removeCarouselErrors,
  setErrors,
  errorList,
  loadingItemList,
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
    buildFormFromItem(item, nextOrder, defaultGroupId),
  );
  const [imagePreview, setImagePreview] = useState(() => item?.imageUrl || null);
  const [formReady, setFormReady] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);

  useEffect(() => {
    if (!show) {
      setFormReady(false);
      return;
    }

    setFormData(buildFormFromItem(item, nextOrder, defaultGroupId));
    setImagePreview(item?.imageUrl || null);
    setFormReady(true);
    removeCarouselErrors();
  }, [item, show, nextOrder, defaultGroupId, removeCarouselErrors]);

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
    formDataToSend.append("shortDesc", formData.shortDesc.trim());
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
    removeCarouselErrors();

    const errors = validateForm(formData, [
      { path: "group", msg: "Section group is required" },
    ]);

    const hasName = Boolean(formData.name?.trim());
    const hasShortDesc = Boolean(formData.shortDesc?.trim());
    const hasImage =
      Boolean(formData.image) ||
      (Boolean(imagePreview) && !formData.clearImage);

    if (!hasName && !hasShortDesc && !hasImage) {
      errors.push({
        path: "name",
        msg: "Add at least one of: name, short description, or image",
      });
    }

    if ((formData.name || "").length > NAME_MAX_LENGTH) {
      errors.push({
        path: "name",
        msg: `Name must be at most ${NAME_MAX_LENGTH} characters`,
      });
    }

    if ((formData.shortDesc || "").length > SHORT_DESC_MAX_LENGTH) {
      errors.push({
        path: "shortDesc",
        msg: `Short description must be at most ${SHORT_DESC_MAX_LENGTH} characters`,
      });
    }

    if (errors.length) {
      setErrors(errors);
      return;
    }

    if (item) {
      setPendingFormData(buildFormData());
      setShowConfirmModal(true);
      return;
    }

    createCarouselItem(buildFormData(), handleClose);
  };

  const handleConfirmEdit = (txnPassword) => {
    if (!pendingFormData || !txnPassword) {
      return;
    }

    pendingFormData.append("txn_password", txnPassword);
    updateCarouselItem(pendingFormData, item._id, () => {
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
        title={item ? "Edit Carousel Item" : "Add Carousel Item"}
        size="lg"
        closeButton
        bodyClassName="common-modal-body--start"
        actions={[
          {
            label: "Cancel",
            onClick: handleClose,
            className: "btn btn--outline",
            colSize: 5,
            disabled: loadingItemList || !formReady,
          },
          {
            label: loadingItemList ? "Saving..." : item ? "Update" : "Create",
            onClick: onSubmit,
            className: "btn btn--theme",
            colSize: 7,
            disabled: loadingItemList || !formReady || groups.length === 0,
          },
        ]}
      >
        {!formReady ? (
          <BouncingLoader className="bouncing-loader-container--compact" />
        ) : (
          <Form onSubmit={(e) => e.preventDefault()}>
            {groups.length === 0 ? (
              <p className="text-danger mb-3">
                Create at least one section group before adding items.
              </p>
            ) : null}

            <Row>
              <Col md="12" className="mb-3">
                <Form.Group controlId="carouselItemName">
                  <Form.Label>Name (optional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={onChange}
                    maxLength={NAME_MAX_LENGTH}
                    placeholder="e.g. PATNA 2.0 TRIALS"
                    className={errorList.name ? "invalid" : ""}
                  />
                  <Form.Text className="text-muted">
                    {(formData.name || "").length}/{NAME_MAX_LENGTH} characters.
                    At least one of name, short description, or image is
                    required.
                  </Form.Text>
                  <Errors current_key="name" />
                </Form.Group>
              </Col>

              <Col md="12" className="mb-3">
                <Form.Group controlId="carouselItemShortDesc">
                  <Form.Label>Short Description (optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="shortDesc"
                    value={formData.shortDesc}
                    onChange={onChange}
                    maxLength={SHORT_DESC_MAX_LENGTH}
                    placeholder="Optional short text under the title"
                    className={errorList.shortDesc ? "invalid" : ""}
                  />
                  <Form.Text className="text-muted">
                    {(formData.shortDesc || "").length}/{SHORT_DESC_MAX_LENGTH}{" "}
                    characters
                  </Form.Text>
                  <Errors current_key="shortDesc" />
                </Form.Group>
              </Col>

              <Col md="6" className="mb-3">
                <Form.Group controlId="carouselItemGroup">
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
                <Form.Group controlId="carouselItemOrder">
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
                <Form.Group controlId="carouselItemActive">
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
                <Form.Group controlId="carouselItemImage">
                  <Form.Label>Image (optional)</Form.Label>
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
                        alt="Carousel item preview"
                        className="image-preview"
                        style={{
                          width: 160,
                          height: 100,
                          objectFit: "cover",
                          borderRadius: 8,
                        }}
                      />
                      <div className="mt-2">
                        <Button
                          type="button"
                          variant="outline-danger"
                          size="sm"
                          onClick={handleRemoveImage}
                        >
                          Remove Image
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
        title="Confirm Item Update"
        body="Please enter your transaction password to update this carousel item."
        submitBtnText="Update"
      />
    </>
  );
};

CarouselItemModal.propTypes = {
  show: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  item: PropTypes.object,
  nextOrder: PropTypes.number,
  groups: PropTypes.array,
};

const mapStateToProps = (state) => ({
  errorList: state.errors,
  loadingItemList: state.carouselSections.loadingItemList,
});

export default connect(mapStateToProps, {
  createCarouselItem,
  updateCarouselItem,
  removeCarouselErrors,
  setErrors,
})(CarouselItemModal);
