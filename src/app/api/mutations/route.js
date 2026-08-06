import { NextResponse } from 'next/server';
import { query, getDbConnection } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const houseId = searchParams.get('house_id');
    const materialId = searchParams.get('material_id');

    let sql = `
      SELECT mm.*, m.name as material_name, m.code as material_code, m.unit,
             hs.block_number as source_house_block,
             hd.block_number as destination_house_block
      FROM material_mutations mm
      JOIN materials m ON mm.material_id = m.id
      LEFT JOIN houses hs ON mm.source_house_id = hs.id
      LEFT JOIN houses hd ON mm.destination_house_id = hd.id
      WHERE 1=1
    `;
    const params = [];

    if (houseId) {
      sql += ' AND (mm.source_house_id = ? OR mm.destination_house_id = ?)';
      params.push(houseId, houseId);
    }
    if (materialId) {
      sql += ' AND mm.material_id = ?';
      params.push(materialId);
    }

    sql += ' ORDER BY mm.mutation_date DESC, mm.created_at DESC';

    const mutations = await query(sql, params);
    return NextResponse.json({ success: true, data: mutations });
  } catch (error) {
    console.error('Error fetching mutations:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const db = await getDbConnection();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const body = await request.json();
    let { items, type, source_house_id, destination_house_id, mutation_date } = body;

    if (!items && body.material_id) {
      items = [{ material_id: body.material_id, quantity: body.quantity, difference: body.difference }];
    }

    if (!items || items.length === 0 || !type || !mutation_date) {
      await connection.rollback();
      connection.release();
      return NextResponse.json({ success: false, error: 'Data mutasi tidak lengkap' }, { status: 400 });
    }

    for (const item of items) {
      const material_id = item.material_id;
      const reqQty = Number(item.quantity);

      if (!material_id || (!reqQty && type !== 'Opname-Penyesuaian')) {
        await connection.rollback();
        connection.release();
        return NextResponse.json({ success: false, error: 'Material dan jumlah wajib diisi' }, { status: 400 });
      }

      // Check material and warehouse stock
      const [matRows] = await connection.execute('SELECT * FROM materials WHERE id = ?', [material_id]);
      if (matRows.length === 0) {
        await connection.rollback();
        connection.release();
        return NextResponse.json({ success: false, error: 'Material tidak ditemukan' }, { status: 404 });
      }
      const material = matRows[0];

      const [stockRows] = await connection.execute('SELECT quantity FROM warehouse_stocks WHERE material_id = ?', [material_id]);
      const currentStock = stockRows.length > 0 ? Number(stockRows[0].quantity) : 0;

      // --- CASE 1: KELUAR KE RUMAH (Gudang -> Unit Rumah) ---
      if (type === 'Keluar-Rumah') {
        if (!destination_house_id) {
          await connection.rollback();
          connection.release();
          return NextResponse.json({ success: false, error: 'Unit rumah tujuan wajib dipilih' }, { status: 400 });
        }

        if (currentStock < reqQty) {
          await connection.rollback();
          connection.release();
          return NextResponse.json({ 
            success: false, 
            error: `Stok gudang tidak mencukupi untuk ${material.name}. Stok: ${currentStock}, Diminta: ${reqQty}` 
          }, { status: 400 });
        }

        let needed = reqQty;
        const [purchaseItems] = await connection.execute(
          'SELECT id, price_unit, qty_remaining FROM purchase_items WHERE material_id = ? AND qty_remaining > 0 ORDER BY id ASC',
          [material_id]
        );

        for (const pItem of purchaseItems) {
          if (needed <= 0) break;
          const avail = Number(pItem.qty_remaining);
          const slice = Math.min(needed, avail);

          await connection.execute(
            'UPDATE purchase_items SET qty_remaining = qty_remaining - ? WHERE id = ?',
            [slice, pItem.id]
          );

          await connection.execute(
            'INSERT INTO material_mutations (material_id, type, quantity, destination_house_id, price_unit, mutation_date, reference_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [material_id, 'Keluar-Rumah', slice, destination_house_id, pItem.price_unit, mutation_date, pItem.id]
          );

          needed -= slice;
        }

        if (needed > 0) {
          await connection.execute(
            'INSERT INTO material_mutations (material_id, type, quantity, destination_house_id, price_unit, mutation_date) VALUES (?, ?, ?, ?, ?, ?)',
            [material_id, 'Keluar-Rumah', needed, destination_house_id, material.default_price, mutation_date]
          );
        }

        await connection.execute('UPDATE warehouse_stocks SET quantity = quantity - ? WHERE material_id = ?', [reqQty, material_id]);
        await connection.execute(
          'INSERT INTO house_materials (house_id, material_id, stock_quantity) VALUES (?, ?, ?) ON CONFLICT(house_id, material_id) DO UPDATE SET stock_quantity = stock_quantity + ?',
          [destination_house_id, material_id, reqQty, reqQty]
        );

      // --- CASE 2: RETUR KE GUDANG (Unit Rumah -> Gudang) ---
      } else if (type === 'Retur-Gudang') {
        if (!source_house_id) {
          await connection.rollback();
          connection.release();
          return NextResponse.json({ success: false, error: 'Unit rumah asal wajib dipilih untuk retur' }, { status: 400 });
        }

        const [issueRows] = await connection.execute(
          `SELECT SUM(quantity * price_unit) as total_c, SUM(quantity) as total_q 
           FROM material_mutations 
           WHERE destination_house_id = ? AND material_id = ? AND type IN ('Beli-Rumah', 'Keluar-Rumah', 'Pindah-Rumah')`,
          [source_house_id, material_id]
        );
        const avgPrice = (issueRows.length > 0 && Number(issueRows[0].total_q) > 0)
          ? Number(issueRows[0].total_c) / Number(issueRows[0].total_q)
          : Number(material.default_price);

        await connection.execute('UPDATE warehouse_stocks SET quantity = quantity + ? WHERE material_id = ?', [reqQty, material_id]);
        await connection.execute('UPDATE house_materials SET stock_quantity = stock_quantity - ? WHERE house_id = ? AND material_id = ?', [reqQty, source_house_id, material_id]);

        const [latestPItems] = await connection.execute('SELECT id FROM purchase_items WHERE material_id = ? ORDER BY id DESC LIMIT 1', [material_id]);
        if (latestPItems.length > 0) {
          await connection.execute('UPDATE purchase_items SET qty_remaining = qty_remaining + ? WHERE id = ?', [reqQty, latestPItems[0].id]);
        }

        await connection.execute(
          'INSERT INTO material_mutations (material_id, type, quantity, source_house_id, price_unit, mutation_date) VALUES (?, ?, ?, ?, ?, ?)',
          [material_id, 'Retur-Gudang', reqQty, source_house_id, avgPrice, mutation_date]
        );

      // --- CASE 3: PINDAH ANTAR RUMAH (Rumah A -> Rumah B) ---
      } else if (type === 'Pindah-Rumah') {
        if (!source_house_id || !destination_house_id || source_house_id === destination_house_id) {
          await connection.rollback();
          connection.release();
          return NextResponse.json({ success: false, error: 'Rumah asal dan tujuan harus dipilih dan berbeda' }, { status: 400 });
        }

        const [issueRows] = await connection.execute(
          `SELECT SUM(quantity * price_unit) as total_c, SUM(quantity) as total_q 
           FROM material_mutations 
           WHERE destination_house_id = ? AND material_id = ? AND type IN ('Beli-Rumah', 'Keluar-Rumah', 'Pindah-Rumah')`,
          [source_house_id, material_id]
        );
        const avgPrice = (issueRows.length > 0 && Number(issueRows[0].total_q) > 0)
          ? Number(issueRows[0].total_c) / Number(issueRows[0].total_q)
          : Number(material.default_price);

        await connection.execute(
          'INSERT INTO material_mutations (material_id, type, quantity, source_house_id, destination_house_id, price_unit, mutation_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [material_id, 'Pindah-Rumah', reqQty, source_house_id, destination_house_id, avgPrice, mutation_date]
        );
        await connection.execute('UPDATE house_materials SET stock_quantity = stock_quantity - ? WHERE house_id = ? AND material_id = ?', [reqQty, source_house_id, material_id]);
        await connection.execute(
          'INSERT INTO house_materials (house_id, material_id, stock_quantity) VALUES (?, ?, ?) ON CONFLICT(house_id, material_id) DO UPDATE SET stock_quantity = stock_quantity + ?',
          [destination_house_id, material_id, reqQty, reqQty]
        );

      // --- CASE 4: OPNAME PENYESUAIAN ---
      } else if (type === 'Opname-Penyesuaian') {
        const diff = Number(item.difference);
        if (isNaN(diff) || diff === 0) {
          await connection.rollback();
          connection.release();
          return NextResponse.json({ success: false, error: 'Selisih opname tidak boleh 0' }, { status: 400 });
        }

        if (diff < 0) {
          const absDiff = Math.abs(diff);
          if (currentStock < absDiff) {
            await connection.rollback();
            connection.release();
            return NextResponse.json({ success: false, error: `Stok gudang (${currentStock}) tidak cukup untuk penyesuaian minus (${absDiff})` }, { status: 400 });
          }

          let needed = absDiff;
          const [purchaseItems] = await connection.execute('SELECT id, price_unit, qty_remaining FROM purchase_items WHERE material_id = ? AND qty_remaining > 0 ORDER BY id ASC', [material_id]);

          for (const pItem of purchaseItems) {
            if (needed <= 0) break;
            const avail = Number(pItem.qty_remaining);
            const slice = Math.min(needed, avail);

            await connection.execute('UPDATE purchase_items SET qty_remaining = qty_remaining - ? WHERE id = ?', [slice, pItem.id]);
            await connection.execute(
              'INSERT INTO material_mutations (material_id, type, quantity, price_unit, mutation_date, reference_id) VALUES (?, ?, ?, ?, ?, ?)',
              [material_id, 'Opname-Penyesuaian', slice, pItem.price_unit, mutation_date, pItem.id]
            );
            needed -= slice;
          }

          if (needed > 0) {
            await connection.execute(
              'INSERT INTO material_mutations (material_id, type, quantity, price_unit, mutation_date) VALUES (?, ?, ?, ?, ?)',
              [material_id, 'Opname-Penyesuaian', needed, material.default_price, mutation_date]
            );
          }
          await connection.execute('UPDATE warehouse_stocks SET quantity = quantity - ? WHERE material_id = ?', [absDiff, material_id]);
        } else {
          await connection.execute('UPDATE warehouse_stocks SET quantity = quantity + ? WHERE material_id = ?', [diff, material_id]);
          const [latestPItems] = await connection.execute('SELECT id FROM purchase_items WHERE material_id = ? ORDER BY id DESC LIMIT 1', [material_id]);
          if (latestPItems.length > 0) {
            await connection.execute('UPDATE purchase_items SET qty_remaining = qty_remaining + ? WHERE id = ?', [diff, latestPItems[0].id]);
          }
          await connection.execute(
            'INSERT INTO material_mutations (material_id, type, quantity, price_unit, mutation_date) VALUES (?, ?, ?, ?, ?)',
            [material_id, 'Opname-Penyesuaian', diff, material.default_price, mutation_date]
          );
        }
      } else {
        await connection.rollback();
        connection.release();
        return NextResponse.json({ success: false, error: 'Tipe mutasi tidak dikenali' }, { status: 400 });
      }
    } // End of items loop

    await connection.commit();
    connection.release();

    return NextResponse.json({
      success: true,
      message: `Mutasi material ${type} berhasil diproses`,
    }, { status: 201 });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error processing mutation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
