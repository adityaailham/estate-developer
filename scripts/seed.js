import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

async function seedDatabase() {
  console.log('🌱 Memulai proses seeding data dummy CCMS...');

  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'estate_developer_ccms',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    multipleStatements: true
  });

  try {
    const connection = await pool.getConnection();
    
    // 1. Jalankan schema.sql untuk memastikan tabel ada & siap
    const schemaPath = path.join(process.cwd(), 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      await connection.query(schemaSql);
      console.log('✅ Skema tabel terverifikasi.');
    }

    // 2. Bersihkan data lama (opsional opsional reset) agar data konsisten
    console.log('🧹 Membersihkan tabel dari data lama jika ada...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    const tables = [
      'borongan_payments', 'borongan_contracts', 'material_mutations',
      'purchase_items', 'purchases', 'house_rab_items', 'house_rabs',
      'rab_template_items', 'rab_templates', 'warehouse_stocks',
      'kepala_tukang', 'suppliers', 'materials', 'houses', 'projects'
    ];
    for (const table of tables) {
      await connection.query(`TRUNCATE TABLE \`${table}\`;`);
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

    // 3. Insert Projects
    console.log('🏗️ Menambahkan data Proyek...');
    await connection.query(`
      INSERT INTO projects (id, name, location) VALUES
      (1, 'Grand Aditia Residence', 'Jl. Raya Boulevard Selatan No. 88, Tangerang Selatan'),
      (2, 'Green Valley Sanctuary', 'Kawasan Hills Bintaro Sektor 9')
    `);

    // 4. Insert Houses
    console.log('🏠 Menambahkan data Unit Rumah...');
    await connection.query(`
      INSERT INTO houses (id, project_id, block_number, type, selling_price, progress_percent, status) VALUES
      (1, 1, 'A1', 'Tipe 36/72 Modern', 450000000.00, 65, 'Pembangunan'),
      (2, 1, 'A2', 'Tipe 36/72 Modern', 450000000.00, 40, 'Pembangunan'),
      (3, 1, 'A3', 'Tipe 36/72 Modern', 450000000.00, 100, 'Selesai'),
      (4, 1, 'B1', 'Tipe 45/90 Luxury', 650000000.00, 80, 'Pembangunan'),
      (5, 2, 'C1', 'Tipe 45/90 Luxury', 680000000.00, 100, 'Serah Terima'),
      (6, 2, 'C2', 'Tipe 45/90 Luxury', 680000000.00, 0, 'Belum Mulai')
    `);

    // 5. Insert Materials
    console.log('📦 Menambahkan Master Material & Stok Minimum...');
    await connection.query(`
      INSERT INTO materials (id, code, name, unit, default_price, minimum_stock) VALUES
      (1, 'SMN-01', 'Semen Portland PCC 50kg (Tiga Roda)', 'Sak', 65000.00, 50.00),
      (2, 'BSI-10', 'Besi Beton Ulir 10mm SNI (Full)', 'Batang', 85000.00, 100.00),
      (3, 'BTA-AAC', 'Bata Ringan AAC 10cm (Citicon)', 'M3', 650000.00, 10.00),
      (4, 'PSR-BTN', 'Pasir Cor / Pasir Beton Bersih', 'M3', 280000.00, 15.00),
      (5, 'GRN-60', 'Granit Lantai Polished 60x60 (Granito)', 'Dus', 165000.00, 30.00),
      (6, 'CAT-25', 'Cat Tembok Interior Putih 25kg (Dulux)', 'Pail', 550000.00, 5.00)
    `);

    // 6. Insert Initial Warehouse Stocks (Opsi A)
    // Note: Cat-25 ditaruh 3 Pail (di bawah minimum_stock 5) supaya muncul peringatan kritis di Dashboard!
    console.log('🏢 Mengisi Stok Gudang Utama Global...');
    await connection.query(`
      INSERT INTO warehouse_stocks (material_id, quantity) VALUES
      (1, 120.00),
      (2, 250.00),
      (3, 25.00),
      (4, 30.00),
      (5, 80.00),
      (6, 3.00)
    `);

    // 7. Insert Suppliers
    console.log('🚚 Menambahkan Data Supplier...');
    await connection.query(`
      INSERT INTO suppliers (id, name, phone, address) VALUES
      (1, 'TB Sinar Bangunan Abadi', '0812-3456-7890', 'Jl. Raya Serpong No. 12, Tangerang Selatan'),
      (2, 'PT Semen Nusantara Perkasa', '021-78901234', 'Kawasan Industri Pulo Gadung Kav. 4'),
      (3, 'Toko Besi & Baja Sejahtera', '0813-9876-5432', 'Jl. Ciputat Raya No. 45')
    `);

    // 8. Insert Kepala Tukang / Mandor
    console.log('👷 Menambahkan Mitra Kepala Tukang / Mandor...');
    await connection.query(`
      INSERT INTO kepala_tukang (id, name, phone) VALUES
      (1, 'Pak Budi Santoso (Mandor Struktur & Pondasi)', '0819-8877-6655'),
      (2, 'Pak Haryanto (Mandor Arsitektur & Finishing)', '0815-4433-2211')
    `);

    // 9. Insert RAB Templates & Items
    console.log('📋 Rancang Template RAB Master...');
    await connection.query(`
      INSERT INTO rab_templates (id, house_type, description) VALUES
      (1, 'Tipe 36/72 Modern', 'Standar spesifikasi modern minimalis untuk blok A.'),
      (2, 'Tipe 45/90 Luxury', 'Spesifikasi premium dengan granit 60x60 dan plafon tinggi.')
    `);

    await connection.query(`
      INSERT INTO rab_template_items (rab_template_id, item_type, material_id, name, quantity, unit, estimated_price) VALUES
      (1, 'Material', 1, 'Semen Portland PCC 50kg', 100.00, 'Sak', 65000.00),
      (1, 'Material', 2, 'Besi Beton Ulir 10mm SNI', 80.00, 'Batang', 85000.00),
      (1, 'Material', 3, 'Bata Ringan AAC 10cm', 12.00, 'M3', 650000.00),
      (1, 'Material', 4, 'Pasir Cor / Pasir Beton', 10.00, 'M3', 280000.00),
      (1, 'Material', 5, 'Granit Lantai Polished 60x60', 35.00, 'Dus', 165000.00),
      (1, 'Tenaga Kerja', NULL, 'Upah Borongan Struktur & Pondasi Tipe 36', 1.00, 'Ls', 25000000.00),
      (1, 'Tenaga Kerja', NULL, 'Upah Borongan Finishing & Keramik Tipe 36', 1.00, 'Ls', 18000000.00),
      
      (2, 'Material', 1, 'Semen Portland PCC 50kg', 150.00, 'Sak', 65000.00),
      (2, 'Material', 2, 'Besi Beton Ulir 10mm SNI', 120.00, 'Batang', 85000.00),
      (2, 'Material', 5, 'Granit Lantai Polished 60x60', 50.00, 'Dus', 165000.00),
      (2, 'Tenaga Kerja', NULL, 'Upah Borongan Struktur & Pondasi Tipe 45', 1.00, 'Ls', 35000000.00)
    `);

    // 10. Assign House RAB (Salin dari Template ke Blok A1 dan Blok A2)
    console.log('📑 Menyiapkan RAB Target pada Rumah Blok A1 dan A2...');
    await connection.query(`
      INSERT INTO house_rabs (id, house_id) VALUES (1, 1), (2, 2)
    `);

    // Copy template items to Block A1 and A2
    await connection.query(`
      INSERT INTO house_rab_items (house_rab_id, item_type, material_id, name, quantity, unit, estimated_price)
      SELECT 1, item_type, material_id, name, quantity, unit, estimated_price FROM rab_template_items WHERE rab_template_id = 1;
    `);
    await connection.query(`
      INSERT INTO house_rab_items (house_rab_id, item_type, material_id, name, quantity, unit, estimated_price)
      SELECT 2, item_type, material_id, name, quantity, unit, estimated_price FROM rab_template_items WHERE rab_template_id = 1;
    `);

    // 11. Insert Purchases & Purchase Items (FIFO & Bypass)
    console.log('🛒 Mencatat Riwayat Nota Pembelian...');
    await connection.query(`
      INSERT INTO purchases (id, supplier_id, invoice_number, purchase_date, total_amount) VALUES
      (1, 2, 'INV-2026-001', '2026-06-15', 16250000.00),
      (2, 3, 'INV-2026-002', '2026-06-20', 21250000.00),
      (3, 1, 'INV-2026-003-BYPASS', '2026-07-01', 3250000.00)
    `);

    await connection.query(`
      INSERT INTO purchase_items (id, purchase_id, material_id, quantity, price_unit, destination_type, house_id, qty_remaining) VALUES
      -- Nota 1: Masuk Gudang FIFO (Semen & Pasir)
      (1, 1, 1, 200.00, 64000.00, 'Gudang', NULL, 120.00),
      (2, 1, 4, 30.00, 275000.00, 'Gudang', NULL, 30.00),
      -- Nota 2: Masuk Gudang FIFO (Besi Beton)
      (3, 2, 2, 250.00, 85000.00, 'Gudang', NULL, 210.00),
      -- Nota 3: Bypass Langsung ke Blok A1 (Granit 60x60)
      (4, 3, 5, 20.00, 162500.00, 'Rumah', 1, 0.00)
    `);

    // 12. Insert Material Mutations (Masuk Gudang & Keluar ke Blok A1/A2)
    console.log('🔄 Mencatat Log Mutasi Gudang & Lapangan...');
    await connection.query(`
      INSERT INTO material_mutations (material_id, type, quantity, source_house_id, destination_house_id, price_unit, mutation_date, reference_id) VALUES
      -- Masuk awal dari Nota 1 & 2
      (1, 'Beli-Gudang', 200.00, NULL, NULL, 64000.00, '2026-06-15', 1),
      (4, 'Beli-Gudang', 30.00, NULL, NULL, 275000.00, '2026-06-15', 2),
      (2, 'Beli-Gudang', 250.00, NULL, NULL, 85000.00, '2026-06-20', 3),
      -- Bypass Nota 3 langsung ke Blok A1
      (5, 'Beli-Rumah', 20.00, NULL, 1, 162500.00, '2026-07-01', 4),
      
      -- Pengeluaran FIFO dari Gudang ke Blok A1 (Semen 50 Sak, Besi 40 Batang)
      (1, 'Keluar-Rumah', 50.00, NULL, 1, 64000.00, '2026-07-03', 1),
      (2, 'Keluar-Rumah', 40.00, NULL, 1, 85000.00, '2026-07-03', 3),
      
      -- Pengeluaran FIFO dari Gudang ke Blok A2 (Semen 30 Sak)
      (1, 'Keluar-Rumah', 30.00, NULL, 2, 64000.00, '2026-07-05', 1)
    `);

    // 13. Insert Borongan Contracts & Payments
    console.log('📝 Mencatat Kontrak Borongan & Pembayaran Termin...');
    await connection.query(`
      INSERT INTO borongan_contracts (id, house_id, kepala_tukang_id, work_name, contract_value, status) VALUES
      (1, 1, 1, 'Pekerjaan Struktur & Pondasi Blok A1', 25000000.00, 'Aktif'),
      (2, 2, 1, 'Pekerjaan Struktur & Pondasi Blok A2', 25000000.00, 'Aktif')
    `);

    await connection.query(`
      INSERT INTO borongan_payments (contract_id, payment_date, amount, description) VALUES
      (1, '2026-06-25', 10000000.00, 'Termin 1 (Progress Pondasi Selesai 40%)'),
      (1, '2026-07-05', 7500000.00, 'Termin 2 (Progress Struktur Naik 70%)'),
      (2, '2026-07-06', 10000000.00, 'Termin 1 (Progress Pondasi Selesai 40%)')
    `);

    connection.release();
    console.log('🎉 SEEDING BERHASIL! Seluruh data dummy real-world telah masuk ke database CCMS.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat seeding:', error);
    process.exit(1);
  }
}

seedDatabase();
