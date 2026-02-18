/**
 * Flagium API Client
 * Centralized API calls to the FastAPI backend.
 */

const API_BASE = "/api";

let authToken = localStorage.getItem("flagium_token");

async function fetchJSON(endpoint, options = {}) {
  const headers = { ...options.headers };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  if (options.body && typeof options.body === "object") {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    // If 401, maybe clear token? 
    // For now, just throw
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API Error: ${res.status}`);
  }
  return res.json();
}

export const api = {
  setToken: (token) => { authToken = token; },

  // Auth
  login: (email, password) => {
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);
    return fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      body: formData
    }).then(r => {
      if (!r.ok) throw new Error("Login failed");
      return r.json();
    });
  },
  register: (email, password, fullName) =>
    fetchJSON("/auth/register", { method: "POST", body: { email, password, full_name: fullName } }),
  getMe: () => fetchJSON("/auth/me"),
  verifyEmail: (token) => fetchJSON(`/auth/verify-email?token=${token}`),
  updateProfile: (fullName) => fetchJSON("/auth/me", { method: "PUT", body: { full_name: fullName } }),
  changePassword: (oldPassword, newPassword) => fetchJSON("/auth/change-password", { method: "POST", body: { old_password: oldPassword, new_password: newPassword } }),

  // Data
  getDashboard: () => fetchJSON("/dashboard"),
  getCompanies: () => fetchJSON("/companies"),
  getCompany: (ticker) => fetchJSON(`/companies/${ticker}`),
  getFlags: (severity) => fetchJSON(`/flags${severity ? `?severity=${severity}` : ""}`),
  getFlagsForCompany: (ticker) => fetchJSON(`/flags/${ticker}`),

  // Portfolios
  getPortfolios: () => fetchJSON("/portfolios/"),
  getAggregatedHealth: () => fetchJSON("/portfolios/aggregated/health"),
  createPortfolio: (name) => fetchJSON("/portfolios/", { method: "POST", body: { name } }),
  deletePortfolio: (id) => fetchJSON(`/portfolios/${id}`, { method: "DELETE" }),
  renamePortfolio: (id, name) => fetchJSON(`/portfolios/${id}`, { method: "PATCH", body: { name } }),
  getPortfolioDetail: (id) => fetchJSON(`/portfolios/${id}`),
  addPortfolioItem: (id, ticker, investment = 100000) => fetchJSON(`/portfolios/${id}/items`, { method: "POST", body: { ticker, investment } }),
  updatePortfolioItem: (id, ticker, investment) => fetchJSON(`/portfolios/${id}/items/${ticker}`, { method: "PUT", body: { investment } }),
  removePortfolioItem: (id, ticker) => fetchJSON(`/portfolios/${id}/items/${ticker}`, { method: "DELETE" }),

  // Admin
  getIngestionStatus: () => fetchJSON("/admin/ingestion-status"),
  getSanityReport: () => fetchJSON("/admin/sanity-report"),
  triggerScan: () => fetchJSON("/scan", { method: "POST" }),
  triggerIngest: (ticker) => fetchJSON(`/ingest/${ticker}`, { method: "POST" }),
};
