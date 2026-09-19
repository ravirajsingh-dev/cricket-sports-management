import { createSlice } from "@reduxjs/toolkit";
import * as Constants from "@src/constants/index";

const initialState = {
  playingRoleList: {
    page: 1,
    data: [],
    count: 0,
  },
  loadingPlayingRoleList: true,
  error: {},
  sortingParams: {
    limit: Constants.DEFAULT_PAGE_SIZE,
    page: 1,
    orderBy: "createdAt",
    ascending: "desc",
    query: "",
  },
};

const playingRoleSlice = createSlice({
  name: "adminPlayingRoles",
  initialState,
  reducers: {
    playingRoleCreated(state) {
      state.loadingPlayingRoleList = false;
    },
    resetPlayingRoles() {
      return { ...initialState };
    },
    playingRoleUpdated(state) {
      return {
        ...state,
        sortingParams: initialState.sortingParams,
        loadingPlayingRoleList: false,
      };
    },
    playingRoleError(state, action) {
      return {
        ...state,
        error: action.payload,
        loadingPlayingRoleList: false,
      };
    },
    playingRoleDeleted(state, action) {
      const currentCount = state.playingRoleList.count;
      const currentLimit = state.sortingParams.limit;
      const currentPage = parseInt(state.playingRoleList.page, 10);
      const remainingPages = Math.ceil((currentCount - 1) / currentLimit);
      return {
        ...state,
        playingRoleList: {
          data: state.playingRoleList.data.filter(
            (item) => item._id !== action.payload,
          ),
          count: currentCount - 1,
          page:
            currentPage <= remainingPages
              ? currentPage.toString()
              : remainingPages.toString(),
        },
        sortingParams: initialState.sortingParams,
        loadingPlayingRoleList: false,
      };
    },
    playingRoleListUpdated(state, action) {
      return {
        ...state,
        playingRoleList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
        },
        loadingPlayingRoleList: false,
      };
    },
    playingRoleSearchParameterUpdate(state, action) {
      return {
        ...state,
        sortingParams: { ...action.payload },
        loadingPlayingRoleList: false,
      };
    },
    loadingOnPlayingRoleSubmit(state) {
      return {
        ...state,
        loadingPlayingRoleList: true,
      };
    },
    loadingPlayingRoleList(state) {
      return {
        ...state,
        loadingPlayingRoleList: true,
      };
    },
  },
});

export const {
  playingRoleCreated,
  resetPlayingRoles,
  playingRoleUpdated,
  playingRoleError,
  playingRoleDeleted,
  playingRoleListUpdated,
  playingRoleSearchParameterUpdate,
  loadingOnPlayingRoleSubmit,
  loadingPlayingRoleList,
} = playingRoleSlice.actions;

export default playingRoleSlice.reducer;
