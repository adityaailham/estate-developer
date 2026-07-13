import { NextResponse } from 'next/server';
import { query, getDbConnection } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    let sql = `
      SELECT h.*, p.name as project_name,
             COALESCE((
               SELECT SUM(total_cost) FROM material_mutations 
               WHERE destination_house_id = h.id AND type IN ('Beli-Rumah', 'Keluar-Rumah', 'Pindah-Rumah')
             ), 0) - COALESCE((
               SELECT SUM(total_cost) FROM material_mutations 
               WHERE source_house_id = h.id AND type IN ('Retur-Gudang', 'Pindah-Rumah')
             ), 0) as actual_material_cost,
             COALESCE((
               SELECT SUM(bp.amount) FROM borongan_payments bp
               JOIN borongan_contracts bc ON bp.contract_id = bc.id
               WHERE bc.house_id = h.id
             ), 0) as actual_labor_cost
      FROM houses h
      JOIN projects p ON h.project_id = p.id
    `;
    const params = [];
    if (projectId) {
      sql += ' WHERE h.project_id = ?';
      params.push(projectId);
    }
    sql += ' ORDER BY h.block_number ASC';

    const houses = await query(sql, params);
    return NextResponse.json({ success: true, data: houses });
  } catch (error) {
    console.error('Error fetching houses:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const db = await getDbConnection();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const body = await request.json();
    const { project_id, block_number, type, selling_price, status } = body;

    if (!project_id || !block_number || !type) {
      await connection.rollback();
      connection.release();
      return NextResponse.json({ success: false, error: 'Proyek, Nomor Blok, dan Tipe Rumah wajib diisi' }, { status: 400 });
    }

    const initialStatus = status || 'Belum Mulai';
    let initialProgress = 0;
    if (initialStatus === 'Pembangunan') initialProgress = 50;
    else if (initialStatus === 'Selesai' || initialStatus === 'Serah Terima') initialProgress = 100;

    // 1. Insert house
    const [houseResult] = await connection.execute(
      'INSERT INTO houses (project_id, block_number, type, selling_price, status, progress_percent) VALUES (?, ?, ?, ?, ?, ?)',
      [project_id, block_number.trim(), type.trim(), selling_price || 0, initialStatus, initialProgress]
    );
    const houseId = houseResult.insertId;

    // 2. Check if RAB template exists for this type
    const [templates] = await connection.execute(
      'SELECT id FROM rab_templates WHERE house_type = ?',
      [type.trim()]
    );

    if (templates.length > 0) {
      const templateId = templates[0].id;

      // Create house_rabs header
      const [rabResult] = await connection.execute(
        'INSERT INTO house_rabs (house_id) VALUES (?)',
        [houseId]
      );
      const houseRabId = rabResult.insertId;

      // Copy items from rab_template_items
      const [templateItems] = await connection.execute(
        'SELECT * FROM rab_template_items WHERE rab_template_id = ?',
        [templateId]
      );

      for (const item of templateItems) {
        await connection.execute(
          'INSERT INTO house_rab_items (house_rab_id, item_type, material_id, name, quantity, unit, estimated_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [houseRabId, item.item_type, item.material_id || null, item.name, item.quantity, item.unit, item.estimated_price]
        );
      }
    }

    await connection.commit();
    connection.release();

    return NextResponse.json({
      success: true,
      message: 'Unit rumah berhasil dibuat beserta salinan RAB target (jika template ada)',
      data: { id: houseId, project_id, block_number, type }
    }, { status: 201 });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error creating house:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
