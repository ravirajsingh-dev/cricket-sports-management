import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { initializeFavicon } from '@src/utils/faviconUtils';

/**
 * FaviconManager Component
 * Manages dynamic favicon updates based on Application Settings
 * Automatically updates favicon when logoUrl changes or theme changes
 */
const FaviconManager = () => {
  const logoUrl = useSelector(
    (state) => state.adminCommonSettings.commonSettings?.logoUrl,
  );
  const loadingCommonSettings = useSelector(
    (state) => state.adminCommonSettings.loadingCommonSettings,
  );

  const cleanupRef = useRef(null);

  useEffect(() => {
    // Don't update favicon while loading
    if (loadingCommonSettings) {
      return;
    }

    // Clean up previous listener if it exists
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    // Initialize favicon with current logo
    if (logoUrl) {
      cleanupRef.current = initializeFavicon(logoUrl);
    }

    // Cleanup on unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [logoUrl, loadingCommonSettings]);

  // This component doesn't render anything
  return null;
};

export default FaviconManager;
