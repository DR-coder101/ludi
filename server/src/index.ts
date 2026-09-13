import { createLudiServer } from './server.js';

const PORT = Number(process.env.PORT) || 3000;

const server = createLudiServer(PORT);
server.start();
