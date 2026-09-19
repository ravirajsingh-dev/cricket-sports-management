// Remember Member ID only — never store passwords in browser storage.

export const saveUserCredentials = (memberId) => {
  try {
    localStorage.setItem("savedMemberId", memberId);
    localStorage.setItem("rememberMemberId", "true");
  } catch (error) {
    console.error("Error saving credentials to localStorage:", error);
  }
};

export const getUserCredentials = () => {
  try {
    const memberId = localStorage.getItem("savedMemberId");
    const rememberPassword =
      localStorage.getItem("rememberMemberId") === "true";

    return {
      memberId: memberId || "",
      password: "",
      rememberPassword,
    };
  } catch (error) {
    console.error("Error getting credentials from localStorage:", error);
    return {
      memberId: "",
      password: "",
      rememberPassword: false,
    };
  }
};

export const removeUserCredentials = () => {
  try {
    localStorage.removeItem("savedMemberId");
    localStorage.removeItem("rememberMemberId");
  } catch (error) {
    console.error("Error removing credentials from localStorage:", error);
  }
};
