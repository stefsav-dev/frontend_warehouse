"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Package2,
  LayoutDashboard,
  Boxes,
  Plus,
  Trash2,
  Search,
  LogOut,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Menu,
  X,
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
  useIncomingItems,
  useComboboxCategories,
  useComboboxSubCategories,
  useCreateIncomingItem,
  useDeleteIncomingItem,
  useUploadAttachment,
} from "@/hooks/use-incoming-query";
import { getApiBaseUrl } from "@/lib/api";

function formatRupiah(amount: number) {
  if (isNaN(amount) || amount === null || amount === undefined) return "Rp 0";
  return "Rp " + new Intl.NumberFormat("id-ID").format(amount);
}

export default function OperatorPage() {
  const router = useRouter();
  const { data: session, isLoading: isSessionLoading } = useAuthSession();
  const logoutMutation = useLogoutMutation();

  const [activeTab, setActiveTab] = useState<"items" | "overview">("items");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync activeTab from URL search params if provided (e.g. ?tab=overview)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab && ["items", "overview"].includes(tab)) {
        setActiveTab(tab as any);
      }
    }
  }, []);

  // Pagination & Limit States (5, 10, 25, 50, 100)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  // Sorting States
  const [sortBy, setSortBy] = useState<"date" | "name" | "origin" | "quantity" | "price">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Search & Filter
  const [search, setSearch] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [selectedYearFilter, setSelectedYearFilter] = useState("");

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteItemState, setDeleteItemState] = useState<{
    isOpen: boolean;
    id: string;
    itemName: string;
    itemOrigin: string;
    quantity: number;
  }>({
    isOpen: false,
    id: "",
    itemName: "",
    itemOrigin: "",
    quantity: 0,
  });

  // Form Input States
  const [itemName, setItemName] = useState("");
  const [itemOrigin, setItemOrigin] = useState("");
  const [letterNumber, setLetterNumber] = useState("");
  const [incomingDate, setIncomingDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [itemPrice, setItemPrice] = useState<number>(0);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const token = session?.accessToken;

  // Protect route
  useEffect(() => {
    if (!isSessionLoading && !session) {
      router.push("/");
    }
  }, [session, isSessionLoading, router]);

  // Queries
  const { data: itemsData, refetch: refetchItems } = useIncomingItems(token, {
    page,
    limit,
    search: search || undefined,
    categoryId: selectedCategoryFilter || undefined,
    year: selectedYearFilter || undefined,
    operatorId: session?.user?.role === "OPERATOR" ? session.user.id : undefined,
  });

  const { data: comboboxCategories } = useComboboxCategories(token);
  const { data: comboboxSubCategories } = useComboboxSubCategories(
    token,
    categoryId || undefined
  );

  // Mutations
  const createItemMutation = useCreateIncomingItem(token);
  const deleteItemMutation = useDeleteIncomingItem(token);
  const uploadMutation = useUploadAttachment(token);

  if (isSessionLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  // Selected sub category price limit
  const selectedSub = comboboxSubCategories?.data?.find(
    (s: any) => s.id === subCategoryId
  );
  const priceLimitNum = selectedSub ? Number(selectedSub.priceLimit) : 0;
  const isOverPriceLimit = priceLimitNum > 0 && itemPrice > priceLimitNum;

  const calculatedTotal = (quantity || 0) * (itemPrice || 0);

  // Upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileUploadError(null);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["doc", "docx", "zip"].includes(ext || "")) {
      setFileUploadError("Format file harus .doc, .docx, atau .zip.");
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadMutation.mutateAsync(file);
      if (res.success && res.data?.fileName) {
        setAttachedFileName(res.data.fileName);
      } else {
        setFileUploadError(res.message || "Gagal mengunggah file.");
      }
    } catch (err: any) {
      setFileUploadError(err.message || "Gagal mengunggah file lampiran.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (isOverPriceLimit) {
      setFeedback({
        type: "error",
        text: `Harga satuan (${formatRupiah(itemPrice)}) melebihi batas harga sub kategori (${formatRupiah(priceLimitNum)}).`,
      });
      return;
    }

    createItemMutation.mutate(
      {
        itemName,
        itemOrigin,
        letterNumber,
        incomingDate,
        categoryId,
        subCategoryId,
        quantity: Number(quantity),
        itemPrice: Number(itemPrice),
        fileAttachment: attachedFileName,
      },
      {
        onSuccess: (res: any) => {
          if (res.success) {
            setIsAddOpen(false);
            setItemName("");
            setItemOrigin("");
            setLetterNumber("");
            setCategoryId("");
            setSubCategoryId("");
            setQuantity(1);
            setItemPrice(0);
            setAttachedFileName(null);
            setFeedback({
              type: "success",
              text: "Data barang masuk berhasil dicatat.",
            });
            refetchItems();
          } else {
            setFeedback({
              type: "error",
              text: res.message || "Gagal mencatat barang masuk.",
            });
          }
        },
        onError: (err: Error) => {
          setFeedback({ type: "error", text: err.message });
        },
      }
    );
  };

  const handleLogout = () => {
    logoutMutation.mutate(session.refreshToken, {
      onSuccess: () => router.push("/"),
    });
  };

  // Toggle sorting column
  const handleSort = (column: "date" | "name" | "origin" | "quantity" | "price") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Sorting logic on items
  const rawItems = itemsData?.data || [];
  const sortedItems = [...rawItems].sort((a: any, b: any) => {
    let valA: any;
    let valB: any;

    if (sortBy === "name") {
      valA = (a.itemName || "").toLowerCase();
      valB = (b.itemName || "").toLowerCase();
      return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    if (sortBy === "origin") {
      valA = (a.itemOrigin || "").toLowerCase();
      valB = (b.itemOrigin || "").toLowerCase();
      return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    if (sortBy === "quantity") {
      valA = Number(a.quantity || 0);
      valB = Number(b.quantity || 0);
    } else if (sortBy === "price") {
      valA = Number(a.price ?? a.itemPrice ?? 0);
      valB = Number(b.price ?? b.itemPrice ?? 0);
    } else {
      // date
      valA = new Date(a.incomingDate || a.createdAt || 0).getTime();
      valB = new Date(b.incomingDate || b.createdAt || 0).getTime();
    }

    return sortOrder === "asc" ? valA - valB : valB - valA;
  });

  // Pagination details
  const totalCount = itemsData?.pagination?.total || 0;
  const totalPages = itemsData?.pagination?.totalPages || Math.ceil(totalCount / limit) || 1;

  const totalQuantity =
    rawItems.reduce((acc: number, curr: any) => acc + Number(curr.quantity || 0), 0) || 0;

  const navItems = [
    { id: "items", label: "Barang Masuk", icon: Boxes },
    { id: "overview", label: "Ringkasan Operasional", icon: LayoutDashboard },
  ] as const;

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
            <Badge variant="secondary" className="ml-1.5 text-[9px] h-4 px-1 font-normal">
              OPERATOR
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

      {/* SIDEBAR OPERATOR */}
      <aside
        className={`${
          isMobileMenuOpen ? "block" : "hidden"
        } md:flex flex-col w-full md:w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 shrink-0 md:min-h-screen z-20`}
      >
        {/* Brand Header di Sidebar Desktop */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/80 hidden md:flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center">
            <Package2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm">Warehouse App</span>
              <Badge variant="secondary" className="text-[9px] h-4 px-1 font-normal">
                OPERATOR
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-500">Panel Operator Gudang</p>
          </div>
        </div>

        {/* Menu Navigasi Sidebar */}
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

        {/* Footer Sidebar: User Profile & Logout */}
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
          {/* Header Konten */}
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {activeTab === "items" && "Pencatatan Barang Masuk"}
              {activeTab === "overview" && "Ringkasan Operasional"}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {activeTab === "items" &&
                "Kelola dan input penerimaan barang inventaris ke dalam gudang."}
              {activeTab === "overview" &&
                "Statistik ringkas aktivitas pencatatan barang oleh akun Anda."}
            </p>
          </div>

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

          {/* 1. Tab Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="shadow-xs">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">Catatan Barang Masuk</CardDescription>
                    <CardTitle className="text-2xl font-semibold">{totalCount}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-[11px] text-zinc-500">
                    Total transaksi barang yang telah Anda catat
                  </CardContent>
                </Card>

                <Card className="shadow-xs">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs">
                      Total Unit Barang (Kuantitas)
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold">{totalQuantity}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-[11px] text-zinc-500">
                    Total akumulasi fisik unit barang yang masuk
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-xs">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Informasi Operator</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    Setiap barang masuk yang Anda input otomatis terikat dengan akun Anda sebagai
                    operator pencatat. Lampirkan dokumen jalan atau tanda terima berekstensi .doc,
                    .docx, atau .zip bila tersedia.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* 2. Tab Barang Masuk */}
          {activeTab === "items" && (
            <div className="space-y-4">
              {/* Filter & Tombol Catat Barang */}
              <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-60">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-zinc-400" />
                    <Input
                      placeholder="Cari barang / no surat / asal..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className="h-8 pl-8 text-xs"
                    />
                  </div>

                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => {
                      setSelectedCategoryFilter(e.target.value);
                      setPage(1);
                    }}
                    className="h-8 px-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  >
                    <option value="">Semua Kategori</option>
                    {comboboxCategories?.data?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedYearFilter}
                    onChange={(e) => {
                      setSelectedYearFilter(e.target.value);
                      setPage(1);
                    }}
                    className="h-8 px-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  >
                    <option value="">Semua Tahun</option>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>

                <Button
                  size="sm"
                  className="h-8 text-xs gap-1 w-full sm:w-auto"
                  onClick={() => router.push("/operator/barang-masuk/tambah")}
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Catat Barang Masuk</span>
                </Button>
              </div>

              {/* Tabel Barang Masuk Operator */}
              <Card className="shadow-xs overflow-hidden">
                {/* SELECTOR LIMIT DATA (DI ATAS TABEL) */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-b border-zinc-200 dark:border-zinc-800 text-xs bg-zinc-50/50 dark:bg-zinc-900/50">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-500">Tampilkan:</span>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
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
                    Total: <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">{totalCount}</strong> data
                  </span>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors select-none"
                        onClick={() => handleSort("date")}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Tanggal</span>
                          {sortBy === "date" ? (
                            sortOrder === "asc" ? (
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
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Nama Barang</span>
                          {sortBy === "name" ? (
                            sortOrder === "asc" ? (
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
                        onClick={() => handleSort("origin")}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Asal Barang</span>
                          {sortBy === "origin" ? (
                            sortOrder === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-zinc-700 dark:text-zinc-300" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-zinc-700 dark:text-zinc-300" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-zinc-400" />
                          )}
                        </div>
                      </TableHead>

                      <TableHead>No. Surat</TableHead>
                      <TableHead>Kategori / Sub</TableHead>

                      <TableHead
                        className="cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors select-none"
                        onClick={() => handleSort("quantity")}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Jumlah</span>
                          {sortBy === "quantity" ? (
                            sortOrder === "asc" ? (
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
                        onClick={() => handleSort("price")}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>Harga Satuan</span>
                          {sortBy === "price" ? (
                            sortOrder === "asc" ? (
                              <ArrowUp className="h-3 w-3 text-zinc-700 dark:text-zinc-300" />
                            ) : (
                              <ArrowDown className="h-3 w-3 text-zinc-700 dark:text-zinc-300" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3 w-3 text-zinc-400" />
                          )}
                        </div>
                      </TableHead>

                      <TableHead>Lampiran</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-zinc-500">
                          Belum ada data barang masuk yang sesuai. Klik &quot;Catat Barang
                          Masuk&quot; untuk menambah data.
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
                            <TableCell className="text-zinc-500">{item.itemOrigin}</TableCell>
                            <TableCell className="font-mono text-[11px]">
                              {item.letterNumber || "-"}
                            </TableCell>
                            <TableCell className="text-zinc-500">
                              {categoryName} &bull; {subCategoryName}
                            </TableCell>
                            <TableCell className="font-medium">{item.quantity}</TableCell>
                            <TableCell className="font-medium">
                              {formatRupiah(priceNum)}
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
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                onClick={() =>
                                  setDeleteItemState({
                                    isOpen: true,
                                    id: item.id,
                                    itemName: item.itemName,
                                    itemOrigin: item.itemOrigin,
                                    quantity: item.quantity,
                                  })
                                }
                                title="Hapus Catatan Barang"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>

                {/* PAGINATION (DI BAWAH TABEL) */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 border-t border-zinc-200 dark:border-zinc-800 text-xs bg-zinc-50/50 dark:bg-zinc-900/50">
                  <span className="text-zinc-500">
                    Menampilkan{" "}
                    <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">
                      {totalCount === 0 ? 0 : (page - 1) * limit + 1} -{" "}
                      {Math.min(page * limit, totalCount)}
                    </strong>{" "}
                    dari{" "}
                    <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">
                      {totalCount}
                    </strong>{" "}
                    data
                  </span>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs"
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft className="h-3 w-3 mr-1" />
                      Sebelumnya
                    </Button>

                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                        .map((p, idx, arr) => {
                          const prevPage = arr[idx - 1];
                          return (
                            <React.Fragment key={p}>
                              {prevPage && p - prevPage > 1 && (
                                <span className="px-1 text-zinc-400">...</span>
                              )}
                              <Button
                                variant={page === p ? "default" : "outline"}
                                size="sm"
                                className="h-7 w-7 p-0 text-xs"
                                onClick={() => setPage(p)}
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
                      onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={page >= totalPages}
                    >
                      Selanjutnya
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: Form Catat Barang Masuk */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle>Catat Penerimaan Barang Masuk</DialogTitle>
              <DialogDescription>
                Operator otomatis tercatat atas nama akun Anda. Pastikan harga satuan tidak
                melebihi batas harga sub kategori.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-3">
              {/* Nama Barang */}
              <div className="space-y-1">
                <Label htmlFor="in-name" className="text-xs">
                  Nama Barang
                </Label>
                <Input
                  id="in-name"
                  placeholder="Contoh: Laptop ThinkPad T14"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="h-8 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Asal Barang */}
                <div className="space-y-1">
                  <Label htmlFor="in-origin" className="text-xs">
                    Asal Barang (Vendor / Supplier)
                  </Label>
                  <Input
                    id="in-origin"
                    placeholder="Contoh: PT Sumber Rezeki Logistik"
                    value={itemOrigin}
                    onChange={(e) => setItemOrigin(e.target.value)}
                    className="h-8 text-xs"
                    required
                  />
                </div>

                {/* Nomor Surat Jalan */}
                <div className="space-y-1">
                  <Label htmlFor="in-letter" className="text-xs">
                    Nomor Surat Jalan
                  </Label>
                  <Input
                    id="in-letter"
                    placeholder="Contoh: SJ-2026/04/001"
                    value={letterNumber}
                    onChange={(e) => setLetterNumber(e.target.value)}
                    className="h-8 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Tanggal Masuk */}
                <div className="space-y-1">
                  <Label htmlFor="in-date" className="text-xs">
                    Tanggal Masuk
                  </Label>
                  <Input
                    id="in-date"
                    type="date"
                    value={incomingDate}
                    onChange={(e) => setIncomingDate(e.target.value)}
                    className="h-8 text-xs"
                    required
                  />
                </div>

                {/* Kategori */}
                <div className="space-y-1">
                  <Label htmlFor="in-cat" className="text-xs">
                    Kategori
                  </Label>
                  <select
                    id="in-cat"
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      setSubCategoryId("");
                    }}
                    className="w-full h-8 px-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    {comboboxCategories?.data?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub Kategori */}
                <div className="space-y-1">
                  <Label htmlFor="in-subcat" className="text-xs">
                    Sub Kategori
                  </Label>
                  <select
                    id="in-subcat"
                    value={subCategoryId}
                    onChange={(e) => setSubCategoryId(e.target.value)}
                    className="w-full h-8 px-2 text-xs rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                    disabled={!categoryId}
                    required
                  >
                    <option value="">Pilih Sub Kategori</option>
                    {comboboxSubCategories?.data?.map((sc: any) => (
                      <option key={sc.id} value={sc.id}>
                        {sc.name} (Max {sc.formattedPriceLimit || formatRupiah(Number(sc.priceLimit))})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Info Batas Harga */}
              {selectedSub && (
                <div className="text-[11px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800/60 p-2 rounded">
                  Batas maksimum harga satuan untuk <strong>{selectedSub.name}</strong> adalah{" "}
                  <strong className="text-emerald-600">{formatRupiah(priceLimitNum)}</strong>.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Kuantitas */}
                <div className="space-y-1">
                  <Label htmlFor="in-qty" className="text-xs">
                    Jumlah Barang (Kuantitas)
                  </Label>
                  <Input
                    id="in-qty"
                    type="number"
                    min="1"
                    value={quantity || ""}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="h-8 text-xs"
                    required
                  />
                </div>

                {/* Harga Satuan */}
                <div className="space-y-1">
                  <Label htmlFor="in-price" className="text-xs">
                    Harga Satuan (Rp)
                  </Label>
                  <Input
                    id="in-price"
                    type="number"
                    min="0"
                    value={itemPrice || ""}
                    onChange={(e) => setItemPrice(Math.max(0, Number(e.target.value)))}
                    className={`h-8 text-xs ${
                      isOverPriceLimit ? "border-rose-500 focus-visible:ring-rose-500" : ""
                    }`}
                    required
                  />
                  {isOverPriceLimit && (
                    <p className="text-[10px] text-rose-600 flex items-center gap-1 mt-0.5">
                      <ShieldAlert className="h-3 w-3" />
                      Melebihi batas harga maksimum ({formatRupiah(priceLimitNum)})
                    </p>
                  )}
                </div>
              </div>

              {/* Total Harga Otomatis */}
              <div className="bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded border border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-xs">
                <span className="text-zinc-500">Total Nilai Transaksi:</span>
                <span className="font-semibold text-emerald-600 text-sm">
                  {formatRupiah(calculatedTotal)}
                </span>
              </div>

              {/* File Lampiran */}
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="in-file" className="text-xs">
                  Upload Dokumen Lampiran (.doc, .docx, .zip)
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="in-file"
                    type="file"
                    accept=".doc,.docx,.zip"
                    onChange={handleFileChange}
                    className="h-8 text-xs file:text-xs"
                    disabled={isUploading}
                  />
                  {isUploading && (
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400 shrink-0" />
                  )}
                </div>
                {attachedFileName && (
                  <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Lampiran tersimpan: {attachedFileName}
                  </p>
                )}
                {fileUploadError && (
                  <p className="text-[11px] text-rose-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {fileUploadError}
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
                onClick={() => setIsAddOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs"
                disabled={createItemMutation.isPending || isUploading || isOverPriceLimit}
              >
                {createItemMutation.isPending ? "Menyimpan..." : "Simpan Barang Masuk"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL KONFIRMASI HAPUS BARANG */}
      <Dialog
        open={deleteItemState.isOpen}
        onOpenChange={(open) =>
          setDeleteItemState((prev) => ({ ...prev, isOpen: open }))
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
                  Hapus Catatan Barang Masuk
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Apakah Anda yakin ingin menghapus catatan barang masuk ini? Tindakan ini tidak dapat dibatalkan.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="my-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-3 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Nama Barang:</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {deleteItemState.itemName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Asal Barang:</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {deleteItemState.itemOrigin || "-"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500">Jumlah:</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {deleteItemState.quantity}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() =>
                setDeleteItemState((prev) => ({ ...prev, isOpen: false }))
              }
              disabled={deleteItemMutation.isPending}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
              onClick={() => {
                if (!deleteItemState.id) return;
                deleteItemMutation.mutate(deleteItemState.id, {
                  onSuccess: () => {
                    setDeleteItemState((prev) => ({ ...prev, isOpen: false }));
                    refetchItems();
                    setFeedback({
                      type: "success",
                      text: "Catatan barang masuk berhasil dihapus.",
                    });
                  },
                  onError: (err: any) => {
                    setDeleteItemState((prev) => ({ ...prev, isOpen: false }));
                    setFeedback({
                      type: "error",
                      text: err.message || "Gagal menghapus catatan barang masuk.",
                    });
                  },
                });
              }}
              disabled={deleteItemMutation.isPending}
            >
              {deleteItemMutation.isPending ? (
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
