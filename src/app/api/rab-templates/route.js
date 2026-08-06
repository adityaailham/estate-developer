import { NextResponse } from 'next/server';
import { query, getDbConnection } from '@/lib/db';

export async function GET() {
  try {
    const templates = await query('SELECT * FROM rab_templates ORDER BY house_type ASC');
    
    // Attach items for each template
    for (const t of templates) {
      const items = await query(`
        SELECT rti.*, m.code as material_code 
        FROM rab_template_items rti
        LEFT JOIN materials m ON rti.material_id = m.id
        WHERE rti.rab_template_id = ?
        ORDER BY rti.id ASC
      `, [t.id]);
      t.items = items;
      
      t.total_material_budget = items.filter(i => i.item_type === 'Material').reduce((sum, i) => sum + Number(i.total_price), 0);
      t.total_labor_budget = items.filter(i => i.item_type === 'Tenaga Kerja').reduce((sum, i) => sum + Number(i.total_price), 0);
      t.total_budget = t.total_material_budget + t.total_labor_budget;
    }

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching rab templates:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
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

    // Insert template header
    const [templateResult] = await connection.execute(
      'INSERT INTO rab_templates (house_type, description) VALUES (?, ?)',
      [house_type.trim(), description || '']
    );
    const templateId = templateResult.insertId;

    // Insert items if provided
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        await connection.execute(
          'INSERT INTO rab_template_items (rab_template_id, item_type, material_id, name, quantity, unit, estimated_price, phase) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            templateId,
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
      message: 'Template RAB berhasil dibuat',
      data: { id: templateId, house_type: house_type.trim(), description: description || '' }
    }, { status: 201 });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error creating rab template:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
