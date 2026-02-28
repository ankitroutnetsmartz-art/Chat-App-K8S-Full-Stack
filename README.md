# TunnelPro Chat Application

A real-time, full-stack chat application built with Node.js, Socket.IO, PostgreSQL, and Redis. Deployable locally or on Kubernetes with advanced messaging features.

## 🎯 Features

### Core Messaging
- ✅ Real-time bidirectional messaging via Socket.IO
- ✅ Message persistence with PostgreSQL
- ✅ Support for up to 2 concurrent user profiles
- ✅ Message search and filtering
- ✅ Infinite scroll with lazy-loading (50 messages at a time)

### Message Status & Receipts
- ✅ **Delivered** status – instantly sent to recipient
- ✅ **Read** status – tracked when message enters viewport
- ✅ Delivery/read indicators persist in database
- ✅ Real-time receipt updates across all clients

### User Experience
- ✅ Three theme options: **Dark** (default), **Light**, and **Solar**
- ✅ Theme preference saved in browser localStorage
- ✅ Typing indicators with 2-second timeout
- ✅ Message deletion with confirmation
- ✅ Clear entire chat history
- ✅ Live message counter
- ✅ Responsive glass-morphism UI with Tailwind CSS

### Infrastructure
- ✅ Redis adapter for Socket.IO clustering (optional)
- ✅ Graceful fallback if Redis unavailable
- ✅ Horizontal scalability with Kubernetes
- ✅ Connection logging and error handling

---

## 🏗 Project Structure

```
Chat-App-K8S-Full-Stack/
├── app/
│   ├── index.html          # Single-page chat UI
│   ├── server.js           # Express + Socket.IO backend
│   ├── package.json        # Node dependencies
│   └── Dockerfile          # Container image for app
├── k8s-manifests/
│   ├── 01-config.yaml      # ConfigMap and Secrets
│   ├── 02-db-statefulset.yaml    # PostgreSQL StatefulSet
│   ├── 03-app-deployment.yaml    # Node.js Deployment + Service
│   ├── 04-ingress.yaml     # Ingress routing
│   ├── 05-redis-statefulset.yaml # Redis StatefulSet
│   └── init.sql            # Database schema
└── README.md               # This file
```

---

## 🚀 Quick Start (Local)

### Prerequisites
- **Node.js** v16 or later
- **PostgreSQL** (local or Docker)
- **Redis** (optional, for clustering)

### 1. Initialize Database

```bash
# Create database
createdb chatapp

# Load schema
psql chatapp < k8s-manifests/init.sql
```

> **Docker alternative:**
> ```bash
> docker run --name chat-postgres -e POSTGRES_PASSWORD=secret -d postgres:latest
> docker exec chat-postgres createdb -U postgres chatapp
> docker exec -i chat-postgres psql -U postgres chatapp < k8s-manifests/init.sql
> ```

### 2. Configure Environment

Create `.env` file in the `app/` directory:

```env
DB_HOST=localhost
DB_USER=postgres
POSTGRES_PASSWORD=secret
DB_NAME=chatapp
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Install & Run

```bash
cd app
npm install
node server.js
```

Expected output:
```
✅ Database connected
✅ Redis adapter connected for Socket.IO clustering
🚀 Tunnel v14 Control Live
```

### 4. Open in Browser

Navigate to **http://localhost:3000**

- Add up to 2 user profiles
- Click a profile to enter chat
- Start messaging!

---

## 🎨 Using Themes

Click **Themes** in the top navigation bar:

- **Dark** – Deep blue/black with high contrast (default)
- **Light** – Clean white/gray for daylight use
- **Solar** – Solarized palette inspired by Solarized Dark

Your selected theme persists across sessions.

---

## 🔄 Chat Features

### Message Search
- Type in the search bar to filter visible messages locally
- Message counter updates in real-time

### Infinite Scroll
- Scroll to the top of the message list to load older messages
- Database pagination (50 messages per load) prevents lag

### Message Deletion
- Hover over your message and click the trash icon
- Deletion is persisted to the database

### Clear Chat
- Click the trash icon in the chat header to clear all messages
- Requires confirmation
- All clients receive the broadcast

### Typing Indicator
- Appears when anyone else is typing
- Disappears after 2 seconds of inactivity

### Read Receipts
- Sent messages show **"Delivered"** when reached the recipient
- Changes to **"Read"** when the message scrolls into view
- Status persists even after reload

---

## 🐳 Docker Deployment

### Using Docker Compose (Minimal)

```bash
docker-compose up -d
```

Expected setup:
- PostgreSQL on port 5432
- Redis on port 6379
- Node app on port 3000

---

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (1.20+)
- `kubectl` configured
- Docker registry access for images

### 1. Build & Push Image

```bash
cd app
docker build -t your-registry/chat-app:latest .
docker push your-registry/chat-app:latest
```

Update image references in `k8s-manifests/03-app-deployment.yaml`.

### 2. Apply Manifests

```bash
kubectl apply -f k8s-manifests/
```

### 3. Wait for Pods

```bash
kubectl get pods -w
```

### 4. Access Application

**Via Port-Forward:**
```bash
kubectl port-forward svc/app 3000:3000
```

**Via Ingress:**
Update `04-ingress.yaml` with your domain and apply:
```bash
kubectl apply -f k8s-manifests/04-ingress.yaml
```

### 5. Verify Setup

```bash
kubectl logs -f deploy/app
```

---

## 🗄️ Database Schema

### Messages Table

```sql
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  sender TEXT NOT NULL,              -- Username
  text TEXT NOT NULL,                -- Message content
  time TEXT NOT NULL,                -- Client timestamp
  delivered_at TIMESTAMP NULL,       -- Delivery receipt timestamp
  read_at TIMESTAMP NULL,            -- Read receipt timestamp
  created_at TIMESTAMP DEFAULT NOW() -- Server timestamp
);

