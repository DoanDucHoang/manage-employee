import { IncomingMessage, ServerResponse } from "http"
import { originController } from '../controllers/status.controller';
import { parse } from 'url';

export function handleStatusRoutes(req: IncomingMessage, res: ServerResponse): boolean {
    const parsedUrl = parse(req.url || "", true);
    const pathname = parsedUrl.pathname || "";
    if (req.method === 'GET' && pathname === "/api/status") {
        originController.getAllOrigin(req, res);
        return true;
    }

    if (req.method === 'POST' && pathname === "/api/status") {
        originController.createOrigin(req, res);
        return true;
    }

    const match = pathname.match(/^\/api\/status\/([0-9]+)$/);
    if (match) {
        const id = Number(match[1]);
        if (req.method === 'GET') {
            originController.getOriginByID(req, res, id);
            return true;
        } else if (req.method === 'PUT') {
            
            originController.updateOriginByID(req, res, id);
            return true;
        } else {
            originController.deleteOriginByID(req, res, id);
            return true;
        }
    }

    return false;
}