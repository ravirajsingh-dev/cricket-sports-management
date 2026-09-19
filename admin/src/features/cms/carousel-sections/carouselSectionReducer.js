import { createSlice } from "@reduxjs/toolkit";
import * as Constants from "@src/constants/index";

const initialState = {
  itemList: {
    page: 1,
    data: [],
    count: 0,
    nextOrder: 1,
  },
  groups: {
    data: [],
    nextOrder: 1,
  },
  loadingItemList: true,
  loadingGroups: true,
  error: {},
  sortingParams: {
    limit: Constants.DEFAULT_PAGE_SIZE,
    page: 1,
    orderBy: "order",
    ascending: "asc",
    query: "",
  },
};

const carouselSectionSlice = createSlice({
  name: "adminCarouselSections",
  initialState,
  reducers: {
    itemCreated(state) {
      state.loadingItemList = false;
    },
    resetCarouselSections() {
      return { ...initialState };
    },
    itemUpdated(state) {
      return {
        ...state,
        sortingParams: initialState.sortingParams,
        loadingItemList: false,
      };
    },
    itemError(state, action) {
      return {
        ...state,
        error: action.payload,
        loadingItemList: false,
        loadingGroups: false,
      };
    },
    itemDeleted(state, action) {
      const currentCount = state.itemList.count;
      const currentLimit = state.sortingParams.limit;
      const currentPage = parseInt(state.itemList.page, 10);
      const remainingPages = Math.ceil((currentCount - 1) / currentLimit);
      return {
        ...state,
        itemList: {
          data: state.itemList.data.filter(
            (item) => item._id !== action.payload,
          ),
          count: currentCount - 1,
          page:
            currentPage <= remainingPages
              ? currentPage.toString()
              : remainingPages.toString(),
          nextOrder: state.itemList.nextOrder,
        },
        sortingParams: initialState.sortingParams,
        loadingItemList: false,
      };
    },
    itemListUpdated(state, action) {
      return {
        ...state,
        itemList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
          nextOrder: action.payload.metadata[0].nextOrder || 1,
        },
        loadingItemList: false,
      };
    },
    groupsUpdated(state, action) {
      return {
        ...state,
        groups: {
          data: action.payload.data || [],
          nextOrder: action.payload.nextOrder || 1,
        },
        loadingGroups: false,
      };
    },
    searchParameterUpdate(state, action) {
      return {
        ...state,
        sortingParams: { ...action.payload },
        loadingItemList: false,
      };
    },
    loadingOnItemSubmit(state) {
      return {
        ...state,
        loadingItemList: true,
      };
    },
    loadingItemList(state) {
      return {
        ...state,
        loadingItemList: true,
      };
    },
    loadingGroups(state) {
      return {
        ...state,
        loadingGroups: true,
      };
    },
  },
});

export const {
  itemCreated,
  resetCarouselSections,
  itemUpdated,
  itemError,
  itemDeleted,
  itemListUpdated,
  groupsUpdated,
  searchParameterUpdate,
  loadingOnItemSubmit,
  loadingItemList,
  loadingGroups,
} = carouselSectionSlice.actions;

export default carouselSectionSlice.reducer;
