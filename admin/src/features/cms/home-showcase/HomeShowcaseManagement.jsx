import React, { useEffect } from "react";
import { Card, Container } from "react-bootstrap";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import AppBreadCrumb from "@src/components/common/AppBreadCrumb";
import BouncingLoader from "@src/components/common/Loaders/BouncingLoader";
import Errors from "@src/notifications/Errors";
import { getHomeShowcase } from "@src/features/cms/home-showcase/homeShowcaseActions";
import {
  ImpactSettingsPanel,
  SelectorsSettingsPanel,
  TestimonialsSettingsPanel,
} from "@src/features/cms/home-showcase/ShowcaseSettingsPanels";
import ImpactItemsPanel from "@src/features/cms/home-showcase/ImpactItemsPanel";
import SelectorBadgesPanel from "@src/features/cms/home-showcase/SelectorBadgesPanel";
import SelectorsPeoplePanel from "@src/features/cms/home-showcase/SelectorsPeoplePanel";
import TestimonialsItemsPanel from "@src/features/cms/home-showcase/TestimonialsItemsPanel";

const HomeShowcaseManagement = ({
  loadingShowcase,
  getHomeShowcase,
}) => {
  useEffect(() => {
    getHomeShowcase();
  }, [getHomeShowcase]);

  return (
    <Container>
      <AppBreadCrumb breadcrumbs={[{ name: "Impact & Stories" }]} />

      <p className="text-muted small mb-3">
        Each block has its own title settings and items. Title saves separately;
        add / edit / delete on items saves immediately.
      </p>
      <Errors current_key="showcase" />
      <Errors current_key="section" />

      {loadingShowcase ? (
        <Card className="common-panel-card mb-4">
          <Card.Body>
            <BouncingLoader className="bouncing-loader-container--compact" />
          </Card.Body>
        </Card>
      ) : (
        <>
          <ImpactSettingsPanel />
          <ImpactItemsPanel />

          <SelectorsSettingsPanel />
          <SelectorBadgesPanel />
          <SelectorsPeoplePanel />

          <TestimonialsSettingsPanel />
          <TestimonialsItemsPanel />
        </>
      )}
    </Container>
  );
};

HomeShowcaseManagement.propTypes = {
  loadingShowcase: PropTypes.bool,
  getHomeShowcase: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  loadingShowcase: state.homeShowcase.loadingShowcase,
});

export default connect(mapStateToProps, {
  getHomeShowcase,
})(HomeShowcaseManagement);
