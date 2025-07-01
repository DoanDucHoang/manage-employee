import http from "http";
import { app } from "./app"
import './init.ts';
import 'dotenv/config';

const server = http.createServer(app);
const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});