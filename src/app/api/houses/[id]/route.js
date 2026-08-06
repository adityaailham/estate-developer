import { NextResponse } from 'next/server';
import { query, getDbConnection } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const [house] = await query('SELECT * FROM houses WHERE id = ?', [id]);
    if (!house) {
      return NextResponse.json({ success: false, error: 'Unit rumah tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: house });
  } catch (error) {
    console.error('Error fetching house:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const db = await getDbConnection();
  const connection = await db.getConnection();
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, progress_percent } = body;

    if (!status) {
      connection.release();
      return NextResponse.json({ success: false, error: 'Status rumah wajib dipilih' }, { status: 400 });
    }

    let finalProgress = 50;
    if (status === 'Belum Mulai') finalProgress = 0;
    else if (status === 'Selesai' || status === 'Serah Terima') finalProgress = 100;
    else if (progress_percent !== undefined && progress_percent !== null) finalProgress = progress_percent;

    await connection.beginTransaction();

    await connection.execute(
      'UPDATE houses SET status = ?, progress_percent = ? WHERE id = ?',
      [status, finalProgress, id]
    );

    // Auto-Return leftover materials to warehouse if status is Finished/Handover
    let returnedCount = 0;
    if (status === 'Selesai' || status === 'Serah Terima') {
      const [leftoverMats] = await connection.execute(
        'SELECT hm.material_id, hm.stock_quantity, m.default_price FROM house_materials hm JOIN materials m ON hm.material_id = m.id WHERE hm.house_id = ? AND hm.stock_quantity > 0',
        [id]
      );

      for (const mat of leftoverMats) {
        const matId = mat.material_id;
        const qty = Number(mat.stock_quantity);

        const [issueRows] = await connection.execute(
          `SELECT SUM(quantity * price_unit) as total_c, SUM(quantity) as total_q 
           FROM material_mutations 
           WHERE destination_house_id = ? AND material_id = ? AND type IN ('Beli-Rumah', 'Keluar-Rumah', 'Pindah-Rumah')`,
          [id, matId]
        );
        const avgPrice = (issueRows.length > 0 && Number(issueRows[0].total_q) > 0)
          ? Number(issueRows[0].total_c) / Number(issueRows[0].total_q)
          : Number(mat.default_price);

        // Update warehouse stock
        await connection.execute('UPDATE warehouse_stocks SET quantity = quantity + ? WHERE material_id = ?', [qty, matId]);
        
        // Zero out house stock
        await connection.execute('UPDATE house_materials SET stock_quantity = 0 WHERE house_id = ? AND material_id = ?', [id, matId]);

        // Add back to latest purchase item if exists
        const [latestPItems] = await connection.execute('SELECT id FROM purchase_items WHERE material_id = ? ORDER BY id DESC LIMIT 1', [matId]);
        if (latestPItems.length > 0) {
          await connection.execute('UPDATE purchase_items SET qty_remaining = qty_remaining + ? WHERE id = ?', [qty, latestPItems[0].id]);
        }

        const today = new Date().toISOString().split('T')[0];
        // Create mutation record
        await connection.execute(
          'INSERT INTO material_mutations (material_id, type, quantity, source_house_id, price_unit, mutation_date) VALUES (?, ?, ?, ?, ?, ?)',
          [matId, 'Retur-Gudang', qty, id, avgPrice, today]
        );
        returnedCount++;
      }
    }

    await connection.commit();
    connection.release();

    let message = 'Status dan progress fisik unit rumah berhasil diperbarui!';
    if (returnedCount > 0) {
      message += ` Serta mengembalikan ${returnedCount} material sisa ke gudang otomatis.`;
    }

    return NextResponse.json({
      success: true,
      message: message,
      data: { id, status, progress_percent }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Error updating house status:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    
    // Deleting a house will cascade to house_rabs, house_rab_items, etc. (assuming foreign keys are set up with CASCADE)
    // Or at least we can just delete from houses table directly.
    await query('DELETE FROM houses WHERE id = ?', [id]);
    
    return NextResponse.json({ success: true, message: 'Unit rumah berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting house:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
