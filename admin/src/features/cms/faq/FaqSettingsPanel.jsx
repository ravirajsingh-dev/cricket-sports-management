import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  getFaqSettings,
  updateFaqSettings,
  removeFaqErrors,
} from "@src/features/cms/faq/faqActions";
import { setErrors } from "@src/features/auth";
import CmsSectionSettingsPanel from "@src/features/cms/components/CmsSectionSettingsPanel";

const FaqSettingsPanel = ({
  getFaqSettings,
  updateFaqSettings,
  removeFaqErrors,
  setErrors,
  faqSettings,
  loadingFaqSettings,
  savingFaqSettings,
  canEdit = false,
}) => (
  <CmsSectionSettingsPanel
    sectionLabel="Frequently Asked Questions"
    titlePlaceholder="Enter FAQ section title"
    descriptionPlaceholder="Enter a short description for the FAQ section"
    confirmTitle="Confirm FAQ Settings Update"
    confirmBody="Please enter your transaction password to save FAQ section content."
    titleRequiredMsg="FAQ title is required"
    descriptionRequiredMsg="FAQ description is required"
    controlIdPrefix="faq"
    helperText="This title and short description appear on the homepage FAQ section for all visitors."
    settings={faqSettings}
    loading={loadingFaqSettings}
    saving={savingFaqSettings}
    canEdit={canEdit}
    getSettings={getFaqSettings}
    updateSettings={updateFaqSettings}
    removeErrors={removeFaqErrors}
    setErrors={setErrors}
  />
);

FaqSettingsPanel.propTypes = {
  getFaqSettings: PropTypes.func.isRequired,
  updateFaqSettings: PropTypes.func.isRequired,
  removeFaqErrors: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired,
  faqSettings: PropTypes.object,
  loadingFaqSettings: PropTypes.bool,
  savingFaqSettings: PropTypes.bool,
  canEdit: PropTypes.bool,
};

const mapStateToProps = (state) => ({
  faqSettings: state.faq.faqSettings,
  loadingFaqSettings: state.faq.loadingFaqSettings,
  savingFaqSettings: state.faq.savingFaqSettings,
});

export default connect(mapStateToProps, {
  getFaqSettings,
  updateFaqSettings,
  removeFaqErrors,
  setErrors,
})(FaqSettingsPanel);
