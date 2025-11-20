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
docker-compose up --build -d
```

This will:
- Build the frontend (Vite → Nginx)
- Build the backend (Node.js)
- Start MySQL database
- Start Adminer (database management UI)

### 3. Access the Application

- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:3000
- **Adminer (DB UI)**: http://localhost:8080
- **MySQL**: localhost:3306

## Architecture

### Frontend (dockerfile.frontend)
- **Build Stage**: Compiles React/Vite app using Node.js 18 Alpine
- **Production Stage**: Serves static files via Nginx Alpine
- **Features**:
  - Multi-stage build reduces final image size
  - SPA routing support
  - API proxy to backend at `/api`
  - Health checks

### Backend (dockerfile.backend)
- **Dependencies Stage**: Installs production dependencies only
- **Production Stage**: Runs Node.js app as non-root user
- **Features**:
  - Multi-stage build
  - Non-root user (nodeuser) for security
  - Health check endpoint
  - Alpine-based for minimal size

### Services

1. **mysql**: MySQL 8.0 database with persistent volume
2. **adminer**: Web-based database management
3. **backend**: Node.js/Express API server
4. **frontend**: React app served via Nginx

All services communicate through a dedicated Docker network (`app-network`).

## Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Rebuild After Code Changes
```bash
docker-compose up --build -d
```

### Remove Everything (including volumes)
```bash
docker-compose down -v
```

## Production Deployment

### Security Checklist

- [ ] Change all default passwords in `.env`
- [ ] Use strong, unique passwords for `DB_ROOT_PASS` and `DB_PASS`
- [ ] Remove or secure Adminer in production (port 8080)
- [ ] Configure firewall rules to restrict port access
- [ ] Use HTTPS with a reverse proxy (Nginx/Traefik)
- [ ] Set up automated backups for MySQL volume
- [ ] Review and update `restart: unless-stopped` policy

### Environment-Specific Configuration

For production, consider:

1. **Use secrets management** instead of `.env` files
2. **Set up SSL/TLS** with Let's Encrypt or similar
3. **Configure logging** to external services
4. **Set resource limits** in docker-compose.yml:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

### Health Checks

All services include health checks:
- **MySQL**: Checks database availability
- **Backend**: HTTP check on `/health` endpoint
- **Frontend**: HTTP check on root endpoint

Monitor with:
```bash
docker-compose ps
```

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs

# Check if ports are already in use
lsof -i :3000
lsof -i :5000
lsof -i :3306
```

### Database connection errors
```bash
# Ensure MySQL is healthy
docker-compose ps mysql

# Check backend environment variables
docker-compose exec backend env | grep DB_
```

### Frontend can't connect to backend
- Verify `BACKEND_URL` in `.env`
- Check backend is running: `docker-compose ps backend`
- Verify network connectivity: `docker network inspect aggridproject_app-network`

### Reset database
```bash
docker-compose down -v
docker-compose up -d
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
- Review health status: `docker-compose ps`
