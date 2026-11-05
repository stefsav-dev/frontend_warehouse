/**
 * API Service Client untuk Warehouse App Frontend
 */

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem("warehouse_api_url");
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, "");
    }
  }
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace(/\/+$/, "");
}

export function setCustomApiUrl(url: string | null) {
  if (typeof window !== "undefined") {
    if (!url || !url.trim()) {
      localStorage.removeItem("warehouse_api_url");
    } else {
      localStorage.setItem("warehouse_api_url", url.trim().replace(/\/+$/, ""));
    }
  }
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: "ADMIN" | "OPERATOR";
  isLocked: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    accessToken: string;
    refreshToken: string | null;
    user: User;
    tokenType?: string;
    expiresIn?: number;
  };
}

export const AUTH_STORAGE_KEY = "warehouse_auth_session";

export function getStoredAuth(): {
  user: User;
  accessToken: string;
  refreshToken: string | null;
} | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredAuth(data: {
  user: User;
  accessToken: string;
  refreshToken: string | null;
}) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
}

export function clearStoredAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

/**
 * Endpoint Refresh Token ke backend untuk mendapatkan access token baru
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  success: boolean;
  message?: string;
  data?: {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
  };
}> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    return await res.json();
  } catch (err: unknown) {
    const error = err as Error;
    return {
      success: false,
      message: error?.message || "Gagal memperbarui token autentikasi.",
    };
  }
}

// Pengendali refresh token bersama (mencegah refresh ganda secara bersamaan)
let isRefreshing = false;
let refreshSubscribers: ((newToken: string) => void)[] = [];

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (newToken: string) => void) {
  refreshSubscribers.push(cb);
}

/**
 * Fetch wrapper dengan autentikasi otomatis dan Auto Token Refresh pada status 401
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  explicitToken?: string
): Promise<Response> {
  const stored = getStoredAuth();
  let token = explicitToken || stored?.accessToken;

  const reqHeaders = new Headers(options.headers || {});
  if (token) {
    reqHeaders.set("Authorization", `Bearer ${token}`);
  }

  let res = await fetch(url, { ...options, headers: reqHeaders });

  // Jika response 401 Unauthorized dan kita memiliki refreshToken di localStorage
  if (res.status === 401 && stored?.refreshToken) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await refreshAccessToken(stored.refreshToken);
        if (refreshRes.success && refreshRes.data?.accessToken) {
          const newAccessToken = refreshRes.data.accessToken;
          const newRefreshToken =
            refreshRes.data.refreshToken || stored.refreshToken;

          saveStoredAuth({
            user: stored.user,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          });

          isRefreshing = false;
          onTokenRefreshed(newAccessToken);

          // Ulangi request saat ini dengan access token baru
          reqHeaders.set("Authorization", `Bearer ${newAccessToken}`);
          return await fetch(url, { ...options, headers: reqHeaders });
        } else {
          isRefreshing = false;
        }
      } catch {
        isRefreshing = false;
      }
    } else {
      // Tunggu proses refresh yang sedang berjalan selesai lalu gunakan token baru
      return new Promise((resolve) => {
        addRefreshSubscriber(async (newToken: string) => {
          reqHeaders.set("Authorization", `Bearer ${newToken}`);
          resolve(await fetch(url, { ...options, headers: reqHeaders }));
        });
      });
    }
  }

  return res;
}

async function safeJson(res: Response) {
  try {
    const text = await res.text();
    if (!text) {
      return {
        success: res.ok,
        message: res.ok ? "Operasi berhasil." : `Status respons ${res.status}`,
      };
    }
    try {
      return JSON.parse(text);
    } catch {
      return {
        success: false,
        message:
          text.includes("foreign key") || text.includes("Failed query")
            ? "Data tidak dapat dihapus karena masih terkait dengan data transaksi lain."
            : text.slice(0, 150) || `Terjadi kesalahan pada server (HTTP ${res.status}).`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Gagal memproses respon dari server.",
    };
  }
}

export async function loginUser(credentials: {
  username: string;
  password: string;
}): Promise<LoginResponse> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const result = await response.json();
    return result;
  } catch (err: unknown) {
    const error = err as Error;
    return {
      success: false,
      message:
        error?.message?.includes("fetch") || error?.message?.includes("Failed")
          ? `Gagal terhubung ke server backend (${getApiBaseUrl()}). Pastikan service backend aktif.`
          : error?.message || "Terjadi kesalahan saat memproses login.",
    };
  }
}

export async function logoutUser(refreshToken?: string | null): Promise<void> {
  try {
    if (refreshToken) {
      await fetch(`${getApiBaseUrl()}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch (error) {
    console.error("Gagal melakukan panggilan logout backend:", error);
  } finally {
    clearStoredAuth();
  }
}

export async function fetchUserProfile(
  accessToken: string
): Promise<{ success: boolean; data?: User; message?: string }> {
  try {
    const response = await fetchWithAuth(
      `${getApiBaseUrl()}/auth/me`,
      {},
      accessToken
    );
    return await response.json();
  } catch (err: unknown) {
    const error = err as Error;
    return {
      success: false,
      message: error?.message || "Gagal mengambil data profil.",
    };
  }
}

/* ========================================================
   Admin API Endpoints
   ======================================================== */

