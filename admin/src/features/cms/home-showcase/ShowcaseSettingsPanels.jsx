import PropTypes from "prop-types";
import { connect } from "react-redux";
import { setErrors } from "@src/features/auth";
import { hasPermission } from "@src/utils/permissions";
import {
  updateShowcaseSectionSettings,
  removeHomeShowcaseErrors,
} from "@src/features/cms/home-showcase/homeShowcaseActions";
import ShowcaseSectionSettingsPanel from "@src/features/cms/home-showcase/ShowcaseSectionSettingsPanel";

const SectionSettingsConnected = ({
  sectionKey,
  sectionLabel,
  titlePlaceholder,
  descriptionPlaceholder,
  helperText,
  loggedInUser,
  showcase,
  loadingShowcase,
  savingShowcase,
  savingSection,
  updateShowcaseSectionSettings,
  removeHomeShowcaseErrors,
  setErrors,
}) => (
  <ShowcaseSectionSettingsPanel
    sectionKey={sectionKey}
    sectionLabel={sectionLabel}
    titlePlaceholder={titlePlaceholder}
    descriptionPlaceholder={descriptionPlaceholder}
    helperText={helperText}
    settings={showcase?.[sectionKey]}
    loading={loadingShowcase}
    saving={savingShowcase && savingSection === `${sectionKey}-settings`}
    canEdit={hasPermission(loggedInUser, "home-showcase", "edit")}
    updateSettings={updateShowcaseSectionSettings}
    removeErrors={removeHomeShowcaseErrors}
    setErrors={setErrors}
  />
);

SectionSettingsConnected.propTypes = {
  sectionKey: PropTypes.string.isRequired,
  sectionLabel: PropTypes.string.isRequired,
  titlePlaceholder: PropTypes.string,
  descriptionPlaceholder: PropTypes.string,
  helperText: PropTypes.string,
  loggedInUser: PropTypes.object,
  showcase: PropTypes.object,
  loadingShowcase: PropTypes.bool,
  savingShowcase: PropTypes.bool,
  savingSection: PropTypes.string,
  updateShowcaseSectionSettings: PropTypes.func.isRequired,
  removeHomeShowcaseErrors: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  loggedInUser: state.adminAuth.admin,
  showcase: state.homeShowcase.showcase,
  loadingShowcase: state.homeShowcase.loadingShowcase,
  savingShowcase: state.homeShowcase.savingShowcase,
  savingSection: state.homeShowcase.savingSection,
});

const Connected = connect(mapStateToProps, {
  updateShowcaseSectionSettings,
  removeHomeShowcaseErrors,
  setErrors,
})(SectionSettingsConnected);

export const ImpactSettingsPanel = () => (
  <Connected
    sectionKey="impact"
    sectionLabel="1. The Numbers Speak (Impact)"
    titlePlaceholder="e.g. THE NUMBERS SPEAK"
    descriptionPlaceholder="Short supporting line for this section"
  />
);

export const SelectorsSettingsPanel = () => (
  <Connected
    sectionKey="selectors"
    sectionLabel="2. Mentors & Selectors"
    titlePlaceholder="e.g. MEET OUR MENTOR & SELECTORS"
    descriptionPlaceholder="Short supporting line for this section"
  />
);

export const TestimonialsSettingsPanel = () => (
  <Connected
    sectionKey="testimonials"
    sectionLabel="3. Lives Changed (Testimonials)"
    titlePlaceholder="e.g. LIVES CHANGED BY LTCL"
    descriptionPlaceholder="Short supporting line for this section"
  />
);

export default Connected;
