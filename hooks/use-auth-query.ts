"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  loginUser,
  logoutUser,
  getStoredAuth,
  saveStoredAuth,
  clearStoredAuth,
  fetchUserProfile,
  type User,
  type LoginResponse,
} from "@/lib/api";

export const AUTH_KEYS = {
  session: ["auth", "session"] as const,
  profile: (userId?: string) => ["auth", "profile", userId] as const,
};

export function useAuthSession() {
  return useQuery({
    queryKey: AUTH_KEYS.session,
    queryFn: () => getStoredAuth(),
    staleTime: Infinity,
  });
}

export function useUserProfile(accessToken?: string, userId?: string) {
  return useQuery({
    queryKey: AUTH_KEYS.profile(userId),
    queryFn: async () => {
      if (!accessToken) return null;
      const res = await fetchUserProfile(accessToken);
      if (res.success && res.data) {
        return res.data;
      }
      return null;
    },
    enabled: !!accessToken,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: { username: string; password: string }) =>
      loginUser(credentials),
    onSuccess: (result: LoginResponse) => {
      if (result.success && result.data) {
        saveStoredAuth({
          user: result.data.user,
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
        });

        // Perbarui cache auth session di TanStack Query
        queryClient.setQueryData(AUTH_KEYS.session, {
          user: result.data.user,
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
        });

        // Set juga cache profile user
        queryClient.setQueryData(
          AUTH_KEYS.profile(result.data.user.id),
          result.data.user
        );
      }
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (refreshToken?: string | null) => logoutUser(refreshToken),
    onSuccess: () => {
      clearStoredAuth();
      // Reset semua query yang berhubungan dengan autentikasi
      queryClient.setQueryData(AUTH_KEYS.session, null);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

