/**
 * Flagium API Client
 * Centralized API calls to the FastAPI backend.
 */

const API_BASE = "http://localhost:8000/api";

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

  // Data
  getDashboard: () => fetchJSON("/dashboard"),
  getCompanies: () => fetchJSON("/companies"),
  getCompany: (ticker) => fetchJSON(`/companies/${ticker}`),
  getFlags: (severity) => fetchJSON(`/flags${severity ? `?severity=${severity}` : ""}`),
  getFlagsForCompany: (ticker) => fetchJSON(`/flags/${ticker}`),

  // Portfolios
  getPortfolios: () => fetchJSON("/portfolios/"),
  createPortfolio: (name) => fetchJSON("/portfolios/", { method: "POST", body: { name } }),
  deletePortfolio: (id) => fetchJSON(`/portfolios/${id}`, { method: "DELETE" }),
  getPortfolioDetail: (id) => fetchJSON(`/portfolios/${id}`),
  addPortfolioItem: (id, ticker) => fetchJSON(`/portfolios/${id}/items`, { method: "POST", body: { ticker } }),
  removePortfolioItem: (id, ticker) => fetchJSON(`/portfolios/${id}/items/${ticker}`, { method: "DELETE" }),

  // Admin
  getIngestionStatus: () => fetchJSON("/admin/ingestion-status"),
  triggerScan: () => fetch(`${API_BASE}/scan`, { method: "POST" }).then((r) => r.json()),
  triggerIngest: (ticker) => fetch(`${API_BASE}/ingest/${ticker}`, { method: "POST" }).then((r) => r.json()),
};
