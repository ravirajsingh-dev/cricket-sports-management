import { combineReducers } from "redux";

import errors from "./errors";
import alert from "./alert";
import adminCommonSettings from "./commonReducer";

import adminAuth from "@src/features/auth/authReducer";
import adminUsers from "@src/features/users/userReducer";
import adminSubAdmins from "@src/features/sub-admins/subAdminsReducer";
import adminSlider from "@src/features/cms/slider/sliderReducer";
import adminGallery from "@src/features/cms/gallery/galleryReducer";
import adminVideo from "@src/features/cms/video/videoReducer";
import adminNews from "@src/features/cms/news/newsReducer";
import adminTeams from "@src/features/cms/teams/teamReducer";
import adminCarouselSections from "@src/features/cms/carousel-sections/carouselSectionReducer";
import adminFaq from "@src/features/cms/faq/faqReducer";
import adminHomeShowcase from "@src/features/cms/home-showcase/homeShowcaseReducer";
import adminHowItWorks from "@src/features/cms/how-it-works/howItWorksReducer";
import adminContactMessages from "@src/features/cms/contact-messages/contactMessageReducer";
import adminPlayingRoles from "@src/features/cms/playing-roles/playingRoleReducer";

const rootReducer = combineReducers({
  errors,
  alert,
  adminAuth,
  adminUsers,
  adminSubAdmins,
  adminCommonSettings,
  slider: adminSlider,
  gallery: adminGallery,
  video: adminVideo,
  news: adminNews,
  teams: adminTeams,
  carouselSections: adminCarouselSections,
  faq: adminFaq,
  homeShowcase: adminHomeShowcase,
  howItWorks: adminHowItWorks,
  contactMessages: adminContactMessages,
  playingRoles: adminPlayingRoles,
});

export default rootReducer;
