import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id: houseId } = await params;

    // 1. Get active site stock
    const siteStock = await query(`
      SELECT hm.*, m.name, m.unit, m.code 
      FROM house_materials hm
      JOIN materials m ON hm.material_id = m.id
      WHERE hm.house_id = ? AND hm.stock_quantity > 0
    `, [houseId]);

    // 2. Get combined logs (mutations + usage)
    const logs = await query(`
      SELECT 
        u.id, 
        u.material_id, 
        m.name as material_name,
        m.unit as unit,
        'Pemakaian' as log_type,
        'OUT' as flow,
        u.quantity_used as quantity, 
        u.usage_date as date, 
        'Dipakai untuk tahap: ' || u.phase as description,
        u.phase as phase,
        COALESCE(u.notes, '') as notes,
        u.created_at as created_at
      FROM material_usage_logs u
      JOIN materials m ON u.material_id = m.id
      WHERE u.house_id = ?
      
      UNION ALL
      
      SELECT 
        mm.id, 
        mm.material_id, 
        m.name as material_name,
        m.unit as unit,
        mm.type as log_type, 
        CASE WHEN mm.destination_house_id = ? THEN 'IN' ELSE 'OUT' END as flow,
        mm.quantity as quantity, 
        mm.mutation_date as date, 
        (CASE
          WHEN mm.type = 'Keluar-Rumah' THEN 'Mutasi dari Gudang'
          WHEN mm.type = 'Beli-Rumah' THEN 'Beli Langsung ke Rumah'
          WHEN mm.type = 'Retur-Gudang' THEN 'Retur ke Gudang'
          WHEN mm.type = 'Pindah-Rumah' AND mm.destination_house_id = ? THEN 'Masuk dari blok ' || COALESCE(hs.block_number, 'lain')
          WHEN mm.type = 'Pindah-Rumah' AND mm.source_house_id = ? THEN 'Pindah ke blok ' || COALESCE(hd.block_number, 'lain')
          ELSE mm.type
        END) as description,
        'Umum' as phase,
        '' as notes,
        mm.created_at
      FROM material_mutations mm
      JOIN materials m ON mm.material_id = m.id
      LEFT JOIN houses hs ON mm.source_house_id = hs.id
      LEFT JOIN houses hd ON mm.destination_house_id = hd.id
      WHERE mm.source_house_id = ? OR mm.destination_house_id = ?
      
      ORDER BY date DESC, created_at DESC
    `, [houseId, houseId, houseId, houseId, houseId, houseId]);

    // 3. Get distinct phases from RAB and past usage logs
    const phasesRes = await query(`
      SELECT DISTINCT phase FROM (
        SELECT hri.phase 
        FROM house_rab_items hri
        JOIN house_rabs hr ON hri.house_rab_id = hr.id
        WHERE hr.house_id = ? AND hri.item_type = 'Material'
        
        UNION
        
        SELECT phase 
        FROM material_usage_logs 
        WHERE house_id = ?
      ) as combined_phases
      WHERE phase IS NOT NULL AND phase != ''
    `, [houseId, houseId]);
    const phases = phasesRes.map(p => p.phase);
    if (phases.length === 0) phases.push('Umum', 'Fondasi', 'Dinding', 'Atap & Plafon', 'Finishing');

    return NextResponse.json({ 
      success: true, 
      data: {
        site_stock: siteStock,
        logs: logs,
        phases: phases
      }
    });
  } catch (error) {
    console.error('Error fetching house materials:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
