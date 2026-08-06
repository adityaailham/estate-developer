import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export async function DELETE(request, { params }) {
  const db = await getDbConnection();
  const connection = await db.getConnection();
  try {
    const { id } = await params;
    await connection.beginTransaction();

    // 1. Fetch mutation details
    const [mutRows] = await connection.execute('SELECT * FROM material_mutations WHERE id = ?', [id]);
    if (mutRows.length === 0) {
      await connection.rollback();
      connection.release();
      return NextResponse.json({ success: false, error: 'Data mutasi tidak ditemukan' }, { status: 404 });
    }
    const mut = mutRows[0];
    const { material_id, type, quantity, source_house_id, destination_house_id, reference_id } = mut;

    // 2. Cek Cost Freeze jika tujuan/asal adalah rumah
    if (destination_house_id) {
      const [houseRows] = await connection.execute('SELECT status FROM houses WHERE id = ?', [destination_house_id]);
      if (houseRows.length > 0 && (houseRows[0].status === 'Selesai' || houseRows[0].status === 'Serah Terima')) {
        await connection.rollback();
        connection.release();
        return NextResponse.json({
          success: false,
          error: `Mutasi tidak dapat dihapus karena unit rumah tujuan berstatus '${houseRows[0].status}' (Cost Freeze).`
        }, { status: 400 });
      }
    }
    if (source_house_id) {
      const [houseRows] = await connection.execute('SELECT status FROM houses WHERE id = ?', [source_house_id]);
      if (houseRows.length > 0 && (houseRows[0].status === 'Selesai' || houseRows[0].status === 'Serah Terima')) {
        await connection.rollback();
        connection.release();
        return NextResponse.json({
          success: false,
          error: `Mutasi tidak dapat dihapus karena unit rumah asal berstatus '${houseRows[0].status}' (Cost Freeze).`
        }, { status: 400 });
      }
    }

    // 3. Lakukan Rollback sesuai tipe mutasi
    if (type === 'Keluar-Rumah') {
      // Kembalikan stok ke Gudang Utama
      await connection.execute(
        'UPDATE warehouse_stocks SET quantity = quantity + ? WHERE material_id = ?',
        [quantity, material_id]
      );
      // Jika ada reference_id (pembelian FIFO), kembalikan juga ke qty_remaining pembelian tsb
      if (reference_id) {
        await connection.execute(
          'UPDATE purchase_items SET qty_remaining = qty_remaining + ? WHERE id = ?',
          [quantity, reference_id]
        );
      }
    } else if (type === 'Beli-Gudang' || type === 'Retur-Gudang') {
      // Cek apakah stok di gudang masih cukup untuk dikurangi
      const [stockRows] = await connection.execute('SELECT quantity FROM warehouse_stocks WHERE material_id = ?', [material_id]);
      const currentStock = stockRows.length > 0 ? Number(stockRows[0].quantity) : 0;
      if (currentStock < quantity) {
        await connection.rollback();
        connection.release();
        return NextResponse.json({
          success: false,
          error: `Mutasi masuk tidak dapat dihapus karena sebagian/seluruh stoknya (${quantity}) sudah terpakai di lapangan. Stok saat ini: ${currentStock}.`
        }, { status: 400 });
      }
      await connection.execute(
        'UPDATE warehouse_stocks SET quantity = quantity - ? WHERE material_id = ?',
        [quantity, material_id]
      );
    }
    // Jika type === 'Pindah-Rumah' atau 'Beli-Rumah' (bypass), cukup hapus log mutasi karena stok tidak masuk ke gudang global

    // 4. Hapus baris mutasi
    await connection.execute('DELETE FROM material_mutations WHERE id = ?', [id]);

    await connection.commit();
    connection.release();
    return NextResponse.json({ success: true, message: 'Transaksi mutasi berhasil dibatalkan & stok dikembalikan!' });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error deleting mutation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
