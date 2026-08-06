import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export async function POST(request, { params }) {
  const db = await getDbConnection();
  const connection = await db.getConnection();
  try {
    const { id: houseId } = await params;
    const body = await request.json();
    let { items, phase, usage_date, work_volume, work_unit } = body;
    if (!items && body.material_id) {
      items = [{ material_id: body.material_id, quantity: body.quantity, notes: body.notes }];
    }

    if (!items || items.length === 0 || !phase || !usage_date) {
      connection.release();
      return NextResponse.json({ success: false, error: 'Data tidak lengkap' }, { status: 400 });
    }

    const finalVolume = work_volume ? Number(work_volume) : null;
    const finalUnit = work_unit ? work_unit.trim() : null;

    await connection.beginTransaction();

    for (const item of items) {
      const material_id = item.material_id;
      const qty = Number(item.quantity);
      
      if (!material_id || qty <= 0) {
        await connection.rollback();
        connection.release();
        return NextResponse.json({ success: false, error: 'Material dan jumlah valid wajib diisi' }, { status: 400 });
      }

      // 1. Cek stok lapangan
      const [stocks] = await connection.execute(
        'SELECT stock_quantity FROM house_materials WHERE house_id = ? AND material_id = ?',
        [houseId, material_id]
      );

      if (stocks.length === 0 || Number(stocks[0].stock_quantity) < qty) {
        await connection.rollback();
        connection.release();
        return NextResponse.json({ success: false, error: `Stok lapangan tidak mencukupi untuk salah satu material` }, { status: 400 });
      }

      // 2. Kurangi stok lapangan
      await connection.execute(
        'UPDATE house_materials SET stock_quantity = stock_quantity - ? WHERE house_id = ? AND material_id = ?',
        [qty, houseId, material_id]
      );

      // 3. Catat log pemakaian dengan volume
      await connection.execute(
        'INSERT INTO material_usage_logs (house_id, material_id, phase, quantity_used, usage_date, notes, work_volume, work_unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [houseId, material_id, phase, qty, usage_date, item.notes || '', finalVolume, finalUnit]
      );
    }

    await connection.commit();
    connection.release();

    return NextResponse.json({ success: true, message: 'Pemakaian material berhasil dicatat' }, { status: 201 });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error logging material usage:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
