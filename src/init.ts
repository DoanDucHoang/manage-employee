import { pool } from './db/database';

(async () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      employee_code VARCHAR(100) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL UNIQUE,
      email VARCHAR(100) NOT NULL UNIQUE,
      id_number VARCHAR(20) NOT NULL UNIQUE,
      id_front_image VARCHAR(255) NOT NULL,
      id_back_image VARCHAR(255) NOT NULL,
      origin_id INT NOT NULL,
      current_address VARCHAR(255) NOT NULL,
      day_of_birth DATE NOT NULL,
      graduated_from_id INT,
      position_id INT NOT NULL,
      salary INT NOT NULL,
      status_id INT NOT NULL,
      start_date DATE NOT NULL,
      is_deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (origin_id) REFERENCES origins(id) ON DELETE CASCADE,
      FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
      FOREIGN KEY (status_id) REFERENCES status(id) ON DELETE CASCADE,
      FOREIGN KEY (graduated_from_id) REFERENCES graduated_from(id) ON DELETE CASCADE
    );
  `;

  const createBankAccountsTable = `
    CREATE TABLE IF NOT EXISTS bank_accounts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(8) NOT NULL,
      bank_name VARCHAR(100) NOT NULL,
      account_number VARCHAR(50) NOT NULL UNIQUE,
      account_holder VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  const createOriginTable = `
    CREATE TABLE IF NOT EXISTS origins (
      id INT PRIMARY KEY,
      origin_name VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  const createPositionTable = `
    CREATE TABLE IF NOT EXISTS positions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      position_name VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  const createStatusTable = `
    CREATE TABLE IF NOT EXISTS status (
      id INT AUTO_INCREMENT PRIMARY KEY,
      status_name VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `;

  const createGraduatedFromTable = `
  CREATE TABLE IF NOT EXISTS graduated_from (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  );
`;

  try {
    const conn = await pool.getConnection();

    await conn.query(createUsersTable);
    await conn.query(createBankAccountsTable);
    await conn.query(createOriginTable);
    await conn.query(createPositionTable);
    await conn.query(createStatusTable);
    await conn.query(createGraduatedFromTable);

    console.log('Connect DB successfully!');
    conn.release();
  } catch (err) {
    console.error('Lỗi tạo bảng:', err);
  }
})();
