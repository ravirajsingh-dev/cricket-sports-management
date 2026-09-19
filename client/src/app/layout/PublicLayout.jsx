import React, { useEffect, useLayoutEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { useDispatch } from "react-redux";
import { HelmetProvider } from "react-helmet-async";

import { removeAllErrors } from "@src/app/state/actions/commonActions";
import Header from "./Header";
import Footer from "./Footer";
import DefaultFooter from "./DefaultFooter";

const PublicLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    dispatch(removeAllErrors());
  }, [location.pathname, dispatch]);

  return (
    <HelmetProvider>
      <div className="d-flex flex-column min-vh-100">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Header />

        <main id="main-content" className="flex-grow-1" tabIndex={-1}>
          <Outlet />
        </main>

        <Footer />
        <DefaultFooter />
      </div>
    </HelmetProvider>
  );
};

export default PublicLayout;
