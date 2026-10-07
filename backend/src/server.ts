import './bootstrap.js';
import { createServer } from 'node:http';
import { createApp } from './app.js';
import { attachPriceSocket } from './ws.js';
import { config } from './config.js';

const app = createApp();
const server = createServer(app);
attachPriceSocket(server);

server.listen(config.port, () => {
  console.log(`🪙 CryptoPulse backend listening on http://localhost:${config.port}`);
  console.log(`   REST: http://localhost:${config.port}/api/health`);
  console.log(`   WS:   ws://localhost:${config.port}/ws`);
});
