const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Client } = require('pg');

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

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));

io.on('connection', (socket) => {
    socket.on('typing', (data) => socket.broadcast.emit('typing', data));
    
    socket.on('chat message', async (data) => {
        try {
            await db.query('INSERT INTO messages (content) VALUES ($1)', [`[${data.time}] ${data.user}: ${data.text}`]);
            io.emit('chat message', data);
        } catch (err) { console.error('Save failed:', err.message); }
    });
});

server.listen(3000, '0.0.0.0', () => console.log('🚀 Tunnel v13 Online'));
