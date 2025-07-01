import { pool } from '../db/database';
import { Position } from '../models/position.model';

export async function getAllPosition(): Promise<Position[]> {
    const sql = `
    SELECT id, position_name
    FROM positions ORDER BY id ASC
  `;
    const [rows] = await pool.query(sql);
    return rows as Position[];
}

export async function getPositionById(id: number): Promise<Position | null> {
    const [rows] = await pool.query(`
    SELECT *
    FROM positions
    WHERE id = ?
  `,
        [id]
    );

    const result = (rows as Position[])?.[0];
    return result || null;
}

export async function createPosition(origin: Omit<Position, 'id'>): Promise<Position> {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT id FROM positions ORDER BY id DESC LIMIT 1');
    const latestID = (rows as any[])[0]?.id + 1 || null;

    try {
        await conn.beginTransaction();

        await conn.query(
            `INSERT INTO positions (
        id, position_name, created_at, updated_at
      ) VALUES (?, ?, current_timestamp(), current_timestamp())`,
            [
                latestID,
                origin.position_name
            ]
        );
        await conn.commit();
        return { id: latestID, ...origin };
    } catch (err: any) {
        await conn.rollback();

        if (err.code === 'ER_DUP_ENTRY') {
            if (err.message.includes('Positions_position_name_key')) {
                throw new Error('Tên đã tồn tại!');
            }
        }
        throw err;
    } finally {
        conn.release();
    }
}

export async function updatePosition(id: number, origin: Partial<Position>): Promise<Position | null> {
    const existing = await getPositionById(id);
    if (!existing) return null;

    const updated = {
        ...existing,
        ...origin,
    };

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const sqlQuery = `
        UPDATE positions SET 
          position_name = ?,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;

        await conn.query(sqlQuery, [
            updated.position_name,
            id
        ]);

        await conn.commit();
        return updated;
    } catch (err: any) {
        await conn.rollback();
        if (err.code === 'ER_DUP_ENTRY') {
            if (err.message.includes('Positions_position_name_key')) {
                throw new Error('Tên đã tồn tại!');
            }
        }
        throw err;
    } finally {
        conn.release();
    }
}