import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // 1. Fetch house details
    const houses = await query(`
      SELECT h.*, p.name as project_name, p.location as project_location
      FROM houses h
      JOIN projects p ON h.project_id = p.id
      WHERE h.id = ?
    `, [id]);

    if (houses.length === 0) {
      return NextResponse.json({ success: false, error: 'Unit rumah tidak ditemukan' }, { status: 404 });
    }
    const house = houses[0];

    // 2. Fetch target RAB
    const rabHeaders = await query('SELECT id FROM house_rabs WHERE house_id = ?', [id]);
    let targetMaterialItems = [];
    let targetLaborItems = [];
    let targetMaterialBudget = 0;
    let targetLaborBudget = 0;

    if (rabHeaders.length > 0) {
      const rabId = rabHeaders[0].id;
      const rabItems = await query(`
        SELECT hri.*, m.code as material_code 
        FROM house_rab_items hri
        LEFT JOIN materials m ON hri.material_id = m.id
        WHERE hri.house_rab_id = ?
        ORDER BY hri.id ASC
      `, [rabId]);

      targetMaterialItems = rabItems.filter(i => i.item_type === 'Material');
      targetLaborItems = rabItems.filter(i => i.item_type === 'Tenaga Kerja');

      targetMaterialBudget = targetMaterialItems.reduce((sum, i) => sum + Number(i.total_price), 0);
      targetLaborBudget = targetLaborItems.reduce((sum, i) => sum + Number(i.total_price), 0);
    }

    // 3. Fetch Actual Materials Used (Mutations Net)
    const actualMaterialList = await query(`
      SELECT m.id as material_id, m.code as material_code, m.name as material_name, m.unit,
             COALESCE(SUM(CASE WHEN mm.destination_house_id = ? AND mm.type IN ('Beli-Rumah', 'Keluar-Rumah', 'Pindah-Rumah') THEN mm.quantity ELSE 0 END), 0) as total_in,
             COALESCE(SUM(CASE WHEN mm.source_house_id = ? AND mm.type IN ('Retur-Gudang', 'Pindah-Rumah') THEN mm.quantity ELSE 0 END), 0) as total_out,
             COALESCE(SUM(CASE WHEN mm.destination_house_id = ? AND mm.type IN ('Beli-Rumah', 'Keluar-Rumah', 'Pindah-Rumah') THEN mm.quantity ELSE 0 END), 0) -
             COALESCE(SUM(CASE WHEN mm.source_house_id = ? AND mm.type IN ('Retur-Gudang', 'Pindah-Rumah') THEN mm.quantity ELSE 0 END), 0) as net_quantity,
             
             COALESCE(SUM(CASE WHEN mm.destination_house_id = ? AND mm.type IN ('Beli-Rumah', 'Keluar-Rumah', 'Pindah-Rumah') THEN (mm.quantity * mm.price_unit) ELSE 0 END), 0) -
             COALESCE(SUM(CASE WHEN mm.source_house_id = ? AND mm.type IN ('Retur-Gudang', 'Pindah-Rumah') THEN (mm.quantity * mm.price_unit) ELSE 0 END), 0) as net_cost
      FROM materials m
      JOIN material_mutations mm ON m.id = mm.material_id
      WHERE mm.destination_house_id = ? OR mm.source_house_id = ?
      GROUP BY m.id, m.code, m.name, m.unit
      HAVING net_quantity != 0 OR net_cost != 0 OR total_in != 0
      ORDER BY m.name ASC
    `, [id, id, id, id, id, id, id, id]);

    const actualMaterialCost = actualMaterialList.reduce((sum, item) => sum + Number(item.net_cost), 0);

    // 4. Fetch Actual Labor Contracts & Payments
    const laborContracts = await query(`
      SELECT bc.*, kt.name as kepala_tukang_name,
             COALESCE((SELECT SUM(amount) FROM borongan_payments WHERE contract_id = bc.id), 0) as total_paid
      FROM borongan_contracts bc
      JOIN kepala_tukang kt ON bc.kepala_tukang_id = kt.id
      WHERE bc.house_id = ?
      ORDER BY bc.created_at DESC
    `, [id]);

    const actualLaborCost = laborContracts.reduce((sum, c) => sum + Number(c.total_paid), 0);
    const totalContractValue = laborContracts.reduce((sum, c) => sum + Number(c.contract_value), 0);

    // 5. Calculate Variances & Health Status
    const targetTotalBudget = targetMaterialBudget + targetLaborBudget;
    const actualTotalCost = actualMaterialCost + actualLaborCost;
    const varianceTotal = targetTotalBudget - actualTotalCost; // Positive means Under Budget (Hemat)

    let healthStatus = 'Aman (Under Budget)';
    if (targetTotalBudget > 0) {
      const percentageUsed = (actualTotalCost / targetTotalBudget) * 100;
      if (percentageUsed > 100) {
        healthStatus = 'Overbudget';
      } else if (percentageUsed >= 90) {
        healthStatus = 'Waspada (Mendekati Batas)';
      }
    } else if (actualTotalCost > 0) {
      healthStatus = 'Tanpa RAB (Belum Dianggarkan)';
    }

    // 6. Recent Mutations History for this house
    const recentMutations = await query(`
      SELECT mm.*, m.name as material_name, m.code as material_code, m.unit
      FROM material_mutations mm
      JOIN materials m ON mm.material_id = m.id
      WHERE mm.destination_house_id = ? OR mm.source_house_id = ?
      ORDER BY mm.mutation_date DESC, mm.id DESC
      LIMIT 10
    `, [id, id]);

    // 6. Fetch raw usage logs for Coefficient Analysis
    const usageLogs = await query(`
      SELECT u.id, u.phase, u.usage_date, u.work_volume, u.work_unit, u.created_at,
             u.material_id, m.name as material_name, m.unit as material_unit, u.quantity_used
      FROM material_usage_logs u
      JOIN materials m ON u.material_id = m.id
      WHERE u.house_id = ?
      ORDER BY u.usage_date ASC, u.created_at ASC
    `, [id]);

    return NextResponse.json({
      success: true,
      data: {
        house,
        summary: {
          target_material_budget: targetMaterialBudget,
          target_labor_budget: targetLaborBudget,
          target_total_budget: targetTotalBudget,
          actual_material_cost: actualMaterialCost,
          actual_labor_cost: actualLaborCost,
          actual_total_cost: actualTotalCost,
          total_contract_value: totalContractValue,
          variance_total: varianceTotal,
          health_status: healthStatus
        },
        target_material_items: targetMaterialItems,
        target_labor_items: targetLaborItems,
        actual_materials: actualMaterialList,
        labor_contracts: laborContracts,
        recent_mutations: recentMutations,
        usage_logs: usageLogs
      }
    });
  } catch (error) {
    console.error('Error fetching unit cost sheet:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
