export const TAB_KEYS = {
  profile: "profile",
  loginPassword: "login-password",
  txnPassword: "txn-password",
};

export const TAB_LABELS = {
  [TAB_KEYS.profile]: "Profile",
  [TAB_KEYS.loginPassword]: "Change Login Password",
  [TAB_KEYS.txnPassword]: "Change Transaction Password",
};

export const initialFormData = {
  name: "",
  phone: "",
  email: "",
};

export const initialLoginPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export const initialTxnPasswordForm = {
  currentTxnPassword: "",
  newTxnPassword: "",
  confirmTxnPassword: "",
};

export const initialSetTxnForm = {
  txn_password: "",
  confirmTxnPassword: "",
};
