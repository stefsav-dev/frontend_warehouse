"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Package2,
  LayoutDashboard,
  Users,
  FolderTree,
  Layers,
  Boxes,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Pencil,
  Search,
  LogOut,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Menu,
  X,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuthSession, useLogoutMutation } from "@/hooks/use-auth-query";
import {
  useAdminDashboard,
  useAdminUsers,
  useToggleUserLock,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useSubCategories,
  useCreateSubCategory,
  useUpdateSubCategory,
  useDeleteSubCategory,
} from "@/hooks/use-admin-query";
import {
  useIncomingItems,
  useIncomingItemSummary,
  useUpdateIncomingItem,
  useDeleteIncomingItem,
  useComboboxOperators,
  useComboboxCategories,
  useComboboxSubCategories,
} from "@/hooks/use-incoming-query";
import { DatePicker } from "@/components/ui/date-picker";
import { getApiBaseUrl } from "@/lib/api";

function formatRupiah(amount: number) {
  if (isNaN(amount) || amount === null || amount === undefined) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(amount);
}

export default function AdminPage() {
  const router = useRouter();
  const { data: session, isLoading: isSessionLoading } = useAuthSession();
  const logoutMutation = useLogoutMutation();

  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "categories" | "subcategories" | "items"
  >("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync activeTab from URL search params if provided (e.g. ?tab=items)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab && ["overview", "users", "categories", "subcategories", "items"].includes(tab)) {
        setActiveTab(tab as any);
      }
    }
  }, []);

  // Update document title dynamically based on active tab
  useEffect(() => {
    switch (activeTab) {
      case "overview":
        document.title = "Ringkasan Sistem - Warehouse App";
        break;
      case "users":
        document.title = "Manajemen Pengguna - Warehouse App";
        break;
      case "categories":
        document.title = "Master Kategori - Warehouse App";
        break;
      case "subcategories":
        document.title = "Master Sub Kategori - Warehouse App";
        break;
      case "items":
        document.title = "Master Barang Masuk - Warehouse App";
        break;
      default:
        document.title = "Admin - Warehouse App";
    }
  }, [activeTab]);

  // Pagination & Limits (5, 10, 25, 50, 100)
  const [userPage, setUserPage] = useState(1);
  const [userLimit, setUserLimit] = useState(5);

  const [catPage, setCatPage] = useState(1);
  const [catLimit, setCatLimit] = useState(5);

  const [subCatPage, setSubCatPage] = useState(1);
  const [subCatLimit, setSubCatLimit] = useState(5);

  const [itemPage, setItemPage] = useState(1);
  const [itemLimit, setItemLimit] = useState(5);
  const [itemSortBy, setItemSortBy] = useState<"date" | "name" | "quantity" | "price">("date");
  const [itemSortOrder, setItemSortOrder] = useState<"asc" | "desc">("desc");

  // Search & Filter States
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [subCatSearch, setSubCatSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");

  // Dialog States
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [isEditCatOpen, setIsEditCatOpen] = useState(false);
  const [isAddSubCatOpen, setIsAddSubCatOpen] = useState(false);
  const [isEditSubCatOpen, setIsEditSubCatOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    type: "user" | "category" | "subcategory" | "item";
    id: string;
    title: string;
    description: string;
    detail?: { label: string; value: string }[];
  }>({
    isOpen: false,
    type: "user",
    id: "",
    title: "",
    description: "",
  });

  // Modal Error States (Menampilkan pesan error langsung di dalam modal)
  const [userModalError, setUserModalError] = useState<string | null>(null);
  const [editUserModalError, setEditUserModalError] = useState<string | null>(null);
  const [catModalError, setCatModalError] = useState<string | null>(null);
  const [editCatModalError, setEditCatModalError] = useState<string | null>(null);
  const [subCatModalError, setSubCatModalError] = useState<string | null>(null);
  const [editSubCatModalError, setEditSubCatModalError] = useState<string | null>(null);
  const [editItemModalError, setEditItemModalError] = useState<string | null>(null);

  // Toggle lihat password di modal tambah user & edit user
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [showEditUserPassword, setShowEditUserPassword] = useState(false);

  // Form States
  const [newUserData, setNewUserData] = useState({
    name: "",
    username: "",
    email: "",
    role: "OPERATOR" as "ADMIN" | "OPERATOR",
    password: "",
  });
  const [editUserData, setEditUserData] = useState({
    id: "",
    name: "",
    username: "",
    email: "",
    role: "OPERATOR" as "ADMIN" | "OPERATOR",
    password: "",
  });
  const [newCatData, setNewCatData] = useState({ code: "", name: "" });
  const [editCatData, setEditCatData] = useState({ id: "", code: "", name: "" });
  const [newSubCatData, setNewSubCatData] = useState({
    categoryId: "",
    code: "",
    name: "",
    priceLimit: 0,
  });
  const [editSubCatData, setEditSubCatData] = useState({
    id: "",
    categoryId: "",
    code: "",
    name: "",
    priceLimit: 0,
  });
  const [editItemData, setEditItemData] = useState({
    id: "",
    operatorId: "",
    categoryId: "",
    subCategoryId: "",
    itemOrigin: "",
    letterNumber: "",
    itemName: "",
    price: 0,
    quantity: 1,
    unit: "Buah",
    expiredDate: "",
    incomingDate: "",
  });

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const token = session?.accessToken;

  // Protect Admin Route: Redirect if not logged in or not admin
  useEffect(() => {
    if (!isSessionLoading) {
      if (!session) {
        router.push("/");
      } else if (session.user.role !== "ADMIN") {
        router.push("/operator");
      }
    }
  }, [session, isSessionLoading, router]);

  // Queries
  const { data: dashboardData } = useAdminDashboard(token);
  const { data: usersData } = useAdminUsers(token, {
    page: userPage,
    limit: userLimit,
    search: userSearch,
    role: userRoleFilter || undefined,
  });
  const { data: categoriesData } = useCategories(token, {
    page: catPage,
    limit: catLimit,
    search: catSearch,
  });
  const { data: allCategories } = useCategories(token, { all: true });
  const { data: subCategoriesData } = useSubCategories(token, {
    page: subCatPage,
    limit: subCatLimit,
    search: subCatSearch,
  });
  const { data: itemsData } = useIncomingItems(token, {
    page: itemPage,
    limit: itemLimit,
    search: itemSearch,
  });
  const { data: itemSummary } = useIncomingItemSummary(token);

  // Mutations
  const toggleLockMutation = useToggleUserLock(token);
  const createUserMutation = useCreateUser(token);
  const updateUserMutation = useUpdateUser(token);
  const deleteUserMutation = useDeleteUser(token);
  const createCatMutation = useCreateCategory(token);
  const updateCatMutation = useUpdateCategory(token);
  const deleteCatMutation = useDeleteCategory(token);
  const createSubCatMutation = useCreateSubCategory(token);
  const updateSubCatMutation = useUpdateSubCategory(token);
  const deleteSubCatMutation = useDeleteSubCategory(token);
  const updateItemMutation = useUpdateIncomingItem(token);
  const deleteItemMutation = useDeleteIncomingItem(token);

  const { data: operatorsData } = useComboboxOperators(token);
  const { data: comboboxCategories } = useComboboxCategories(token);
  const { data: comboboxSubCategories } = useComboboxSubCategories(
    token,
    editItemData.categoryId || undefined
  );

  const isDeleting =
    deleteUserMutation.isPending ||
    deleteCatMutation.isPending ||
    deleteSubCatMutation.isPending ||
    deleteItemMutation.isPending;

  if (isSessionLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserModalError(null);

    // Front-end validasi sesuai skema backend (minimal 8 karakter)
    if (newUserData.name.trim().length < 8) {
      setUserModalError("Nama lengkap minimal 8 karakter.");
      return;
    }
    if (newUserData.username.trim().length < 8) {
      setUserModalError("Username minimal 8 karakter.");
      return;
    }
    if (newUserData.email.trim().length < 8) {
      setUserModalError("Email minimal 8 karakter.");
      return;
    }
    if (newUserData.password.length < 8) {
      setUserModalError("Password minimal 8 karakter.");
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(newUserData.password)) {
      setUserModalError("Password wajib kombinasi huruf besar, kecil, dan angka.");
      return;
    }

    createUserMutation.mutate(newUserData, {
      onSuccess: (res: any) => {
        if (res.success) {
          setIsAddUserOpen(false);
          setUserModalError(null);
          setNewUserData({
            name: "",
            username: "",
            email: "",
            role: "OPERATOR",
            password: "",
          });
          setFeedback({ type: "success", text: "Pengguna baru berhasil dibuat." });
        } else {
          // Error ditampilkan di dalam modal, modal TETAP terbuka
          setUserModalError(res.message || "Gagal menambah user.");
        }
      },
      onError: (err: Error) => {
        // Error ditampilkan di dalam modal
        setUserModalError(err.message || "Terjadi kesalahan saat menambah user.");
      },
    });
  };

  const handleOpenEditUser = (user: any) => {
    setEditUserData({
      id: user.id,
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      role: user.role || "OPERATOR",
      password: "",
    });
    setEditUserModalError(null);
    setShowEditUserPassword(false);
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setEditUserModalError(null);

    if (editUserData.name.trim().length < 3) {
      setEditUserModalError("Nama lengkap minimal 3 karakter.");
      return;
    }
    if (editUserData.username.trim().length < 3) {
      setEditUserModalError("Username minimal 3 karakter.");
      return;
    }
    if (editUserData.email.trim().length < 5) {
      setEditUserModalError("Email minimal 5 karakter.");
      return;
    }

    // Jika password diisi, periksa kompleksitasnya
    if (editUserData.password.trim() !== "") {
      if (editUserData.password.length < 8) {
        setEditUserModalError("Password baru minimal 8 karakter.");
        return;
      }
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
      if (!passwordRegex.test(editUserData.password)) {
        setEditUserModalError("Password baru wajib kombinasi huruf besar, kecil, dan angka.");
        return;
      }
    }

    const payload: {
      name: string;
      username: string;
      email: string;
      role: "ADMIN" | "OPERATOR";
      password?: string;
    } = {
      name: editUserData.name.trim(),
      username: editUserData.username.trim(),
      email: editUserData.email.trim().toLowerCase(),
      role: editUserData.role,
    };

    if (editUserData.password.trim() !== "") {
      payload.password = editUserData.password;
    }

    updateUserMutation.mutate(
      { userId: editUserData.id, payload },
      {
        onSuccess: (res: any) => {
          if (res.success) {
            setIsEditUserOpen(false);
            setEditUserModalError(null);
            setFeedback({
              type: "success",
              text: res.message || "Data pengguna berhasil diperbarui.",
            });
          } else {
            setEditUserModalError(res.message || "Gagal memperbarui data pengguna.");
          }
        },
        onError: (err: Error) => {
          setEditUserModalError(err.message || "Terjadi kesalahan saat memperbarui data pengguna.");
        },
      }
    );
  };

  const handleOpenDeleteUser = (u: any) => {
    if (u.id === session?.user?.id) {
      setFeedback({
        type: "error",
        text: "Tidak dapat menghapus akun sendiri yang sedang aktif.",
      });
      return;
    }
    setDeleteModalState({
      isOpen: true,
      type: "user",
      id: u.id,
      title: "Hapus Pengguna",
      description: `Apakah Anda yakin ingin menghapus akun pengguna '${u.name}'? Tindakan ini akan menghapus akun secara permanen dari sistem.`,
      detail: [
        { label: "Nama Lengkap", value: u.name },
        { label: "Username", value: `@${u.username}` },
        { label: "Role", value: u.role },
        { label: "Email", value: u.email },
      ],
    });
  };

  const handleOpenDeleteCategory = (c: any) => {
    setDeleteModalState({
      isOpen: true,
      type: "category",
      id: c.id,
      title: "Hapus Kategori",
      description: `Apakah Anda yakin ingin menghapus kategori '${c.name}'?`,
      detail: [
        { label: "Kode Kategori", value: c.code },
        { label: "Nama Kategori", value: c.name },
      ],
    });
  };

  const handleOpenDeleteSubCategory = (sc: any) => {
    setDeleteModalState({
      isOpen: true,
      type: "subcategory",
      id: sc.id,
      title: "Hapus Sub Kategori",
      description: `Apakah Anda yakin ingin menghapus sub kategori '${sc.name}'?`,
      detail: [
        { label: "Kode Sub", value: sc.code },
        { label: "Nama Sub Kategori", value: sc.name },
        { label: "Batas Harga", value: formatRupiah(sc.priceLimit) },
      ],
    });
  };

  const handleOpenDeleteItem = (item: any) => {
    setDeleteModalState({
      isOpen: true,
      type: "item",
      id: item.id,
      title: "Hapus Barang Masuk",
      description: `Apakah Anda yakin ingin menghapus catatan barang masuk '${item.itemName}'?`,
      detail: [
        { label: "Nama Barang", value: item.itemName },
        { label: "Jumlah", value: `${item.quantity} ${item.unit || "Buah"}` },
        { label: "Harga Satuan", value: formatRupiah(Number(item.price || 0)) },
        { label: "Tanggal Masuk", value: item.incomingDate || "-" },
      ],
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteModalState.id) return;

    if (deleteModalState.type === "user") {
      deleteUserMutation.mutate(deleteModalState.id, {
        onSuccess: (res: any) => {
          setDeleteModalState((prev) => ({ ...prev, isOpen: false }));
          if (res.success) {
            setFeedback({
              type: "success",
              text: res.message || "Pengguna berhasil dihapus.",
            });
          } else {
            setFeedback({
              type: "error",
              text: res.message || "Gagal menghapus pengguna.",
            });
          }
        },
        onError: (err: any) => {
          setDeleteModalState((prev) => ({ ...prev, isOpen: false }));
          setFeedback({
            type: "error",
            text: err.message || "Terjadi kesalahan saat menghapus pengguna.",
          });
        },
      });
    } else if (deleteModalState.type === "category") {
      deleteCatMutation.mutate(deleteModalState.id, {
        onSuccess: (res: any) => {
          setDeleteModalState((prev) => ({ ...prev, isOpen: false }));
          if (res.success) {
            setFeedback({
              type: "success",
              text: res.message || "Kategori berhasil dihapus.",
            });
          } else {
            setFeedback({
              type: "error",
              text: res.message || "Gagal menghapus kategori.",
            });
          }
        },
        onError: (err: any) => {
          setDeleteModalState((prev) => ({ ...prev, isOpen: false }));
          setFeedback({
            type: "error",
            text: err.message || "Terjadi kesalahan saat menghapus kategori.",
          });
        },
      });
    } else if (deleteModalState.type === "subcategory") {
      deleteSubCatMutation.mutate(deleteModalState.id, {
        onSuccess: (res: any) => {
          setDeleteModalState((prev) => ({ ...prev, isOpen: false }));
          if (res.success) {
            setFeedback({
              type: "success",
              text: res.message || "Sub kategori berhasil dihapus.",
            });
          } else {
            setFeedback({
              type: "error",
              text: res.message || "Gagal menghapus sub kategori.",
            });
          }
        },
        onError: (err: any) => {
          setDeleteModalState((prev) => ({ ...prev, isOpen: false }));
          setFeedback({
            type: "error",
            text: err.message || "Terjadi kesalahan saat menghapus sub kategori.",
          });
        },
      });
    } else if (deleteModalState.type === "item") {
      deleteItemMutation.mutate(deleteModalState.id, {
        onSuccess: (res: any) => {
          setDeleteModalState((prev) => ({ ...prev, isOpen: false }));
          if (res.success) {
            setFeedback({
              type: "success",
              text: res.message || "Data barang masuk berhasil dihapus.",
            });
          } else {
            setFeedback({
              type: "error",
              text: res.message || "Gagal menghapus data barang masuk.",
            });
          }
        },
        onError: (err: any) => {
          setDeleteModalState((prev) => ({ ...prev, isOpen: false }));
          setFeedback({
            type: "error",
            text: err.message || "Terjadi kesalahan saat menghapus data barang masuk.",
          });
        },
      });
    }
  };

  const handleOpenEditCategory = (c: any) => {
    setEditCatModalError(null);
    setEditCatData({
      id: c.id,
      code: c.code || "",
      name: c.name || "",
    });
    setIsEditCatOpen(true);
  };

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setEditCatModalError(null);

    if (!editCatData.code.trim()) {
      setEditCatModalError("Kode kategori wajib diisi.");
      return;
    }
    if (!editCatData.name.trim()) {
      setEditCatModalError("Nama kategori wajib diisi.");
      return;
    }

    updateCatMutation.mutate(
      {
        id: editCatData.id,
        payload: {
          code: editCatData.code.trim().toUpperCase(),
          name: editCatData.name.trim(),
        },
      },
      {
        onSuccess: (res: any) => {
          if (res.success) {
            setIsEditCatOpen(false);
            setEditCatModalError(null);
            setFeedback({
              type: "success",
              text: `Kategori '${editCatData.name}' berhasil diperbarui.`,
            });
          } else {
            setEditCatModalError(res.message || "Gagal memperbarui kategori.");
          }
        },
        onError: (err: Error) => {
          setEditCatModalError(
            err.message || "Terjadi kesalahan saat memperbarui kategori."
          );
        },
      }
    );
  };

  const handleOpenEditSubCategory = (sc: any) => {
    setEditSubCatModalError(null);
    setEditSubCatData({
      id: sc.id,
      categoryId: sc.categoryId || sc.category?.id || "",
      code: sc.code || "",
      name: sc.name || "",
      priceLimit: Number(sc.priceLimit || 0),
    });
    setIsEditSubCatOpen(true);
  };

  const handleUpdateSubCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setEditSubCatModalError(null);

    if (!editSubCatData.categoryId) {
      setEditSubCatModalError("Kategori induk wajib dipilih.");
      return;
    }
    if (!editSubCatData.code.trim()) {
      setEditSubCatModalError("Kode sub kategori wajib diisi.");
      return;
    }
    if (!editSubCatData.name.trim()) {
      setEditSubCatModalError("Nama sub kategori wajib diisi.");
      return;
    }
    if (Number(editSubCatData.priceLimit) <= 0) {
      setEditSubCatModalError("Batas harga satuan wajib lebih dari Rp 0.");
      return;
    }

    updateSubCatMutation.mutate(
      {
        id: editSubCatData.id,
        payload: {
          categoryId: editSubCatData.categoryId,
          code: editSubCatData.code.trim().toUpperCase(),
          name: editSubCatData.name.trim(),
          priceLimit: Number(editSubCatData.priceLimit),
        },
      },
      {
        onSuccess: (res: any) => {
          if (res.success) {
            setIsEditSubCatOpen(false);
            setEditSubCatModalError(null);
            setFeedback({
              type: "success",
              text: `Sub kategori '${editSubCatData.name}' berhasil diperbarui.`,
            });
          } else {
            setEditSubCatModalError(res.message || "Gagal memperbarui sub kategori.");
          }
        },
        onError: (err: Error) => {
          setEditSubCatModalError(
            err.message || "Terjadi kesalahan saat memperbarui sub kategori."
          );
        },
      }
    );
  };

  const handleOpenEditItem = (it: any) => {
    setEditItemModalError(null);
    setEditItemData({
      id: it.id,
      operatorId: it.operator?.id || it.operatorId || "",
      categoryId: it.category?.id || it.categoryId || "",
      subCategoryId: it.subCategory?.id || it.subCategoryId || "",
      itemOrigin: it.itemOrigin || "",
      letterNumber: it.letterNumber || "",
      itemName: it.itemName || "",
      price: Number(it.price ?? it.itemPrice ?? 0),
      quantity: Number(it.quantity || 1),
      unit: it.unit || "Buah",
      expiredDate: it.expiredDate || "",
      incomingDate: it.incomingDate || new Date().toISOString().split("T")[0],
    });
    setIsEditItemOpen(true);
  };

  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    setEditItemModalError(null);

    if (!editItemData.itemName.trim()) {
      setEditItemModalError("Nama barang tidak boleh kosong.");
      return;
    }
    if (!editItemData.itemOrigin.trim()) {
      setEditItemModalError("Asal barang wajib diisi.");
      return;
    }
    if (!editItemData.categoryId) {
      setEditItemModalError("Kategori wajib dipilih.");
      return;
    }
    if (!editItemData.subCategoryId) {
      setEditItemModalError("Sub kategori wajib dipilih.");
      return;
    }
    if (Number(editItemData.price) <= 0) {
      setEditItemModalError("Harga satuan harus lebih dari Rp 0.");
      return;
    }
    if (Number(editItemData.quantity) < 1) {
      setEditItemModalError("Jumlah barang minimal 1.");
      return;
    }

    const selectedSub = comboboxSubCategories?.data?.find(
      (s: any) => s.id === editItemData.subCategoryId
    );
    if (selectedSub && Number(selectedSub.priceLimit) > 0) {
      if (Number(editItemData.price) > Number(selectedSub.priceLimit)) {
        setEditItemModalError(
          `Harga satuan (${formatRupiah(Number(editItemData.price))}) melebihi batas harga sub kategori (${formatRupiah(Number(selectedSub.priceLimit))}).`
        );
        return;
      }
    }

    updateItemMutation.mutate(
      {
        id: editItemData.id,
        payload: {
          operatorId: editItemData.operatorId || undefined,
          categoryId: editItemData.categoryId,
          subCategoryId: editItemData.subCategoryId,
          itemOrigin: editItemData.itemOrigin.trim(),
          letterNumber: editItemData.letterNumber.trim() || undefined,
          itemName: editItemData.itemName.trim(),
          price: Number(editItemData.price),
          quantity: Number(editItemData.quantity),
          unit: editItemData.unit.trim() || "Buah",
          expiredDate: editItemData.expiredDate || null,
          incomingDate: editItemData.incomingDate,
        },
      },
      {
        onSuccess: (res: any) => {
          if (res.success) {
            setIsEditItemOpen(false);
            setEditItemModalError(null);
            setFeedback({
              type: "success",
              text: `Data barang masuk '${editItemData.itemName}' berhasil diperbarui.`,
            });
          } else {
            setEditItemModalError(res.message || "Gagal memperbarui barang masuk.");
          }
        },
        onError: (err: Error) => {
          setEditItemModalError(
            err.message || "Terjadi kesalahan saat memperbarui barang masuk."
          );
        },
      }
    );
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setCatModalError(null);

    if (!newCatData.code.trim()) {
      setCatModalError("Kode kategori wajib diisi.");
      return;
    }
    if (!newCatData.name.trim()) {
      setCatModalError("Nama kategori wajib diisi.");
      return;
    }

    createCatMutation.mutate(newCatData, {
      onSuccess: (res: any) => {
        if (res.success) {
          setIsAddCatOpen(false);
          setCatModalError(null);
          setNewCatData({ code: "", name: "" });
          setFeedback({ type: "success", text: "Kategori berhasil ditambahkan." });
        } else {
          setCatModalError(res.message || "Gagal menambah kategori.");
        }
      },
      onError: (err: Error) => {
        setCatModalError(err.message || "Terjadi kesalahan saat menambah kategori.");
      },
    });
  };

  const handleCreateSubCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setSubCatModalError(null);

    if (!newSubCatData.categoryId) {
      setSubCatModalError("Kategori induk wajib dipilih.");
      return;
    }
    if (!newSubCatData.code.trim()) {
      setSubCatModalError("Kode sub kategori wajib diisi.");
      return;
    }
    if (!newSubCatData.name.trim()) {
      setSubCatModalError("Nama sub kategori wajib diisi.");
      return;
    }
    if (Number(newSubCatData.priceLimit) <= 0) {
      setSubCatModalError("Batas harga satuan harus lebih dari Rp 0.");
      return;
    }

    createSubCatMutation.mutate(newSubCatData, {
      onSuccess: (res: any) => {
        if (res.success) {
          setIsAddSubCatOpen(false);
          setSubCatModalError(null);
          setNewSubCatData({ categoryId: "", code: "", name: "", priceLimit: 0 });
          setFeedback({ type: "success", text: "Sub kategori berhasil ditambahkan." });
        } else {
          setSubCatModalError(res.message || "Gagal menambah sub kategori.");
        }
      },
      onError: (err: Error) => {
        setSubCatModalError(err.message || "Terjadi kesalahan saat menambah sub kategori.");
      },
    });
  };

  const handleLogout = () => {
    logoutMutation.mutate(session.refreshToken, {
      onSuccess: () => router.push("/"),
    });
  };

  const navItems = [
    { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
    { id: "users", label: "Manajemen User", icon: Users },
    { id: "categories", label: "Master Kategori", icon: FolderTree },
    { id: "subcategories", label: "Master Sub Kategori", icon: Layers },
    { id: "items", label: "Master Barang Masuk", icon: Boxes },
  ] as const;

  // Items sorting & pagination helper
  const rawItems = itemsData?.data || [];
  const sortedItems = [...rawItems].sort((a: any, b: any) => {
    let valA: any;
    let valB: any;
    if (itemSortBy === "name") {
      valA = (a.itemName || "").toLowerCase();
      valB = (b.itemName || "").toLowerCase();
      return itemSortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    if (itemSortBy === "quantity") {
      valA = Number(a.quantity || 0);
      valB = Number(b.quantity || 0);
    } else if (itemSortBy === "price") {
      valA = Number(a.price ?? a.itemPrice ?? 0);
      valB = Number(b.price ?? b.itemPrice ?? 0);
    } else {
      valA = new Date(a.incomingDate || a.createdAt || 0).getTime();
      valB = new Date(b.incomingDate || b.createdAt || 0).getTime();
    }
    return itemSortOrder === "asc" ? valA - valB : valB - valA;
  });

  const handleItemSort = (col: "date" | "name" | "quantity" | "price") => {
    if (itemSortBy === col) {
      setItemSortOrder(itemSortOrder === "asc" ? "desc" : "asc");
    } else {
      setItemSortBy(col);
      setItemSortOrder("asc");
    }
  };

  // Top Limit Selector (Ditempatkan di Atas Tabel)
  const renderTopLimitSelector = (
    currentL: number,
    total: number,
    onLimitChange: (l: number) => void,
    onPageChange: (p: number) => void
  ) => {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-b border-zinc-200 dark:border-zinc-800 text-xs bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-500">Tampilkan:</span>
          <select
            value={currentL}
            onChange={(e) => {
              onLimitChange(Number(e.target.value));
              onPageChange(1);
            }}
            className="h-7 px-2 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-medium cursor-pointer"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-zinc-500">data / hlm</span>
        </div>

        <span className="text-zinc-500">
          Total: <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{total}</strong> data
        </span>
      </div>
    );
  };

  // Bottom Pagination (Ditempatkan di Bawah Tabel)
  const renderBottomPagination = (
    currentP: number,
    currentL: number,
    total: number,
    onPageChange: (p: number) => void
  ) => {
    const totalP = Math.ceil(total / currentL) || 1;
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-zinc-200 dark:border-zinc-800 text-xs bg-zinc-50/50 dark:bg-zinc-900/50">
        <span className="text-zinc-500">
          Menampilkan{" "}
          <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">
            {total === 0 ? 0 : (currentP - 1) * currentL + 1} -{" "}
            {Math.min(currentP * currentL, total)}
          </strong>{" "}
          dari{" "}
          <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">
            {total}
          </strong>{" "}
          data
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => onPageChange(Math.max(currentP - 1, 1))}
            disabled={currentP <= 1}
          >
            <ChevronLeft className="h-3 w-3 mr-1" />
            Sebelumnya
          </Button>

          <div className="flex items-center gap-1 px-1">
            {Array.from({ length: totalP }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalP || Math.abs(p - currentP) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                return (
                  <React.Fragment key={p}>
                    {prev && p - prev > 1 && (
                      <span className="px-1 text-zinc-400">...</span>
                    )}
                    <Button
                      variant={currentP === p ? "default" : "outline"}
                      size="sm"
                      className="h-7 w-7 p-0 text-xs"
                      onClick={() => onPageChange(p)}
                    >
                      {p}
                    </Button>
                  </React.Fragment>
                );
              })}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => onPageChange(Math.min(currentP + 1, totalP))}
            disabled={currentP >= totalP}
          >
            Selanjutnya
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center">
            <Package2 className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-sm">Warehouse App</span>
            <Badge variant="default" className="ml-1.5 text-[9px] h-4 px-1 font-normal">
              ADMIN
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`${
          isMobileMenuOpen ? "block" : "hidden"
        } md:flex flex-col w-full md:w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 shrink-0 md:min-h-screen z-20`}
      >
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/80 hidden md:flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center">
            <Package2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm">Warehouse App</span>
              <Badge variant="default" className="text-[9px] h-4 px-1 font-normal">
                ADMIN
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-500">Panel Administrator</p>
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer text-left ${
                  isActive
                    ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-3">
          <div className="px-2 py-1.5 rounded-md bg-zinc-50 dark:bg-zinc-800/40">
            <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {session.user.name}
            </p>
            <p className="text-[11px] font-mono text-zinc-500 truncate">
              @{session.user.username}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 gap-2 justify-center"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
            <span>Keluar</span>
          </Button>
        </div>
      </aside>

      {/* AREA KONTEN UTAMA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="max-w-6xl w-full mx-auto p-6 md:p-8 space-y-6 flex-1">
          {/* Header Konten Berdasarkan Tab Aktif */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {activeTab === "overview" && "Ringkasan Sistem"}
                {activeTab === "users" && "Manajemen Pengguna"}
                {activeTab === "categories" && "Master Kategori"}
                {activeTab === "subcategories" && "Master Sub Kategori"}
                {activeTab === "items" && "Master Barang Masuk"}
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {activeTab === "overview" &&
                  "Statistik umum akun dan total pencatatan barang gudang."}
                {activeTab === "users" &&
                  "Kelola akun administrator dan operator, status akses, serta penguncian user."}
                {activeTab === "categories" &&
                  "Kelola master data klasifikasi kategori barang inventaris."}
                {activeTab === "subcategories" &&
                  "Daftar sub kategori barang dengan batas pagu harga satuan maksimum."}
                {activeTab === "items" &&
                  "Monitoring seluruh data penerimaan barang masuk dari operator."}
              </p>
            </div>
          </div>

          {/* Pesan Feedback Alert */}
          {feedback && (
            <Alert
              variant={feedback.type === "error" ? "destructive" : "default"}
              className="py-2.5 text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {feedback.type === "error" ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                )}
                <AlertDescription>{feedback.text}</AlertDescription>
              </div>
              <button
                onClick={() => setFeedback(null)}
                className="text-xs underline text-zinc-500 cursor-pointer"
              >
                Tutup
              </button>
            </Alert>
          )}

          {/* 1. Tab Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="shadow-xs">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Total Pengguna</CardDescription>
                    <CardTitle className="text-2xl font-semibold">
                      {dashboardData?.data?.statistics?.totalUsers ?? "-"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-[11px] text-zinc-500">
                    {dashboardData?.data?.statistics?.totalAdmins ?? 0} Admin,{" "}
                    {dashboardData?.data?.statistics?.totalOperators ?? 0} Operator
                  </CardContent>
                </Card>

                <Card className="shadow-xs">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Akun Terkunci</CardDescription>
                    <CardTitle className="text-2xl font-semibold text-rose-600">
                      {dashboardData?.data?.statistics?.totalLockedUsers ?? 0}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-[11px] text-zinc-500">
                    User dibatasi & tidak dapat login ke sistem
                  </CardContent>
                </Card>

                <Card className="shadow-xs">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Total Barang Masuk</CardDescription>
                    <CardTitle className="text-2xl font-semibold">
                      {itemSummary?.data?.totalItems ?? itemsData?.pagination?.total ?? 0}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-[11px] text-zinc-500">
                    Jumlah transaksi barang tercatat di database
                  </CardContent>
                </Card>
              </div>

            </div>
          )}

          {/* 2. Tab Manajemen Pengguna */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-zinc-400" />
                    <Input
                      placeholder="Cari user / nama..."
                      value={userSearch}
                      onChange={(e) => {
                        setUserSearch(e.target.value);
                        setUserPage(1);
                      }}
                      className="h-8 pl-8 text-xs"
                    />
                  </div>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => {
                      setUserRoleFilter(e.target.value);
                      setUserPage(1);
                    }}
                    className="h-8 px-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  >
                    <option value="">Semua Role</option>
                    <option value="ADMIN">Admin</option>
                    <option value="OPERATOR">Operator</option>
                  </select>
                </div>

                <Button
                  size="sm"
                  className="h-8 text-xs gap-1 w-full sm:w-auto"
                  onClick={() => {
                    setUserModalError(null);
                    setShowUserPassword(false);
                    setIsAddUserOpen(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Pengguna</span>
                </Button>
              </div>

              {/* Users Table Card */}
              <Card className="shadow-xs overflow-hidden">
                {renderTopLimitSelector(
                  userLimit,
                  usersData?.pagination?.total || 0,
                  setUserLimit,
                  setUserPage
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Pengguna</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.data?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-zinc-500">
                          Tidak ada data pengguna yang sesuai.
                        </TableCell>
                      </TableRow>
                    ) : (
                      usersData?.data?.map((u: any) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell className="font-mono text-[11px]">@{u.username}</TableCell>
                          <TableCell className="text-zinc-500">{u.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={u.role === "ADMIN" ? "default" : "secondary"}
                              className="text-[10px] h-5"
                            >
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {u.isLocked ? (
                              <span className="text-[11px] text-rose-600 font-medium">
                                Terkunci
                              </span>
                            ) : (
                              <span className="text-[11px] text-emerald-600 font-medium">
                                Aktif
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-2 gap-1 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                                onClick={() => handleOpenEditUser(u)}
                                title="Edit Pengguna"
                              >
                                <Pencil className="h-3 w-3 text-amber-500" />
                                <span>Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-2 gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                onClick={() => handleOpenDeleteUser(u)}
                                disabled={deleteUserMutation.isPending}
                                title="Hapus Pengguna"
                              >
                                <Trash2 className="h-3 w-3 text-rose-600" />
                                <span>Hapus</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {renderBottomPagination(
                  userPage,
                  userLimit,
                  usersData?.pagination?.total || 0,
                  setUserPage
                )}
              </Card>
            </div>
          )}

          {/* 3. Tab Master Kategori */}
          {activeTab === "categories" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
                <div className="relative w-full sm:w-64">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-zinc-400" />
                  <Input
                    placeholder="Cari kode atau nama..."
                    value={catSearch}
                    onChange={(e) => {
                      setCatSearch(e.target.value);
                      setCatPage(1);
                    }}
                    className="h-8 pl-8 text-xs"
                  />
                </div>

                <Button
                  size="sm"
                  className="h-8 text-xs gap-1 w-full sm:w-auto"
                  onClick={() => {
                    setCatModalError(null);
                    setIsAddCatOpen(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Kategori</span>
                </Button>
              </div>

              {/* Category Table Card */}
              <Card className="shadow-xs overflow-hidden">
                {renderTopLimitSelector(
                  catLimit,
                  categoriesData?.pagination?.total || 0,
                  setCatLimit,
                  setCatPage
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode Kategori</TableHead>
                      <TableHead>Nama Kategori</TableHead>
                      <TableHead>Tanggal Dibuat</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoriesData?.data?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-zinc-500">
                          Belum ada kategori terdaftar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      categoriesData?.data?.map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-mono font-medium">{c.code}</TableCell>
                          <TableCell>{c.name}</TableCell>
                          <TableCell className="text-zinc-500 text-[11px]">
                            {c.createdAt
                              ? new Date(c.createdAt).toLocaleDateString("id-ID")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                onClick={() => handleOpenEditCategory(c)}
                                title="Ubah Kategori"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                onClick={() => handleOpenDeleteCategory(c)}
                                title="Hapus Kategori"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {renderBottomPagination(
                  catPage,
                  catLimit,
                  categoriesData?.pagination?.total || 0,
                  setCatPage
                )}
              </Card>
            </div>
          )}

          {/* 4. Tab Master Sub Kategori */}
          {activeTab === "subcategories" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
                <div className="relative w-full sm:w-64">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-zinc-400" />
                  <Input
                    placeholder="Cari sub kategori..."
                    value={subCatSearch}
                    onChange={(e) => {
                      setSubCatSearch(e.target.value);
                      setSubCatPage(1);
                    }}
                    className="h-8 pl-8 text-xs"
                  />
                </div>

                <Button
                  size="sm"
                  className="h-8 text-xs gap-1 w-full sm:w-auto"
                  onClick={() => {
                    setSubCatModalError(null);
                    setIsAddSubCatOpen(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Sub Kategori</span>
                </Button>
              </div>

              {/* SubCategory Table Card */}
              <Card className="shadow-xs overflow-hidden">
                {renderTopLimitSelector(
                  subCatLimit,
                  subCategoriesData?.pagination?.total || 0,
                  setSubCatLimit,
                  setSubCatPage
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Nama Sub Kategori</TableHead>
                      <TableHead>Kategori Induk</TableHead>
                      <TableHead>Batas Harga Rupiah</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subCategoriesData?.data?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-zinc-500">
                          Belum ada sub kategori terdaftar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      subCategoriesData?.data?.map((sc: any) => (
                        <TableRow key={sc.id}>
                          <TableCell className="font-mono font-medium">{sc.code}</TableCell>
                          <TableCell>{sc.name}</TableCell>
                          <TableCell className="text-zinc-500">
                            {sc.category?.name || sc.categoryName || "-"}
                          </TableCell>
                          <TableCell className="font-medium text-emerald-600">
                            {formatRupiah(Number(sc.priceLimit || 0))}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                onClick={() => handleOpenEditSubCategory(sc)}
                                title="Ubah Sub Kategori"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                onClick={() => handleOpenDeleteSubCategory(sc)}
                                title="Hapus Sub Kategori"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {renderBottomPagination(
                  subCatPage,
                  subCatLimit,
                  subCategoriesData?.pagination?.total || 0,
                  setSubCatPage
                )}
              </Card>
            </div>
          )}

          {/* 5. Tab Semua Barang Masuk */}
          {activeTab === "items" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
                <div className="relative w-full sm:w-72">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-zinc-400" />
                  <Input
                    placeholder="Cari barang / no surat / asal..."
                    value={itemSearch}
                    onChange={(e) => {
                      setItemSearch(e.target.value);
                      setItemPage(1);
                    }}
                    className="h-8 pl-8 text-xs"
                  />
                </div>

                <Button
                  size="sm"
                  className="h-8 text-xs gap-1 w-full sm:w-auto"
                  onClick={() => router.push("/admin/barang-masuk/tambah")}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Barang Masuk</span>
                </Button>
              </div>

              {/* Items Table Card */}
              <Card className="shadow-xs overflow-hidden">
                {renderTopLimitSelector(
                  itemLimit,
                  itemsData?.pagination?.total || 0,
                  setItemLimit,
                  setItemPage
                )}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors select-none"
                        onClick={() => handleItemSort("date")}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Tanggal</span>
                          {itemSortBy === "date" ? (
                            itemSortOrder === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-zinc-700 dark:text-zinc-300" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-zinc-700 dark:text-zinc-300" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-zinc-400" />
                          )}
                        </div>
                      </TableHead>

                      <TableHead
                        className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors select-none"
                        onClick={() => handleItemSort("name")}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Nama Barang</span>
                          {itemSortBy === "name" ? (
                            itemSortOrder === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-zinc-700 dark:text-zinc-300" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-zinc-700 dark:text-zinc-300" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-zinc-400" />
                          )}
                        </div>
                      </TableHead>

                      <TableHead>Kategori / Sub</TableHead>

                      <TableHead
                        className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors select-none"
                        onClick={() => handleItemSort("quantity")}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Jumlah</span>
                          {itemSortBy === "quantity" ? (
                            itemSortOrder === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-zinc-700 dark:text-zinc-300" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-zinc-700 dark:text-zinc-300" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-zinc-400" />
                          )}
                        </div>
                      </TableHead>

                      <TableHead
                        className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors select-none"
                        onClick={() => handleItemSort("price")}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Harga Satuan</span>
                          {itemSortBy === "price" ? (
                            itemSortOrder === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-zinc-700 dark:text-zinc-300" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-zinc-700 dark:text-zinc-300" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-zinc-400" />
                          )}
                        </div>
                      </TableHead>

                      <TableHead>Operator</TableHead>
                      <TableHead>Lampiran</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-6 text-zinc-500">
                          Belum ada catatan barang masuk.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedItems.map((item: any) => {
                        const priceNum = Number(item.price ?? item.itemPrice ?? 0);
                        const categoryName = item.category?.name ?? item.categoryName ?? "-";
                        const subCategoryName = item.subCategory?.name ?? item.subCategoryName ?? "-";
                        const attachmentFileName =
                          item.attachment?.filename ??
                          (typeof item.attachment === "string" ? item.attachment : null) ??
                          item.fileAttachment ??
                          null;

                        return (
                          <TableRow key={item.id}>
                            <TableCell className="text-zinc-500 whitespace-nowrap">
                              {item.incomingDate}
                            </TableCell>
                            <TableCell className="font-medium">{item.itemName}</TableCell>
                            <TableCell className="text-zinc-500">
                              {categoryName} &bull; {subCategoryName}
                            </TableCell>
                            <TableCell className="font-medium">{item.quantity}</TableCell>
                            <TableCell className="font-medium">
                              {formatRupiah(priceNum)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px]">
                                {item.operator?.name || item.operatorName || "Admin"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {attachmentFileName ? (
                                <a
                                  href={`${getApiBaseUrl()}/uploads/${attachmentFileName}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-600 dark:text-blue-400 text-xs hover:underline flex items-center gap-1"
                                >
                                  <span>Unduh</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </a>
                              ) : (
                                <span className="text-zinc-400 text-[11px]">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                  onClick={() => handleOpenEditItem(item)}
                                  title="Ubah Barang Masuk"
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                  onClick={() => handleOpenDeleteItem(item)}
                                  title="Hapus Barang Masuk"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>

                {renderBottomPagination(
                  itemPage,
                  itemLimit,
                  itemsData?.pagination?.total || 0,
                  setItemPage
                )}
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* MODAL 1: Tambah Pengguna */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <form onSubmit={handleCreateUser}>
            <DialogHeader>
              <DialogTitle>Tambah Pengguna Baru</DialogTitle>
              <DialogDescription>
                Buat akun dengan peran Administrator atau Operator. Password wajib minimal 8
                karakter (kombinasi huruf besar, kecil, angka).
              </DialogDescription>
            </DialogHeader>

            {userModalError && (
              <Alert variant="destructive" className="py-2.5 text-xs flex items-center justify-between my-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <AlertDescription>{userModalError}</AlertDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setUserModalError(null)}
                  className="text-xs underline text-rose-300 hover:text-white cursor-pointer ml-2 shrink-0"
                >
                  Tutup
                </button>
              </Alert>
            )}
            <div className="space-y-3 py-3">
              <div className="space-y-1">
                <Label htmlFor="u-name" className="text-xs">
                  Nama Lengkap
                </Label>
                <Input
                  id="u-name"
                  placeholder="Contoh: Budi Santoso"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="u-username" className="text-xs">
                  Username
                </Label>
                <Input
                  id="u-username"
                  placeholder="Contoh: budi123"
                  value={newUserData.username}
                  onChange={(e) =>
                    setNewUserData({ ...newUserData, username: e.target.value })
                  }
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="u-email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="u-email"
                  type="email"
                  placeholder="budi@example.com"
                  value={newUserData.email}
                  onChange={(e) =>
                    setNewUserData({ ...newUserData, email: e.target.value })
                  }
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="u-role" className="text-xs">
                  Peran (Role)
                </Label>
                <select
                  id="u-role"
                  value={newUserData.role}
                  onChange={(e) =>
                    setNewUserData({
                      ...newUserData,
                      role: e.target.value as "ADMIN" | "OPERATOR",
                    })
                  }
                  className="w-full h-8 px-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                >
                  <option value="OPERATOR">Operator</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="u-pass" className="text-xs">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="u-pass"
                    type={showUserPassword ? "text" : "password"}
                    placeholder="Min 8 karakter, kombinasi Aa1"
                    value={newUserData.password}
                    onChange={(e) =>
                      setNewUserData({ ...newUserData, password: e.target.value })
                    }
                    className="h-8 text-xs pr-8"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserPassword(!showUserPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    tabIndex={-1}
                    title={showUserPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showUserPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setIsAddUserOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs"
                disabled={createUserMutation.isPending}
              >
                {createUserMutation.isPending ? "Menyimpan..." : "Simpan Pengguna"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL EDIT PENGGUNA */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateUser}>
            <DialogHeader>
              <DialogTitle>Edit Data Pengguna</DialogTitle>
              <DialogDescription>
                Perbarui akun administrator atau operator. Password bersifat opsional (kosongkan jika tidak ingin mengubah password).
              </DialogDescription>
            </DialogHeader>

            {editUserModalError && (
              <Alert variant="destructive" className="py-2.5 text-xs flex items-center justify-between my-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <AlertDescription>{editUserModalError}</AlertDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setEditUserModalError(null)}
                  className="text-xs underline text-rose-300 hover:text-white cursor-pointer ml-2 shrink-0"
                >
                  Tutup
                </button>
              </Alert>
            )}
            <div className="space-y-3 py-3">
              <div className="space-y-1">
                <Label htmlFor="edit-u-name" className="text-xs">
                  Nama Lengkap
                </Label>
                <Input
                  id="edit-u-name"
                  placeholder="Contoh: Budi Santoso"
                  value={editUserData.name}
                  onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-u-username" className="text-xs">
                  Username
                </Label>
                <Input
                  id="edit-u-username"
                  placeholder="Contoh: budi123"
                  value={editUserData.username}
                  onChange={(e) =>
                    setEditUserData({ ...editUserData, username: e.target.value })
                  }
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-u-email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="edit-u-email"
                  type="email"
                  placeholder="budi@example.com"
                  value={editUserData.email}
                  onChange={(e) =>
                    setEditUserData({ ...editUserData, email: e.target.value })
                  }
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-u-role" className="text-xs">
                  Peran (Role)
                </Label>
                <select
                  id="edit-u-role"
                  value={editUserData.role}
                  onChange={(e) =>
                    setEditUserData({
                      ...editUserData,
                      role: e.target.value as "ADMIN" | "OPERATOR",
                    })
                  }
                  className="w-full h-8 px-2.5 text-xs rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
                >
                  <option value="ADMIN">Administrator</option>
                  <option value="OPERATOR">Operator</option>
                </select>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-u-pass" className="text-xs">
                    Password Baru (Opsional)
                  </Label>
                  <span className="text-[10px] text-zinc-400">
                    Kosongkan jika tidak diganti
                  </span>
                </div>
                <div className="relative">
                  <Input
                    id="edit-u-pass"
                    type={showEditUserPassword ? "text" : "password"}
                    placeholder="Min 8 karakter, kombinasi Aa1 (opsional)"
                    value={editUserData.password}
                    onChange={(e) =>
                      setEditUserData({ ...editUserData, password: e.target.value })
                    }
                    className="h-8 text-xs pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditUserPassword(!showEditUserPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    tabIndex={-1}
                    title={showEditUserPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showEditUserPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setIsEditUserOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs"
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Tambah Kategori */}
      <Dialog open={isAddCatOpen} onOpenChange={setIsAddCatOpen}>
        <DialogContent>
          <form onSubmit={handleCreateCategory}>
            <DialogHeader>
              <DialogTitle>Tambah Kategori Baru</DialogTitle>
              <DialogDescription>
                Kode kategori bersifat unik (maksimal 10 karakter).
              </DialogDescription>
            </DialogHeader>

            {catModalError && (
              <Alert variant="destructive" className="py-2.5 text-xs flex items-center justify-between my-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <AlertDescription>{catModalError}</AlertDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setCatModalError(null)}
                  className="text-xs underline text-rose-300 hover:text-white cursor-pointer ml-2 shrink-0"
                >
                  Tutup
                </button>
              </Alert>
            )}
            <div className="space-y-3 py-3">
              <div className="space-y-1">
                <Label htmlFor="cat-code" className="text-xs">
                  Kode Kategori
                </Label>
                <Input
                  id="cat-code"
                  placeholder="Contoh: ELEKTRONIK"
                  value={newCatData.code}
                  onChange={(e) =>
                    setNewCatData({ ...newCatData, code: e.target.value })
                  }
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cat-name" className="text-xs">
                  Nama Kategori
                </Label>
                <Input
                  id="cat-name"
                  placeholder="Contoh: Peralatan Elektronik"
                  value={newCatData.name}
                  onChange={(e) =>
                    setNewCatData({ ...newCatData, name: e.target.value })
                  }
                  className="h-8 text-xs"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setIsAddCatOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs"
                disabled={createCatMutation.isPending}
              >
                {createCatMutation.isPending ? "Menyimpan..." : "Simpan Kategori"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Tambah Sub Kategori */}
      <Dialog open={isAddSubCatOpen} onOpenChange={setIsAddSubCatOpen}>
        <DialogContent>
          <form onSubmit={handleCreateSubCategory}>
            <DialogHeader>
              <DialogTitle>Tambah Sub Kategori Baru</DialogTitle>
              <DialogDescription>
                Tentukan kategori induk dan batas harga maksimum satuan (dalam Rupiah).
              </DialogDescription>
            </DialogHeader>

            {subCatModalError && (
              <Alert variant="destructive" className="py-2.5 text-xs flex items-center justify-between my-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <AlertDescription>{subCatModalError}</AlertDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setSubCatModalError(null)}
                  className="text-xs underline text-rose-300 hover:text-white cursor-pointer ml-2 shrink-0"
                >
                  Tutup
                </button>
              </Alert>
            )}
            <div className="space-y-3 py-3">
              <div className="space-y-1">
                <Label htmlFor="sub-cat" className="text-xs">
                  Kategori Induk
                </Label>
                <select
                  id="sub-cat"
                  value={newSubCatData.categoryId}
                  onChange={(e) =>
                    setNewSubCatData({ ...newSubCatData, categoryId: e.target.value })
                  }
                  className="w-full h-8 px-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  required
                >
                  <option value="">Pilih Kategori Induk</option>
                  {allCategories?.data?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.code} - {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="sub-code" className="text-xs">
                  Kode Sub Kategori
                </Label>
                <Input
                  id="sub-code"
                  placeholder="Contoh: LAPTOP"
                  value={newSubCatData.code}
                  onChange={(e) =>
                    setNewSubCatData({ ...newSubCatData, code: e.target.value })
                  }
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sub-name" className="text-xs">
                  Nama Sub Kategori
                </Label>
                <Input
                  id="sub-name"
                  placeholder="Contoh: Laptop dan Komputer Portabel"
                  value={newSubCatData.name}
                  onChange={(e) =>
                    setNewSubCatData({ ...newSubCatData, name: e.target.value })
                  }
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sub-limit" className="text-xs">
                  Batas Harga Maksimum Satuan (Rp)
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-zinc-400 font-medium select-none pointer-events-none">
                    Rp
                  </span>
                  <Input
                    id="sub-limit"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={
                      newSubCatData.priceLimit
                        ? new Intl.NumberFormat("id-ID").format(Number(newSubCatData.priceLimit))
                        : ""
                    }
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      setNewSubCatData({
                        ...newSubCatData,
                        priceLimit: raw === "" ? 0 : Number(raw),
                      });
                    }}
                    className="h-8 text-xs pl-8 font-medium"
                    required
                  />
                </div>
                {Number(newSubCatData.priceLimit) > 0 && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Terformat: {formatRupiah(Number(newSubCatData.priceLimit))}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setIsAddSubCatOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs"
                disabled={createSubCatMutation.isPending}
              >
                {createSubCatMutation.isPending ? "Menyimpan..." : "Simpan Sub Kategori"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Ubah Kategori */}
      <Dialog open={isEditCatOpen} onOpenChange={setIsEditCatOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateCategory}>
            <DialogHeader>
              <DialogTitle>Ubah Data Kategori</DialogTitle>
              <DialogDescription>
                Perbarui kode atau nama klasifikasi kategori barang.
              </DialogDescription>
            </DialogHeader>

            {editCatModalError && (
              <Alert variant="destructive" className="py-2.5 text-xs flex items-center justify-between my-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <AlertDescription>{editCatModalError}</AlertDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setEditCatModalError(null)}
                  className="text-xs underline text-rose-300 hover:text-white cursor-pointer ml-2 shrink-0"
                >
                  Tutup
                </button>
              </Alert>
            )}
            <div className="space-y-3 py-3">
              <div className="space-y-1">
                <Label htmlFor="edit-cat-code" className="text-xs">
                  Kode Kategori
                </Label>
                <Input
                  id="edit-cat-code"
                  placeholder="Contoh: KAT-01"
                  value={editCatData.code}
                  onChange={(e) =>
                    setEditCatData({ ...editCatData, code: e.target.value })
                  }
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-cat-name" className="text-xs">
                  Nama Kategori
                </Label>
                <Input
                  id="edit-cat-name"
                  placeholder="Contoh: Elektronik & Gadget"
                  value={editCatData.name}
                  onChange={(e) =>
                    setEditCatData({ ...editCatData, name: e.target.value })
                  }
                  className="h-8 text-xs"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setIsEditCatOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs"
                disabled={updateCatMutation.isPending}
              >
                {updateCatMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Ubah Sub Kategori */}
      <Dialog open={isEditSubCatOpen} onOpenChange={setIsEditSubCatOpen}>
        <DialogContent>
          <form onSubmit={handleUpdateSubCategory}>
            <DialogHeader>
              <DialogTitle>Ubah Sub Kategori</DialogTitle>
              <DialogDescription>
                Perbarui informasi sub kategori, kategori induk, dan batas pagu harga satuan.
              </DialogDescription>
            </DialogHeader>

            {editSubCatModalError && (
              <Alert variant="destructive" className="py-2.5 text-xs flex items-center justify-between my-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <AlertDescription>{editSubCatModalError}</AlertDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setEditSubCatModalError(null)}
                  className="text-xs underline text-rose-300 hover:text-white cursor-pointer ml-2 shrink-0"
                >
                  Tutup
                </button>
              </Alert>
            )}
            <div className="space-y-3 py-3">
              <div className="space-y-1">
                <Label htmlFor="edit-sub-cat" className="text-xs">
                  Kategori Induk
                </Label>
                <select
                  id="edit-sub-cat"
                  value={editSubCatData.categoryId}
                  onChange={(e) =>
                    setEditSubCatData({ ...editSubCatData, categoryId: e.target.value })
                  }
                  className="w-full h-8 px-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer"
                  required
                >
                  <option value="">Pilih Kategori Induk</option>
                  {allCategories?.data?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.code} - {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-sub-code" className="text-xs">
                  Kode Sub Kategori
                </Label>
                <Input
                  id="edit-sub-code"
                  placeholder="Contoh: SUB-01"
                  value={editSubCatData.code}
                  onChange={(e) =>
                    setEditSubCatData({ ...editSubCatData, code: e.target.value })
                  }
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-sub-name" className="text-xs">
                  Nama Sub Kategori
                </Label>
                <Input
                  id="edit-sub-name"
                  placeholder="Contoh: Komputer & Laptop"
                  value={editSubCatData.name}
                  onChange={(e) =>
                    setEditSubCatData({ ...editSubCatData, name: e.target.value })
                  }
                  className="h-8 text-xs"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-sub-limit" className="text-xs">
                  Batas Harga Maksimum Satuan (Rp)
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs text-zinc-400 font-medium select-none pointer-events-none">
                    Rp
                  </span>
                  <Input
                    id="edit-sub-limit"
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={
                      editSubCatData.priceLimit
                        ? new Intl.NumberFormat("id-ID").format(Number(editSubCatData.priceLimit))
                        : ""
                    }
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      setEditSubCatData({
                        ...editSubCatData,
                        priceLimit: raw === "" ? 0 : Number(raw),
                      });
                    }}
                    className="h-8 text-xs pl-8 font-medium"
                    required
                  />
                </div>
                {Number(editSubCatData.priceLimit) > 0 && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Terformat: {formatRupiah(Number(editSubCatData.priceLimit))}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setIsEditSubCatOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs"
                disabled={updateSubCatMutation.isPending}
              >
                {updateSubCatMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Ubah Barang Masuk */}
      <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleUpdateItem}>
            <DialogHeader>
              <DialogTitle>Ubah Data Barang Masuk</DialogTitle>
              <DialogDescription>
                Perbarui informasi transaksi barang masuk inventaris gudang.
              </DialogDescription>
            </DialogHeader>

            {editItemModalError && (
              <Alert variant="destructive" className="py-2.5 text-xs flex items-center justify-between my-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <AlertDescription>{editItemModalError}</AlertDescription>
                </div>
                <button
                  type="button"
                  onClick={() => setEditItemModalError(null)}
                  className="text-xs underline text-rose-300 hover:text-white cursor-pointer ml-2 shrink-0"
                >
                  Tutup
                </button>
              </Alert>
            )}

            <div className="space-y-3 py-3 text-xs">
              {/* Row 1: Operator & Asal Barang */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-item-operator" className="text-xs">
                    Operator Pencatat
                  </Label>
                  <select
                    id="edit-item-operator"
                    value={editItemData.operatorId}
                    onChange={(e) =>
                      setEditItemData({ ...editItemData, operatorId: e.target.value })
                    }
                    className="w-full h-8 px-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer"
                  >
                    <option value="">Pilih Operator...</option>
                    {operatorsData?.data?.map((op: any) => (
                      <option key={op.id} value={op.id}>
                        {op.name} ({op.username})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-item-origin" className="text-xs">
                    Asal Barang
                  </Label>
                  <Input
                    id="edit-item-origin"
                    placeholder="Contoh: PT Sumber Makmur"
                    value={editItemData.itemOrigin}
                    onChange={(e) =>
                      setEditItemData({ ...editItemData, itemOrigin: e.target.value })
                    }
                    className="h-8 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Kategori & Sub Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-item-cat" className="text-xs">
                    Kategori
                  </Label>
                  <select
                    id="edit-item-cat"
                    value={editItemData.categoryId}
                    onChange={(e) => {
                      setEditItemData({
                        ...editItemData,
                        categoryId: e.target.value,
                        subCategoryId: "",
                      });
                    }}
                    className="w-full h-8 px-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer"
                    required
                  >
                    <option value="">Pilih Kategori...</option>
                    {allCategories?.data?.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.code} - {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-item-subcat" className="text-xs">
                    Sub Kategori
                  </Label>
                  <select
                    id="edit-item-subcat"
                    value={editItemData.subCategoryId}
                    onChange={(e) =>
                      setEditItemData({ ...editItemData, subCategoryId: e.target.value })
                    }
                    className="w-full h-8 px-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer"
                    required
                  >
                    <option value="">Pilih Sub Kategori...</option>
                    {comboboxSubCategories?.data?.map((sub: any) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code || "-"} {sub.name} (Max {formatRupiah(sub.priceLimit)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Nama Barang & Nomor Surat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-item-name" className="text-xs">
                    Nama Barang
                  </Label>
                  <Input
                    id="edit-item-name"
                    placeholder="Contoh: Kertas HVS A4 80gr"
                    value={editItemData.itemName}
                    onChange={(e) =>
                      setEditItemData({ ...editItemData, itemName: e.target.value })
                    }
                    className="h-8 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-item-letter" className="text-xs">
                    Nomor Surat / Faktur (Opsional)
                  </Label>
                  <Input
                    id="edit-item-letter"
                    placeholder="Contoh: SJ-2026/001"
                    value={editItemData.letterNumber}
                    onChange={(e) =>
                      setEditItemData({ ...editItemData, letterNumber: e.target.value })
                    }
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Row 4: Harga Satuan, Jumlah, Satuan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="edit-item-price" className="text-xs">
                    Harga Satuan (Rp)
                  </Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-zinc-400 font-medium select-none pointer-events-none">
                      Rp
                    </span>
                    <Input
                      id="edit-item-price"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={
                        editItemData.price
                          ? new Intl.NumberFormat("id-ID").format(Number(editItemData.price))
                          : ""
                      }
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        setEditItemData({
                          ...editItemData,
                          price: raw === "" ? 0 : Number(raw),
                        });
                      }}
                      className="h-8 text-xs pl-8 font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-item-qty" className="text-xs">
                    Jumlah
                  </Label>
                  <Input
                    id="edit-item-qty"
                    type="number"
                    min="1"
                    value={editItemData.quantity}
                    onChange={(e) =>
                      setEditItemData({
                        ...editItemData,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="h-8 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="edit-item-unit" className="text-xs">
                    Satuan
                  </Label>
                  <Input
                    id="edit-item-unit"
                    placeholder="Buah, Rim, Box..."
                    value={editItemData.unit}
                    onChange={(e) =>
                      setEditItemData({ ...editItemData, unit: e.target.value })
                    }
                    className="h-8 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Row 5: Total Akumulasi (Readonly) */}
              <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <span className="text-zinc-500 text-xs">Total Harga:</span>
                <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  {formatRupiah((editItemData.price || 0) * (editItemData.quantity || 1))}
                </span>
              </div>

              {/* Row 6: Tgl Expired & Tgl Masuk */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tanggal Kedaluwarsa (Opsional)</Label>
                  <DatePicker
                    value={editItemData.expiredDate}
                    onChange={(val) =>
                      setEditItemData({ ...editItemData, expiredDate: val })
                    }
                    placeholder="Pilih tgl expired..."
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Tanggal Masuk</Label>
                  <DatePicker
                    value={editItemData.incomingDate}
                    onChange={(val) =>
                      setEditItemData({ ...editItemData, incomingDate: val })
                    }
                    placeholder="Pilih tgl masuk..."
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setIsEditItemOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs"
                disabled={updateItemMutation.isPending}
              >
                {updateItemMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL KONFIRMASI HAPUS */}
      <Dialog
        open={deleteModalState.isOpen}
        onOpenChange={(open) =>
          setDeleteModalState((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0 text-rose-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base text-zinc-900 dark:text-zinc-100">
                  {deleteModalState.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {deleteModalState.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {deleteModalState.detail && deleteModalState.detail.length > 0 && (
            <div className="my-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-3 space-y-1.5 text-xs">
              {deleteModalState.detail.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-zinc-500">{item.label}:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() =>
                setDeleteModalState((prev) => ({ ...prev, isOpen: false }))
              }
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Ya, Hapus Data</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