CREATE INDEX idx_messages_created_at ON messages(created_at);
```

---

## 📡 Socket.IO Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `chat message` | `{user, text, time}` | New message |
| `typing` | `{user, isTyping}` | Typing indicator |
| `message delivered` | `msgId` | Acknowledge delivery |
| `message read` | `msgId` | Mark as read |
| `delete message` | `msgId` | Delete message |
| `clear chat` | - | Clear all messages |

### Server → Client (Broadcast)

| Event | Payload | Description |
|-------|---------|-------------|
| `chat message` | Full message object | New message for all |
| `typing` | `{user, isTyping}` | Typing broadcast |
| `message delivered` | `msgId` | Delivery receipt |
| `message read` | `msgId` | Read receipt |
| `delete message` | `msgId` | Message deleted |
| `clear chat` | - | Chat cleared |

---

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `db-service` | PostgreSQL hostname |
| `DB_USER` | `postgres` | Database user |
| `POSTGRES_PASSWORD` | - | **Required** |
| `DB_NAME` | `postgres` | Database name |
| `REDIS_HOST` | `redis-service` | Redis hostname |
| `REDIS_PORT` | `6379` | Redis port |

---

## 🐛 Troubleshooting

### "Cannot connect to database"
- Ensure PostgreSQL is running
- Verify credentials in `.env`
- Check `DB_HOST` and `DB_NAME`

### "Messages loading slowly"
- Verify database indexes are created
- Check PostgreSQL query logs: `EXPLAIN ANALYZE SELECT ...`

### "Redis not connecting (but app works)"
- This is normal! Redis is optional for non-clustered deployments
- For production clusters, ensure Redis is accessible at `REDIS_HOST`

### "Themes not persisting"
- Check browser localStorage is enabled
- Clear storage: `localStorage.clear()` in DevTools console

### "Messages not appearing after refresh"
- Rerun `init.sql` to ensure schema is up-to-date
- Check database permissions for the user

---

## 🚢 Production Checklist

- [ ] Set strong `POSTGRES_PASSWORD`
- [ ] Use environment secrets in Kubernetes (`kubectl create secret generic ...`)
- [ ] Enable HTTPS/TLS on Ingress
- [ ] Set resource limits in Deployment manifests
- [ ] Configure database backups (StatefulSet PVC retention)
- [ ] Monitor Redis memory usage
- [ ] Enable Socket.IO room-based broadcasts for scalability
- [ ] Implement rate limiting on message endpoints
- [ ] Add authentication/authorization layer

---

## 📊 Performance Notes

- **Infinite scroll**: Loads 50 messages per request
- **Database indexes**: Created on `created_at` for fast sorting
- **Redis adapter**: Enables horizontal scaling (optional)
- **Typing debounce**: 2-second timeout to reduce broadcasts
- **DOM filtering**: Client-side search is instant

---

## 🤝 Contributing

Contributions welcome! Areas for enhancement:
- User accounts & authentication
- Group chats
- File sharing
- Encryption
- Mobile responsive improvements
- Audit logging

---

## 📝 License

MIT License – feel free to use and modify.

---

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs: `kubectl logs deploy/app` (K8s) or console output (local)
3. Inspect browser DevTools → Network & Console tabs
4. Verify Socket.IO connectivity: Open DevTools → `io.engine.transport.type`

---

**Happy chatting!** 🎉
