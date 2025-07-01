import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const tempUploadDir = path.join(__dirname, '../../temp-uploads');

export async function moveUploadedImages(files: Record<string, string>, employeeCode: string): Promise<Record<string, string>> {
  const finalPaths: Record<string, string> = {};
  const baseUploadDir = path.join(__dirname, '../../uploads');

  const employeeDir = path.join(baseUploadDir, employeeCode);
  if (!fs.existsSync(employeeDir)) fs.mkdirSync(employeeDir, { recursive: true });

  for (const key in files) {
    const tempPath = files[key];
    const ext = path.extname(tempPath);

    const isBack = key === 'IDBackImage';
    const newFilename = `${isBack ? 'CCCD_MS' : 'CCCD_MT'}-${employeeCode}${ext}`;
    const newPath = path.join(employeeDir, newFilename);

    fs.renameSync(tempPath, newPath);
    finalPaths[key] = `/uploads/${employeeCode}/CCCD/${newFilename}`;

    if (key === 'IDFrontImage' || key === 'IDBackImage') {
      const thumbPath = await createThumbnail(newPath);
      const thumbKey = `${key}Thumb`;
      finalPaths[thumbKey] = `/uploads/${employeeCode}/CCCD_Thumb/${path.basename(thumbPath)}`;
    }
  }

  return finalPaths;
}

export function cleanUpTempUploads(usedPaths: string[]) {
  fs.readdir(tempUploadDir, (err, files) => {
    if (err) return;
    files.forEach((file) => {
      const fullPath = path.join(tempUploadDir, file);
      if (!usedPaths.includes(fullPath)) {
        fs.unlink(fullPath, () => { });
      }
    });
  });
}

export async function createThumbnail(originalPath: string) {
  const dir = path.dirname(originalPath);
  const ext = path.extname(originalPath);
  const baseName = path.basename(originalPath, ext);

  const thumbName = `${baseName}_thumb${ext}`;
  const thumbPath = path.join(dir, thumbName);

  try {
    await sharp(originalPath)
      .resize(300, 300)
      .toFile(thumbPath);
    return thumbPath;
  } catch (error) {
    throw error;
  }
}

