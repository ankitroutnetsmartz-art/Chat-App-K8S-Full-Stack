-- Initialize PostgreSQL database for Chat App

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  sender TEXT NOT NULL,
  text TEXT NOT NULL,
  time TEXT NOT NULL,
  delivered_at TIMESTAMP NULL,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
