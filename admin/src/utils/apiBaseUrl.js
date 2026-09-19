/**
 * Resolve axios baseURL for browser API calls.
 *
 * Production (Caddy): same-origin `/api/*` → leave baseURL empty.
 * Local Vite: relative `/api` is proxied via vite.config.js.
 * Absolute VITE_APP_SERVER_URL is only honored for local browser hosts
 * (e.g. http://localhost:5000). Docker service hostnames and public API
 * hosts (e.g. https://api.example.com) are ignored in production builds so
 * CSP `connect-src 'self'` and the Caddy `/api` proxy keep working.
 */
export function resolveApiBaseURL() {
  const configured = String(import.meta.env.VITE_APP_SERVER_URL || "").trim();
  if (!configured) return "";

  try {
    const url = new URL(configured);
    const dockerInternalHosts = new Set([
      "server",
      "mongo",
      "mongodb",
      "redis",
      "client",
      "admin",
    ]);
    if (
      dockerInternalHosts.has(url.hostname) ||
      url.hostname.endsWith(".internal")
    ) {
      return "";
    }

    const isLocalHost =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "[::1]";

    // Prod static builds must stay same-origin; public API URLs break CSP.
    if (import.meta.env.PROD && !isLocalHost) {
      return "";
    }

    return configured.replace(/\/$/, "");
  } catch {
    return "";
  }
}
