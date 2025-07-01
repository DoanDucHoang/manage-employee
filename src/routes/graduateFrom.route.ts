import { IncomingMessage, ServerResponse } from "http"
import { originController } from '../controllers/graduateFrom.controller';
import { parse } from 'url';

export function handleGraRoutes(req: IncomingMessage, res: ServerResponse): boolean {
    const parsedUrl = parse(req.url || "", true);
    const pathname = parsedUrl.pathname || "";
    if (req.method === 'GET' && pathname === "/api/graduated_from") {
        originController.getAllOrigin(req, res);
        return true;
    }

    if (req.method === 'POST' && pathname === "/api/graduated_from") {
        originController.createOrigin(req, res);
        return true;
    }

    const match = pathname.match(/^\/api\/graduated_from\/([0-9]+)$/);
    if (match) {
        const id = Number(match[1]);
        if (req.method === 'GET') {
            originController.getOriginByID(req, res, id);
            return true;
        } else if (req.method === 'PUT') {
            originController.updateOriginByID(req, res, id);
            return true;
        } else {
            originController.updateOriginByID(req, res, id);
            return true;
        }
    }

    return false;
}