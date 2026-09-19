import { createSlice } from "@reduxjs/toolkit";
import * as Constants from "@src/constants/index";

const initialState = {
  teamList: {
    page: 1,
    data: [],
    count: 0,
    nextOrder: 1,
  },
  teamGroups: {
    data: [],
    nextOrder: 1,
  },
  teamSettings: {
    title: "",
    description: "",
  },
  loadingTeamList: true,
  loadingTeamGroups: true,
  loadingTeamSettings: true,
  savingTeamSettings: false,
  error: {},
  sortingParams: {
    limit: Constants.DEFAULT_PAGE_SIZE,
    page: 1,
    orderBy: "order",
    ascending: "asc",
    query: "",
  },
};

const teamSlice = createSlice({
  name: "adminTeams",
  initialState,
  reducers: {
    teamCreated(state) {
      state.loadingTeamList = false;
    },
    resetTeams() {
      return { ...initialState };
    },
    teamUpdated(state) {
      return {
        ...state,
        sortingParams: initialState.sortingParams,
        loadingTeamList: false,
      };
    },
    teamError(state, action) {
      return {
        ...state,
        error: action.payload,
        loadingTeamList: false,
        loadingTeamGroups: false,
        loadingTeamSettings: false,
        savingTeamSettings: false,
      };
    },
    teamDeleted(state, action) {
      const currentCount = state.teamList.count;
      const currentLimit = state.sortingParams.limit;
      const currentPage = parseInt(state.teamList.page, 10);
      const remainingPages = Math.ceil((currentCount - 1) / currentLimit);
      return {
        ...state,
        teamList: {
          data: state.teamList.data.filter((team) => team._id !== action.payload),
          count: currentCount - 1,
          page:
            currentPage <= remainingPages
              ? currentPage.toString()
              : remainingPages.toString(),
          nextOrder: state.teamList.nextOrder,
        },
        sortingParams: initialState.sortingParams,
        loadingTeamList: false,
      };
    },
    teamListUpdated(state, action) {
      return {
        ...state,
        teamList: {
          data: action.payload.data,
          page: action.payload.metadata[0].current_page,
          count: action.payload.metadata[0].totalRecord,
          nextOrder: action.payload.metadata[0].nextOrder || 1,
        },
        loadingTeamList: false,
      };
    },
    teamGroupsUpdated(state, action) {
      return {
        ...state,
        teamGroups: {
          data: action.payload.data || [],
          nextOrder: action.payload.nextOrder || 1,
        },
        loadingTeamGroups: false,
      };
    },
    teamSettingsUpdated(state, action) {
      return {
        ...state,
        teamSettings: action.payload,
        loadingTeamSettings: false,
        savingTeamSettings: false,
      };
    },
    loadingTeamSettings(state) {
      return {
        ...state,
        loadingTeamSettings: true,
      };
    },
    savingTeamSettings(state) {
      return {
        ...state,
        savingTeamSettings: true,
      };
    },
    teamSearchParameterUpdate(state, action) {
      return {
        ...state,
        sortingParams: { ...action.payload },
        loadingTeamList: false,
      };
    },
    loadingOnTeamSubmit(state) {
      return {
        ...state,
        loadingTeamList: true,
      };
    },
    loadingTeamList(state) {
      return {
        ...state,
        loadingTeamList: true,
      };
    },
    loadingTeamGroups(state) {
      return {
        ...state,
        loadingTeamGroups: true,
      };
    },
  },
});

export const {
  teamCreated,
  resetTeams,
  teamUpdated,
  teamError,
  teamDeleted,
  teamListUpdated,
  teamGroupsUpdated,
  teamSettingsUpdated,
  loadingTeamSettings,
  savingTeamSettings,
  teamSearchParameterUpdate,
  loadingOnTeamSubmit,
  loadingTeamList,
  loadingTeamGroups,
} = teamSlice.actions;

export default teamSlice.reducer;
