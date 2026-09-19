import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router";

import { TAB_KEYS, TAB_LABELS } from "../editUserConstants";
import {
  buildSubmitDataForTab,
  hasAdditionalDetails,
  hasLocationDetails,
  isSectionEdited,
  validateTab,
} from "../editUserValidation";
import { buildFormDataFromUser } from "../editUserUtils";
import { useHydrateUserForm } from "./useHydrateUserForm";
import { useEditUserTabCallbacks } from "./useEditUserTabCallbacks";
import { useEditUserPage } from "./useEditUserPage";
import { useEditUserFormState } from "./useEditUserFormState";
import { useBrowserNavigationBlocker } from "./useBrowserNavigationBlocker";

export function useEditUserController() {
  const { user_id } = useParams();
  const [discardPrompt, setDiscardPrompt] = useState(null);
  const pendingNavigationRef = useRef(null);

  const page = useEditUserPage();
  const {
    errorList,
    loadingUserDetails,
    currentUser,
    editUser,
    setErrors,
    removeUserErrors,
    getUserById,
    resetComponentStore,
  } = page;

  const form = useEditUserFormState();
  const {
    formData,
    originalSnapshot,
    submitting,
    activeTab,
    editingTab,
    showPasswordField,
    showPasswordCopy,
    showConfirmModal,
    pendingSubmitData,
    pendingTabKey,
    hydrateForm,
    updateForm,
    onFieldChange,
    resetFromSnapshot,
    setEditingTab,
    setActiveTab,
    setShowPasswordField,
    setShowPasswordCopy,
    openConfirmModal,
    closeConfirmModal,
    startSubmit,
    submitSuccess,
    submitDone,
    clearEditingIfMatch,
    setFormData,
  } = form;

  const activeTabLabel = useMemo(
    () => TAB_LABELS[activeTab] || "Edit User",
    [activeTab],
  );

  const mappedCurrentUserFormData = useMemo(() => {
    if (!currentUser?._id) return null;
    return buildFormDataFromUser(currentUser);
  }, [currentUser]);

  const loadUserFormData = useCallback(
    (user, { force = false } = {}) => {
      if (!user) return;
      if (!force && editingTab) return;

      const data =
        user._id === currentUser?._id && mappedCurrentUserFormData
          ? mappedCurrentUserFormData
          : buildFormDataFromUser(user);

      hydrateForm(data);
    },
    [
      currentUser?._id,
      editingTab,
      hydrateForm,
      mappedCurrentUserFormData,
    ],
  );

  const { formHydrated } = useHydrateUserForm({
    currentUser,
    editingTab,
    hydrateForm: loadUserFormData,
  });

  const hasUnsavedEdits = useMemo(
    () =>
      Boolean(
        editingTab &&
          originalSnapshot &&
          isSectionEdited(editingTab, formData, originalSnapshot),
      ),
    [editingTab, formData, originalSnapshot],
  );

  useBrowserNavigationBlocker(hasUnsavedEdits, (proceed) => {
    pendingNavigationRef.current = proceed;
    setDiscardPrompt({ kind: "navigation" });
  });

  useEffect(() => {
    if (!hasUnsavedEdits) return undefined;

    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedEdits]);

  useEffect(() => {
    if (!user_id) return;
    getUserById(user_id);
  }, [getUserById, user_id]);

  useEffect(() => {
    return () => {
      resetComponentStore();
    };
  }, [resetComponentStore]);

  const finishDiscard = useCallback(
    (onAfterDiscard) => {
      if (editingTab) {
        if (currentUser?._id) {
          loadUserFormData(currentUser, { force: true });
        } else if (originalSnapshot) {
          resetFromSnapshot();
        }
        clearEditingIfMatch(editingTab);
        removeUserErrors();
      }
      onAfterDiscard?.();
      setDiscardPrompt(null);
    },
    [
      clearEditingIfMatch,
      currentUser,
      editingTab,
      loadUserFormData,
      originalSnapshot,
      removeUserErrors,
      resetFromSnapshot,
    ],
  );

  const handleSelectChange = useCallback(
    (name, selectedOption) => {
      updateForm((prev) => ({ ...prev, [name]: selectedOption }));
    },
    [updateForm],
  );

  const handleTabEdit = useCallback(
    (tabKey) => {
      setEditingTab(tabKey);
    },
    [setEditingTab],
  );

  const handleTabCancel = useCallback(
    (tabKey) => {
      if (currentUser?._id) {
        loadUserFormData(currentUser, { force: true });
      } else if (originalSnapshot) {
        resetFromSnapshot();
      }
      removeUserErrors();
      clearEditingIfMatch(tabKey);
    },
    [
      clearEditingIfMatch,
      currentUser,
      loadUserFormData,
      originalSnapshot,
      removeUserErrors,
      resetFromSnapshot,
    ],
  );

  const handleTabSave = useCallback(
    (tabKey) => {
      removeUserErrors();

      const result = validateTab(tabKey, {
        formData,
        originalSnapshot,
        showPasswordField,
      });

      if (result.noChanges) {
        return;
      }

      if (!result.valid) {
        setErrors(result.errors);
        return;
      }

      openConfirmModal(
        buildSubmitDataForTab(tabKey, formData, { showPasswordField }),
        tabKey,
      );
    },
    [
      formData,
      openConfirmModal,
      originalSnapshot,
      removeUserErrors,
      setErrors,
      showPasswordField,
    ],
  );

  const tabCallbacks = useEditUserTabCallbacks({
    onEdit: handleTabEdit,
    onCancel: handleTabCancel,
    onSave: handleTabSave,
  });

  const handleConfirmSave = useCallback(
    (txnPassword) => {
      if (!pendingSubmitData || !txnPassword) return;

      startSubmit();
      editUser(
        { ...pendingSubmitData, txn_password: txnPassword },
        user_id,
      ).then((res) => {
        if (res && res.status === true) {
          submitSuccess();
        } else {
          submitDone();
        }
      });
    },
    [
      editUser,
      pendingSubmitData,
      startSubmit,
      submitDone,
      submitSuccess,
      user_id,
    ],
  );

  const handleTabSelect = useCallback(
    (tabKey) => {
      const nextTab = tabKey || TAB_KEYS.core;
      if (nextTab === activeTab) return;

      if (hasUnsavedEdits) {
        setDiscardPrompt({ kind: "tab", nextTab });
        return;
      }

      if (editingTab) {
        handleTabCancel(editingTab);
      }
      setActiveTab(nextTab);
      removeUserErrors();
    },
    [
      activeTab,
      editingTab,
      handleTabCancel,
      hasUnsavedEdits,
      removeUserErrors,
      setActiveTab,
    ],
  );

  const handleConfirmDiscard = useCallback(() => {
    if (!discardPrompt) return;

    if (discardPrompt.kind === "tab") {
      finishDiscard(() => {
        setActiveTab(discardPrompt.nextTab);
      });
      return;
    }

    if (discardPrompt.kind === "navigation") {
      const proceed = pendingNavigationRef.current;
      pendingNavigationRef.current = null;
      finishDiscard(() => {
        proceed?.();
      });
    }
  }, [discardPrompt, finishDiscard, setActiveTab]);

  const handleCancelDiscard = useCallback(() => {
    pendingNavigationRef.current = null;
    setDiscardPrompt(null);
  }, []);

  const isTabDisabled = useCallback(
    (tabKey) => editingTab !== tabKey,
    [editingTab],
  );

  return {
    activeTab,
    activeTabLabel,
    additionalSectionComplete: hasAdditionalDetails(originalSnapshot),
    locationSectionComplete: hasLocationDetails(originalSnapshot),
    currentUser,
    discardPrompt,
    errorList,
    formData,
    handleCancelDiscard,
    handleConfirmDiscard,
    handleConfirmSave,
    handleSelectChange,
    handleTabSelect,
    isTabDisabled,
    onFieldChange,
    pendingTabKey,
    setFormData,
    setShowPasswordCopy,
    setShowPasswordField,
    showConfirmModal,
    showPasswordCopy,
    showPasswordField,
    closeConfirmModal,
    submitting,
    tabCallbacks,
    userLoaded:
      !loadingUserDetails && Boolean(currentUser?._id) && formHydrated,
    editingTab,
  };
}
