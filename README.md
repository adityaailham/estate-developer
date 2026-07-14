# Estate CCMS - Cost Control & Monitoring System

## Deskripsi
Estate CCMS adalah sistem informasi berbasis web yang dirancang khusus untuk pengembang (developer) perumahan dalam mengelola, melacak, dan mengendalikan biaya pembangunan proyek secara real-time. Aplikasi ini membantu menjembatani perencanaan anggaran (RAB) dengan pengeluaran aktual di lapangan secara presisi.

## Fungsi Utama
Fungsi utama dari aplikasi ini adalah sebagai alat kontrol biaya pembangunan (Cost Control) yang terintegrasi guna mencegah terjadinya pembengkakan anggaran (over-budget) pada setiap unit rumah. Sistem melacak alokasi material gudang dengan metode FIFO, mengontrol kontrak borongan tenaga kerja, serta menyajikan analisis laba-rugi kotor konstruksi per unit melalui lembar biaya (Cost Sheet).

## Fitur Utama Proyek
1. **Dashboard Eksekutif**: Menyajikan ringkasan keuangan proyek, grafik distribusi status unit rumah, nilai total aset gudang, serta perbandingan agregat target RAB vs realisasi aktual.
2. **Manajemen Proyek Perumahan**: Portofolio lokasi proyek beserta statistik distribusi kemajuan pembangunan unit di setiap kawasan.
3. **Daftar Unit & Laporan Cost Sheet**: Lembar biaya mendalam untuk setiap unit rumah yang merinci harga jual, realisasi biaya material (metode FIFO), upah tenaga kerja borongan, serta sisa anggaran (variance) secara otomatis.
4. **Stok Gudang & Katalog Material**: Pencatatan inventaris bahan bangunan global, harga satuan rata-rata, kartu stok masuk-keluar, dan penyesuaian opname gudang.
5. **Pembelian & Penerimaan Barang**: Pencatatan faktur pembelian material dari supplier dengan opsi alokasi langsung ke unit rumah (bypass) atau disimpan ke dalam gudang utama.
6. **Mutasi Material (FIFO)**: Manajemen distribusi material dari gudang utama ke blok unit rumah dengan penghitungan biaya otomatis berbasis urutan pembelian terlama.
7. **Kontrak Kerja Borongan**: Pencatatan kontrak kerja borongan dengan kepala tukang (mandor) per unit rumah beserta pelacakan termin pembayaran upah yang sudah direalisasikan.
8. **Master Template RAB**: Pembuatan standar rincian kebutuhan material dan upah per tipe rumah (misalnya Tipe 36, Tipe 45) untuk disalin secara otomatis ketika unit rumah baru didaftarkan.
9. **Direktori Supplier & Kepala Tukang**: Master data rekanan toko material dan daftar pelaksana pekerjaan borongan di lapangan.
10. **Panduan Penggunaan Sistem**: Dokumentasi interaktif mengenai alur kerja aplikasi, logika perhitungan biaya FIFO, serta penanganan alur bisnis konstruksi.

## Arsitektur Teknologi
* **Framework**: Next.js (App Router)
* **Bahasa**: JavaScript
* **Database**: MySQL (diakses melalui mysql2/promise)
* **Styling**: Tailwind CSS / Vanilla CSS

## Panduan Instalasi Lokal

### Prasyarat
* Node.js (versi 18 atau 20 LTS)
* MySQL Server (XAMPP, Laragon, atau instalasi standalone)
* Git

### Langkah Penginstalan
1. Kloning repository proyek ini:
   ```bash
   git clone https://github.com/adityaailham/estate-developer.git
   ```
2. Masuk ke direktori proyek:
   ```bash
   cd estate-developer
   ```
3. Instal semua dependensi Node.js:
   ```bash
   npm install
   ```
4. Jalankan MySQL Server di komputer Anda, lalu buat database kosong baru (misalnya dengan nama `estate_developer`).
5. Impor struktur database dari file `schema.sql` yang berada di direktori utama proyek ke dalam database baru tersebut.
6. Buat file `.env.local` di direktori utama proyek, lalu isi dengan konfigurasi database MySQL Anda:
   ```env
   DB_HOST=localhost
   DB_USER=username_mysql_anda
   DB_PASSWORD=password_mysql_anda
   DB_NAME=nama_database_anda
   ```
7. Jalankan server pembangunan Next.js:
   ```bash
   npm run dev
   ```
8. Buka browser dan akses alamat `http://localhost:3000`.
9. (Opsional) Untuk mengisi database dengan data pengujian awal, buka tautan `http://localhost:3000/api/seed` di browser Anda setelah server berjalan.
