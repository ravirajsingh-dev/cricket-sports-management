import React from "react";
import { Navigate, Outlet } from "react-router";
import { useSelector } from "react-redux";
import BouncingLoader from "@src/components/common/Loaders/BouncingLoader";

const AdminPrivateRoute = () => {
  const { isAdminAuthenticated, adminLoading, admin } = useSelector(
    (state) => state.adminAuth,
  );

  if (isAdminAuthenticated === null || adminLoading) {
    return <BouncingLoader minHeight="100vh" />;
  }

  if (!isAdminAuthenticated || !admin) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
};

export default AdminPrivateRoute;
