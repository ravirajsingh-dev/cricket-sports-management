import { lazy } from "react";

const AdminDashboard = lazy(
  () => import("@src/features/dashboard/Dashboard"),
);
const NoAccessPage = lazy(
  () => import("@src/features/sub-admins/NoAccessPage"),
);
const ApplicationSettings = lazy(
  () =>
    import(
      "@src/features/settings/ApplicationSettings"
    ),
);
const LegalPagesManagement = lazy(
  () =>
    import("@src/features/cms/legal-pages/LegalPagesManagement"),
);
const UsersList = lazy(
  () => import("@src/features/users/UsersList"),
);
const EditUser = lazy(
  () => import("@src/features/users/EditUser"),
);
const AddUser = lazy(
  () => import("@src/features/users/AddUser"),
);
const SliderList = lazy(() => import("@src/features/cms/slider/SliderList"));
const GalleryList = lazy(
  () => import("@src/features/cms/gallery/GalleryList"),
);
const VideoList = lazy(() => import("@src/features/cms/video/VideoList"));
const AddVideo = lazy(() => import("@src/features/cms/video/AddVideo"));
const EditVideo = lazy(() => import("@src/features/cms/video/EditVideo"));
const NewsList = lazy(() => import("@src/features/cms/news/NewsList"));
const AddNews = lazy(() => import("@src/features/cms/news/AddNews"));
const EditNews = lazy(() => import("@src/features/cms/news/EditNews"));
const TeamsList = lazy(() => import("@src/features/cms/teams/TeamsList"));
const CarouselSectionsList = lazy(
  () => import("@src/features/cms/carousel-sections/CarouselSectionsList"),
);
const FaqList = lazy(() => import("@src/features/cms/faq/FaqList"));
const ContactMessageList = lazy(
  () => import("@src/features/cms/contact-messages/ContactMessageList"),
);
const PlayingRoleList = lazy(
  () => import("@src/features/cms/playing-roles/PlayingRoleList"),
);
const HomeShowcaseManagement = lazy(
  () => import("@src/features/cms/home-showcase/HomeShowcaseManagement"),
);
const HowItWorksManagement = lazy(
  () => import("@src/features/cms/how-it-works/HowItWorksManagement"),
);
const SubAdminsList = lazy(
  () => import("@src/features/sub-admins/SubAdminsList"),
);
const CreateSubAdmin = lazy(
  () => import("@src/features/sub-admins/CreateSubAdmin"),
);
const EditSubAdmin = lazy(
  () => import("@src/features/sub-admins/EditSubAdmin"),
);
const ChangePassword = lazy(
  () => import("@src/features/settings/ChangePassword"),
);
const MyAccount = lazy(
  () => import("@src/features/settings/MyAccount"),
);

const AdminRoutes = [
  {
    path: "dashboard",
    name: "Admin Dashboard",
    element: <AdminDashboard />,
  },
  {
    path: "application-settings",
    name: "Application Settings",
    element: <ApplicationSettings />,
  },
  {
    path: "legal-pages",
    name: "Legal & policy pages",
    element: <LegalPagesManagement />,
  },
  {
    path: "users-list",
    name: "Users List",
    element: <UsersList />,
  },
  {
    path: "users/add",
    name: "Add User",
    element: <AddUser />,
  },
  {
    path: "users/edit/:user_id/*",
    name: "Users All Details",
    element: <EditUser />,
  },
  {
    path: "slider",
    name: "Slider Banners",
    element: <SliderList />,
  },
  {
    path: "gallery",
    name: "Image Gallery",
    element: <GalleryList />,
  },
  {
    path: "video",
    name: "Videos",
    element: <VideoList />,
  },
  {
    path: "video/add",
    name: "Add Video",
    element: <AddVideo />,
  },
  {
    path: "video/edit/:id",
    name: "Edit Video",
    element: <EditVideo />,
  },
  {
    path: "news",
    name: "News",
    element: <NewsList />,
  },
  {
    path: "news/add",
    name: "Add News",
    element: <AddNews />,
  },
  {
    path: "news/edit/:id",
    name: "Edit News",
    element: <EditNews />,
  },
  {
    path: "teams",
    name: "Official Teams",
    element: <TeamsList />,
  },
  {
    path: "carousel-sections",
    name: "Carousel Sections",
    element: <CarouselSectionsList />,
  },
  {
    path: "faq",
    name: "FAQ",
    element: <FaqList />,
  },
  {
    path: "contact-messages",
    name: "Contact Messages",
    element: <ContactMessageList />,
  },
  {
    path: "playing-roles",
    name: "Select Your Role",
    element: <PlayingRoleList />,
  },
  {
    path: "home-showcase",
    name: "Impact & Stories",
    element: <HomeShowcaseManagement />,
  },
  {
    path: "how-it-works",
    name: "How Our Platform Works",
    element: <HowItWorksManagement />,
  },
  {
    path: "sub-admins",
    name: "Sub-Admins",
    element: <SubAdminsList />,
  },
  {
    path: "sub-admins/create",
    name: "Create Sub-Admin",
    element: <CreateSubAdmin />,
  },
  {
    path: "sub-admins/edit/:id",
    name: "Edit Sub-Admin",
    element: <EditSubAdmin />,
  },
  {
    path: "my-account",
    name: "My Account",
    element: <MyAccount />,
  },
  {
    path: "change-password",
    name: "Change Password",
    element: <ChangePassword />,
  },
  {
    path: "no-access",
    name: "No Access",
    element: <NoAccessPage />,
  },
];

export default AdminRoutes;
