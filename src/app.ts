import { IncomingMessage, ServerResponse } from 'http';
import { handleUserRoutes } from './routes/user.route';
import { handleOriginRoutes } from './routes/origin.route';
import { handlePositionRoutes } from './routes/position.route';
import { handleGraRoutes } from './routes/graduateFrom.route';
import { handleStatusRoutes } from './routes/status.route';

export function app(req: IncomingMessage, res: ServerResponse) { 
    const matched =
        handleUserRoutes(req, res) ||
        handleOriginRoutes(req, res) ||
        handlePositionRoutes(req, res) ||
        handleGraRoutes(req, res) ||
        handleStatusRoutes(req, res);
    if (!matched) { 
        res.writeHead(404, { 'Cotent-type': 'application/json' });
        res.end(JSON.stringify({
            message: "Not found!"
        }));
    }
}