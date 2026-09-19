import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  commonSettings: {
    name: "",
    abbreviation: "",
    developedBy: "",
    developedByLink: "",
    socialMedia: {
      links: [],
    },
    aboutUs: {
      title: "",
      intro: "",
      sections: [],
    },
    contactUsPage: {
      title: "",
      intro: "",
      phone: "",
      secondaryPhone: "",
      email: "",
      address: "",
      businessHours: "",
    },
    loginEnabled: true,
    registerEnabled: true,
  },
  loadingCommonSettings: false,
};

const commonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {
    commonSettingsUpdated(state, action) {
      return {
        ...state,
        commonSettings: action.payload,
        loadingCommonSettings: false,
      };
    },

    commonSettingsLoadFailed(state) {
      return {
        ...state,
        loadingCommonSettings: false,
      };
    },

    loadingCommonSettings(state) {
      return {
        ...state,
        loadingCommonSettings: true,
      };
    },
  },
});

export const {
  commonSettingsUpdated,
  commonSettingsLoadFailed,
  loadingCommonSettings,
} = commonSlice.actions;
export default commonSlice.reducer;
