import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router";

// Layouts stay eager so shells paint quickly
import PublicLayout from "../layout/PublicLayout";
import PortalLayout from "../layout/PortalLayout";

// Auth
const Register = lazy(() => import("@src/features/auth/Register"));
const Login = lazy(() => import("@src/features/auth/Login"));

// Public
const Home = lazy(() => import("@src/features/public/Home"));
const AboutUs = lazy(() => import("@src/features/public/AboutUs"));
const ContactUs = lazy(() => import("@src/features/public/ContactUs"));
const LegalContentPage = lazy(
  () => import("@src/features/public/LegalContentPage"),
);

// Authenticated pages
const Dashboard = lazy(() => import("@src/features/dashboard/Dashboard"));
const MyAccount = lazy(() => import("@src/features/user/MyAccount"));

const NotFoundPage = lazy(() => import("../../components/common/NotFound/NotFoundPage"));

const PortalRoutes = createBrowserRouter([
  {
    path: "/register",
    name: "Register",
    element: <Register />,
  },
  {
    path: "/login",
    name: "Login",
    element: <Login />,
  },
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      {
        path: "/",
        name: "Home Page",
        element: <Home />,
      },
      {
        path: "/contact-us",
        name: "Contact US",
        element: <ContactUs />,
      },
      {
        path: "/about-us",
        name: "About US",
        element: <AboutUs />,
      },
      {
        path: "/privacy-policy",
        name: "Privacy Policy",
        element: <LegalContentPage />,
      },
      {
        path: "/terms-and-conditions",
        name: "Terms & Conditions",
        element: <LegalContentPage />,
      },
      {
        path: "/returns-and-refunds",
        name: "Refunds",
        element: <LegalContentPage />,
      },
    ],
  },
  {
    path: "/user",
    element: <PortalLayout />,
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "my-account",
        element: <MyAccount />,
      },
      {
        path: "profile",
        element: <Navigate to="/user/my-account" replace />,
      },
      {
        path: "change-login-password",
        element: <Navigate to="/user/my-account?tab=password" replace />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default PortalRoutes;
