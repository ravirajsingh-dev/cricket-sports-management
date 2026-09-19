import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  getNewsSettings,
  updateNewsSettings,
  removeNewsErrors,
} from "@src/features/cms/news/newsActions";
import { setErrors } from "@src/features/auth";
import CmsSectionSettingsPanel from "@src/features/cms/components/CmsSectionSettingsPanel";

const NewsSettingsPanel = ({
  getNewsSettings,
  updateNewsSettings,
  removeNewsErrors,
  setErrors,
  newsSettings,
  loadingNewsSettings,
  savingNewsSettings,
  canEdit = false,
}) => (
  <CmsSectionSettingsPanel
    sectionLabel="Latest News"
    titlePlaceholder="Enter news section title"
    descriptionPlaceholder="Enter a short description for the news section"
    confirmTitle="Confirm News Settings Update"
    confirmBody="Please enter your transaction password to save news section content."
    titleRequiredMsg="News title is required"
    descriptionRequiredMsg="News description is required"
    controlIdPrefix="news"
    helperText="This title and short description appear on the homepage news section for all visitors."
    settings={newsSettings}
    loading={loadingNewsSettings}
    saving={savingNewsSettings}
    canEdit={canEdit}
    getSettings={getNewsSettings}
    updateSettings={updateNewsSettings}
    removeErrors={removeNewsErrors}
    setErrors={setErrors}
  />
);

NewsSettingsPanel.propTypes = {
  getNewsSettings: PropTypes.func.isRequired,
  updateNewsSettings: PropTypes.func.isRequired,
  removeNewsErrors: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired,
  newsSettings: PropTypes.object,
  loadingNewsSettings: PropTypes.bool,
  savingNewsSettings: PropTypes.bool,
  canEdit: PropTypes.bool,
};

const mapStateToProps = (state) => ({
  newsSettings: state.news.newsSettings,
  loadingNewsSettings: state.news.loadingNewsSettings,
  savingNewsSettings: state.news.savingNewsSettings,
});

export default connect(mapStateToProps, {
  getNewsSettings,
  updateNewsSettings,
  removeNewsErrors,
  setErrors,
})(NewsSettingsPanel);
