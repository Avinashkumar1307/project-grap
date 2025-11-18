# Docker Setup Guide

This guide explains how to use Docker with this NestJS application.

## Prerequisites

- Docker installed (https://docs.docker.com/get-docker/)
- Docker Compose installed (comes with Docker Desktop)
- Docker Hub account (for CI/CD push)

## Quick Start

### 1. Local Development with Docker Compose

```bash
# Copy environment file
cp .env.example .env

# Update .env file with your configuration
# For Docker, set DATABASE_HOST=postgres

# Start all services (app + PostgreSQL)
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

### 2. Build Docker Image Manually

```bash
# Build the image
docker build -t project-grap:latest .

# Run the container
docker run -p 3000:3000 \
  -e DATABASE_HOST=your-db-host \
  -e DATABASE_USER=your-db-user \
  -e DATABASE_PASSWORD=your-db-password \
  -e DATABASE_NAME=your-db-name \
  project-grap:latest
```

## Docker Compose Services

### Production Mode (default)
```bash
docker-compose up -d
```

This starts:
- PostgreSQL database (postgres:15-alpine)
- NestJS application (production build)

### Development Mode
Uncomment the `app-dev` service in docker-compose.yml and run:
```bash
docker-compose up app-dev -d
```

This enables hot-reload for development.

## Environment Variables

Create a `.env` file from `.env.example`:

```env
# For Docker Compose
NODE_ENV=production
APP_PORT=3000
DATABASE_HOST=postgres    # Use 'postgres' for Docker Compose
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=project_grap_db

# Add your secrets
JWT_SECRET=your-secret-key
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
RAZORPAY_KEY_ID=your-key
RAZORPAY_KEY_SECRET=your-secret
```

## CI/CD Pipeline

### GitHub Actions Setup

The CI/CD pipeline automatically builds and pushes Docker images to Docker Hub when you push to `master` or `develop` branches.

#### Required GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

1. **DOCKER_USERNAME**: Your Docker Hub username
2. **DOCKER_TOKEN**: Your Docker Hub access token (create at https://hub.docker.com/settings/security)

#### How to Create Docker Hub Access Token

1. Go to https://hub.docker.com/settings/security
2. Click "New Access Token"
3. Give it a name (e.g., "GitHub Actions")
4. Select "Read & Write" permissions
5. Copy the token and add it as `DOCKER_TOKEN` in GitHub secrets

#### Docker Image Tags

The pipeline creates multiple tags:
- `your-username/project-grap:master` - Latest master branch
- `your-username/project-grap:develop` - Latest develop branch
- `your-username/project-grap:master-abc1234` - Specific commit SHA
- `your-username/project-grap:latest` - Latest from default branch (master)

### Pipeline Workflow

```
Push to master/develop
  ↓
Run Tests & Linting
  ↓
Build Application
  ↓
Build Docker Image
  ↓
Push to Docker Hub
```

The Docker job runs only on pushes to `master` or `develop` branches (not on PRs).

## Docker Image Details

### Multi-stage Build

The Dockerfile uses a multi-stage build for optimization:

1. **Builder Stage**: Installs all dependencies and builds the application
2. **Production Stage**: Only includes production dependencies and built code

### Security Features

- Runs as non-root user (`nestjs:nodejs`)
- Minimal Alpine Linux base image
- No dev dependencies in final image
- Health check endpoint configured

### Image Size Optimization

- Uses Alpine Linux (smaller base image)
- Multi-stage build (separates build and runtime)
- Build cache optimization in CI/CD
- Only production dependencies included

## Useful Commands

```bash
# View running containers
docker ps

# View all containers
docker ps -a

# View logs
docker logs project-grap-app
docker-compose logs -f

# Execute commands in container
docker exec -it project-grap-app sh

# Restart a service
docker-compose restart app

# Rebuild and restart
docker-compose up -d --build

# Remove all containers and volumes
docker-compose down -v

# View images
docker images

# Remove unused images
docker image prune -a
```

## Troubleshooting

### Database Connection Issues

If the app can't connect to the database:

1. Check DATABASE_HOST is set to `postgres` (not `localhost`)
2. Ensure PostgreSQL container is healthy: `docker-compose ps`
3. Check logs: `docker-compose logs postgres`

### Port Already in Use

If port 3000 is already in use:

```bash
# Change APP_PORT in .env file
APP_PORT=3001

# Or modify docker-compose.yml
ports:
  - "3001:3000"
```

### Build Failures

```bash
# Clear Docker cache and rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Health Check Failing

The Dockerfile includes a health check that expects a `/health` endpoint. Ensure your NestJS app has this endpoint or remove the HEALTHCHECK directive from the Dockerfile.

## Production Deployment

### Pull and Run from Docker Hub

```bash
# Pull the latest image
docker pull your-username/project-grap:latest

# Run with environment variables
docker run -d \
  --name project-grap-app \
  -p 3000:3000 \
  -e DATABASE_HOST=your-production-db \
  -e DATABASE_USER=your-user \
  -e DATABASE_PASSWORD=your-password \
  -e DATABASE_NAME=your-db \
  -e JWT_SECRET=your-secret \
  your-username/project-grap:latest
```

### Using Docker Compose in Production

1. Copy `docker-compose.yml` to your server
2. Create `.env` file with production values
3. Update database credentials
4. Run: `docker-compose up -d`

## Next Steps

1. Add GitHub secrets for Docker Hub
2. Push to master/develop to trigger the pipeline
3. Monitor the Actions tab for build status
4. Pull and run your image from Docker Hub

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Deployment Guide](https://docs.nestjs.com/deployment)
