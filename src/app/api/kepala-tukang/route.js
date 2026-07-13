import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const data = await query('SELECT * FROM kepala_tukang ORDER BY name ASC');
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching kepala tukang:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, phone } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Nama Kepala Tukang wajib diisi' }, { status: 400 });
    }

    const result = await query(
      'INSERT INTO kepala_tukang (name, phone) VALUES (?, ?)',
      [name.trim(), phone || '']
    );

    return NextResponse.json({
      success: true,
      message: 'Kepala Tukang berhasil ditambahkan',
      data: { id: result.insertId, name: name.trim(), phone: phone || '' }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating kepala tukang:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
