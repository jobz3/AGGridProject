# Docker Deployment Guide

This guide explains how to deploy the AG Grid application using Docker.

## Prerequisites

- Docker Engine (v20.10+)
- Docker Compose (v2.0+)

## Quick Start

### 1. Configure Environment Variables

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit [.env](.env) and set your database credentials:

```env
DB_ROOT_PASS=your_secure_password
DB_USER=your_db_user
DB_PASS=your_db_password
```

### 2. Build and Run

Build and start all services:

```bash
docker compose up --build -d
```

This will:
- Build the frontend (Vite → Nginx)
- Build the backend (Node.js)
- Start MySQL database
- Start Adminer (database management UI)

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Adminer (DB UI)**: http://localhost:8080
- **MySQL**: localhost:3306

### Services

1. **mysql**: MySQL 8.0 database with persistent volume
2. **adminer**: Web-based database management
3. **backend**: Node.js/Express API server
4. **frontend**: React app served via Nginx

All services communicate through a dedicated Docker network (`app-network`).

## Commands

### Start Services
```bash
docker compose up -d
```

### Stop Services
```bash
docker compose down
```

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
```

### Rebuild After Code Changes
```bash
docker compose up --build -d
```

### Remove Everything (including volumes)
```bash
docker compose down -v
```

## Troubleshooting

### Services won't start
```bash
# Check logs
docker compose logs

# Check if ports are already in use
lsof -i :3000
lsof -i :5000
lsof -i :3306
```

### Database connection errors
```bash
# Ensure MySQL is healthy
docker compose ps mysql

# Check backend environment variables
docker compose exec backend env | grep DB_
```

### Frontend can't connect to backend
- Verify `BACKEND_URL` in `.env`
- Check backend is running: `docker compose ps backend`
- Verify network connectivity: `docker network inspect aggridproject_app-network`

### Reset database
```bash
docker compose down -v
docker compose up -d
```

## File Structure

```
AGGridProject/
├── client/                 # React frontend source
├── server/                 # Node.js backend source
├── dockerfile.frontend     # Frontend production Dockerfile
├── dockerfile.backend      # Backend production Dockerfile
├── docker-compose.yml      # Service orchestration
├── .dockerignore          # Build optimization
├── .env                   # Environment variables (not in git)
├── .env.example           # Example environment template
└── DEPLOYMENT.md          # This file
```


For issues or questions:
- Check logs: `docker logs`
- Verify environment: `docker config`
- Review health status: `docker-   ps`
