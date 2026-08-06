import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export async function PUT(request, { params }) {
  const { id } = await params;
  const db = await getDbConnection();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const body = await request.json();
    const { house_type, description, items } = body;

    if (!house_type || house_type.trim() === '') {
      await connection.rollback();
      connection.release();
      return NextResponse.json({ success: false, error: 'Tipe Rumah wajib diisi (Contoh: Tipe 36)' }, { status: 400 });
    }

    // Update template header
    await connection.execute(
      'UPDATE rab_templates SET house_type = ?, description = ? WHERE id = ?',
      [house_type.trim(), description || '', id]
    );

    // Delete existing items
    await connection.execute('DELETE FROM rab_template_items WHERE rab_template_id = ?', [id]);

    // Insert new items if provided
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        await connection.execute(
          'INSERT INTO rab_template_items (rab_template_id, item_type, material_id, name, quantity, unit, estimated_price, phase) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            id,
            item.item_type || 'Material',
            item.material_id || null,
            item.name.trim(),
            item.quantity || 0,
            item.unit.trim(),
            item.estimated_price || 0,
            item.phase || 'Umum'
          ]
        );
      }
    }

    await connection.commit();
    connection.release();

    return NextResponse.json({
      success: true,
      message: 'Template RAB berhasil diperbarui',
      data: { id, house_type: house_type.trim(), description: description || '' }
    }, { status: 200 });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error updating rab template:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const db = await getDbConnection();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute('DELETE FROM rab_template_items WHERE rab_template_id = ?', [id]);
    await connection.execute('DELETE FROM rab_templates WHERE id = ?', [id]);

    await connection.commit();
    connection.release();

    return NextResponse.json({ success: true, message: 'Template RAB berhasil dihapus' });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error deleting rab template:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
