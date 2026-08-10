import { NextResponse } from 'next/server';
import { query, getDbConnection } from '@/lib/db';

export async function GET() {
  try {
    const purchases = await query(`
      SELECT p.*, s.name as supplier_name,
             COALESCE(item_aggs.total_items, 0) as total_items,
             item_aggs.item_details
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN (
          SELECT pi.purchase_id, 
                 COUNT(pi.id) as total_items,
                 GROUP_CONCAT(m.name || ' (' || pi.quantity || ' ' || m.unit || ')', '||') as item_details
          FROM purchase_items pi
          LEFT JOIN materials m ON pi.material_id = m.id
          GROUP BY pi.purchase_id
      ) item_aggs ON p.id = item_aggs.purchase_id
      ORDER BY p.purchase_date DESC, p.created_at DESC
    `);
    return NextResponse.json({ success: true, data: purchases });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const db = await getDbConnection();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const body = await request.json();
    const { supplier_id, invoice_number, purchase_date, items } = body;

    if (!supplier_id || !invoice_number || !purchase_date || !Array.isArray(items) || items.length === 0) {
      await connection.rollback();
      connection.release();
      return NextResponse.json({ success: false, error: 'Supplier, Nomor Nota, Tanggal, dan Item belanja wajib diisi' }, { status: 400 });
    }

    // 1. Calculate total and check invoice duplication
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += Number(item.quantity) * Number(item.price_unit);
    }

    const [purchaseResult] = await connection.execute(
      'INSERT INTO purchases (supplier_id, invoice_number, purchase_date, total_amount) VALUES (?, ?, ?, ?)',
      [supplier_id, invoice_number.trim(), purchase_date, totalAmount]
    );
    const purchaseId = purchaseResult.insertId;

    // 2. Process each purchase item
    for (const item of items) {
      const qty = Number(item.quantity);
      const priceUnit = Number(item.price_unit);
      const destType = item.destination_type || 'Gudang'; // 'Gudang' or 'Rumah'
      const houseId = destType === 'Rumah' ? item.house_id : null;
      const qtyRemaining = destType === 'Gudang' ? qty : 0;

      const [itemResult] = await connection.execute(
        'INSERT INTO purchase_items (purchase_id, material_id, quantity, price_unit, destination_type, house_id, qty_remaining) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [purchaseId, item.material_id, qty, priceUnit, destType, houseId, qtyRemaining]
      );
      const purchaseItemId = itemResult.insertId;

      if (destType === 'Gudang') {
        // Add to warehouse stock
        await connection.execute(
          'INSERT INTO warehouse_stocks (material_id, quantity) VALUES (?, ?) ON CONFLICT(material_id) DO UPDATE SET quantity = quantity + ?',
          [item.material_id, qty, qty]
        );

        // Log mutation Beli-Gudang
        await connection.execute(
          'INSERT INTO material_mutations (material_id, type, quantity, price_unit, mutation_date, reference_id) VALUES (?, ?, ?, ?, ?, ?)',
          [item.material_id, 'Beli-Gudang', qty, priceUnit, purchase_date, purchaseItemId]
        );
      } else if (destType === 'Rumah' && houseId) {
        // Bypass warehouse, allocate directly to house stock
        await connection.execute(
          'INSERT INTO house_materials (house_id, material_id, stock_quantity) VALUES (?, ?, ?) ON CONFLICT(house_id, material_id) DO UPDATE SET stock_quantity = stock_quantity + ?',
          [houseId, item.material_id, qty, qty]
        );

        await connection.execute(
          'INSERT INTO material_mutations (material_id, type, quantity, destination_house_id, price_unit, mutation_date, reference_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [item.material_id, 'Beli-Rumah', qty, houseId, priceUnit, purchase_date, purchaseItemId]
        );
      }
    }

    await connection.commit();
    connection.release();

    return NextResponse.json({
      success: true,
      message: 'Transaksi pembelian berhasil disimpan',
      data: { id: purchaseId, invoice_number: invoice_number.trim(), total_amount: totalAmount }
    }, { status: 201 });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error processing purchase:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
