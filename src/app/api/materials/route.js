import { NextResponse } from 'next/server';
import { query, getDbConnection } from '@/lib/db';

export async function GET() {
  try {
    const materials = await query(`
      SELECT m.*, 
             COALESCE(w.quantity, 0) as stock_quantity,
             CASE 
               WHEN COALESCE(w.quantity, 0) <= m.minimum_stock THEN 1 
               ELSE 0 
             END as is_low_stock
      FROM materials m
      LEFT JOIN warehouse_stocks w ON m.id = w.material_id
      ORDER BY m.name ASC
    `);
    return NextResponse.json({ success: true, data: materials });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const db = await getDbConnection();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const body = await request.json();
    const { code, name, unit, default_price, minimum_stock } = body;

    if (!code || !name || !unit) {
      await connection.rollback();
      connection.release();
      return NextResponse.json({ success: false, error: 'Kode, Nama Material, dan Satuan wajib diisi' }, { status: 400 });
    }

    // 1. Insert material
    const [result] = await connection.execute(
      'INSERT INTO materials (code, name, unit, default_price, minimum_stock) VALUES (?, ?, ?, ?, ?)',
      [code.trim().toUpperCase(), name.trim(), unit.trim(), default_price || 0, minimum_stock || 0]
    );
    const materialId = result.insertId;

    // 2. Initialize warehouse stock with 0
    await connection.execute(
      'INSERT INTO warehouse_stocks (material_id, quantity) VALUES (?, 0.00)',
      [materialId]
    );

    await connection.commit();
    connection.release();

    return NextResponse.json({
      success: true,
      message: 'Material berhasil ditambahkan dan stok gudang diinisialisasi',
      data: { id: materialId, code: code.trim().toUpperCase(), name: name.trim(), unit: unit.trim(), stock_quantity: 0 }
    }, { status: 201 });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error creating material:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
