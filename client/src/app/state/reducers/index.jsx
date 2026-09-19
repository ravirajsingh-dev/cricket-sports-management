import { combineReducers } from "redux";

import errors from "./errors";
import alert from "./alert";
import common from "./commonReducer";
import auth from "@src/features/auth/authReducer";
import profile from "@src/features/user/profileReducer";

const rootReducer = combineReducers({
  errors,
  alert,
  auth,
  common,
  profile,
});

export default rootReducer;
