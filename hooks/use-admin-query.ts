"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminDashboard,
  fetchAdminUsers,
  toggleUserLock,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} from "@/lib/api";

export function useAdminDashboard(token?: string) {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => fetchAdminDashboard(token!),
    enabled: !!token,
  });
}

export function useAdminUsers(
  token?: string,
  params?: { page?: number; limit?: number; role?: string; search?: string }
) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => fetchAdminUsers(token!, params),
    enabled: !!token,
  });
}

export function useToggleUserLock(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, lock }: { userId: string; lock: boolean }) =>
      toggleUserLock(token!, userId, lock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useCreateUser(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      username: string;
      email: string;
      role: "ADMIN" | "OPERATOR";
      password: string;
    }) => createAdminUser(token!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useUpdateUser(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: {
        name?: string;
        username?: string;
        email?: string;
        role?: "ADMIN" | "OPERATOR";
        password?: string;
      };
    }) => updateAdminUser(token!, userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useDeleteUser(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => deleteAdminUser(token!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useCategories(
  token?: string,
  params?: { page?: number; limit?: number; search?: string; all?: boolean }
) {
  return useQuery({
    queryKey: ["categories", params],
    queryFn: () => fetchCategories(token!, params),
    enabled: !!token,
  });
}

export function useCreateCategory(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { code: string; name: string }) =>
      createCategory(token!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { code?: string; name?: string };
    }) => updateCategory(token!, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["incoming-items"] });
    },
  });
}

export function useDeleteCategory(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useSubCategories(
  token?: string,
  params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    all?: boolean;
  }
) {
  return useQuery({
    queryKey: ["sub-categories", params],
    queryFn: () => fetchSubCategories(token!, params),
    enabled: !!token,
  });
}

export function useCreateSubCategory(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      categoryId: string;
      code: string;
      name: string;
      priceLimit: number;
    }) => createSubCategory(token!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-categories"] });
    },
  });
}

export function useUpdateSubCategory(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        categoryId?: string;
        code?: string;
        name?: string;
        priceLimit?: number;
      };
    }) => updateSubCategory(token!, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-categories"] });
      queryClient.invalidateQueries({ queryKey: ["incoming-items"] });
    },
  });
}

export function useDeleteSubCategory(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSubCategory(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-categories"] });
    },
  });
}

