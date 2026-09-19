import React, { useEffect, useState, useLayoutEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { HelmetProvider } from "react-helmet-async";

import Header from "./Header";
import DefaultFooter from "./DefaultFooter";
import BouncingLoader from "@src/components/common/Loaders/BouncingLoader";
import { getProfileRequirements } from "@src/features/user/profileActions";

const PortalLayout = ({
  auth: { isAuthenticated, loading, user },
  getProfileRequirements,
  profileRequirements,
  profileRequirementsError,
}) => {
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      setIsAuthChecked(true);
    }
  }, [loading]);

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (!user || profileRequirements || profileRequirementsError) return;

    getProfileRequirements();
  }, [
    user,
    profileRequirements,
    profileRequirementsError,
    getProfileRequirements,
  ]);

  if (loading || !isAuthChecked) {
    return <BouncingLoader minHeight="500px" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <HelmetProvider>
      <div className="d-flex flex-column portal-shell">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Header />
        <main id="main-content" className="flex-grow-1 portal-shell__main" tabIndex={-1}>
          <Outlet />
        </main>

        <DefaultFooter />
      </div>
    </HelmetProvider>
  );
};

PortalLayout.propTypes = {
  auth: PropTypes.object.isRequired,
  getProfileRequirements: PropTypes.func.isRequired,
  profileRequirements: PropTypes.object,
  profileRequirementsError: PropTypes.string,
};

const mapStateToProps = (state) => ({
  auth: state.auth,
  profileRequirements: state.profile?.requirements ?? null,
  profileRequirementsError: state.profile?.requirementsError ?? null,
});

export default connect(mapStateToProps, {
  getProfileRequirements,
})(PortalLayout);
