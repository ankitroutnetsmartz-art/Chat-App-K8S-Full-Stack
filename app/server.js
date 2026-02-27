cat <<EOF > server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Client } = require('pg');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Database configuration using Environment Variables
const db = new Client({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  database: process.env.DB_NAME || 'postgres',
  port: 5432,
});

db.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Database connection error', err.stack));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
        // Here we could add db.query('INSERT INTO messages...') later
        io.emit('chat message', msg);
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log('✅ Chat app ready for K8s deployment!');
});
EOF