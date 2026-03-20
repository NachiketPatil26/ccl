import { buildApiUrl } from './config.js';

async function fetchJson(path) {
  const response = await fetch(buildApiUrl(path), {
    method: 'GET',
    credentials: 'include'
  });

  if (!response.ok) {
    const error = new Error(`API request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function fetchMetrics(timezone) {
  return fetchJson(`/fit/metrics?timezone=${encodeURIComponent(timezone)}`);
}

export async function fetchSessionStatus() {
  return fetchJson('/auth/session');
}

export async function fetchParity(timezone) {
  return fetchJson(`/fit/parity?timezone=${encodeURIComponent(timezone)}`);
}

export async function logout() {
  await fetch(buildApiUrl('/auth/logout'), {
    method: 'POST',
    credentials: 'include'
  });
}
