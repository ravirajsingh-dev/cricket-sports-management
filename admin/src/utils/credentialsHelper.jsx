// Remember Admin ID only — never store passwords in browser storage.

export const saveAdminCredentials = (admin_id) => {
  try {
    localStorage.setItem("savedAdmin_id", admin_id);
    localStorage.setItem("rememberAdminId", "true");
  } catch (error) {
    console.error("Error saving admin credentials to localStorage:", error);
  }
};

export const getAdminCredentials = () => {
  try {
    const admin_id = localStorage.getItem("savedAdmin_id");
    const rememberPassword =
      localStorage.getItem("rememberAdminId") === "true";

    return {
      admin_id: admin_id || "",
      password: "",
      rememberPassword,
    };
  } catch (error) {
    console.error("Error getting admin credentials from localStorage:", error);
    return {
      admin_id: "",
      password: "",
      rememberPassword: false,
    };
  }
};

export const removeAdminCredentials = () => {
  try {
    localStorage.removeItem("savedAdmin_id");
    localStorage.removeItem("rememberAdminId");
  } catch (error) {
    console.error("Error removing admin credentials from localStorage:", error);
  }
};
