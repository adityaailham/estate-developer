import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export async function DELETE(request, { params }) {
  const db = await getDbConnection();
  const connection = await db.getConnection();
  try {
    const { id } = await params;
    await connection.beginTransaction();

    // 1. Fetch purchase header and items
    const [purchases] = await connection.execute('SELECT * FROM purchases WHERE id = ?', [id]);
    if (purchases.length === 0) {
      await connection.rollback();
      connection.release();
      return NextResponse.json({ success: false, error: 'Nota pembelian tidak ditemukan' }, { status: 404 });
    }

    const [items] = await connection.execute('SELECT * FROM purchase_items WHERE purchase_id = ?', [id]);

    // 2. Cek keamanan setiap item
    for (const item of items) {
      const { material_id, quantity, destination_type, house_id, qty_remaining } = item;

      if (destination_type === 'Gudang') {
        // Cek apakah sebagian sudah terpakai di FIFO (qty_remaining < quantity)
        if (Number(qty_remaining) < Number(quantity)) {
          await connection.rollback();
          connection.release();
          const terpakai = Number(quantity) - Number(qty_remaining);
          return NextResponse.json({
            success: false,
            error: `Nota pembelian tidak dapat dihapus karena ${terpakai} satuan material sudah terpakai di lapangan melalui antrean FIFO. Silakan lakukan retur/adjustment di menu Mutasi.`
          }, { status: 400 });
        }

        // Cek apakah stok di gudang saat ini cukup untuk dikurangi
        const [stockRows] = await connection.execute('SELECT quantity FROM warehouse_stocks WHERE material_id = ?', [material_id]);
        const currentStock = stockRows.length > 0 ? Number(stockRows[0].quantity) : 0;
        if (currentStock < Number(quantity)) {
          await connection.rollback();
          connection.release();
          return NextResponse.json({
            success: false,
            error: `Stok gudang saat ini (${currentStock}) tidak cukup untuk membatalkan pembelian (${quantity}).`
          }, { status: 400 });
        }
      } else if (destination_type === 'Rumah' && house_id) {
        // Cek Cost Freeze
        const [houseRows] = await connection.execute('SELECT status FROM houses WHERE id = ?', [house_id]);
        if (houseRows.length > 0 && (houseRows[0].status === 'Selesai' || houseRows[0].status === 'Serah Terima')) {
          await connection.rollback();
          connection.release();
          return NextResponse.json({
            success: false,
            error: `Nota pembelian bypass ini tidak dapat dihapus karena unit rumah tujuan berstatus '${houseRows[0].status}' (Cost Freeze).`
          }, { status: 400 });
        }
      }
    }

    // 3. Rollback stok dan hapus mutasi log terkait pembelian ini
    for (const item of items) {
      if (item.destination_type === 'Gudang') {
        await connection.execute(
          'UPDATE warehouse_stocks SET quantity = quantity - ? WHERE material_id = ?',
          [item.quantity, item.material_id]
        );
      }
      // Hapus log material_mutations yang terkait dengan purchase_item ini
      await connection.execute('DELETE FROM material_mutations WHERE reference_id = ?', [item.id]);
    }

    // 4. Hapus purchase_items & purchases
    await connection.execute('DELETE FROM purchase_items WHERE purchase_id = ?', [id]);
    await connection.execute('DELETE FROM purchases WHERE id = ?', [id]);

    await connection.commit();
    connection.release();
    return NextResponse.json({ success: true, message: 'Nota pembelian berhasil dihapus dan stok telah disesuaikan!' });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error deleting purchase:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
