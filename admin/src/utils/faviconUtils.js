/**
 * Favicon Utility — set app favicon from Application Settings logo.
 */

const removeDynamicFavicons = () => {
  if (typeof document === "undefined") return;

  document
    .querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]')
    .forEach((link) => link.remove());
};

const createFaviconLinks = (logoUrl) => {
  if (!logoUrl || typeof document === "undefined") return;

  removeDynamicFavicons();

  const makeLink = (id, media) => {
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    link.href = logoUrl;
    link.id = id;
    if (media) link.media = media;
    document.head.appendChild(link);
  };

  makeLink("favicon-light", "(prefers-color-scheme: light)");
  makeLink("favicon-dark", "(prefers-color-scheme: dark)");
  makeLink("favicon-default");
};

/**
 * Call when Application Settings logo is loaded.
 * @param {string} logoUrl
 * @returns {Function} cleanup
 */
export const initializeFavicon = (logoUrl) => {
  if (!logoUrl) {
    document
      .querySelectorAll(
        'link[rel="icon"][id="favicon-default"], link[rel="icon"][id="favicon-light"], link[rel="icon"][id="favicon-dark"]',
      )
      .forEach((link) => link.remove());
    return () => {};
  }

  createFaviconLinks(logoUrl);
  return () => {};
};
