import { ParsedUrlQuery } from 'querystring';
import { pool } from '../db/database';
import { User } from '../models/user.model';

function genNextID(latestID: string): string {
  if (!latestID) {
    return 'NS000001'
  }
  const numbericPart = parseInt(latestID.slice(2), 10);
  const nextNumberic = numbericPart + 1;
  return 'NS' + nextNumberic.toString().padStart(6, '0');
}

async function checkExist(table: string, id: number): Promise<boolean> {
  const [rows] = await pool.query(`SELECT id FROM ${table} WHERE id = ?`, [id]);
  return (rows as any[]).length > 0;
}

function mapUsers(rows: any): any {
  const userMap: Record<string, any> = {};

  for (const row of rows as any[]) {
    const userId = row.id;

    if (!userMap[userId]) {
      userMap[userId] = {
        id: row.id,
        employee_code: row.employee_code,
        full_name: row.full_name,
        phone: row.phone,
        email: row.email,
        id_number: row.id_number,
        IDFrontImage: row.id_front_image,
        IDBackImage: row.id_back_image,
        IDFrontThumb: row.id_front_thumb,
        IDBackThumb: row.id_back_thumb,
        origin: row.origin,
        current_address: row.current_address,
        day_of_birth: row.day_of_birth,
        graduated_from: row.graduated_from,
        position: row.position,
        salary: row.salary,
        status: row.status,
        start_date: row.start_date,
        is_deleted: row.is_deleted,
        created_at: row.created_at,
        updated_at: row.updated_at,
        bank_account: []
      };
    }

    if (row.bank_name && row.account_number) {
      userMap[userId].bank_account.push({
        bank_name: row.bank_name,
        account_number: row.account_number,
        account_holder: row.account_holder
      });
    }
  }

  return Object.values(userMap);
}

export async function getAllUser({
  page = 1,
  limit = 10,
  keyword = '',
  minSalary,
  maxSalary
}: {
  page?: number;
  limit?: number;
  keyword?: string;
  minSalary?: number;
  maxSalary?: number;
}): Promise<{
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const offset = (page - 1) * limit;
  const searchTerm = `%${keyword}%`;

  const keywordConditions = `
    (
      u.employee_code LIKE ? OR
      u.full_name LIKE ? OR
      u.phone LIKE ? OR
      u.email LIKE ? OR
      u.id_number LIKE ? OR
      o.origin_name LIKE ? OR
      g.school_name LIKE ? OR
      p.position_name LIKE ? OR
      s.status_name LIKE ? OR
      CAST(YEAR(u.day_of_birth) AS CHAR) LIKE ?
    )
  `;

  const salaryCondition =
    minSalary != null && maxSalary != null ? 'AND u.salary BETWEEN ? AND ?' : '';

  const whereClause = `
    WHERE u.is_deleted = FALSE
    AND ${keywordConditions}
    ${salaryCondition}
  `;

  const sql = `
    SELECT 
      u.id,
      u.employee_code,
      u.full_name,
      u.phone,
      u.email,
      u.id_number,
      u.id_front_image,
      u.id_back_image,
      o.origin_name AS origin,
      u.current_address,
      u.day_of_birth,
      g.school_name AS graduated_from,
      p.position_name AS position,
      u.salary,
      s.status_name AS status,
      u.start_date,
      u.is_deleted,
      u.created_at,
      u.updated_at
    FROM users u
    LEFT JOIN origins o ON u.origin_id = o.id
    LEFT JOIN graduated_from g ON u.graduated_from_id = g.id
    LEFT JOIN positions p ON u.position_id = p.id
    LEFT JOIN status s ON u.status_id = s.id
    ${whereClause}
    ORDER BY u.created_at ASC
    LIMIT ? OFFSET ?;
  `;

  const countSql = `
    SELECT COUNT(*) as total
    FROM users u
    LEFT JOIN origins o ON u.origin_id = o.id
    LEFT JOIN graduated_from g ON u.graduated_from_id = g.id
    LEFT JOIN positions p ON u.position_id = p.id
    LEFT JOIN status s ON u.status_id = s.id
    ${whereClause};
  `;

  const searchParams: any[] = Array(10).fill(searchTerm);
  if (minSalary != null && maxSalary != null) {
    searchParams.push(minSalary, maxSalary);
  }

  const [dataRows] = await pool.query(sql, [...searchParams, limit, offset]);
  const [countRows] = await pool.query(countSql, searchParams);
  const total = (countRows as any[])[0]?.total ?? 0;

  const employeeCodes = (dataRows as any[]).map((u) => u.employee_code);
  let bankAccountsMap: Record<string, any[]> = {};

  if (employeeCodes.length > 0) {
    const [bankRows] = await pool.query(
      `
      SELECT employee_code, bank_name, account_number, account_holder
      FROM bank_accounts
      WHERE employee_code IN (${employeeCodes.map(() => '?').join(',')})
    `,
      employeeCodes
    );

    for (const row of bankRows as any[]) {
      if (!bankAccountsMap[row.employee_code]) {
        bankAccountsMap[row.employee_code] = [];
      }
      bankAccountsMap[row.employee_code].push({
        bank_name: row.bank_name,
        account_number: row.account_number,
        account_holder: row.account_holder
      });
    }
  }

  const users: User[] = (dataRows as any[]).map((user) => ({
    ...user,
    bank_account: bankAccountsMap[user.employee_code] || []
  }));

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}