export async function fetchAdminDashboard(token: string) {
  const res = await fetchWithAuth(
    `${getApiBaseUrl()}/admin/dashboard`,
    {},
    token
  );
  return await safeJson(res);
}

export async function fetchAdminUsers(
  token: string,
  params?: { page?: number; limit?: number; role?: string; search?: string }
) {
  const url = new URL(`${getApiBaseUrl()}/admin/users`);
  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.role) url.searchParams.set("role", params.role);
  if (params?.search) url.searchParams.set("search", params.search);

  const res = await fetchWithAuth(url.toString(), {}, token);
  return await safeJson(res);
}

export async function toggleUserLock(
  token: string,
  userId: string,
  lock: boolean
) {
  const endpoint = lock ? "lock" : "unlock";
  const res = await fetchWithAuth(
    `${getApiBaseUrl()}/admin/users/${userId}/${endpoint}`,
    { method: "PATCH" },
    token
  );
  return await safeJson(res);
}

export async function createAdminUser(
  token: string,
  payload: {
    name: string;
    username: string;
    email: string;
    role: "ADMIN" | "OPERATOR";
    password: string;
  }
) {
  const res = await fetchWithAuth(
    `${getApiBaseUrl()}/admin/users`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    token
  );
  return await safeJson(res);
}

