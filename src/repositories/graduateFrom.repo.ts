import { pool } from '../db/database';
import { GraduatedFrom } from '../models/graduateFrom.model';

export async function getAllGra(): Promise<GraduatedFrom[]> {
    const sql = `
    SELECT id, school_name
    FROM graduated_from ORDER BY school_name ASC
  `;
    const [rows] = await pool.query(sql);
    return rows as GraduatedFrom[];
}

export async function getGraById(id: number): Promise<GraduatedFrom | null> {
    const [rows] = await pool.query(`
    SELECT *
    FROM graduated_from
    WHERE id = ?
  `,
        [id]
    );

    const result = (rows as GraduatedFrom[])?.[0];
    return result || null;
}

export async function createGra(origin: Omit<GraduatedFrom, 'id'>): Promise<GraduatedFrom> {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT id FROM graduated_from ORDER BY id DESC LIMIT 1');
    const latestID = (rows as any[])[0]?.id + 1 || null;

    try {
        await conn.beginTransaction();

        await conn.query(
            `INSERT INTO graduated_from (
        id, school_name, created_at, updated_at
      ) VALUES (?, ?, current_timestamp(), current_timestamp())`,
            [
                latestID,
                origin.school_name
            ]
        );
        await conn.commit();
        return { id: latestID, ...origin };
    } catch (err: any) {
        await conn.rollback();

        if (err.code === 'ER_DUP_ENTRY') {
            if (err.message.includes('unique_school_name')) {
                throw new Error('Tên đã tồn tại!');
            }
        }
        throw err;
    } finally {
        conn.release();
    }
}

export async function updateGra(id: number, origin: Partial<GraduatedFrom>): Promise<GraduatedFrom | null> {
    const existing = await getGraById(id);
    if (!existing) return null;

    const updated = {
        ...existing,
        ...origin,
    };

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const sqlQuery = `
        UPDATE graduated_from SET 
          school_name = ?,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;

        await conn.query(sqlQuery, [
            updated.school_name,
            id
        ]);

        await conn.commit();
        return updated;
    } catch (err: any) {
        await conn.rollback();
        if (err.code === 'ER_DUP_ENTRY') {
            if (err.message.includes('unique_school_name')) {
                throw new Error('Tên đã tồn tại!');
            }
        }
        throw err;
    } finally {
        conn.release();
    }
}