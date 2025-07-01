import { pool } from '../db/database';
import { Status } from '../models/status.model';

export async function getAllOrigin(): Promise<Status[]> {
    const sql = `
    SELECT id, status_name
    FROM status ORDER BY status_name ASC
  `;
    const [rows] = await pool.query(sql);
    return rows as Status[];
}

export async function getOriginById(id: number): Promise<Status | null> {
    const [rows] = await pool.query(`
    SELECT *
    FROM status
    WHERE id = ?
  `,
        [id]
    );

    const result = (rows as Status[])?.[0];
    return result || null;
}

export async function createOrigin(origin: Omit<Status, 'id'>): Promise<Status> {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT id FROM status ORDER BY id DESC LIMIT 1');
    const latestID = (rows as any[])[0]?.id + 1 || null;

    try {
        await conn.beginTransaction();

        await conn.query(
            `INSERT INTO status (
        id, status_name, created_at, updated_at
      ) VALUES (?, ?, current_timestamp(), current_timestamp())`,
            [
                latestID,
                origin.status_name
            ]
        );
        await conn.commit();
        return { id: latestID, ...origin };
    } catch (err: any) {
        await conn.rollback();

        if (err.code === 'ER_DUP_ENTRY') {
            if (err.message.includes('unique_status_phone')) {
                throw new Error('Tên đã tồn tại!');
            }
        }
        throw err;
    } finally {
        conn.release();
    }
}

export async function updateOrigin(id: number, origin: Partial<Status>): Promise<Status | null> {
    const existing = await getOriginById(id);
    if (!existing) return null;

    const updated = {
        ...existing,
        ...origin,
    };

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const sqlQuery = `
        UPDATE status SET 
          status_name = ?,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;

        await conn.query(sqlQuery, [
            updated.status_name,
            id
        ]);

        await conn.commit();
        return updated;
    } catch (err: any) {
        await conn.rollback();
        if (err.code === 'ER_DUP_ENTRY') {
            if (err.message.includes('unique_status_phone')) {
                throw new Error('Tên đã tồn tại!');
            }
        }
        throw err;
    } finally {
        conn.release();
    }
}