import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  getGallerySettings,
  updateGallerySettings,
  removeGalleryErrors,
} from "@src/features/cms/gallery/galleryActions";
import { setErrors } from "@src/features/auth";
import CmsSectionSettingsPanel from "@src/features/cms/components/CmsSectionSettingsPanel";

const GallerySettingsPanel = ({
  getGallerySettings,
  updateGallerySettings,
  removeGalleryErrors,
  setErrors,
  gallerySettings,
  loadingGallerySettings,
  savingGallerySettings,
  canEdit = false,
}) => (
  <CmsSectionSettingsPanel
    sectionLabel="Our Gallery"
    titlePlaceholder="Enter gallery title"
    descriptionPlaceholder="Enter a short description for the gallery section"
    confirmTitle="Confirm Gallery Settings Update"
    confirmBody="Please enter your transaction password to save gallery section content."
    titleRequiredMsg="Gallery title is required"
    descriptionRequiredMsg="Gallery description is required"
    controlIdPrefix="gallery"
    helperText="This title and short description appear on the homepage gallery section for all visitors."
    settings={gallerySettings}
    loading={loadingGallerySettings}
    saving={savingGallerySettings}
    canEdit={canEdit}
    getSettings={getGallerySettings}
    updateSettings={updateGallerySettings}
    removeErrors={removeGalleryErrors}
    setErrors={setErrors}
  />
);

GallerySettingsPanel.propTypes = {
  getGallerySettings: PropTypes.func.isRequired,
  updateGallerySettings: PropTypes.func.isRequired,
  removeGalleryErrors: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired,
  gallerySettings: PropTypes.object,
  loadingGallerySettings: PropTypes.bool,
  savingGallerySettings: PropTypes.bool,
  canEdit: PropTypes.bool,
};

const mapStateToProps = (state) => ({
  gallerySettings: state.gallery.gallerySettings,
  loadingGallerySettings: state.gallery.loadingGallerySettings,
  savingGallerySettings: state.gallery.savingGallerySettings,
});

export default connect(mapStateToProps, {
  getGallerySettings,
  updateGallerySettings,
  removeGalleryErrors,
  setErrors,
})(GallerySettingsPanel);
