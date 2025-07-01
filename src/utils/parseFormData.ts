import path from 'path';
import fs from 'fs';
import { IncomingMessage } from 'http';
import formidable, { File } from 'formidable';

const MAX_SIZE = 1 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const idRegex = /^\d{12}$/;
const phoneRegex = /^(0\d{9})$/;

export const parseJsonBody = (req: IncomingMessage): Promise<any> => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const json = JSON.parse(body);
        resolve(json);
      } catch (err) {
        reject(new Error('Invalid JSON body'));
      }
    });
  });
};

export function parseFormData(req: IncomingMessage): Promise<{
  fields: Record<string, string>,
  files: Record<string, string>
}> {
  const tempDir = path.join(__dirname, '../../temp_uploads');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const form = formidable({
    uploadDir: tempDir,
    keepExtensions: true,
    maxFileSize: MAX_SIZE,
    maxTotalFileSize: Infinity,
    multiples: false
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, rawFiles) => {
      const errors: string[] = [];

      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE' || err.message.includes('maxFileSize')) {
          errors.push('File ảnh vượt quá 1MB.');
        } else {
          errors.push(err.message);
        }
      }

      const files: Record<string, string> = {};
      const simpleFields: Record<string, string> = {};
      for (const key in fields) {
        simpleFields[key] = Array.isArray(fields[key]) ? fields[key][0] : fields[key] as unknown as string;
      }

      try {
        const { phone, email, IDNumber, dayOfBirth, salary, bankAccount, startDate } = simpleFields;
        let jsonBackAccount: any[] = [];

        if (!email || !emailRegex.test(email)) {
          errors.push('Email không hợp lệ.');
        }

        if (!phone || !phoneRegex.test(phone)) {
          errors.push('Số điện thoại không hợp lệ.');
        }

        if (!IDNumber || !idRegex.test(IDNumber)) {
          errors.push('Số CCCD không hợp lệ.');
        }

        try {
          jsonBackAccount = JSON.parse(bankAccount);
          for (const account of jsonBackAccount) {
            const accNum = account.accountNumber?.toString().trim();
            if (!accNum || !/^[0-9]{8,16}$/.test(accNum)) {
              errors.push(`Số tài khoản ${accNum} không hợp lệ, phải từ 8 đến 16 số.`);
            }
          }
        } catch {
          errors.push('Trường bankAccount không hợp lệ.');
        }

        const dob = new Date(dayOfBirth);
        const sDate = new Date(startDate);
        const today = new Date();

        if (isNaN(dob.getTime())) {
          errors.push('Ngày sinh không hợp lệ.');
        } else {
          const age = today.getFullYear() - dob.getFullYear();
          const monthDiff = today.getMonth() - dob.getMonth();
          const dayDiff = today.getDate() - dob.getDate();
          const realAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

          if (dob > today) errors.push('Ngày sinh không tồn tại.');
          else if (realAge < 18) errors.push('Nhân sự phải đủ 18 tuổi trở lên.');
          else if (realAge > 65) errors.push('Tuổi vượt quá giới hạn cho phép.');
        }

        if (isNaN(sDate.getTime())) {
          errors.push('Ngày bắt đầu không hợp lệ.');
        }

        if (isNaN(Number(salary)) || Number(salary) <= 0) {
          errors.push('Lương phải lớn hơn 0.');
        }
      } catch (e) {
        errors.push('Lỗi không xác định trong validate.');
      }

      for (const key in rawFiles) {
        const fileArray = rawFiles[key];
        if (!fileArray || !Array.isArray(fileArray) || fileArray.length === 0) continue;

        const file = fileArray[0] as File;

        if (!ALLOWED_TYPES.includes(file.mimetype || '')) {
          fs.unlink(file.filepath, () => {});
          errors.push(`File ${file.originalFilename} không hợp lệ. Chỉ chấp nhận JPG hoặc PNG.`);
        } else {
          files[key] = file.filepath;
        }
      }

      if (errors.length > 0) {
        return reject({ errors });
      }

      resolve({ fields: simpleFields, files });
    });
  });
}
