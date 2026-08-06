# Panduan Migrasi & Instalasi Aplikasi Estate Developer

Aplikasi ini bersifat portabel dan mandiri dengan *database* lokal SQLite. Anda dapat dengan mudah memindahkannya ke laptop atau perangkat Windows lain tanpa takut kehilangan data sepeserpun.

## 📋 Prasyarat Utama di Komputer Baru
Sistem operasi komputer baru Anda harus sudah ditanami **Node.js**. 
Jika belum punya, Anda wajib mengunduh dan menginstalnya dari situs resmi: [https://nodejs.org](https://nodejs.org). Gunakan versi LTS (*Long Term Support*).

---

## 🚀 Langkah-langkah Pemindahan (Migrasi)

### 1. Salin Folder Proyek (Dari Komputer Lama)
- Buka *File Explorer*, *copy* seluruh folder `estate-developer` ke dalam *flashdisk* atau Google Drive.
- **Tips Transfer Cepat:** Sebelum di-*copy*, hapus saja folder bernama `node_modules` dan `.next` (jika ada). Kedua folder ini ukurannya raksasa tapi isinya hanya mesin *cache* sementara yang nanti bisa di-*download* ulang otomatis.

### 2. Letakkan Folder (Di Komputer Baru)
- Colokkan *flashdisk* ke komputer baru.
- *Paste* folder `estate-developer` tadi ke lokasi yang aman (misalnya di drive `D:\` atau `Documents`).

### 3. Bangkitkan Ulang Mesin Sistem (Terminal)
- Buka folder `estate-developer` tersebut.
- Arahkan kursor Anda ke kolom alamat folder di bagian atas (*address bar*), klik, lalu ketik `cmd` dan tekan **Enter**. Ini akan membuka layar hitam terminal persis di lokasi folder.
- Ketik perintah sakti berikut dan tekan **Enter**:
  ```bash
  npm install
  ```
- Pastikan komputer baru Anda terhubung dengan internet. Tunggu beberapa menit sampai angka persentase selesai dan folder `node_modules` tercipta kembali.

### 4. Jalankan Aplikasi Satu Klik
- Tutup layar hitam terminal tadi.
- Di dalam folder Anda, cari *file* berlogo gerigi bernama **`start-app.bat`**.
- **Klik Dua Kali (*Double Click*)** *file* tersebut.
- Selesai! Layar terminal akan menyala mandiri dan langsung membuka *browser* Anda menuju aplikasi yang sudah menyala total dengan segala isi datanya.

---

## ⚠️ Peringatan Penting Keamanan Data:
Seluruh nyawa data proyek, target RAB, rekap biaya, pemakaian bahan, hingga rasio koefisien Anda terkunci padat di dalam satu *file* tunggal bernama **`estate.db`**. 

**JANGAN PERNAH menghapus *file* ini secara tidak sengaja!** 
Sangat disarankan bagi Anda untuk menyalin (mem-*backup*) *file* `estate.db` ini ke dalam *flashdisk* setidaknya satu minggu sekali sebagai bentuk pencegahan jika laptop utama Anda rusak/terkena virus.
