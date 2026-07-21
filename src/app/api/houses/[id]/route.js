import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const [house] = await query('SELECT * FROM houses WHERE id = ?', [id]);
    if (!house) {
      return NextResponse.json({ success: false, error: 'Unit rumah tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: house });
  } catch (error) {
    console.error('Error fetching house:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, progress_percent } = body;

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status rumah wajib dipilih' }, { status: 400 });
    }

    let finalProgress = 50;
    if (status === 'Belum Mulai') finalProgress = 0;
    else if (status === 'Selesai' || status === 'Serah Terima') finalProgress = 100;
    else if (progress_percent !== undefined && progress_percent !== null) finalProgress = progress_percent;

    await query(
      'UPDATE houses SET status = ?, progress_percent = ? WHERE id = ?',
      [status, finalProgress, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Status dan progress fisik unit rumah berhasil diperbarui!',
      data: { id, status, progress_percent }
    });
  } catch (error) {
    console.error('Error updating house status:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    // Deleting a house will cascade to house_rabs, house_rab_items, etc. (assuming foreign keys are set up with CASCADE)
    // Or at least we can just delete from houses table directly.
    await query('DELETE FROM houses WHERE id = ?', [id]);
    
    return NextResponse.json({ success: true, message: 'Unit rumah berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting house:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
