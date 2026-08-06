import { NextResponse } from 'next/server';
import { query, getDbConnection } from '@/lib/db';

export async function POST(request, { params }) {
  const db = await getDbConnection();
  const connection = await db.getConnection();
  try {
    const { id: houseId } = await params;
    const body = await request.json();
    const { templateName } = body;

    if (!templateName) {
      connection.release();
      return NextResponse.json({ success: false, error: 'Nama template wajib diisi' }, { status: 400 });
    }

    // 1. Dapatkan detail rumah untuk informasi tambahan
    const [houses] = await connection.execute(
      'SELECT h.block_number, h.type, p.name as project_name FROM houses h JOIN projects p ON h.project_id = p.id WHERE h.id = ?', 
      [houseId]
    );
    if (houses.length === 0) {
      connection.release();
      return NextResponse.json({ success: false, error: 'Unit rumah tidak ditemukan' }, { status: 404 });
    }
    const house = houses[0];

    await connection.beginTransaction();

    // 2. Buat Template RAB Baru
    const [templateRes] = await connection.execute(
      'INSERT INTO rab_templates (house_type, description) VALUES (?, ?)',
      [`${house.type} (${templateName})`, `Template otomatis dari aktual Blok ${house.block_number}`]
    );
    const newTemplateId = templateRes.insertId;

    let totalBudget = 0;

    // 3. Dapatkan Total Volume Progres per Phase
    const [phaseVolumes] = await connection.execute(
      `SELECT phase, MAX(work_unit) as work_unit, SUM(daily_vol) as total_volume
       FROM (
         SELECT phase, created_at, MAX(work_unit) as work_unit, MAX(work_volume) as daily_vol
         FROM material_usage_logs
         WHERE house_id = ? AND work_volume IS NOT NULL
         GROUP BY phase, created_at
       ) sub
       GROUP BY phase`,
       [houseId]
    );
    const volumeMap = {};
    for (const pv of phaseVolumes) {
      volumeMap[pv.phase] = { vol: pv.total_volume, unit: pv.work_unit };
    }

    // 4. Agregasi Material dari Pemakaian Aktual
    const [materialUsage] = await connection.execute(
      `SELECT u.phase, u.material_id, SUM(u.quantity_used) as total_qty, m.name, m.unit, m.default_price 
       FROM material_usage_logs u
       JOIN materials m ON u.material_id = m.id
       WHERE u.house_id = ?
       GROUP BY u.phase, u.material_id, m.name, m.unit, m.default_price`,
      [houseId]
    );

    for (const mat of materialUsage) {
      const estimatedPrice = Number(mat.default_price);
      const phaseVol = volumeMap[mat.phase] || { vol: null, unit: null };

      await connection.execute(
        `INSERT INTO rab_template_items 
        (rab_template_id, item_type, phase, material_id, name, quantity, unit, estimated_price, work_volume, work_unit) 
        VALUES (?, 'Material', ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newTemplateId, mat.phase || 'Umum', mat.material_id, mat.name, mat.total_qty, mat.unit, estimatedPrice, phaseVol.vol, phaseVol.unit]
      );
    }

    // 4. Agregasi Upah Tenaga Kerja dari Kontrak
    const [laborContracts] = await connection.execute(
      `SELECT work_name as phase, SUM(contract_value) as total_amount 
       FROM borongan_contracts 
       WHERE house_id = ?
       GROUP BY work_name`,
      [houseId]
    );

    for (const lab of laborContracts) {
      const amount = Number(lab.total_amount);

      await connection.execute(
        `INSERT INTO rab_template_items 
        (rab_template_id, item_type, phase, name, quantity, unit, estimated_price) 
        VALUES (?, 'Tenaga Kerja', ?, ?, 1, 'Ls', ?)`,
        [newTemplateId, lab.phase || 'Umum', `Upah Borongan ${lab.phase}`, amount]
      );
    }

    await connection.commit();
    connection.release();

    return NextResponse.json({ 
      success: true, 
      message: 'Berhasil mengkonversi data aktual menjadi Template RAB baru!',
      data: { template_id: newTemplateId }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error exporting RAB template:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
