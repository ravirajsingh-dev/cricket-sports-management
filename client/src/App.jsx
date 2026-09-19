import React, { Suspense } from "react";
import { RouterProvider } from "react-router/dom";

import store from "./app/store.jsx";
import PortalRoutes from "./app/router/PortalRoutes.jsx";

import { initializeAuth } from "@src/features/auth";
import { getCommonSettings } from "@src/app/state/actions/commonActions";
import FaviconManager from "@src/components/FaviconManager";
import TitleManager from "@src/components/TitleManager";
import AppErrorBoundary from "@src/components/AppErrorBoundary";
import ShowAlert from "@src/notifications/ShowAlert";
import BouncingLoader from "@src/components/common/Loaders/BouncingLoader";

const App = () => {
  React.useEffect(() => {
    store.dispatch(initializeAuth());
    store.dispatch(getCommonSettings());
  }, []);

  return (
    <AppErrorBoundary>
      <ShowAlert />
      <FaviconManager />
      <TitleManager />
      <Suspense
        fallback={
          <BouncingLoader minHeight="400px" message="Loading..." />
        }
      >
        <RouterProvider router={PortalRoutes} />
      </Suspense>
    </AppErrorBoundary>
  );
};

export default App;
