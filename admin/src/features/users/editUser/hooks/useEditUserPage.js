import { useMemo } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import {
  editUser,
  setErrors,
  removeUserErrors,
  getUserById,
  resetComponentStore,
} from "@src/features/users/userActions";
import { selectEditUserState } from "../editUserSelectors";

export function useEditUserPage() {
  const dispatch = useDispatch();
  const { errorList, loadingUserDetails, currentUser } = useSelector(
    selectEditUserState,
    shallowEqual,
  );

  const actions = useMemo(
    () => ({
      editUser: (...args) => dispatch(editUser(...args)),
      setErrors: (...args) => dispatch(setErrors(...args)),
      removeUserErrors: () => dispatch(removeUserErrors()),
      getUserById: (...args) => dispatch(getUserById(...args)),
      resetComponentStore: () => dispatch(resetComponentStore()),
    }),
    [dispatch],
  );

  return {
    errorList,
    loadingUserDetails,
    currentUser,
    ...actions,
  };
}