export async function getUserById(id: number): Promise<User | null> {
  const [rows] = await pool.query(`
    SELECT 
      u.id,
      u.employee_code,
      u.full_name,
      u.phone,
      u.email,
      u.id_number,
      u.id_front_image,
      u.id_back_image,
      u.id_front_thumb,
      u.id_back_thumb,
      o.origin_name AS origin,
      u.current_address,
      u.day_of_birth,
      g.school_name AS graduated_from,
      p.position_name AS position,
      u.salary,
      s.status_name AS status,
      u.start_date,
      u.is_deleted,
      u.created_at,
      u.updated_at,
      b.bank_name,
      b.account_number,
      b.account_holder
    FROM users u
    LEFT JOIN origins o ON u.origin_id = o.id
    LEFT JOIN graduated_from g ON u.graduated_from_id = g.id
    LEFT JOIN positions p ON u.position_id = p.id
    LEFT JOIN status s ON u.status_id = s.id
    LEFT JOIN bank_accounts b ON u.employee_code = b.employee_code
    WHERE u.id = ? AND u.is_deleted = FALSE
  `, [id]);

  const result = mapUsers(rows)?.[0];
  return result || null;
}

export async function createUser(user: Omit<User, 'id'>): Promise<User> {
  const conn = await pool.getConnection();

  const [rows] = await conn.query('SELECT employee_code FROM users ORDER BY employee_code DESC LIMIT 1');
  const latestID = (rows as any[])[0]?.employee_code || null;
  const newID = genNextID(latestID);

  const errors: string[] = [];

  try {
    if (!(await checkExist('origins', user.origin))) errors.push('Nguyên quán không tồn tại!');
    if (!(await checkExist('graduated_from', user.graduatedFrom))) errors.push('Trường không tồn tại!');
    if (!(await checkExist('positions', user.position))) errors.push('Vị trí không tồn tại!');
    if (!(await checkExist('status', user.status))) errors.push('Trạng thái không phù hợp!');

    const [phoneRows] = await conn.query('SELECT 1 FROM users WHERE phone = ?', [user.phone]);
    if ((phoneRows as any[]).length > 0) errors.push('Số điện thoại đã tồn tại!');

    const [emailExists] = await conn.query('SELECT 1 FROM users WHERE email = ?', [user.email]);
    if ((emailExists as any[]).length > 0) errors.push('Email đã tồn tại!');

    const [idNumberExists] = await conn.query('SELECT 1 FROM users WHERE id_number = ?', [user.IDNumber]);
    if ((idNumberExists as any[]).length > 0) errors.push('Số CCCD đã tồn tại!');

    if (user.bankAccount && Array.isArray(user.bankAccount)) {
      for (const account of user.bankAccount) {
        const [accNumExists] = await conn.query(
          'SELECT 1 FROM bank_accounts WHERE account_number = ?',
          [account.accountNumber]
        );
        if ((accNumExists as any[]).length > 0) {
          errors.push(`Số tài khoản ${account.accountNumber} đã tồn tại!`);
        }
      }
    }
    if (errors.length > 0) {
      const errorObj = new Error('Dữ liệu không hợp lệ!');
      (errorObj as any).errors = errors;
      throw errorObj;
    }
    await conn.beginTransaction();
    await conn.query(
      `INSERT INTO users (
        employee_code, full_name, phone, email, id_number, id_front_image, id_back_image,
        origin_id, current_address, day_of_birth, graduated_from_id, position_id,
        salary, status_id, start_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, current_timestamp(), current_timestamp())`,
      [
        newID,
        user.fullName,
        user.phone,
        user.email,
        user.IDNumber,
        user.IDFrontImage,
        user.IDBackImage,
        user.origin,
        user.currentAddress,
        user.dayOfBirth,
        user.graduatedFrom,
        user.position,
        user.salary,
        user.status,
        user.startDate
      ]
    );

    for (const account of user.bankAccount || []) {
      await conn.query(
        `INSERT INTO bank_accounts (
          employee_code, bank_name, account_number, account_holder,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, current_timestamp(), current_timestamp())`,
        [
          newID,
          account.bankName,
          account.accountNumber,
          account.accountHolder
        ]
      );
    }

    await conn.commit();
    return {
      ...user,
      employee_code: newID
    };
  } catch (err: any) {
    await conn.rollback();

    if (Array.isArray((err as any).errors)) {
      throw err;
    }

    throw new Error(err.message || 'Lỗi không xác định!');
  } finally {
    conn.release();
  }
}


