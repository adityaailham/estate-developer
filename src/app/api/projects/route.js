import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/projects - Fetch all projects with unit counts
export async function GET() {
  try {
    const projects = await query(`
      SELECT p.*, 
             COUNT(h.id) as total_houses,
             SUM(CASE WHEN h.status = 'Pembangunan' THEN 1 ELSE 0 END) as active_houses,
             SUM(CASE WHEN h.status = 'Belum Mulai' THEN 1 ELSE 0 END) as pending_houses,
             SUM(CASE WHEN h.status = 'Selesai' OR h.status = 'Serah Terima' THEN 1 ELSE 0 END) as completed_houses
      FROM projects p
      LEFT JOIN houses h ON p.id = h.project_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/projects - Create a new project
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, location } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ success: false, error: 'Nama proyek wajib diisi' }, { status: 400 });
    }

    const result = await query(
      'INSERT INTO projects (name, location) VALUES (?, ?)',
      [name.trim(), location || '']
    );

    return NextResponse.json({
      success: true,
      message: 'Proyek berhasil dibuat',
      data: { id: result.insertId, name: name.trim(), location: location || '' }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
