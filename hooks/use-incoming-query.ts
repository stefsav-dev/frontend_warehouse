"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchIncomingItems,
  fetchIncomingItemSummary,
  fetchIncomingComboboxCategories,
  fetchIncomingComboboxSubCategories,
  fetchIncomingComboboxOperators,
  createIncomingItem,
  deleteIncomingItem,
  uploadIncomingAttachment,
} from "@/lib/api";

export function useIncomingItems(
  token?: string,
  params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    subCategoryId?: string;
    year?: string;
    search?: string;
    operatorId?: string;
  }
) {
  return useQuery({
    queryKey: ["incoming-items", params],
    queryFn: () => fetchIncomingItems(token!, params),
    enabled: !!token,
  });
}

export function useIncomingItemSummary(token?: string) {
  return useQuery({
    queryKey: ["incoming-items", "summary"],
    queryFn: () => fetchIncomingItemSummary(token!),
    enabled: !!token,
  });
}

export function useComboboxCategories(token?: string) {
  return useQuery({
    queryKey: ["incoming-items", "combobox-categories"],
    queryFn: () => fetchIncomingComboboxCategories(token!),
    enabled: !!token,
  });
}

export function useComboboxSubCategories(token?: string, categoryId?: string) {
  return useQuery({
    queryKey: ["incoming-items", "combobox-sub-categories", categoryId],
    queryFn: () => fetchIncomingComboboxSubCategories(token!, categoryId!),
    enabled: !!token && !!categoryId,
  });
}

export function useComboboxOperators(token?: string) {
  return useQuery({
    queryKey: ["incoming-items", "combobox-operators"],
    queryFn: () => fetchIncomingComboboxOperators(token!),
    enabled: !!token,
  });
}

export function useCreateIncomingItem(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      itemName: string;
      categoryId: string;
      subCategoryId: string;
      quantity: number;
      price?: number;
      itemPrice?: number;
      unit?: string;
      itemOrigin: string;
      letterNumber?: string;
      incomingDate?: string;
      attachment?: string | null;
      fileAttachment?: string | null;
      attachmentOriginalName?: string | null;
      operatorId?: string;
      expiredDate?: string | null;
    }) => createIncomingItem(token!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incoming-items"] });
    },
  });
}

export function useDeleteIncomingItem(token?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteIncomingItem(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incoming-items"] });
    },
  });
}

export function useUploadAttachment(token?: string) {
  return useMutation({
    mutationFn: (file: File) => uploadIncomingAttachment(token!, file),
  });
}

