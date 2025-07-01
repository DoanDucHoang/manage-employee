import { ParsedUrlQuery } from 'querystring';
import { pool } from '../db/database';
import { Origin } from '../models/origin.model';

export async function getAllOrigin(): Promise<Origin[]> {
    const sql = `
    SELECT id, origin_name
    FROM origins ORDER BY id ASC
  `;
    const [rows] = await pool.query(sql);
    return rows as Origin[];
}

export async function getOriginById(id: number): Promise<Origin | null> {
    const [rows] = await pool.query(`
    SELECT *
    FROM origins
    WHERE id = ?
  `,
        [id]
    );

    const result = (rows as Origin[])?.[0];
    return result || null;
}

export async function createOrigin(origin: Omit<Origin, 'id'>): Promise<Origin> {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT id FROM origins ORDER BY id DESC LIMIT 1');
    const latestID = (rows as any[])[0]?.id + 1 || null;

    try {
        await conn.beginTransaction();

        await conn.query(
            `INSERT INTO origins (
        id, origin_name, created_at, updated_at
      ) VALUES (?, ?, current_timestamp(), current_timestamp())`,
            [
                latestID,
                origin.origin_name
            ]
        );
        await conn.commit();
        return { id: latestID, ...origin };
    } catch (err: any) {
        await conn.rollback();

        if (err.code === 'ER_DUP_ENTRY') {
            if (err.message.includes('origin_name')) {
                throw new Error('Tên đã tồn tại!');
            }
        }
        throw err;
    } finally {
        conn.release();
    }
}

export async function updateOrigin(id: number, origin: Partial<Origin>): Promise<Origin | null> {
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
        UPDATE origins SET 
          origin_name = ?,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;

        await conn.query(sqlQuery, [
            updated.origin_name,
            id
        ]);

        await conn.commit();
        return updated;
    } catch (err: any) {
        await conn.rollback();
        if (err.code === 'ER_DUP_ENTRY') {
            if (err.message.includes('origin_name')) {
                throw new Error('Tên đã tồn tại!');
            }
        }
        throw err;
    } finally {
        conn.release();
    }
}

export async function deleteOriginByID(id: number): Promise<Origin | null> {
    const [rows] = await pool.query(`SELECT * FROM origins WHERE id = ?`, [id]);
    const origin = (rows as Origin[])[0];
    if (!origin) return null;

    await pool.query(`DELETE FROM origins WHERE id = ?`, [id]);
    return origin;
}
