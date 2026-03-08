# Panduan Deployment Certi Gen 🚀

Dokumen ini berisi panduan langkah-demi-langkah untuk melakukan deployment aplikasi **Certi Gen** ke Vercel dengan integrasi Supabase dan Canva.

---

## 1. Persiapan Supabase (Database & Auth)

Supabase digunakan sebagai sistem autentikasi dan penyimpanan data (PostgreSQL).

### Langkah-langkah:
1.  **Buat Proyek Baru**: Masuk ke [Supabase Dashboard](https://supabase.com/dashboard) dan buat proyek baru.
2.  **Konfigurasi SQL**:
    *   Buka menu **SQL Editor** di sidebar kiri.
    *   Klik **New Query**.
    *   Salin dan tempel kode SQL yang ada di Dashboard Admin aplikasi (atau lihat di file `components/DatabaseSetupGuide.tsx`).
    *   Klik **Run**. Ini akan membuat tabel `profiles`, `templates`, dan `certificates`.
3.  **Ambil API Keys**:
    *   Buka menu **Settings** -> **API**.
    *   Salin **Project URL** dan **anon public key**.
    *   Salin **service_role key** (Rahasia! Jangan dibagikan). Ini diperlukan untuk fitur hapus user.
4.  **Konfigurasi Autentikasi**:
    *   Buka menu **Authentication** -> **Providers**.
    *   Pastikan **Email** diaktifkan.
    *   Matikan "Confirm Email" jika Anda ingin user bisa langsung masuk tanpa verifikasi email (opsional untuk testing).

---

## 2. Persiapan Canva (Integrasi Desain)

Aplikasi ini mendukung integrasi dengan Canva untuk aset desain.

### Langkah-langkah:
1.  Masuk ke [Canva Developer Portal](https://www.canva.com/developers/).
2.  Buat aplikasi baru (Create an app).
3.  Buka menu **Configure** -> **Authentication**.
4.  Salin **Client ID** dan **Client Secret**.
5.  Tambahkan **Redirect URL** (Setelah deploy Vercel selesai, Anda harus kembali ke sini untuk memasukkan URL aplikasi Anda).

---

## 3. Deployment ke Vercel

### Langkah-langkah:
1.  **Push Kode ke GitHub**: Pastikan kode Anda sudah di-push ke repository GitHub.
2.  **Import ke Vercel**:
    *   Buka [Vercel Dashboard](https://vercel.com/dashboard).
    *   Klik **Add New** -> **Project**.
    *   Pilih repository GitHub Anda.
3.  **Konfigurasi Environment Variables**:
    Di bagian **Environment Variables**, masukkan kunci-kunci berikut:

    | Key | Deskripsi |
    | :--- | :--- |
    | `NEXT_PUBLIC_SUPABASE_URL` | URL Proyek Supabase Anda |
    | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon Public Key Supabase |
    | `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key Supabase (Untuk API hapus user) |
    | `NEXT_PUBLIC_CANVA_CLIENT_ID` | Client ID dari Canva |
    | `CANVA_CLIENT_SECRET` | Client Secret dari Canva |

4.  **Klik Deploy**: Tunggu proses build selesai.

---

## 4. Langkah Setelah Deploy (Penting!)

### Menjadikan User sebagai Admin
Secara default, user yang mendaftar akan memiliki role `user`. Untuk mengakses fitur Admin:
1.  Daftar akun di aplikasi Anda yang sudah live.
2.  Buka **Supabase Dashboard** -> **Table Editor** -> Tabel `profiles`.
3.  Cari email Anda, lalu ubah kolom `role` menjadi `admin` dan centang `is_approved`.

### Update Redirect URL Canva
Kembali ke Canva Developer Portal, dan tambahkan URL aplikasi Vercel Anda ke daftar **Redirect URLs** agar integrasi Canva berjalan lancar.

---

## Variabel Lingkungan (.env)
Pastikan file `.env.local` Anda (untuk pengembangan lokal) atau settings di Vercel memiliki format berikut:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_CANVA_CLIENT_ID=your-canva-id
CANVA_CLIENT_SECRET=your-canva-secret
```

---
Dibuat dengan ❤️ untuk sistem manajemen sertifikat yang lebih baik.
