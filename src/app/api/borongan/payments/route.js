import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get('contract_id');

    let sql = `
      SELECT bp.*, bc.work_name, h.block_number, kt.name as kepala_tukang_name
      FROM borongan_payments bp
      JOIN borongan_contracts bc ON bp.contract_id = bc.id
      JOIN houses h ON bc.house_id = h.id
      JOIN kepala_tukang kt ON bc.kepala_tukang_id = kt.id
    `;
    const params = [];

    if (contractId) {
      sql += ' WHERE bp.contract_id = ?';
      params.push(contractId);
    }

    sql += ' ORDER BY bp.payment_date DESC, bp.created_at DESC';

    const payments = await query(sql, params);
    return NextResponse.json({ success: true, data: payments });
  } catch (error) {
    console.error('Error fetching borongan payments:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { contract_id, payment_date, amount, description } = body;

    if (!contract_id || !payment_date || !amount || Number(amount) <= 0) {
      return NextResponse.json({ success: false, error: 'Kontrak, Tanggal Bayar, dan Jumlah Bayar (positif) wajib diisi' }, { status: 400 });
    }

    const result = await query(
      'INSERT INTO borongan_payments (contract_id, payment_date, amount, description) VALUES (?, ?, ?, ?)',
      [contract_id, payment_date, Number(amount), description || 'Pembayaran Termin']
    );

    return NextResponse.json({
      success: true,
      message: 'Pembayaran upah borongan berhasil dicatat',
      data: { id: result.insertId, contract_id, payment_date, amount: Number(amount), description }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating borongan payment:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
