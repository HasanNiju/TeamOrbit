// ---------------------------------------------------------------------------
// Single import point used by the app. Defaults to the real backend
// (realApi.js). Set VITE_USE_MOCK=true in a local .env to fall back to the
// old localStorage-based mock — handy for offline UI work with no backend
// running.
// ---------------------------------------------------------------------------

import * as mockApi from "./mockApi";
import * as realApi from "./realApi";

const impl = import.meta.env.VITE_USE_MOCK === "true" ? mockApi : realApi;

export const login = impl.login;
export const getSession = impl.getSession;
export const logout = impl.logout;
export const getProfile = impl.getProfile;
export const updateProfile = impl.updateProfile;
export const submitReport = impl.submitReport;
export const getStats = impl.getStats;
