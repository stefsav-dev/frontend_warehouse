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
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  ArrowLeft,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DatePicker } from "@/components/ui/date-picker";
import { useAuthSession, useLogoutMutation } from "@/hooks/use-auth-query";
import {
  useComboboxCategories,
  useComboboxSubCategories,
  useComboboxOperators,
  useCreateIncomingItem,
  useUploadAttachment,
} from "@/hooks/use-incoming-query";

interface ItemRow {
  id: string;
  itemName: string;
  price: number | "";
  quantity: number | "";
  unit: string;
  expiredDate: string;
}

function formatNumber(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return "0";
  return new Intl.NumberFormat("id-ID").format(val);
}

export default function IncomingItemFormPage({
  roleContext,
}: {
  roleContext?: "ADMIN" | "OPERATOR";
}) {
  const router = useRouter();
  const { data: session, isLoading: isSessionLoading } = useAuthSession();
  const logoutMutation = useLogoutMutation();
  const token = session?.accessToken;

  // Protect route
  useEffect(() => {
    if (!isSessionLoading && !session) {
      router.push("/");
    }
  }, [session, isSessionLoading, router]);

  // Sidebar mobile toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // General Information States
  const [operatorId, setOperatorId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [itemOrigin, setItemOrigin] = useState("");
  const [letterNumber, setLetterNumber] = useState("");

  // Attachment states
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachedOriginalName, setAttachedOriginalName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Dynamic Item Rows (Informasi Barang)
  const [items, setItems] = useState<ItemRow[]>([
    {
      id: "row-1",
      itemName: "",
      price: "",
      quantity: 1,
      unit: "Buah",
      expiredDate: "",
    },
  ]);

  // Form submission feedback
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const { data: operatorsData } = useComboboxOperators(token);
  const { data: categoriesData } = useComboboxCategories(token);
  const { data: subCategoriesData } = useComboboxSubCategories(
    token,
    categoryId || undefined
  );

  // Mutations
  const createItemMutation = useCreateIncomingItem(token);
  const uploadMutation = useUploadAttachment(token);

  // Default operator initialization
  useEffect(() => {
    if (session?.user) {
      if (session.user.role === "OPERATOR") {
        setOperatorId(session.user.id);
      } else if (operatorsData?.data && operatorsData.data.length > 0 && !operatorId) {
        setOperatorId(operatorsData.data[0].id);
      }
    }
  }, [session, operatorsData, operatorId]);

  // Category change handler
  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
    setSubCategoryId("");
  };

  // Find selected subcategory to get priceLimit
  const selectedSub = subCategoriesData?.data?.find(
    (s: any) => s.id === subCategoryId
  );
  const priceLimitNum = selectedSub ? Number(selectedSub.priceLimit) : 0;

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["doc", "docx", "zip"].includes(ext || "")) {
      setUploadError("Hanya file .doc, .docx, atau .zip yang diizinkan.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Ukuran file maksimal 10 MB.");
      return;
    }

    setIsUploading(true);
    uploadMutation.mutate(file, {
      onSuccess: (res: any) => {
        setIsUploading(false);
        if (res.success && res.data?.filename) {
          setAttachedFileName(res.data.filename);
          setAttachedOriginalName(res.data.originalName || file.name);
        } else {
          setUploadError(res.message || "Gagal mengunggah lampiran.");
        }
      },
      onError: (err: Error) => {
        setIsUploading(false);
        setUploadError(err.message || "Gagal mengunggah file.");
      },
    });
  };

  // Add Item Row
  const handleAddRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        itemName: "",
        price: "",
        quantity: 1,
        unit: "Buah",
        expiredDate: "",
      },
    ]);
  };

  // Remove Item Row
  const handleRemoveRow = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Update Item Row Field
  const handleItemChange = (
    id: string,
    field: keyof ItemRow,
    value: any
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Submit all items
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // 1. Validasi Umum
    if (!operatorId) {
      setFeedback({ type: "error", text: "Operator wajib dipilih." });
      return;
    }
    if (!categoryId) {
      setFeedback({ type: "error", text: "Kategori wajib dipilih." });
      return;
    }
    if (!subCategoryId) {
      setFeedback({ type: "error", text: "Sub Kategori wajib dipilih." });
      return;
    }
    if (!itemOrigin.trim()) {
      setFeedback({ type: "error", text: "Asal Barang wajib diisi." });
      return;
    }

    // 2. Validasi Item Rows
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.itemName.trim()) {
        setFeedback({
          type: "error",
          text: `Nama Barang pada baris ${i + 1} tidak boleh kosong.`,
        });
        return;
      }
      const priceNum = Number(it.price || 0);
      if (priceNum <= 0) {
        setFeedback({
          type: "error",
          text: `Harga barang '${it.itemName}' pada baris ${i + 1} harus lebih dari Rp 0.`,
        });
        return;
      }
      if (priceLimitNum > 0 && priceNum > priceLimitNum) {
        setFeedback({
          type: "error",
          text: `Harga barang '${it.itemName}' (Rp ${formatNumber(
            priceNum
          )}) melebihi Batas Harga sub kategori (Rp ${formatNumber(priceLimitNum)}).`,
        });
        return;
      }
      const qtyNum = Number(it.quantity || 0);
      if (qtyNum < 1) {
        setFeedback({
          type: "error",
          text: `Jumlah barang '${it.itemName}' pada baris ${i + 1} minimal 1.`,
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Submit each item row
      for (const it of items) {
        const payload = {
          operatorId: operatorId || undefined,
          categoryId,
          subCategoryId,
          itemOrigin: itemOrigin.trim(),
          letterNumber: letterNumber.trim() || undefined,
          attachment: attachedFileName || undefined,
          attachmentOriginalName: attachedOriginalName || undefined,
          itemName: it.itemName.trim(),
          price: Number(it.price),
          quantity: Number(it.quantity),
          unit: it.unit.trim() || "Buah",
          expiredDate: it.expiredDate || undefined,
          incomingDate: new Date().toISOString().split("T")[0],
        };

        const res = await createItemMutation.mutateAsync(payload);
        if (!res.success) {
          throw new Error(res.message || "Gagal menyimpan barang masuk.");
        }
      }

      setFeedback({
        type: "success",
        text: `Berhasil mencatat ${items.length} data barang masuk ke sistem. Mengalihkan...`,
      });

      setTimeout(() => {
        if (session?.user?.role === "ADMIN") {
          router.push("/admin?tab=items");
        } else {
          router.push("/operator?tab=items");
        }
      }, 1200);
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.message || "Terjadi kesalahan saat menyimpan data.",
      });
      setIsSubmitting(false);
    }
  };

  // Back destination
  const handleBack = () => {
    if (session?.user?.role === "ADMIN") {
      router.push("/admin?tab=items");
    } else {
      router.push("/operator?tab=items");
    }
  };

  const handleLogout = () => {
    if (session?.refreshToken) {
      logoutMutation.mutate(session.refreshToken, {
        onSuccess: () => router.push("/"),
      });
    } else {
      router.push("/");
    }
  };

  if (isSessionLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  const userRole = session.user.role;
  const userName = session.user.name || "User";
  const userInitials = userName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Navigation Items for Sidebar
  const adminNavItems = [
    { id: "overview", label: "Ringkasan", icon: LayoutDashboard, href: "/admin?tab=overview" },
    { id: "users", label: "Manajemen Pengguna", icon: Users, href: "/admin?tab=users" },
    { id: "categories", label: "Master Kategori", icon: FolderTree, href: "/admin?tab=categories" },
    { id: "subcategories", label: "Master Sub Kategori", icon: Layers, href: "/admin?tab=subcategories" },
    { id: "items", label: "Semua Barang Masuk", icon: Boxes, href: "/admin?tab=items" },
  ];

  const operatorNavItems = [
    { id: "items", label: "Barang Masuk", icon: Boxes, href: "/operator?tab=items" },
    { id: "overview", label: "Ringkasan Operasional", icon: LayoutDashboard, href: "/operator?tab=overview" },
  ];

  const currentNavItems = userRole === "ADMIN" ? adminNavItems : operatorNavItems;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-md bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center">
            <Package2 className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-sm">Warehouse App</span>
            <Badge
              variant={userRole === "ADMIN" ? "default" : "secondary"}
              className="ml-1.5 text-[9px] h-4 px-1 font-normal"
            >
              {userRole === "ADMIN" ? "ADMIN" : "OPERATOR"}
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

      {/* ================= SIDEBAR (MASIH TERLIHAT) ================= */}
      <aside
        className={`${
          isMobileMenuOpen ? "block" : "hidden"
        } md:flex flex-col w-full md:w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 shrink-0 md:min-h-screen z-20`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/80 hidden md:flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center">
            <Package2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm">Warehouse App</span>
              <Badge
                variant={userRole === "ADMIN" ? "default" : "secondary"}
                className="text-[9px] h-4 px-1 font-normal"
              >
                {userRole === "ADMIN" ? "ADMIN" : "OPERATOR"}
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-500">
              {userRole === "ADMIN" ? "Panel Administrator" : "Panel Operator"}
            </p>
          </div>
        </div>

        {/* Menu Navigasi */}
        <nav className="p-3 space-y-1 flex-1">
          {currentNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === "items"; // Aktif pada Barang Masuk
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  router.push(item.href);
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

        {/* User Card & Logout */}
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

      {/* ================= AREA KONTEN UTAMA ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar (Sesuai Gambar 2) */}
        <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 rounded text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
                Warehouse App
              </span>
              <span className="text-zinc-400 dark:text-zinc-600 text-xs">/</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Tambah Barang Masuk
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Lonceng Notifikasi */}
            <div className="relative cursor-pointer text-zinc-500 hover:text-zinc-800 dark:text-zinc-400">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500" />
            </div>

            {/* Badge Profil Pengguna */}
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <div className="h-8 w-8 rounded-full bg-[#1b6b93] text-white flex items-center justify-center text-xs font-semibold">
                {userInitials || "AD"}
              </div>
              <div className="hidden sm:block text-left text-xs leading-tight">
                <div className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                  <span>{userName}</span>
                  <ChevronDown className="h-3 w-3 text-zinc-400" />
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {userRole === "ADMIN" ? "Administrator" : "Operator"}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Konten Formulir */}
        <main className="flex-1 p-4 sm:p-6 max-w-5xl w-full mx-auto space-y-5">
          {/* Feedback Alert */}
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

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* CARD UTAMA: INFORMASI UMUM & INFORMASI BARANG */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xs overflow-hidden">
              {/* ================= SECTION 1: INFORMASI UMUM ================= */}
              <div className="border-b border-zinc-200 dark:border-zinc-800">
                <div className="px-5 py-3 bg-[#fbfcfd] dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200">
                    INFORMASI UMUM
                  </h2>
                </div>

                <div className="p-5 space-y-4">
                  {/* Operator Selector */}
                  <div className="space-y-1.5">
                    <Label htmlFor="form-operator" className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                      Operator
                    </Label>
                    <select
                      id="form-operator"
                      value={operatorId}
                      onChange={(e) => setOperatorId(e.target.value)}
                      disabled={userRole === "OPERATOR"}
                      className="w-full sm:w-1/2 h-8 px-2.5 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 disabled:opacity-75 disabled:bg-zinc-100 dark:disabled:bg-zinc-800 cursor-pointer"
                      required
                    >
                      <option value="">Pilih Operator...</option>
                      {userRole === "OPERATOR" && session?.user && !operatorsData?.data?.some((op: any) => op.id === session.user.id) && (
                        <option value={session.user.id}>
                          {session.user.name} ({session.user.username})
                        </option>
                      )}
                      {operatorsData?.data?.map((op: any) => (
                        <option key={op.id} value={op.id}>
                          {op.name} ({op.username})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kategori Selector */}
                  <div className="space-y-1.5">
                    <Label htmlFor="form-kategori" className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                      Kategori
                    </Label>
                    <select
                      id="form-kategori"
                      value={categoryId}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full sm:w-1/2 h-8 px-2.5 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer"
                      required
                    >
                      <option value="">Pilih Kategori...</option>
                      {categoriesData?.data?.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sub Kategori & Batas Harga (2 Kolom) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="form-sub-kategori" className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                        Sub Kategori
                      </Label>
                      <select
                        id="form-sub-kategori"
                        value={subCategoryId}
                        onChange={(e) => setSubCategoryId(e.target.value)}
                        disabled={!categoryId}
                        className="w-full h-8 px-2.5 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 disabled:bg-zinc-100 dark:disabled:bg-zinc-800 cursor-pointer"
                        required
                      >
                        <option value="">
                          {categoryId ? "Pilih Sub Kategori..." : "Pilih Kategori terlebih dahulu"}
                        </option>
                        {subCategoriesData?.data?.map((sc: any) => (
                          <option key={sc.id} value={sc.id}>
                            {sc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="form-batas-harga" className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                        Batas Harga
                      </Label>
                      <Input
                        id="form-batas-harga"
                        value={priceLimitNum > 0 ? formatNumber(priceLimitNum) : "-"}
                        readOnly
                        disabled
                        className="h-8 text-xs bg-zinc-50 dark:bg-zinc-800/50 font-medium text-zinc-700 dark:text-zinc-300"
                      />
                    </div>
                  </div>

                  {/* Asal Barang (Full Width) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="form-asal-barang" className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                      Asal Barang
                    </Label>
                    <Input
                      id="form-asal-barang"
                      placeholder="Contoh: PT Sumber Rezeki Logistik"
                      value={itemOrigin}
                      onChange={(e) => setItemOrigin(e.target.value)}
                      className="h-8 text-xs"
                      required
                    />
                  </div>

                  {/* Nomor Surat & Lampiran (2 Kolom) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="form-nomor-surat" className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                        Nomor Surat
                      </Label>
                      <Input
                        id="form-nomor-surat"
                        placeholder="Contoh: SJ-2026/04/001"
                        value={letterNumber}
                        onChange={(e) => setLetterNumber(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="form-lampiran" className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                        Lampiran
                      </Label>
                      <div className="flex items-center gap-2">
                        <label className="h-8 px-3 text-xs rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-medium flex items-center justify-center cursor-pointer shrink-0">
                          <span>Choose File</span>
                          <input
                            id="form-lampiran"
                            type="file"
                            accept=".doc,.docx,.zip"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={isUploading}
                          />
                        </label>
                        <span className="text-xs text-zinc-500 truncate flex-1">
                          {isUploading
                            ? "Mengunggah file..."
                            : attachedOriginalName || "No file chosen"}
                        </span>
                      </div>
                      {uploadError && (
                        <p className="text-[11px] text-rose-500 mt-1">{uploadError}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= SECTION 2: INFORMASI BARANG ================= */}
              <div>
                <div className="px-5 py-3 bg-[#fbfcfd] dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200">
                    INFORMASI BARANG
                  </h2>
                </div>

                <div className="p-5 overflow-x-auto min-h-[360px] pb-32">
                  {/* Header Kolom Barang */}
                  <div className="min-w-[760px] grid grid-cols-12 gap-3 pb-2 text-xs font-medium text-slate-700 dark:text-zinc-300">
                    <div className="col-span-3">Nama Barang</div>
                    <div className="col-span-2">Harga (Rp.)</div>
                    <div className="col-span-1">Jumlah</div>
                    <div className="col-span-1">Satuan</div>
                    <div className="col-span-2">Total</div>
                    <div className="col-span-2">Tgl. Ekspired</div>
                    <div className="col-span-1 text-center">Aksi</div>
                  </div>

                  {/* Baris-Baris Barang Dinamis */}
                  <div className="min-w-[760px] space-y-2.5">
                    {items.map((it, idx) => {
                      const priceNum = Number(it.price || 0);
                      const qtyNum = Number(it.quantity || 0);
                      const totalNum = priceNum * qtyNum;
                      const isExceedLimit = priceLimitNum > 0 && priceNum > priceLimitNum;

                      return (
                        <div
                          key={it.id}
                          className="grid grid-cols-12 gap-3 items-center"
                        >
                          {/* 1. Nama Barang */}
                          <div className="col-span-3">
                            <Input
                              placeholder="Nama barang..."
                              value={it.itemName}
                              onChange={(e) =>
                                handleItemChange(it.id, "itemName", e.target.value)
                              }
                              className="h-8 text-xs"
                              required
                            />
                          </div>

                          {/* 2. Harga (Rp.) */}
                          <div className="col-span-2 relative">
                            <Input
                              type="text"
                              inputMode="numeric"
                              placeholder="0"
                              value={it.price === "" ? "" : formatNumber(Number(it.price))}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, "");
                                handleItemChange(
                                  it.id,
                                  "price",
                                  raw === "" ? "" : Number(raw)
                                );
                              }}
                              className={`h-8 text-xs pr-7 text-right ${
                                isExceedLimit
                                  ? "border-rose-500 focus-visible:ring-rose-500"
                                  : ""
                              }`}
                              required
                            />
                            <span className="absolute right-2.5 top-2 text-[10px] text-zinc-400 pointer-events-none">
                              Rp.
                            </span>
                          </div>

                          {/* 3. Jumlah */}
                          <div className="col-span-1">
                            <Input
                              type="number"
                              min="1"
                              value={it.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  it.id,
                                  "quantity",
                                  e.target.value === "" ? "" : Number(e.target.value)
                                )
                              }
                              className="h-8 text-xs"
                              required
                            />
                          </div>

                          {/* 4. Satuan */}
                          <div className="col-span-1">
                            <Input
                              value={it.unit}
                              onChange={(e) =>
                                handleItemChange(it.id, "unit", e.target.value)
                              }
                              className="h-8 text-xs"
                              placeholder="Buah"
                              required
                            />
                          </div>

                          {/* 5. Total (Readonly) */}
                          <div className="col-span-2 relative">
                            <Input
                              value={totalNum > 0 ? formatNumber(totalNum) : ""}
                              readOnly
                              disabled
                              placeholder="0"
                              className="h-8 text-xs bg-zinc-50 dark:bg-zinc-800/50 pr-7 font-medium"
                            />
                            <span className="absolute right-2.5 top-2 text-[10px] text-zinc-400 pointer-events-none">
                              Rp.
                            </span>
                          </div>

                          {/* 6. Tgl. Ekspired */}
                          <div className="col-span-2">
                            <DatePicker
                              value={it.expiredDate}
                              onChange={(val) =>
                                handleItemChange(it.id, "expiredDate", val)
                              }
                              placeholder="Pilih tanggal..."
                              align="right"
                            />
                          </div>

                          {/* 7. Action Button (+ / X) */}
                          <div className="col-span-1 flex items-center justify-center">
                            {idx === 0 ? (
                              <button
                                type="button"
                                onClick={handleAddRow}
                                title="Tambah baris barang"
                                className="h-7 w-7 rounded-full border border-blue-400 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(it.id)}
                                title="Hapus baris ini"
                                className="h-7 w-7 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. TOMBOL AKSI DI BAWAH (Kembali & Simpan) */}
            <div className="flex items-center gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="h-8 px-4 text-xs font-medium gap-1.5 bg-white dark:bg-zinc-900"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Kembali</span>
              </Button>

              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || isUploading}
                className="h-8 px-5 text-xs font-medium bg-[#24638a] hover:bg-[#1d5272] text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan</span>
                )}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
