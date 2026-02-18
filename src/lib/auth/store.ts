"use client";

import { create } from "zustand";
import { UserRole, UserStatus, User } from "./types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (step: number, data: any) => Promise<{ success: boolean; message: string; data?: any }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<{ success: boolean; message: string }>;
  clearError: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        set({ isLoading: false, error: data.error, user: null, isAuthenticated: false });
        return false;
      }

      set({ 
        user: data.data.user, 
        isAuthenticated: true, 
        isLoading: false, 
        error: null 
      });

      return true;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: "Network error. Please try again.", 
        user: null, 
        isAuthenticated: false 
      });
      return false;
    }
  },

  logout: () => {
    // Clear cookies by setting them to expire in the past
    document.cookie = "umuti_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "umuti_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    set({ user: null, isAuthenticated: false, error: null });
  },

  signup: async (step: number, data: any) => {
    set({ isLoading: true, error: null });

    try {
      const formData = new FormData();
      formData.append("step", step.toString());

      if (step === 1) {
        formData.append("businessName", data.businessName);
        formData.append("email", data.email);
        formData.append("phoneNumber", data.phoneNumber);
        formData.append("role", data.role);
      } else if (step === 2) {
        formData.append("userId", data.userId);
        formData.append("district", data.district);
        formData.append("sector", data.sector);
        formData.append("password", data.password);
        formData.append("confirmPassword", data.confirmPassword);
      } else if (step === 3) {
        formData.append("userId", data.userId);
        formData.append("licenseNumber", data.licenseNumber);
        if (data.licenseDocument) {
          formData.append("licenseDocument", data.licenseDocument);
        }
        if (data.rdbRegistration) {
          formData.append("rdbRegistration", data.rdbRegistration);
        }
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        set({ isLoading: false, error: result.error });
        return { success: false, message: result.error };
      }

      set({ isLoading: false });
      return { success: true, message: result.message, data: result.data };
    } catch (error) {
      set({ 
        isLoading: false, 
        error: "Network error. Please try again." 
      });
      return { success: false, message: "Network error. Please try again." };
    }
  },

  forgotPassword: async (email: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      set({ isLoading: false });

      if (!response.ok) {
        return { success: false, message: data.error };
      }

      return { success: true, message: data.message };
    } catch (error) {
      set({ 
        isLoading: false, 
        error: "Network error. Please try again." 
      });
      return { success: false, message: "Network error. Please try again." };
    }
  },

  resetPassword: async (token: string, password: string, confirmPassword: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await response.json();

      set({ isLoading: false });

      if (!response.ok) {
        return { success: false, message: data.error };
      }

      return { success: true, message: data.message };
    } catch (error) {
      set({ 
        isLoading: false, 
        error: "Network error. Please try again." 
      });
      return { success: false, message: "Network error. Please try again." };
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
