import { createSlice } from "@reduxjs/toolkit";
import * as Constants from "@src/constants/index";

const initialState = {
  contactMessageList: {
    page: 1,
    data: [],
    count: 0,
  },
  selectedContactMessage: null,
  loadingContactMessageList: true,
  loadingContactMessageDetail: false,
  error: {},
  sortingParams: {
    limit: Constants.DEFAULT_PAGE_SIZE,
    page: 1,
    orderBy: "createdAt",
    ascending: "desc",
    query: "",
  },
};

const contactMessageSlice = createSlice({
  name: "adminContactMessages",
  initialState,
  reducers: {
    resetContactMessages() {
      return { ...initialState };
    },
    contactMessageError(state, action) {
      return {
        ...state,
        error: action.payload,
        loadingContactMessageList: false,
        loadingContactMessageDetail: false,
      };
    },
    contactMessageDeleted(state, action) {
      const currentCount = state.contactMessageList.count;
      const currentLimit = state.sortingParams.limit;
      const currentPage = parseInt(state.contactMessageList.page, 10);
      const remainingPages = Math.ceil((currentCount - 1) / currentLimit);
      return {
        ...state,
        contactMessageList: {
          data: state.contactMessageList.data.filter(
            (item) => item._id !== action.payload,
          ),
          count: currentCount - 1,
          page:
            currentPage <= remainingPages
              ? currentPage.toString()
              : remainingPages.toString(),
        },
        selectedContactMessage:
          state.selectedContactMessage?._id === action.payload
            ? null
            : state.selectedContactMessage,
        loadingContactMessageList: false,
      };
    },
    contactMessageListUpdated(state, action) {
      return {
        ...state,
        contactMessageList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
        },
        loadingContactMessageList: false,
      };
    },
    contactMessageDetailUpdated(state, action) {
      const detail = action.payload;
      return {
        ...state,
        selectedContactMessage: detail,
        loadingContactMessageDetail: false,
        contactMessageList: {
          ...state.contactMessageList,
          data: state.contactMessageList.data.map((item) =>
            item._id === detail._id
              ? {
                  ...item,
                  isRead: detail.isRead,
                  readAt: detail.readAt,
                }
              : item,
          ),
        },
      };
    },
    contactMessageSearchParameterUpdate(state, action) {
      return {
        ...state,
        sortingParams: { ...action.payload },
        loadingContactMessageList: false,
      };
    },
    loadingContactMessageList(state) {
      return {
        ...state,
        loadingContactMessageList: true,
      };
    },
    loadingContactMessageDetail(state) {
      return {
        ...state,
        loadingContactMessageDetail: true,
      };
    },
    clearSelectedContactMessage(state) {
      return {
        ...state,
        selectedContactMessage: null,
        loadingContactMessageDetail: false,
      };
    },
  },
});

export const {
  resetContactMessages,
  contactMessageError,
  contactMessageDeleted,
  contactMessageListUpdated,
  contactMessageDetailUpdated,
  contactMessageSearchParameterUpdate,
  loadingContactMessageList,
  loadingContactMessageDetail,
  clearSelectedContactMessage,
} = contactMessageSlice.actions;

export default contactMessageSlice.reducer;
