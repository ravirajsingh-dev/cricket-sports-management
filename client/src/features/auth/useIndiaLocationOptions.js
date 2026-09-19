import { useEffect, useState } from "react";
import {
  getCachedIndiaCityOptions,
  getCachedIndiaStateOptions,
  loadIndiaStateOptions,
  loadIndiaCityOptions,
} from "@src/utils/locationData";

/**
 * Loads India state options and city options for a selected stateId.
 * Uses cached locationData loaders — instant on repeat visits.
 */
export default function useIndiaLocationOptions(stateId) {
  const cachedStates = getCachedIndiaStateOptions();
  const cachedCities = getCachedIndiaCityOptions(stateId);

  const [stateOptions, setStateOptions] = useState(cachedStates || []);
  const [cityOptions, setCityOptions] = useState(cachedCities || []);
  const [loadingStates, setLoadingStates] = useState(!cachedStates);
  const [loadingCities, setLoadingCities] = useState(
    Boolean(Number(stateId)) && !cachedCities,
  );

  useEffect(() => {
    let cancelled = false;
    const warm = getCachedIndiaStateOptions();
    if (warm) {
      setStateOptions(warm);
      setLoadingStates(false);
      return undefined;
    }

    (async () => {
      try {
        setLoadingStates(true);
        const options = await loadIndiaStateOptions();
        if (!cancelled) setStateOptions(options);
      } catch {
        if (!cancelled) setStateOptions([]);
      } finally {
        if (!cancelled) setLoadingStates(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const id = Number(stateId);
    if (!id) {
      setCityOptions([]);
      setLoadingCities(false);
      return undefined;
    }

    const warm = getCachedIndiaCityOptions(id);
    if (warm) {
      setCityOptions(warm);
      setLoadingCities(false);
      return undefined;
    }

    (async () => {
      try {
        setLoadingCities(true);
        const options = await loadIndiaCityOptions(id);
        if (!cancelled) setCityOptions(options);
      } catch {
        if (!cancelled) setCityOptions([]);
      } finally {
        if (!cancelled) setLoadingCities(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [stateId]);

  return {
    stateOptions,
    cityOptions,
    loadingStates,
    loadingCities,
  };
}
