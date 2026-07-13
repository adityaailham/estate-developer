import mysql from 'mysql2/promise';

async function simulateA1Usage() {
  console.log('🚀 Memulai simulasi pemakaian material hari ini untuk Blok A1...');

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
    await connection.beginTransaction();

    const today = new Date().toISOString().split('T')[0];

    // 0. Pastikan ada Nota Pembelian untuk Bata Ringan AAC (material_id = 3) di Gudang FIFO agar simulasi FIFO sempurna
    const [existingBataPurchase] = await connection.execute(
      'SELECT id FROM purchase_items WHERE material_id = 3 AND destination_type = "Gudang" AND qty_remaining > 0 LIMIT 1'
    );
    let bataPurchaseItemId;

    if (existingBataPurchase.length === 0) {
      console.log('📦 Menambahkan Nota Pembelian FIFO untuk Bata Ringan AAC ke Gudang...');
      const [purchaseRes] = await connection.execute(
        'INSERT INTO purchases (supplier_id, invoice_number, purchase_date, total_amount) VALUES (?, ?, ?, ?)',
        [1, 'INV-2026-004-BATA', today, 25800000.00]
      );
      const purchaseId = purchaseRes.insertId;

      const [itemRes] = await connection.execute(
        'INSERT INTO purchase_items (purchase_id, material_id, quantity, price_unit, destination_type, house_id, qty_remaining) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [purchaseId, 3, 40.00, 645000.00, 'Gudang', null, 40.00]
      );
      bataPurchaseItemId = itemRes.insertId;

      // Update stok gudang bata jika belum tercatat cukup
      await connection.execute(
        'INSERT INTO warehouse_stocks (material_id, quantity) VALUES (3, 40.00) ON DUPLICATE KEY UPDATE quantity = quantity + 40.00'
      );
    } else {
      bataPurchaseItemId = existingBataPurchase[0].id;
    }

    // Daftar material yang terpakai hari ini untuk Blok A1 (house_id = 1)
    const usages = [
      {
        material_id: 1, // Semen Portland PCC 50kg
        name: 'Semen Portland PCC 50kg',
        reqQty: 30.00,
        unit: 'Sak'
      },
      {
        material_id: 4, // Pasir Cor / Pasir Beton
        name: 'Pasir Cor / Pasir Beton Bersih',
        reqQty: 8.00,
        unit: 'M3'
      },
      {
        material_id: 3, // Bata Ringan AAC 10cm
        name: 'Bata Ringan AAC 10cm',
        reqQty: 10.00,
        unit: 'M3'
      }
    ];

    for (const usage of usages) {
      console.log(`\n⏳ Memproses keluar gudang untuk Blok A1: ${usage.reqQty} ${usage.unit} ${usage.name}...`);

      // Cek stok gudang
      const [stockRows] = await connection.execute(
        'SELECT quantity FROM warehouse_stocks WHERE material_id = ? FOR UPDATE',
        [usage.material_id]
      );
      const currentStock = stockRows.length > 0 ? Number(stockRows[0].quantity) : 0;

      if (currentStock < usage.reqQty) {
        throw new Error(`Stok gudang ${usage.name} tidak mencukupi! Stok: ${currentStock}, Diminta: ${usage.reqQty}`);
      }

      // FIFO Allocation Loop
      let needed = usage.reqQty;
      const [purchaseItems] = await connection.execute(
        'SELECT id, price_unit, qty_remaining FROM purchase_items WHERE material_id = ? AND qty_remaining > 0 AND destination_type = "Gudang" ORDER BY id ASC FOR UPDATE',
        [usage.material_id]
      );

      for (const pItem of purchaseItems) {
        if (needed <= 0) break;
        const avail = Number(pItem.qty_remaining);
        const slice = Math.min(needed, avail);

        // Deduct from purchase_item
        await connection.execute(
          'UPDATE purchase_items SET qty_remaining = qty_remaining - ? WHERE id = ?',
          [slice, pItem.id]
        );

        // Log mutation
        await connection.execute(
          'INSERT INTO material_mutations (material_id, type, quantity, destination_house_id, price_unit, mutation_date, reference_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [usage.material_id, 'Keluar-Rumah', slice, 1, pItem.price_unit, today, pItem.id]
        );

        const subtotal = slice * Number(pItem.price_unit);
        console.log(`   ✅ terpotong dari Nota ID #${pItem.id} (FIFO): ${slice} ${usage.unit} x Rp ${Number(pItem.price_unit).toLocaleString('id-ID')} = Rp ${subtotal.toLocaleString('id-ID')}`);

        needed -= slice;
      }

      if (needed > 0) {
        // Fallback jika tidak ada record nota purchase
        const [matRows] = await connection.execute('SELECT default_price FROM materials WHERE id = ?', [usage.material_id]);
        const fallbackPrice = matRows[0]?.default_price || 0;
        await connection.execute(
          'INSERT INTO material_mutations (material_id, type, quantity, destination_house_id, price_unit, mutation_date) VALUES (?, ?, ?, ?, ?, ?)',
          [usage.material_id, 'Keluar-Rumah', needed, 1, fallbackPrice, today]
        );
        console.log(`   ⚠️ sisa ${needed} ${usage.unit} menggunakan harga standar material Rp ${Number(fallbackPrice).toLocaleString('id-ID')}`);
      }

      // Potong stok gudang
      await connection.execute(
        'UPDATE warehouse_stocks SET quantity = quantity - ? WHERE material_id = ?',
        [usage.reqQty, usage.material_id]
      );
    }

    await connection.commit();
    connection.release();
    console.log('\n🎉 SIMULASI BERHASIL! Seluruh pemakaian material hari ini telah masuk ke Cost Sheet Blok A1 secara real-time.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Terjadi kesalahan saat simulasi:', error);
    process.exit(1);
  }
}

simulateA1Usage();
