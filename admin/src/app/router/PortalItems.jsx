import {
  FaTachometerAlt,
  FaSlidersH,
  FaCog,
  FaFileContract,
  FaUserCog,
  FaImages,
  FaPhotoVideo,
  FaPlay,
  FaNewspaper,
  FaUsers,
  FaUsersCog,
  FaTasks,
  FaShieldAlt,
  FaLayerGroup,
  FaQuestionCircle,
  FaStar,
  FaEnvelope,
  FaUserTag,
} from "react-icons/fa";
import { filterMenuByPermissions } from "@src/utils/permissions";

const PORTAL_MENU = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/admin/dashboard",
    Icon: FaTachometerAlt,
  },
  {
    key: "settings",
    label: "Settings",
    Icon: FaSlidersH,
    children: [
      {
        key: "application-settings",
        label: "Application Settings",
        path: "/admin/application-settings",
        Icon: FaCog,
      },
      {
        key: "legal-pages",
        label: "Legal & policy pages",
        path: "/admin/legal-pages",
        Icon: FaFileContract,
      },
      {
        key: "my-account",
        label: "My Account",
        path: "/admin/my-account",
        Icon: FaUserCog,
      },
      {
        key: "media-management",
        label: "Media Management",
        Icon: FaImages,
        children: [
          {
            key: "slider-banners",
            label: "Slider Banners",
            path: "/admin/slider",
            Icon: FaPhotoVideo,
          },
          {
            key: "image-gallery",
            label: "Our Gallery",
            path: "/admin/gallery",
            Icon: FaImages,
          },
          {
            key: "videos",
            label: "Videos",
            path: "/admin/video",
            Icon: FaPlay,
          },
          {
            key: "news",
            label: "News",
            path: "/admin/news",
            Icon: FaNewspaper,
          },
          {
            key: "teams",
            label: "Official Teams",
            path: "/admin/teams",
            Icon: FaShieldAlt,
          },
          {
            key: "carousel-sections",
            label: "Carousel Sections",
            path: "/admin/carousel-sections",
            Icon: FaLayerGroup,
          },
          {
            key: "faq",
            label: "FAQ",
            path: "/admin/faq",
            Icon: FaQuestionCircle,
          },
          {
            key: "home-showcase",
            label: "Impact & Stories",
            path: "/admin/home-showcase",
            Icon: FaStar,
          },
          {
            key: "how-it-works",
            label: "How Our Platform Works",
            path: "/admin/how-it-works",
            Icon: FaTasks,
          },
        ],
      },
    ],
  },
  {
    key: "users-list",
    label: "Users List",
    path: "/admin/users-list",
    Icon: FaUsers,
  },
  {
    key: "contact-messages",
    label: "Contact Messages",
    path: "/admin/contact-messages",
    Icon: FaEnvelope,
  },
  {
    key: "playing-roles",
    label: "Select Your Role",
    path: "/admin/playing-roles",
    Icon: FaUserTag,
  },
  {
    key: "sub-admins",
    label: "Sub-Admins",
    path: "/admin/sub-admins",
    Icon: FaUsersCog,
  },
];

const cloneMenu = (items) =>
  items.map((item) => ({
    ...item,
    children: item.children ? cloneMenu(item.children) : undefined,
  }));

/** Menu for sidebar — filtered by LTCL admin permissions */
export const getSidebarMenu = (isAuthenticated, admin) => {
  if (!isAuthenticated || !admin) return [];
  return filterMenuByPermissions(cloneMenu(PORTAL_MENU), admin);
};

const flattenMenuLeaves = (items) =>
  items.flatMap((item) => {
    if (item.children?.length) {
      return flattenMenuLeaves(item.children);
    }
    if (item.path) {
      return [
        {
          label: item.label,
          path: item.path,
          Icon: item.Icon,
        },
      ];
    }
    return [];
  });

/** Leaf items for collapsed icon-only list */
export const flattenMenuForCollapsed = (menu) => flattenMenuLeaves(menu);
