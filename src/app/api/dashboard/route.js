import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Overview counts
    const [counts] = await query(`
      SELECT 
        (SELECT COUNT(*) FROM projects) as total_projects,
        (SELECT COUNT(*) FROM houses) as total_houses,
        (SELECT COUNT(*) FROM houses WHERE status = 'Pembangunan') as active_houses,
        (SELECT COUNT(*) FROM houses WHERE status IN ('Selesai', 'Serah Terima')) as completed_houses,
        (SELECT COUNT(*) FROM materials) as total_materials,
        (SELECT COUNT(*) FROM warehouse_stocks ws JOIN materials m ON ws.material_id = m.id WHERE ws.quantity <= m.minimum_stock) as low_stock_items,
        (SELECT COUNT(*) FROM suppliers) as total_suppliers,
        (SELECT COUNT(*) FROM borongan_contracts WHERE status = 'Aktif') as active_labor_contracts
    `);

    // 2. Financial & Cost Summary
    const [financials] = await query(`
      SELECT 
        COALESCE((SELECT SUM(estimated_price * quantity) FROM house_rab_items), 0) as total_target_rab,
        
        COALESCE((
          SELECT SUM(quantity * price_unit) FROM material_mutations 
          WHERE destination_house_id IS NOT NULL AND type IN ('Beli-Rumah', 'Keluar-Rumah', 'Pindah-Rumah')
        ), 0) - COALESCE((
          SELECT SUM(quantity * price_unit) FROM material_mutations 
          WHERE source_house_id IS NOT NULL AND type IN ('Retur-Gudang', 'Pindah-Rumah')
        ), 0) as total_actual_material_cost,
        
        COALESCE((SELECT SUM(amount) FROM borongan_payments), 0) as total_actual_labor_cost,
        
        COALESCE((
          SELECT SUM(ws.quantity * m.default_price) 
          FROM warehouse_stocks ws 
          JOIN materials m ON ws.material_id = m.id
        ), 0) as warehouse_inventory_value
    `);

    // 3. Houses breakdown by status
    const houseStatuses = await query(`
      SELECT status, COUNT(*) as count 
      FROM houses 
      GROUP BY status 
      ORDER BY count DESC
    `);

    // 4. Latest 8 Material Mutations
    const recentMutations = await query(`
      SELECT mm.*, m.name as material_name, m.code as material_code, m.unit,
             hs.block_number as source_block, hd.block_number as dest_block
      FROM material_mutations mm
      JOIN materials m ON mm.material_id = m.id
      LEFT JOIN houses hs ON mm.source_house_id = hs.id
      LEFT JOIN houses hd ON mm.destination_house_id = hd.id
      ORDER BY mm.mutation_date DESC, mm.created_at DESC
      LIMIT 8
    `);

    // 5. Low stock alerts list
    const lowStockAlerts = await query(`
      SELECT m.id, m.code, m.name, m.unit, m.minimum_stock, COALESCE(ws.quantity, 0) as current_stock
      FROM materials m
      LEFT JOIN warehouse_stocks ws ON m.id = ws.material_id
      WHERE COALESCE(ws.quantity, 0) <= m.minimum_stock
      ORDER BY COALESCE(ws.quantity, 0) ASC
      LIMIT 5
    `);

    return NextResponse.json({
      success: true,
      data: {
        overview: counts,
        financials: {
          total_target_rab: Number(financials.total_target_rab),
          total_actual_material_cost: Number(financials.total_actual_material_cost),
          total_actual_labor_cost: Number(financials.total_actual_labor_cost),
          total_actual_cost: Number(financials.total_actual_material_cost) + Number(financials.total_actual_labor_cost),
          warehouse_inventory_value: Number(financials.warehouse_inventory_value)
        },
        house_statuses: houseStatuses,
        recent_mutations: recentMutations,
        low_stock_alerts: lowStockAlerts
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
