import { IncomingMessage, ServerResponse } from "http"
import { userController } from '../controllers/user.controller';
import { parse } from 'url';

export function handleUserRoutes(req: IncomingMessage, res: ServerResponse): boolean {
    const parsedUrl = parse(req.url || "", true);
    const pathname = parsedUrl.pathname || "";
    if (req.method === 'GET' && pathname === "/api/users") {
        userController.getAllUser(req, res);
        return true;
    }

    if (req.method === 'POST' && pathname === "/api/users") {
        userController.createUser(req, res);
        return true;
    }

    if (req.method === 'GET' && pathname === "/api/users/search") {
        userController.searchUsers(req, res);
        return true;
    }

    const match = pathname.match(/^\/api\/users\/([A-Z0-9]+)$/);
    if (match) {
        const id = Number(match[1]);
        if (req.method === 'GET') {
            userController.getUserByID(req, res, id);
            return true;
        } else if (req.method === 'PUT') {
            userController.updateUserByID(req, res, id);
            return true;
        } else {
            userController.deleteUserByID(req, res, id);
            return true;
        }
    }

    return false;
}