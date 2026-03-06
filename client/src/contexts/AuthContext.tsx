import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AuthUser {
  id: string;
  username: string;
  role: "admin" | "engenharia" | "financeiro" | "integrador";
  name: string;
  email?: string;
  phone?: string;
  cpfCnpj?: string;
  clientType?: "PF" | "PJ";
  company?: string;
  address?: string;
  needsProfileCompletion?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => void;
  isAdmin: boolean;
  isIntegrador: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading, refetch } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: Infinity,
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.status === 401) return null;
        return res.json();
      } catch {
        return null;
      }
    },
  });

  const loginMut = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const logoutMut = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
    },
  });

  const login = async (username: string, password: string) => {
    await loginMut.mutateAsync({ username, password });
  };

  const logout = async () => {
    await logoutMut.mutateAsync();
  };

  return (
    <AuthContext.Provider value={{
      user: user ?? null,
      isLoading,
      login,
      logout,
      refetch,
      isAdmin: ["admin", "engenharia", "financeiro"].includes(user?.role ?? ""),
      isIntegrador: user?.role === "integrador",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
