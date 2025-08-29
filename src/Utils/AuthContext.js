// Utils/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUserApi } from "../Apis/UserApi";
import { tokenService } from "../Apis/tokenService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(!!tokenService.getAccess());
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true); // <-- new

  const getCurrentUser = async () => {
    try {
      setLoadingUser(true);
      const response = await getCurrentUserApi();
      setUser(response.data);
      setIsLoggedIn(true);
    } catch (err) {
      console.error(err);
      setUser(null);
      setIsLoggedIn(false);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    const access = tokenService.getAccess();
    if (access) {
      getCurrentUser();
    } else {
      setIsLoggedIn(false);
      setUser(null);
      setLoadingUser(false); // <-- important: we’re done checking
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ isLoggedIn, setIsLoggedIn, user, setUser, loadingUser, refreshUser: getCurrentUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
