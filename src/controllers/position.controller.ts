import { IncomingMessage, ServerResponse } from 'http'
import * as repo from '../repositories/position.repo';
import {parseJsonBody } from '../utils/parseFormData';

function sendJson(res: ServerResponse, statusCode: number, data: any) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

export const positionController = {
    getAllPosition: async (_: IncomingMessage, res: ServerResponse) => {
        try {
            const positions = await repo.getAllPosition();
            sendJson(res, 200, positions);
        } catch (error) {
            sendJson(res, 400, {
                message: "Error get all position!",
                error: (error as Error).message
            })
        }
    },

    createPosition: async (req: IncomingMessage, res: ServerResponse) => {
        try {
          const data = await parseJsonBody(req);
          const created = await repo.createPosition(data);
          sendJson(res, 201, created);
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            message: 'Upload thất bại!',
            error: (error as Error).message
          }));
        }
      },

    getPositionByID: async (_: IncomingMessage, res: ServerResponse, id: number) => {
        try {
            const origin = await repo.getPositionById(id);
            sendJson(res, 201, origin);
        } catch (error) {
            sendJson(res, 400, {
                message: "Error get origin!",
                error: (error as Error).message
            })
        }
    },

    updatePositionByID: async (req: IncomingMessage, res: ServerResponse, id: number) => {
        try {
            const data = await parseJsonBody(req);
            const updated = await repo.updatePosition(id, data as any);
            if (!updated) return sendJson(res, 404, { message: 'Posotion not found' });
            sendJson(res, 200, updated);
        } catch (error) {
            sendJson(res, 400, {
                message: "Error update origin!",
                error: (error as Error).message
            })
        }
    },

    deletePositionByID: async (_: IncomingMessage, res: ServerResponse, id: number) => {
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