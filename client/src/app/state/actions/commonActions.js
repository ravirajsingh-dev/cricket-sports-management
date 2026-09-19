import {
  commonSettingsUpdated,
  commonSettingsLoadFailed,
  loadingCommonSettings,
} from "@src/app/state/reducers/commonReducer";
import { removeErrors } from "@src/app/state/reducers/errors";
import { removeAlertMsg } from "@src/app/state/reducers/alert";
import api from "@src/utils/axiosSetup";

/** Single-flight + reuse loaded settings to avoid fan-out from layouts/pages. */
let inflightSettings = null;

export const getCommonSettings =
  ({ force = false } = {}) =>
  async (dispatch, getState) => {
    const state = getState()?.common;
    const existing = state?.commonSettings;
    const hasLoadedName = Boolean(existing?.name || existing?.abbreviation);

    if (!force && hasLoadedName && !state?.loadingCommonSettings) {
      return { status: true, response: existing };
    }

    if (!force && inflightSettings) {
      return inflightSettings;
    }

    const request = (async () => {
      try {
        dispatch(loadingCommonSettings());
        const config = {
          headers: { "Content-Type": "application/json" },
          allowDuplicates: true,
        };

        const res = await api.get(`/api/common/settings`, config);

        if (res.data?.status === true) {
          dispatch(commonSettingsUpdated(res.data.response));
        } else {
          dispatch(commonSettingsLoadFailed());
        }
        return res.data ? res.data : { status: false };
      } catch (err) {
        dispatch(commonSettingsLoadFailed());
        return { status: false };
      } finally {
        inflightSettings = null;
      }
    })();

    inflightSettings = request;
    return request;
  };

export const removeAllErrors = () => async (dispatch) => {
  dispatch(removeErrors());
  dispatch(removeAlertMsg());
};
