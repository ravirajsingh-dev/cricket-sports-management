import { useEffect, useRef, useState } from "react";

/**
 * Hydrates the form when user data is ready — without wiping active edits.
 * Exposes formHydrated so the page can keep the skeleton until values are applied.
 */
export function useHydrateUserForm({
  currentUser,
  editingTab,
  hydrateForm,
}) {
  const hydratedUserIdRef = useRef(null);
  const [hydratedUserId, setHydratedUserId] = useState(null);

  useEffect(() => {
    if (!currentUser?._id) {
      hydratedUserIdRef.current = null;
      setHydratedUserId(null);
      return;
    }

    if (editingTab) return;

    if (hydratedUserIdRef.current !== currentUser._id) {
      hydrateForm(currentUser);
      hydratedUserIdRef.current = currentUser._id;
      setHydratedUserId(currentUser._id);
    }
  }, [currentUser, editingTab, hydrateForm]);

  return {
    formHydrated:
      Boolean(currentUser?._id) && hydratedUserId === currentUser._id,
  };
}
