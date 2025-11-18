#!/bin/bash

# Deployment script for project-grap on AWS EC2
# This script pulls the latest code and Docker images, then restarts the application

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Configuration
DOCKER_USERNAME="${DOCKER_USERNAME:-your-docker-username}"
APP_DIR="/home/$(whoami)/project-grap"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📁 Navigating to application directory...${NC}"
cd "$APP_DIR"

echo -e "${YELLOW}🔄 Pulling latest code from Git...${NC}"
git pull origin master

echo -e "${YELLOW}🐋 Pulling latest Docker images...${NC}"
docker-compose pull

echo -e "${YELLOW}⏬ Stopping current containers...${NC}"
docker-compose down

echo -e "${YELLOW}⏫ Starting containers with new images...${NC}"
docker-compose up -d

echo -e "${YELLOW}🧹 Cleaning up old Docker images...${NC}"
docker image prune -af --filter "until=24h"

echo -e "${YELLOW}📊 Checking container status...${NC}"
docker-compose ps

echo -e "${YELLOW}📝 Checking application logs...${NC}"
docker-compose logs --tail=50 app

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Application is running at http://$(curl -s http://169.254.169.254/latest/meta-data/public-hostname):3000${NC}"
