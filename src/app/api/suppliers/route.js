import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const suppliers = await query('SELECT * FROM suppliers ORDER BY name ASC');
    return NextResponse.json({ success: true, data: suppliers });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, phone, address } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Nama supplier wajib diisi' }, { status: 400 });
    }

    const result = await query(
      'INSERT INTO suppliers (name, phone, address) VALUES (?, ?, ?)',
      [name.trim(), phone || '', address || '']
    );

    return NextResponse.json({
      success: true,
      message: 'Supplier berhasil ditambahkan',
      data: { id: result.insertId, name: name.trim(), phone: phone || '', address: address || '' }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
