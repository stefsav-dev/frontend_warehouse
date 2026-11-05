# Warehouse Management System - Frontend App

Aplikasi web modern untuk manajemen pergudangan, pencatatan barang masuk inventaris, klasifikasi kategori/subkategori dengan pembatasan pagu harga, serta manajemen hak akses pengguna (*Role-Based Access Control*).

---

## 📌 1. Link Deployment (Live App)
* **Frontend Web Application (Live App)**: [https://frontendwarehouse-production.up.railway.app/](https://frontendwarehouse-production.up.railway.app/)
* **Backend API Server**: [https://backendwarehouse-production.up.railway.app](https://backendwarehouse-production.up.railway.app)
* **Swagger / OpenAPI Interactive Docs**: [https://backendwarehouse-production.up.railway.app/swagger](https://backendwarehouse-production.up.railway.app/swagger)

---

## 🎥 2. Link Video Demo
* **Google Drive Video Demo**: [https://drive.google.com/drive/folders/1T52p3kCWKn2fk6r7CCUp176hlE3Gca-n?usp=sharing](https://drive.google.com/drive/folders/1T52p3kCWKn2fk6r7CCUp176hlE3Gca-n?usp=sharing)

---

## 🛠️ 3. Tech Stack yang Digunakan

### **Frontend (Aplikasi Klien)**
* **Framework**: Next.js 15+ (App Router Architecture)
* **UI Library & Styling**: React 19, Tailwind CSS, Shadcn UI / Radix UI Primitives
* **State Management & Data Fetching**: TanStack Query (React Query)
* **Icons**: Lucide React
* **Bahasa**: TypeScript

### **Backend (API Server)**
* **Runtime**: Bun (High-performance JavaScript/TypeScript runtime)
* **Framework**: Elysia.js
* **ORM & Database Client**: Drizzle ORM + MySQL2
* **Keamanan & Autentikasi**: Argon2id Hashing, JWT Access Token & Refresh Token Rotation
* **Dokumentasi API**: OpenAPI 3.0 / Swagger UI (@elysiajs/swagger)

### **Database & Deployment**
* **Database**: MySQL 8.0 (Hosted on Railway Database)
* **Cloud Infrastructure**: Railway Cloud Platform (Auto Continuous Deployment via GitHub)

---

## 💻 4. Petunjuk Instalasi Lokal

Ikuti langkah-langkah di bawah ini untuk menjalankan aplikasi secara lokal di komputer Anda:

### **Prasyarat Sistem**
* [Bun](https://bun.sh/) (disarankan) atau [Node.js](https://nodejs.org/) (v18.17+)
* [Git](https://git-scm.com/)
* Database MySQL aktif (atau gunakan cloud database)

### **Langkah 1: Menjalankan Backend**
```bash
# 1. Clone repository backend
git clone https://github.com/stefsav-dev/backend_warehouse.git
cd backend_warehouse/app

# 2. Pasang dependensi
bun install

# 3. Buat file konfigurasi environment .env
# Salin dari .env.example atau buat .env baru dengan isi:
DATABASE_URL=mysql://root:password@localhost:3306/warehouse_db
PORT=3001
JWT_SECRET=super_secret_jwt_key_warehouse_2026_dev
NODE_ENV=development

# 4. Jalankan backend server (auto-migrate & auto-seed otomatis berjalan)
bun run src/index.ts
```
> Server backend akan aktif di `http://localhost:3001` dan dokumentasi Swagger di `http://localhost:3001/swagger`.

### **Langkah 2: Menjalankan Frontend**
```bash
# 1. Clone repository frontend
git clone https://github.com/stefsav-dev/frontend_warehouse.git
cd frontend_warehouse

# 2. Pasang dependensi
bun install
# atau menggunakan npm:
# npm install

# 3. Buat file .env.local
echo NEXT_PUBLIC_API_URL=http://localhost:3001 > .env.local

# 4. Jalankan development server
bun dev
# atau:
# npm run dev
```

Buka peramban (browser) dan akses: **`http://localhost:3000`**

---

## 🔑 5. Akun Pengujian (Kredensial)

Gunakan akun uji coba bawaan sistem (*seeded accounts*) berikut untuk menguji seluruh fungsionalitas aplikasi:

| Peran (Role) | Username | Password | Deskripsi & Hak Akses |
| :--- | :--- | :--- | :--- |
| **Super Administrator** | `admin` | `admin123` | **Akses Penuh**: Manajemen Pengguna (Tambah/Ubah/Kunci Akun), Master Kategori, Master Sub Kategori (Batas Pagu Harga), Monitoring dan Ubah/Hapus Data Barang Masuk seluruh operator. |
| **Warehouse Operator** | `operator` | `operator123` | **Akses Operasional**: Pencatatan Barang Masuk (Form Append multi-item), filter kategori/tahun, unduh berkas lampiran, dan ringkasan operasional mandiri. |
| **Operator Lapangan (Budi)** | `operator_budi` | `operator123` | Akun operator tambahan untuk simulasi pencatatan operator lapangan A. |
| **Operator Lapangan (Siti)** | `operator_siti` | `operator123` | Akun operator tambahan untuk simulasi pencatatan operator lapangan B. |

---

## ✨ Fitur Unggulan Sistem
1. **Dynamic Multi-Item Append Form**: Pencatatan barang masuk dinamis dapat menambah baris `(+)` dan menghapus baris `(x)` secara fleksibel.
2. **Validasi Pagu Batas Harga Otomatis**: Menghitung batas pagu secara *real-time* baik per baris barang maupun total akumulasi seluruh barang agar tidak melebihi pagu sub kategori.
3. **Format Otomatis Rupiah**: Input harga otomatis terformat pemisah ribuan Rupiah (`Rp 1.000.000`).
4. **Interactive Custom DatePicker**: Pemilihan tanggal kedaluwarsa dan tanggal penerimaan barang menggunakan kalender interaktif.
5. **Lock / Unlock User**: Administrator dapat menonaktifkan akun secara instan untuk mencabut akses login dan membatalkan refresh token.
6. **File Attachment**: Dukungan unggah dan unduh berkas lampiran surat jalan/faktur (`.doc`, `.docx`, `.zip`).
