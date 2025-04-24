"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getProfile } from "@/services/api";

interface User {
  _id: string;
  name: string;
  email: string;
  profilePic?: string;
  phoneNumber?: string;
  isAdmin?: boolean;
}

// Define the shape of the user data returned by login
interface LoginResponse extends User {
  token: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (userData: LoginResponse) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem("jwt");
      if (storedToken) {
        setToken(storedToken);
        fetchUserProfile();
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const userData = await getProfile();
      console.log("User profile data:", userData);
      setUser(userData);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      if (typeof window !== 'undefined') {
        localStorage.removeItem("jwt");
      }
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Updated to take a properly typed user data object
  const login = (userData: LoginResponse) => {
    console.log("Login with data:", userData);
    if (userData && userData.token) {
      // Store token
      if (typeof window !== 'undefined') {
        localStorage.setItem("jwt", userData.token);
      }
      setToken(userData.token);
      
      // Set user directly from login data
      const { _id, name, email, profilePic, phoneNumber, isAdmin } = userData;
      setUser({ _id, name, email, profilePic, phoneNumber, isAdmin });
      setLoading(false);
    }
  };

  const logout = () => {
    console.log("Logging out");
    if (typeof window !== 'undefined') {
      localStorage.removeItem("jwt");
    }
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
