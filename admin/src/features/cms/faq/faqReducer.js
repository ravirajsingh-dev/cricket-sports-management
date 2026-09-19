import { createSlice } from "@reduxjs/toolkit";
import * as Constants from "@src/constants/index";

const initialState = {
  faqList: {
    page: 1,
    data: [],
    count: 0,
    nextOrder: 1,
  },
  faqSettings: {
    title: "",
    description: "",
  },
  loadingFaqList: true,
  loadingFaqSettings: true,
  savingFaqSettings: false,
  error: {},
  sortingParams: {
    limit: Constants.DEFAULT_PAGE_SIZE,
    page: 1,
    orderBy: "order",
    ascending: "asc",
    query: "",
  },
};

const faqSlice = createSlice({
  name: "adminFaq",
  initialState,
  reducers: {
    faqCreated(state) {
      state.loadingFaqList = false;
    },
    resetFaq() {
      return { ...initialState };
    },
    faqUpdated(state) {
      return {
        ...state,
        sortingParams: initialState.sortingParams,
        loadingFaqList: false,
      };
    },
    faqError(state, action) {
      return {
        ...state,
        error: action.payload,
        loadingFaqList: false,
        loadingFaqSettings: false,
        savingFaqSettings: false,
      };
    },
    faqDeleted(state, action) {
      const currentCount = state.faqList.count;
      const currentLimit = state.sortingParams.limit;
      const currentPage = parseInt(state.faqList.page, 10);
      const remainingPages = Math.ceil((currentCount - 1) / currentLimit);
      return {
        ...state,
        faqList: {
          data: state.faqList.data.filter((faq) => faq._id !== action.payload),
          count: currentCount - 1,
          page:
            currentPage <= remainingPages
              ? currentPage.toString()
              : remainingPages.toString(),
          nextOrder: state.faqList.nextOrder,
        },
        sortingParams: initialState.sortingParams,
        loadingFaqList: false,
      };
    },
    faqListUpdated(state, action) {
      return {
        ...state,
        faqList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
          nextOrder: action.payload.metadata[0].nextOrder || 1,
        },
        loadingFaqList: false,
      };
    },
    faqSettingsUpdated(state, action) {
      return {
        ...state,
        faqSettings: action.payload,
        loadingFaqSettings: false,
        savingFaqSettings: false,
      };
    },
    loadingFaqSettings(state) {
      return {
        ...state,
        loadingFaqSettings: true,
      };
    },
    savingFaqSettings(state) {
      return {
        ...state,
        savingFaqSettings: true,
      };
    },
    faqSearchParameterUpdate(state, action) {
      return {
        ...state,
        sortingParams: { ...action.payload },
        loadingFaqList: false,
      };
    },
    loadingOnFaqSubmit(state) {
      return {
        ...state,
        loadingFaqList: true,
      };
    },
    loadingFaqList(state) {
      return {
        ...state,
        loadingFaqList: true,
      };
    },
  },
});

export const {
  faqCreated,
  resetFaq,
  faqUpdated,
  faqError,
  faqDeleted,
  faqListUpdated,
  faqSettingsUpdated,
  loadingFaqSettings,
  savingFaqSettings,
  faqSearchParameterUpdate,
  loadingOnFaqSubmit,
  loadingFaqList,
} = faqSlice.actions;

export default faqSlice.reducer;
