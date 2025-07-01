import { IncomingMessage, ServerResponse } from 'http'
import * as repo from '../repositories/user.repo';
import { parse } from 'url';
import { parseFormData } from '../utils/parseFormData';
import { cleanUpTempUploads, moveUploadedImages } from '../utils/uploadImage';
import fs from 'fs';
import path from 'path';

function sendJson(res: ServerResponse, statusCode: number, data: any) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        statusCode,
        ...data
    }));
}

function deleteIfReplaced(
    oldPath: string,
    newPath: string | undefined,
    oldPathThumb: string,
    newPathThumb: string | undefined,
    code: string
  ) {
    if (!newPath || !newPathThumb || oldPath === newPath) return;
  
    const oldFullPath = path.join(__dirname, `../../uploads/${code}/${oldPath}`);
    const newFullPath = path.join(__dirname, `../../uploads/${code}/${newPath}`);
  
    const oldFullPathThumb = path.join(__dirname, `../../uploads/${code}/${oldPathThumb}`);
    const newFullPathThumb = path.join(__dirname, `../../uploads/${code}/${newPathThumb}`);
  
    try {
        if (fs.existsSync(oldFullPath) && fs.existsSync(newFullPath)) {
        fs.unlinkSync(oldFullPath);
      }

      if (fs.existsSync(oldFullPathThumb) && fs.existsSync(newFullPathThumb)) {
        fs.unlinkSync(oldFullPathThumb);
      }
    } catch (err) {
      console.error('Không thể xóa file:', err);
    }
  }

export const userController = {
    getAllUser: async (req: IncomingMessage, res: ServerResponse) => {
        try {
            const { query } = parse(req.url || '', true);
            const page = parseInt(query.page as string) || 1;
            const limit = parseInt(query.limit as string) || 10;
            const keyword = (query.keyword as string) || '';
            const minSalary = parseInt(query.minSalary as string) || 0;
            const maxSalary = parseInt(query.maxSalary as string) || undefined;

            const result = await repo.getAllUser({ page, limit, keyword, minSalary, maxSalary });
            const data = result.data;
            const total = result.pagination.total;

            const message = total > 0 ? "lấy danh sách nhân sự thành công" : "Không tìm thấy nhân sự nào"

            sendJson(res, 200, {
                statusCode: 200,
                message,
                data,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            sendJson(res, 400, {
                message: "Lỗi khi lấy danh sách nhân viên!",
                error: (error as Error).message
            });
        }
    },

    createUser: async (req: IncomingMessage, res: ServerResponse) => {
        let movedFilePaths: string[] = [];
        try {
            const { fields, files: tempFiles } = await parseFormData(req);

            const user = {
                ...fields,
                salary: Number(fields.salary),
                IDFrontImage: '',
                IDBackImage: '',
                IDFrontThumb: '',
                IDBackThumb: '',
                bankAccount: JSON.parse(fields.bankAccount || '[]')
            };

            const created = await repo.createUser(user as any);
            const employeeCode = created.employee_code;

            const movedFiles = await moveUploadedImages(tempFiles, employeeCode);
            movedFilePaths = Object.values(movedFiles).map(p => path.join(__dirname, `../../${p}`));
            cleanUpTempUploads(Object.values(tempFiles));

            await repo.updateUserImages(employeeCode, {
                IDFrontImage: path.basename(movedFiles.IDFrontImage) || '',
                IDBackImage: path.basename(movedFiles.IDBackImage) || '',
                IDFrontThumb: path.basename(movedFiles.IDFrontImageThumb) || '',
                IDBackThumb: path.basename(movedFiles.IDBackImageThumb) || ''
            });

            sendJson(res, 201, {
                message: "Tạo nhân sự thành công!",
                data: created
            });
        } catch (error: any) {
            for (const filePath of movedFilePaths) {
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                } catch (unlinkErr) {
                    console.error('Lỗi khi xóa ảnh:', unlinkErr);
                }
            }
            if (Array.isArray(error.errors)) {
                return sendJson(res, 400, {
                    message: 'Dữ liệu không hợp lệ.',
                    errors: error.errors
                });
            }

            return sendJson(res, 400, {
                error: 'Upload thất bại!',
                message: (error as Error).message
            });
        }
    },

    getUserByID: async (_: IncomingMessage, res: ServerResponse, id: number) => {
        try {
            const user = await repo.getUserById(id);
            sendJson(res, 201, user);
        } catch (error) {
            sendJson(res, 400, {
                message: "Error get user!",
                error: (error as Error).message
            })
        }
    },

    updateUserByID: async (req: IncomingMessage, res: ServerResponse, id: number) => {
        try {
            const oldUser = await repo.getUserById(id);
            if (!oldUser) return sendJson(res, 404, { message: 'User not found' });
            
            const { fields, files } = await parseFormData(req);
            const hasNewImage = files.IDFrontImage || files.IDBackImage;

            let movedFiles: Record<string, string> = {};

            if (hasNewImage) {
                movedFiles = await moveUploadedImages(files, oldUser.employee_code);
                if (files.IDFrontImage) {
                    deleteIfReplaced(oldUser.IDFrontImage, movedFiles.IDFrontImage, oldUser.IDFrontThumb, movedFiles.IDFrontImageThumb, oldUser.employee_code);
                }
                if (files.IDBackImage) deleteIfReplaced(oldUser.IDBackThumb, movedFiles.IDBackImage, oldUser.IDBackThumb, movedFiles.IDBackImageThumb, oldUser.employee_code);
            }

            cleanUpTempUploads(Object.values(files));

            const updatedUser = {
                ...fields,
                salary: fields.salary ? Number(fields.salary) : undefined,
                IDFrontImage: movedFiles.IDFrontImage ? path.basename(movedFiles.IDFrontImage) : path.basename(oldUser.IDFrontImage),
                IDBackImage: movedFiles.IDBackImage ? path.basename(movedFiles.IDBackImage) : path.basename(oldUser.IDBackImage),
                IDFrontThumb: movedFiles.IDFrontImageThumb ? path.basename(movedFiles.IDFrontImageThumb) : path.basename(oldUser.IDFrontThumb),
                IDBackThumb: movedFiles.IDBackImageThumb ? path.basename(movedFiles.IDBackImageThumb) : path.basename(oldUser.IDBackThumb),
                bankAccount: JSON.parse(fields.bankAccount || '[]')
            };

            const updated = await repo.updateUser(id, updatedUser as any);
            if (!updated) return sendJson(res, 404, { message: 'User not found' });

            sendJson(res, 200, updated);
        } catch (error) {
            sendJson(res, 400, {
                message: "Error update user!",
                error: (error as Error).message
            });
        }
    },


    deleteUserByID: async (_: IncomingMessage, res: ServerResponse, id: number) => {
        try {
            const deleted = await repo.deleteUser(id);
            if (!deleted) return sendJson(res, 404, { message: 'User not found' });
            sendJson(res, 200, deleted);
        } catch (error) {
            sendJson(res, 400, {
                message: "Error delete user!",
                error: (error as Error).message
            })
        }
    },

    searchUsers: async (req: IncomingMessage, res: ServerResponse) => {
        try {
            const { query } = parse(req.url || "", true);
            const searched = await repo.searchUsers(query);
            if (!searched) return sendJson(res, 404, { message: 'User not found' });
            sendJson(res, 200, searched);
        } catch (error) {
            sendJson(res, 400, {
                message: "Error search user!",
                error: (error as Error).message
            })
        }
    }
}