import { useEffect, useRef } from "react";
import { useBlocker } from "react-router";

/**
 * Blocks in-app navigation when shouldBlock is true (React Router 7 useBlocker).
 * onBlock receives proceed() to call after the user confirms leaving.
 */
export function useBrowserNavigationBlocker(shouldBlock, onBlock) {
  const onBlockRef = useRef(onBlock);
  onBlockRef.current = onBlock;

  const blocker = useBlocker(Boolean(shouldBlock));

  useEffect(() => {
    if (blocker.state !== "blocked") return undefined;

    onBlockRef.current(() => {
      blocker.proceed?.();
    });

    return undefined;
  }, [blocker]);
}
