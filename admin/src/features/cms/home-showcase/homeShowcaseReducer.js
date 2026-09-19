import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  showcase: {
    impact: { title: "", description: "", items: [] },
    selectors: { title: "", description: "", badges: [], people: [] },
    testimonials: { title: "", description: "", items: [] },
  },
  loadingShowcase: true,
  savingShowcase: false,
  savingSection: null,
  error: {},
};

const homeShowcaseSlice = createSlice({
  name: "adminHomeShowcase",
  initialState,
  reducers: {
    homeShowcaseError(state, action) {
      return {
        ...state,
        error: action.payload || {},
        loadingShowcase: false,
        savingShowcase: false,
        savingSection: null,
      };
    },
    homeShowcaseLoaded(state, action) {
      return {
        ...state,
        showcase: action.payload,
        loadingShowcase: false,
      };
    },
    loadingHomeShowcase(state) {
      return {
        ...state,
        loadingShowcase: true,
      };
    },
    savingHomeShowcase(state, action) {
      return {
        ...state,
        savingShowcase: true,
        savingSection: action.payload || null,
      };
    },
    homeShowcaseSaved(state, action) {
      return {
        ...state,
        showcase: action.payload,
        savingShowcase: false,
        savingSection: null,
      };
    },
  },
});

export const {
  homeShowcaseError,
  homeShowcaseLoaded,
  loadingHomeShowcase,
  savingHomeShowcase,
  homeShowcaseSaved,
} = homeShowcaseSlice.actions;

export default homeShowcaseSlice.reducer;
