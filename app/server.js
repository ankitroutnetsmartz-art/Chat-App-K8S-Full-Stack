const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Client } = require('pg');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const db = new Client({
  host: process.env.DB_HOST || 'db-service',
  user: process.env.DB_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.DB_NAME || 'postgres',
  port: 5432,
});

db.connect().catch(err => console.error('DB Connection Failed:', err.message));

// Setup Redis adapter for Socket.IO clustering
const redisClient = createClient({
  host: process.env.REDIS_HOST || 'redis-service',
  port: process.env.REDIS_PORT || 6379,
});

redisClient.connect()
  .then(() => {
    const pubClient = redisClient.duplicate();
    return pubClient.connect().then(() => {
      io.adapter(createAdapter(pubClient, redisClient));
      console.log('✅ Redis adapter connected for Socket.IO clustering');
    });
  })
  .catch(err => console.warn('⚠️ Redis not available, running without clustering:', err.message));

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

io.on('connection', (socket) => {
    socket.on('typing', (data) => socket.broadcast.emit('typing', data));
    
    socket.on('delete message', async (msgId) => {
        try {
            // In a real prod app, you'd delete from DB here. For now, we sync UI.
            io.emit('delete message', msgId);
        } catch (err) { console.error(err); }
    });

    socket.on('chat message', async (data) => {
        try {
            await db.query('INSERT INTO messages (content) VALUES ($1)', [`[${data.time}] ${data.user}: ${data.text}`]);
            io.emit('chat message', data);
        } catch (err) { console.error('Save failed:', err.message); }
    });
});

server.listen(3000, '0.0.0.0', () => console.log('🚀 Tunnel v14 Control Live'));
