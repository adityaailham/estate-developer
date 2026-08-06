import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const houseId = searchParams.get('house_id');

    let sql = `
      SELECT bc.*, h.block_number, h.type as house_type, kt.name as kepala_tukang_name, kt.phone as kepala_tukang_phone,
             COALESCE((
               SELECT SUM(amount) FROM borongan_payments WHERE contract_id = bc.id
             ), 0) as total_paid
      FROM borongan_contracts bc
      JOIN houses h ON bc.house_id = h.id
      JOIN kepala_tukang kt ON bc.kepala_tukang_id = kt.id
    `;
    const params = [];

    if (houseId) {
      sql += ' WHERE bc.house_id = ?';
      params.push(houseId);
    }

    sql += ' ORDER BY bc.created_at DESC';

    const contracts = await query(sql, params);

    // Calculate remaining balance
    for (const c of contracts) {
      c.remaining_balance = Number(c.contract_value) - Number(c.total_paid);
    }

    return NextResponse.json({ success: true, data: contracts });
  } catch (error) {
    console.error('Error fetching borongan contracts:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { house_id, kepala_tukang_id, work_name, contract_value, status } = body;

    if (!house_id || !kepala_tukang_id || !work_name || !contract_value) {
      return NextResponse.json({ success: false, error: 'Unit Rumah, Kepala Tukang, Nama Pekerjaan, dan Nilai Kontrak wajib diisi' }, { status: 400 });
    }

    const db = await getDbConnection();
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        'INSERT INTO borongan_contracts (house_id, kepala_tukang_id, work_name, contract_value, status) VALUES (?, ?, ?, ?, ?)',
        [house_id, kepala_tukang_id, work_name.trim(), Number(contract_value), status || 'Lunas']
      );
      const contractId = result.insertId;

      await connection.execute(
        'INSERT INTO borongan_payments (contract_id, payment_date, amount, description) VALUES (?, ?, ?, ?)',
        [contractId, new Date().toISOString().split('T')[0], Number(contract_value), 'Lunas (Otomatis)']
      );

      await connection.commit();
      connection.release();

      return NextResponse.json({
        success: true,
        message: 'Kontrak borongan lunas berhasil dicatat',
        data: { id: contractId, house_id, kepala_tukang_id, work_name: work_name.trim(), contract_value: Number(contract_value) }
      }, { status: 201 });
    } catch(err) {
      if (connection) {
        await connection.rollback();
        connection.release();
      }
      throw err;
    }
  } catch (error) {
    console.error('Error creating borongan contract:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
