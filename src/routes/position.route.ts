import { IncomingMessage, ServerResponse } from "http"
import { positionController } from '../controllers/position.controller';
import { parse } from 'url';

export function handlePositionRoutes(req: IncomingMessage, res: ServerResponse): boolean {
    const parsedUrl = parse(req.url || "", true);
    const pathname = parsedUrl.pathname || "";
    if (req.method === 'GET' && pathname === "/api/positions") {
        positionController.getAllPosition(req, res);
        return true;
    }

    if (req.method === 'POST' && pathname === "/api/positions") {
        positionController.createPosition(req, res);
        return true;
    }

    const match = pathname.match(/^\/api\/positions\/([0-9]+)$/);
    if (match) {
        const id = Number(match[1]);
        if (req.method === 'GET') {
            positionController.getPositionByID(req, res, id);
            return true;
        } else if (req.method === 'PUT') {
            positionController.updatePositionByID(req, res, id);
            return true;
        } else {
            positionController.updatePositionByID(req, res, id);
            return true;
        }
    }

    return false;
}