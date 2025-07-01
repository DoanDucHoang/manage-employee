import { IncomingMessage, ServerResponse } from 'http'
import * as repo from '../repositories/origin.repo';
import {parseJsonBody } from '../utils/parseFormData';

function sendJson(res: ServerResponse, statusCode: number, data: any) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

export const originController = {
    getAllOrigin: async (_: IncomingMessage, res: ServerResponse) => {
        try {
            const origins = await repo.getAllOrigin();
            sendJson(res, 200, origins);
        } catch (error) {
            sendJson(res, 400, {
                message: "Error get all origin!",
                error: (error as Error).message
            })
        }
    },

    createOrigin: async (req: IncomingMessage, res: ServerResponse) => {
        try {
          const data = await parseJsonBody(req);
          const created = await repo.createOrigin(data);
          sendJson(res, 201, created);
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            message: 'Upload thất bại!',
            error: (error as Error).message
          }));
        }
      },

    getOriginByID: async (_: IncomingMessage, res: ServerResponse, id: number) => {
        try {
            const origin = await repo.getOriginById(id);
            sendJson(res, 201, origin);
        } catch (error) {
            sendJson(res, 400, {
                message: "Error get origin!",
                error: (error as Error).message
            })
        }
    },

    updateOriginByID: async (req: IncomingMessage, res: ServerResponse, id: number) => {
        try {
            const data = await parseJsonBody(req);
            const updated = await repo.updateOrigin(id, data as any);
            if (!updated) return sendJson(res, 404, { message: 'Origin not found' });
            sendJson(res, 200, updated);
        } catch (error) {
            sendJson(res, 400, {
                message: "Error update origin!",
                error: (error as Error).message
            })
        }
    },

    deleteOriginByID: async (_: IncomingMessage, res: ServerResponse, id: number) => {
        // try {
        //     const deleted = await repo.deleteUser(id);
        //     if (!deleted) return sendJson(res, 404, { message: 'User not found' });
        //     sendJson(res, 200, deleted);
        // } catch (error) {
        //     sendJson(res, 400, {
        //         message: "Error delete user!",
        //         error: (error as Error).message
        //     })
        // }
    },
}