import { NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';

export async function POST(request, { params }) {
  const { id } = await params;
  const db = await getDbConnection();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Fetch house type
    const [houses] = await connection.execute('SELECT type FROM houses WHERE id = ?', [id]);
    if (houses.length === 0) {
      throw new Error('Unit rumah tidak ditemukan');
    }
    const houseType = houses[0].type;

    // Find master RAB for this house type
    const [templates] = await connection.execute('SELECT id FROM rab_templates WHERE house_type = ?', [houseType]);
    if (templates.length === 0) {
      throw new Error(`Master template RAB untuk tipe '${houseType}' belum ada`);
    }
    const templateId = templates[0].id;

    // Fetch template items
    const [templateItems] = await connection.execute('SELECT * FROM rab_template_items WHERE rab_template_id = ?', [templateId]);
    if (templateItems.length === 0) {
      throw new Error('Master template RAB masih kosong');
    }

    // Check if house_rabs exists for this house
    const [existingRabs] = await connection.execute('SELECT id FROM house_rabs WHERE house_id = ?', [id]);
    let houseRabId;

    if (existingRabs.length > 0) {
      houseRabId = existingRabs[0].id;
      // Clear existing items
      await connection.execute('DELETE FROM house_rab_items WHERE house_rab_id = ?', [houseRabId]);
    } else {
      // Create new header
      const [rabResult] = await connection.execute('INSERT INTO house_rabs (house_id) VALUES (?)', [id]);
      houseRabId = rabResult.insertId;
    }

    // Insert new items from template
    for (const item of templateItems) {
      await connection.execute(
        'INSERT INTO house_rab_items (house_rab_id, item_type, material_id, name, quantity, unit, estimated_price, phase) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [houseRabId, item.item_type, item.material_id || null, item.name, item.quantity, item.unit, item.estimated_price, item.phase || 'Umum']
      );
    }

    await connection.commit();
    connection.release();

    return NextResponse.json({ success: true, message: 'Berhasil mensinkronisasi RAB dari Master Template' });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error syncing rab:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