export async function updateAdminUser(
  token: string,
  userId: string,
  payload: {
    name?: string;
    username?: string;
    email?: string;
    role?: "ADMIN" | "OPERATOR";
    password?: string;
  }
) {
  const res = await fetchWithAuth(
    `${getApiBaseUrl()}/admin/users/${userId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    token
  );
  return await safeJson(res);
}

export async function deleteAdminUser(token: string, userId: string) {
  const res = await fetchWithAuth(
    `${getApiBaseUrl()}/admin/users/${userId}`,
    {
      method: "DELETE",
    },
    token
  );
  return await safeJson(res);
}

/* ========================================================
   Master Data Categories & Sub-Categories
   ======================================================== */

export async function fetchCategories(
  token: string,
  params?: { page?: number; limit?: number; search?: string; all?: boolean }
) {
  const url = new URL(`${getApiBaseUrl()}/categories`);
  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.search) url.searchParams.set("search", params.search);
  if (params?.all) url.searchParams.set("all", "true");

  const res = await fetchWithAuth(url.toString(), {}, token);
  return await safeJson(res);
}

export async function createCategory(
  token: string,
  payload: { code: string; name: string }
) {
  const res = await fetchWithAuth(
    `${getApiBaseUrl()}/categories`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    token
  );
  return await safeJson(res);
}

export async function deleteCategory(token: string, id: string) {
  const res = await fetchWithAuth(
    `${getApiBaseUrl()}/categories/${id}`,
    { method: "DELETE" },
    token
  );
  return await safeJson(res);
}

export async function fetchSubCategories(
  token: string,
  params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    all?: boolean;
  }
) {
  const url = new URL(`${getApiBaseUrl()}/sub-categories`);
  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.categoryId)
    url.searchParams.set("categoryId", params.categoryId);
  if (params?.search) url.searchParams.set("search", params.search);
  if (params?.all) url.searchParams.set("all", "true");

  const res = await fetchWithAuth(url.toString(), {}, token);
  return await safeJson(res);
}

export async function createSubCategory(
  token: string,
  payload: {
    categoryId: string;
    code: string;
    name: string;
    priceLimit: number;
  }
) {
  const res = await fetchWithAuth(
    `${getApiBaseUrl()}/sub-categories`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    token
  );
  return await safeJson(res);
}

export async function deleteSubCategory(token: string, id: string) {
  const res = await fetchWithAuth(
    `${getApiBaseUrl()}/sub-categories/${id}`,
    { method: "DELETE" },
    token
  );
  return await safeJson(res);
}

/* ========================================================
   Barang Masuk (Incoming Items)
   ======================================================== */

export async function fetchIncomingItems(
  token: string,
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
  const url = new URL(`${getApiBaseUrl()}/incoming-items`);
  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.categoryId)
    url.searchParams.set("categoryId", params.categoryId);
  if (params?.subCategoryId)
    url.searchParams.set("subCategoryId", params.subCategoryId);
  if (params?.year) url.searchParams.set("year", params.year);
  if (params?.search) url.searchParams.set("search", params.search);
  if (params?.operatorId)
    url.searchParams.set("operatorId", params.operatorId);

  const res = await fetchWithAuth(url.toString(), {}, token);
  return await safeJson(res);
}

export async function fetchIncomingItemSummary(token: string) {
  const res = await fetchWithAuth(
    `${getApiBaseUrl()}/incoming-items/stats/summary`,
    {},
    token
  );
  return await safeJson(res);
}

export async function fetchIncomingComboboxCategories(token: string) {
  const res = await fetchWithAuth(
    `${getApiBaseUrl()}/incoming-items/categories`,
    {},
    token
  );
  return await safeJson(res);
}

export async function fetchIncomingComboboxSubCategories(
  token: string,
  categoryId: string
) {
  const res = await fetchWithAuth(
    `${getApiBaseUrl()}/incoming-items/categories/${categoryId}/sub-categories`,
    {},
    token
  );
  return await safeJson(res);
}

export async function fetchIncomingComboboxOperators(token: string) {
  const res = await fetchWithAuth(
    `${getApiBaseUrl()}/incoming-items/operators`,
    {},
    token
  );
  return await safeJson(res);
}

export async function createIncomingItem(
  token: string,
  payload: {
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
  }
) {
  const bodyData: Record<string, any> = {
    itemName: payload.itemName,
    categoryId: payload.categoryId,
    subCategoryId: payload.subCategoryId,
    quantity: Number(payload.quantity),
    price: Number(payload.price ?? payload.itemPrice ?? 0),
    unit: payload.unit || "Buah",
    itemOrigin: payload.itemOrigin,
  };

  if (payload.letterNumber) bodyData.letterNumber = payload.letterNumber;
  if (payload.incomingDate) bodyData.incomingDate = payload.incomingDate;
  if (payload.attachment || payload.fileAttachment)
    bodyData.attachment = payload.attachment || payload.fileAttachment;
  if (payload.attachmentOriginalName)
    bodyData.attachmentOriginalName = payload.attachmentOriginalName;
  if (payload.operatorId) bodyData.operatorId = payload.operatorId;
  if (payload.expiredDate) bodyData.expiredDate = payload.expiredDate;

  const res = await fetchWithAuth(
    `${getApiBaseUrl()}/incoming-items`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData),
    },
    token
  );
  return await safeJson(res);
}

export async function deleteIncomingItem(token: string, id: string) {
  const res = await fetchWithAuth(
    `${getApiBaseUrl()}/incoming-items/${id}`,
    { method: "DELETE" },
    token
  );
  return await safeJson(res);
}

export async function uploadIncomingAttachment(token: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetchWithAuth(
    `${getApiBaseUrl()}/incoming-items/upload`,
    {
      method: "POST",
      body: formData,
    },
    token
  );
  return await safeJson(res);
}
