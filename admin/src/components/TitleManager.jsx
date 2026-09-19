import React, { useEffect } from "react";
import { useSelector } from "react-redux";

/**
 * TitleManager Component
 * Manages dynamic document title updates based on Application Settings
 * Automatically updates title when settings are loaded
 */
const TitleManager = () => {
  const abbreviation = useSelector(
    (state) => state.adminCommonSettings.commonSettings?.abbreviation,
  );
  const loadingCommonSettings = useSelector(
    (state) => state.adminCommonSettings.loadingCommonSettings,
  );

  useEffect(() => {
    // Update document title based on settings
    if (loadingCommonSettings) {
      document.title = "Loading...";
      return;
    }

    document.title = abbreviation ? `${abbreviation} Admin` : "";
  }, [abbreviation, loadingCommonSettings]);

  // This component doesn't render anything
  return null;
};

export default TitleManager;
