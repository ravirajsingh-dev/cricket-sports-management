import { GetState, GetCity } from "react-country-state-city";

/** Default country for registration / admin user forms */
export const DEFAULT_COUNTRY = {
  id: 101,
  name: "India",
  iso2: "IN",
};

/** In-memory caches — avoid re-fetching on tab remount */
let stateOptionsCache = null;
let stateOptionsPromise = null;
const cityOptionsCache = new Map();
const cityOptionsPromises = new Map();

/** Sync read — skip skeleton flash when cache is warm */
export const getCachedIndiaStateOptions = () => stateOptionsCache;

/** Sync read — skip skeleton flash when cache is warm */
export const getCachedIndiaCityOptions = (stateId) => {
  const id = Number(stateId);
  if (!id) return null;
  return cityOptionsCache.has(id) ? cityOptionsCache.get(id) : null;
};

/**
 * Map package list items to CustomSelect options.
 * @param {Array<{ id: number|string, name: string }>} list
 * @returns {Array<{ value: number, label: string }>}
 */
export const toLocationOptions = (list = []) =>
  (Array.isArray(list) ? list : []).map((item) => ({
    value: item.id,
    label: item.name,
  }));

/**
 * Load Indian states for CustomSelect (cached).
 * @returns {Promise<Array<{ value: number, label: string }>>}
 */
export const loadIndiaStateOptions = async () => {
  if (stateOptionsCache) return stateOptionsCache;
  if (stateOptionsPromise) return stateOptionsPromise;

  stateOptionsPromise = GetState(DEFAULT_COUNTRY.id)
    .then((states) => {
      stateOptionsCache = toLocationOptions(states);
      return stateOptionsCache;
    })
    .catch((err) => {
      stateOptionsPromise = null;
      throw err;
    });

  return stateOptionsPromise;
};

/**
 * Load cities for a state within India (cached per stateId).
 * @param {number|string} stateId
 * @returns {Promise<Array<{ value: number, label: string }>>}
 */
export const loadIndiaCityOptions = async (stateId) => {
  const id = Number(stateId);
  if (!id) return [];

  if (cityOptionsCache.has(id)) return cityOptionsCache.get(id);
  if (cityOptionsPromises.has(id)) return cityOptionsPromises.get(id);

  const promise = GetCity(DEFAULT_COUNTRY.id, id)
    .then((cities) => {
      const options = toLocationOptions(cities);
      cityOptionsCache.set(id, options);
      cityOptionsPromises.delete(id);
      return options;
    })
    .catch((err) => {
      cityOptionsPromises.delete(id);
      throw err;
    });

  cityOptionsPromises.set(id, promise);
  return promise;
};
