import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  getVideoSettings,
  updateVideoSettings,
  removeVideoErrors,
} from "@src/features/cms/video/videoActions";
import { setErrors } from "@src/features/auth";
import CmsSectionSettingsPanel from "@src/features/cms/components/CmsSectionSettingsPanel";

const VideoSettingsPanel = ({
  getVideoSettings,
  updateVideoSettings,
  removeVideoErrors,
  setErrors,
  videoSettings,
  loadingVideoSettings,
  savingVideoSettings,
  canEdit = false,
}) => (
  <CmsSectionSettingsPanel
    sectionLabel="Our Videos"
    titlePlaceholder="Enter video section title"
    descriptionPlaceholder="Enter a short description for the videos section"
    confirmTitle="Confirm Video Settings Update"
    confirmBody="Please enter your transaction password to save video section content."
    titleRequiredMsg="Video title is required"
    descriptionRequiredMsg="Video description is required"
    controlIdPrefix="video"
    helperText="This title and short description appear on the homepage videos section for all visitors."
    settings={videoSettings}
    loading={loadingVideoSettings}
    saving={savingVideoSettings}
    canEdit={canEdit}
    getSettings={getVideoSettings}
    updateSettings={updateVideoSettings}
    removeErrors={removeVideoErrors}
    setErrors={setErrors}
  />
);

VideoSettingsPanel.propTypes = {
  getVideoSettings: PropTypes.func.isRequired,
  updateVideoSettings: PropTypes.func.isRequired,
  removeVideoErrors: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired,
  videoSettings: PropTypes.object,
  loadingVideoSettings: PropTypes.bool,
  savingVideoSettings: PropTypes.bool,
  canEdit: PropTypes.bool,
};

const mapStateToProps = (state) => ({
  videoSettings: state.video.videoSettings,
  loadingVideoSettings: state.video.loadingVideoSettings,
  savingVideoSettings: state.video.savingVideoSettings,
});

export default connect(mapStateToProps, {
  getVideoSettings,
  updateVideoSettings,
  removeVideoErrors,
  setErrors,
})(VideoSettingsPanel);
