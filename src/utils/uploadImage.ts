import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const tempUploadDir = path.join(__dirname, '../../temp-uploads');

export async function moveUploadedImages(files: Record<string, string>, employeeCode: string): Promise<Record<string, string>> {
  const finalPaths: Record<string, string> = {};
  const baseUploadDir = path.join(__dirname, '../../uploads');

  const employeeDir = path.join(baseUploadDir, employeeCode);
  const cccdDir = path.join(employeeDir, 'CCCD');
  const thumbDir = path.join(employeeDir, 'CCCD_Thumb');

  fs.mkdirSync(cccdDir, { recursive: true });
  fs.mkdirSync(thumbDir, { recursive: true });

  for (const key in files) {
    const tempPath = files[key];
    const ext = path.extname(tempPath);

    const isBack = key === 'IDBackImage';
    const newFilename = `${isBack ? 'CCCD_MS' : 'CCCD_MT'}-${employeeCode}${ext}`;
    const newPath = path.join(cccdDir, newFilename);

    fs.renameSync(tempPath, newPath);

    finalPaths[key] = `/uploads/${employeeCode}/CCCD/${newFilename}`;
    if (key === 'IDFrontImage' || key === 'IDBackImage') {
      const thumbFileName = `${isBack ? 'CCCD_MS' : 'CCCD_MT'}-${employeeCode}_thumb${ext}`;
      const thumbFullPath = path.join(thumbDir, thumbFileName);

      await createThumbnail(newPath, thumbFullPath);

      const thumbKey = `${key}Thumb`;
      finalPaths[thumbKey] = `/uploads/${employeeCode}/CCCD_Thumb/${thumbFileName}`;
    }
  }

  console.log(finalPaths);
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

export async function createThumbnail(originalPath: string, outputPath: string) {
  try {
    await sharp(originalPath)
      .resize(300, 300)
      .toFile(outputPath);
    return outputPath;
  } catch (error) {
    throw error;
  }
}