export async function updateUser(id: number, user: Partial<User>): Promise<User | null> {
  const existing = await getUserById(id);
  if (!existing) return null;
  const updated = {
    ...existing,
    ...user,
  };

  const changedFields: Record<string, any> = {};
  for (const key in user) {
    const oldValue = (existing as any)[key];
    const newValue = (user as any)[key];

    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changedFields[key] = { old: oldValue, new: newValue };
    }
  }

  const conn = await pool.getConnection();
  try {

    if (!(await checkExist('origins', updated.origin))) {
      throw new Error('Nguyên quán không tồn tại!');
    }
    if (!(await checkExist('graduated_from', updated.graduatedFrom))) {
      throw new Error('Trường không tồn tại!');
    }
    if (!(await checkExist('positions', updated.position))) {
      throw new Error('Vị trí không tồn tại!');
    }
    if (!(await checkExist('status', updated.status))) {
      throw new Error('Trạng thái không phù hợp!');
    }

    await conn.beginTransaction();

    const sqlQuery = `
      UPDATE users SET 
        full_name = ?, phone = ?, email = ?, id_number = ?, id_front_image = ?, id_back_image = ?, id_front_thumb = ?, id_back_thumb = ?, origin_id = ?, current_address = ?, day_of_birth = ?, graduated_from_id = ?, 
        position_id = ?, salary = ?, status_id = ?, start_date = ?, 
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;

    await conn.query(sqlQuery, [
      updated.fullName,
      updated.phone,
      updated.email,
      updated.IDNumber,
      updated.IDFrontImage,
      updated.IDBackImage,
      updated.IDFrontThumb,
      updated.IDBackThumb,
      updated.origin,
      updated.currentAddress,
      updated.dayOfBirth,
      updated.graduatedFrom,
      updated.position,
      updated.salary,
      updated.status,
      updated.startDate,
      id
    ]);

    if (updated.bankAccount && Array.isArray(updated.bankAccount)) {
      await conn.query(`DELETE FROM bank_accounts WHERE employee_code = ?`, [existing.employee_code]);

      for (const account of updated.bankAccount) {
        await conn.query(
          `INSERT INTO bank_accounts (employee_code, bank_name, account_number, account_holder, created_at, updated_at)
           VALUES (?, ?, ?, ?, current_timestamp(), current_timestamp())`,
          [
            existing.employee_code,
            account.bankName,
            account.accountNumber,
            account.accountHolder
          ]
        );
      }
    }

    await conn.commit();
    return getUserById(id);
  } catch (err: any) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      if (err.message.includes('phone')) {
        throw new Error('Số điện thoại đã tồn tại!');
      }
      if (err.message.includes('email')) {
        throw new Error('Email đã tồn tại!');
      }
      if (err.message.includes('id_number')) {
        throw new Error('Số CCCD đã tồn tại!');
      }
      if (err.message.includes('account_number')) {
        throw new Error('Số tài khoản đã tồn tại!');
      }
    }
    throw err;
  } finally {
    conn.release();
  }
}



export async function deleteUser(id: number): Promise<User | null> {
  const existing = await getUserById(id);
  if (!existing) return null;

  await pool.query('UPDATE users SET is_deleted = TRUE WHERE id = ?', [id]);
  return existing;
}

export async function searchUsers(query: ParsedUrlQuery): Promise<User[]> {
  const condition: string[] = ["is_deleted = FALSE"];
  const params: any[] = [];

  const searchFields: Record<string, string> = {
    fullName: 'full_name',
    phone: 'phone',
    email: 'email',
    IDNumber: 'id_number',
    origin: 'origin_id',
    graduatedFrom: 'graduated_from_id',
    position: 'position_id',
    salary: 'salary',
    status: 'status_id'
  };

  for (const key in searchFields) {
    const dbField = searchFields[key];
    const value = query[key];
    if (value && typeof value === 'string' || value && typeof value === 'number') {
      condition.push(`${dbField} LIKE ?`);
      params.push(`%${value}%`);
    }
  }

  const dayOfBirth = query.dayOfBirth;
  if (typeof dayOfBirth === 'string') {
    if (/^\d{4}$/.test(dayOfBirth)) {
      condition.push('YEAR(day_of_birth) = ?');
      params.push(dayOfBirth);
    } else if (/^\d{4}-\d{2}$/.test(dayOfBirth)) {
      condition.push('DATE_FORMAT(day_of_birth, "%Y-%m") = ?');
      params.push(dayOfBirth);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dayOfBirth)) {
      condition.push('day_of_birth = ?');
      params.push(dayOfBirth);
    }
  }

  const sql = `
  SELECT 
      u.id,
      u.full_name,
      u.phone,
      u.email,
      u.id_number,
      u.id_front_image,
      u.id_back_image,
      o.origin_name AS origin,
      u.current_address,
      u.day_of_birth,
      g.school_name AS graduated_from,
      p.position_name AS position,
      u.salary,
      s.status_name AS status,
      u.start_date,
      u.is_deleted,
      u.created_at,
      u.updated_at,
      b.bank_name,
      b.account_number,
      b.account_holder
    FROM users u
    LEFT JOIN origins o ON u.origin_id = o.id
    LEFT JOIN graduated_from g ON u.graduated_from_id = g.id
    LEFT JOIN positions p ON u.position_id = p.id
    LEFT JOIN status s ON u.status_id = s.id
    LEFT JOIN bank_accounts b ON u.id = b.employee_code
    WHERE ${condition.join(' AND ')}`;
  const [rows] = await pool.query(sql, params);

  return mapUsers(rows);
}

export async function updateUserImages(employeeCode: string, images: {
  IDFrontImage?: string;
  IDBackImage?: string;
  IDFrontThumb?: string;
  IDBackThumb?: string;
}) {
  await pool.query(
    `UPDATE users SET id_front_image = ?, id_back_image = ?, id_front_thumb = ?, id_back_thumb = ?, updated_at = CURRENT_TIMESTAMP WHERE employee_code = ?`,
    [images.IDFrontImage, images.IDBackImage, images.IDFrontThumb, images.IDBackThumb, employeeCode]
  );
}

