import React, { useEffect } from "react";
import { Route, Routes } from "react-router";
import { useDispatch } from "react-redux";

import AdminLogin from "./features/auth/Login";
import AdminPrivateRoute from "./app/router/authGuard.jsx";
import AdminLayout from "./app/layout/PortalLayout";
import { initializeAdminAuth } from "./features/auth";
import { getCommonSettings } from "./app/state/actions/commonActions";
import FaviconManager from "./components/FaviconManager";
import TitleManager from "./components/TitleManager";
import AppErrorBoundary from "./components/AppErrorBoundary";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initializeAdminAuth());
    dispatch(getCommonSettings());
  }, [dispatch]);

  return (
    <AppErrorBoundary>
      <div id="App">
        <FaviconManager />
        <TitleManager />
        <Routes>
          <Route path="/" element={<AdminLogin />} />
          <Route element={<AdminPrivateRoute />}>
            <Route path="/admin/*" element={<AdminLayout />} />
          </Route>
        </Routes>
      </div>
    </AppErrorBoundary>
  );
}

export default App;
