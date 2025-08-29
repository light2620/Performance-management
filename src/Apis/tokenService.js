const ACCESS_TOKEN_KEY = "access";
const REFRESH_TOKEN_KEY = "refresh";

export const tokenService = {
  getAccess() { return localStorage.getItem(ACCESS_TOKEN_KEY) || null; },
  setAccess(t) { t ? localStorage.setItem(ACCESS_TOKEN_KEY, t) : localStorage.removeItem(ACCESS_TOKEN_KEY); },
  getRefresh() { return localStorage.getItem(REFRESH_TOKEN_KEY) || null; },
  setRefresh(t) { t ? localStorage.setItem(REFRESH_TOKEN_KEY, t) : localStorage.removeItem(REFRESH_TOKEN_KEY); },
  clear() { localStorage.removeItem(ACCESS_TOKEN_KEY); localStorage.removeItem(REFRESH_TOKEN_KEY); }
};
