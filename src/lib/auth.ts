"use client";

import { create } from "zustand";

export type UserRole = "DEPOT" | "PHARMACY" | "ADMIN";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  depotName: string;
  isVerified: boolean;
  licenseUploaded: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

// Simulated depot user for demo
const DEMO_DEPOT_USER: User = {
  id: "depot-001",
  name: "Jean-Pierre Habimana",
  email: "depot@umuti.rw",
  role: "DEPOT",
  depotName: "Kigali Central Depot",
  isVerified: true,
  licenseUploaded: true,
};

export const useAuth = create<AuthState>((set) => ({
  user: DEMO_DEPOT_USER,
  isAuthenticated: true,
  login: (email: string, password: string) => {
    if (email === "depot@umuti.rw" && password === "depot123") {
      set({ user: DEMO_DEPOT_USER, isAuthenticated: true });
      return true;
    }
    return false;
  },
  logout: () => set({ user: null, isAuthenticated: false }),
}));
