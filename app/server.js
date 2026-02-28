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

// Properly initialize database connection
async function initializeDB() {
  try {
    await db.connect();
    console.log('✅ Database connected');
  } catch (err) {
    console.error('❌ DB Connection Failed:', err.message);
    process.exit(1);
  }
}

// Setup Redis adapter for Socket.IO clustering
const redisClient = createClient({
  host: process.env.REDIS_HOST || 'redis-service',
  port: process.env.REDIS_PORT || 6379,
});

async function initializeRedis() {
  try {
    await redisClient.connect();
    const pubClient = redisClient.duplicate();
    await pubClient.connect();
    io.adapter(createAdapter(pubClient, redisClient));
    console.log('✅ Redis adapter connected for Socket.IO clustering');
  } catch (err) {
    console.warn('⚠️ Redis not available, running without clustering:', err.message);
  }
}

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

// return chat history with pagination (offset=0 returns newest messages)
app.get('/messages', async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    try {
        const result = await db.query(
            'SELECT id, sender, text, time, delivered_at, read_at, created_at FROM messages ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

io.on('connection', (socket) => {
    console.log(`✓ Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`✗ Client disconnected: ${socket.id}`);
    });

    // broadcast typing notifications to everyone except the originator
    socket.on('typing', (data) => socket.broadcast.emit('typing', data));

    // message deletion (also persist in DB)
    socket.on('delete message', async (msgId) => {
        try {
            await db.query('DELETE FROM messages WHERE id = $1', [msgId]);
            io.emit('delete message', msgId);
        } catch (err) { console.error(err); }
    });

    // new chat message - insert into db and return the real id/timestamp
    socket.on('chat message', async (data) => {
        try {
            const res = await db.query(
                'INSERT INTO messages (sender, text, time) VALUES ($1, $2, $3) RETURNING id, created_at',
                [data.user, data.text, data.time]
            );
            const msgId = res.rows[0].id;
            const createdAt = res.rows[0].created_at;
            // normalize payload: use `sender` to match schema and front-end
            io.emit('chat message', {
                sender: data.user,
                text: data.text,
                time: data.time,
                id: msgId,
                created_at: createdAt
            });
        } catch (err) { console.error('Save failed:', err.message); }
    });

    // delivery/read receipts
    socket.on('message delivered', async (msgId) => {
        try {
            await db.query('UPDATE messages SET delivered_at = NOW() WHERE id = $1', [msgId]);
            io.emit('message delivered', msgId);
        } catch (err) { console.error(err); }
    });

    socket.on('message read', async (msgId) => {
        try {
            await db.query('UPDATE messages SET read_at = NOW() WHERE id = $1', [msgId]);
            io.emit('message read', msgId);
        } catch (err) { console.error(err); }
    });

    // clear all messages (admin action)
    socket.on('clear chat', async () => {
        try {
            await db.query('DELETE FROM messages');
            io.emit('clear chat');
        } catch (err) { console.error('Failed to clear chat:', err.message); }
    });
});

server.listen(3000, '0.0.0.0', () => console.log('🚀 Tunnel v14 Control Live'));

// Initialize all services on startup
(async () => {
  await initializeDB();
  await initializeRedis();
})().catch(err => {
  console.error('Startup failed:', err);
  process.exit(1);
});
