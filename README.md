# Estate Developer Management System 🏗️

Sistem Manajemen Proyek Perumahan dan Kontrol Biaya Kontruksi (ERP Real Estate Lightweight) berbasis **Next.js** & **SQLite**. Dirancang khusus untuk mempermudah developer perumahan dalam mengontrol stok material lapangan, kontrak borongan tukang, analisis *Bottom-Up Costing*, serta melacak **Koefisien Material Aktual** secara presisi.

---

## ✨ Fitur Utama

### 1. 📊 Cost Sheet & Analysis (Target vs Aktual)
- Laporan real-time perbandingan antara target Anggaran (RAB) vs pengeluaran aktual (Material & Upah).
- Indikator kesehatan keuangan unit (*Aman*, *Waspada*, *Overbudget*).

### 2. 🎯 Bottom-Up Costing & Export Template RAB
- Mendukung pembangunan "Rumah Contoh" tanpa RAB awal.
- Ekspor otomatis seluruh akumulasi biaya aktual menjadi **Template RAB Baku** sekali klik.

### 3. 📐 Pelacakan Progres & Analisis Koefisien Material
- Pencatatan pemakaian material harian yang terhubung langsung dengan volume progres lapangan (misal: 12m fondasi).
- Kalkulasi otomatis **Koefisien Material Aktual** (sak/m, pcs/m, m3/m2) untuk mengukur efisiensi kerja & mencegah boros/hilang.
- Riwayat log progres terperinci per tanggal beserta daftar materialnya.

### 4. 📦 Manajamen Mutasi & Stok Lapangan
- Pelacakan stok material di gudang utama & lokasi unit proyek.
- Fitur transaksi mutasi: Pembelian, Keluar ke Unit, Retur ke Gudang, dan Pindah antar Unit.

### 5. 👷 Manajemen Upah & Kontrak Borongan
- Pencatatan kontrak borongan pekerja per tahapan pekerjaan.
- Monitoring pembayaran upah & sisa kewajiban kontrak.

### 6. 🚀 One-Click Startup (`start-app.bat`)
- Cukup klik 2x file batch untuk menyalakan server dan membuka browser otomatis.

---

## 🛠️ Teknologi & Arsitektur

- **Framework**: Next.js (App Router, React 19)
- **Styling**: Tailwind CSS & Lucide Icons
- **Database**: SQLite (`better-sqlite3` & `estate.db`)
- **State/Toast**: Dynamic Context & Custom Modal UI

---

## 🚀 Panduan Instalasi & Jalankan Aplikasi

### 1. Prasyarat
Pastikan komputer Anda sudah ter-install **Node.js** (versi 18+ / LTS). Unduh di [nodejs.org](https://nodejs.org).

### 2. Clone Repositori
```bash
git clone https://github.com/adityaailham/estate-developer.git
cd estate-developer
```

### 3. Install Dependensi
```bash
npm install
```

### 4. Jalankan Aplikasi
Anda dapat memilih salah satu cara berikut:

- **Cara Otomatis (Rekomendasi)**:
  Cukup **klik 2x file `start-app.bat`** di File Explorer. Server Next.js akan menyala dan browser akan terbuka otomatis di `http://localhost:3000`.

- **Cara Manual via Terminal**:
  ```bash
  npm run dev
  ```
  Lalu buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 🔄 Sinkronisasi Database (`estate.db`)

Database SQLite berada di file `estate.db` dan di-track oleh Git. Untuk menyinkronkan data antar perangkat:

- **Mengirim Data Terbaru (Komputer A)**:
  ```bash
  git add estate.db
  git commit -m "update database terbaru"
  git push
  ```

- **Menerima Data Terbaru (Komputer B)**:
  ```bash
  git pull
  ```

---

## 📝 Lisensi
Internal Proprietary - All Rights Reserved.
