import { NextResponse } from 'next/server';
import { query, getDbConnection } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const [material] = await query('SELECT * FROM materials WHERE id = ?', [id]);
    if (!material) {
      return NextResponse.json({ success: false, error: 'Material tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: material });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, name, unit, default_price, minimum_stock } = body;

    if (!code || !name || !unit) {
      return NextResponse.json({ success: false, error: 'Kode, Nama, dan Satuan wajib diisi' }, { status: 400 });
    }

    // Check duplicate code
    const [existing] = await query('SELECT id FROM materials WHERE code = ? AND id != ?', [code.trim(), id]);
    if (existing) {
      return NextResponse.json({ success: false, error: 'Kode material sudah digunakan oleh barang lain' }, { status: 400 });
    }

    await query(
      'UPDATE materials SET code = ?, name = ?, unit = ?, default_price = ?, minimum_stock = ? WHERE id = ?',
      [code.trim(), name.trim(), unit.trim(), default_price || 0, minimum_stock || 10, id]
    );

    return NextResponse.json({ success: true, message: 'Master material berhasil diperbarui!' });
  } catch (error) {
    console.error('Error updating material:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const db = await getDbConnection();
  const connection = await db.getConnection();
  try {
    const { id } = await params;
    await connection.beginTransaction();

    // 1. Cek apakah material ini punya riwayat di purchase_items atau material_mutations
    const [purchases] = await connection.execute('SELECT id FROM purchase_items WHERE material_id = ? LIMIT 1', [id]);
    const [mutations] = await connection.execute('SELECT id FROM material_mutations WHERE material_id = ? LIMIT 1', [id]);
    const [rabItems] = await connection.execute('SELECT id FROM rab_template_items WHERE material_id = ? LIMIT 1', [id]);

    if (purchases.length > 0 || mutations.length > 0 || rabItems.length > 0) {
      await connection.rollback();
      connection.release();
      return NextResponse.json({
        success: false,
        error: 'Material tidak dapat dihapus karena sudah memiliki riwayat pembelian, mutasi FIFO, atau tercatat di template RAB. Silakan edit nama/harganya.'
      }, { status: 400 });
    }

    // 2. Hapus stok gudang dan master material
    await connection.execute('DELETE FROM warehouse_stocks WHERE material_id = ?', [id]);
    await connection.execute('DELETE FROM materials WHERE id = ?', [id]);

    await connection.commit();
    connection.release();
    return NextResponse.json({ success: true, message: 'Master material berhasil dihapus!' });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error deleting material:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
