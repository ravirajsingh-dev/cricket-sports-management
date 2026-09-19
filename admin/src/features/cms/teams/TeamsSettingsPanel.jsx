import PropTypes from "prop-types";
import { connect } from "react-redux";
import {
  getTeamSettings,
  updateTeamSettings,
  removeTeamErrors,
} from "@src/features/cms/teams/teamActions";
import { setErrors } from "@src/features/auth";
import CmsSectionSettingsPanel from "@src/features/cms/components/CmsSectionSettingsPanel";

const TeamsSettingsPanel = ({
  getTeamSettings,
  updateTeamSettings,
  removeTeamErrors,
  setErrors,
  teamSettings,
  loadingTeamSettings,
  savingTeamSettings,
  canEdit = false,
}) => (
  <CmsSectionSettingsPanel
    sectionLabel="Official Teams"
    titlePlaceholder="Enter teams section title"
    descriptionPlaceholder="Enter a short description for the teams section"
    confirmTitle="Confirm Teams Settings Update"
    confirmBody="Please enter your transaction password to save teams section content."
    titleRequiredMsg="Teams title is required"
    descriptionRequiredMsg="Teams description is required"
    controlIdPrefix="teams"
    helperText="This title and short description appear on the homepage Official Teams section for all visitors."
    settings={teamSettings}
    loading={loadingTeamSettings}
    saving={savingTeamSettings}
    canEdit={canEdit}
    getSettings={getTeamSettings}
    updateSettings={updateTeamSettings}
    removeErrors={removeTeamErrors}
    setErrors={setErrors}
  />
);

TeamsSettingsPanel.propTypes = {
  getTeamSettings: PropTypes.func.isRequired,
  updateTeamSettings: PropTypes.func.isRequired,
  removeTeamErrors: PropTypes.func.isRequired,
  setErrors: PropTypes.func.isRequired,
  teamSettings: PropTypes.object,
  loadingTeamSettings: PropTypes.bool,
  savingTeamSettings: PropTypes.bool,
  canEdit: PropTypes.bool,
};

const mapStateToProps = (state) => ({
  teamSettings: state.teams.teamSettings,
  loadingTeamSettings: state.teams.loadingTeamSettings,
  savingTeamSettings: state.teams.savingTeamSettings,
});

export default connect(mapStateToProps, {
  getTeamSettings,
  updateTeamSettings,
  removeTeamErrors,
  setErrors,
})(TeamsSettingsPanel);
