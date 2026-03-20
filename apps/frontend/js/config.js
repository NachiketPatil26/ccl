export const CONFIG = {
  API_BASE_URL:
    window.__VITALORB_CONFIG__ && window.__VITALORB_CONFIG__.API_BASE_URL
      ? window.__VITALORB_CONFIG__.API_BASE_URL
      : ''
};

export function buildApiUrl(path) {
  if (!CONFIG.API_BASE_URL) {
    return path;
  }

  return `${CONFIG.API_BASE_URL}${path}`;
}
