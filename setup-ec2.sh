#!/bin/bash

# EC2 Initial Setup Script for project-grap
# Run this script once on your EC2 server to set up the environment

set -e

echo "🚀 Starting EC2 setup for project-grap..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running on Amazon Linux
if [ -f /etc/os-release ]; then
  . /etc/os-release
  echo -e "${YELLOW}Detected OS: $NAME${NC}"
fi

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo yum update -y || sudo apt update -y

# Install Docker
echo -e "${YELLOW}🐋 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
  sudo yum install -y docker || (curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh)
  sudo systemctl start docker
  sudo systemctl enable docker
  sudo usermod -aG docker $USER
  echo -e "${GREEN}✅ Docker installed${NC}"
else
  echo -e "${GREEN}✅ Docker already installed${NC}"
fi

# Install Docker Compose
echo -e "${YELLOW}🐋 Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
  echo -e "${GREEN}✅ Docker Compose already installed${NC}"
fi

# Install Git
echo -e "${YELLOW}📥 Installing Git...${NC}"
if ! command -v git &> /dev/null; then
  sudo yum install -y git || sudo apt install -y git
  echo -e "${GREEN}✅ Git installed${NC}"
else
  echo -e "${GREEN}✅ Git already installed${NC}"
fi

# Create project directory
echo -e "${YELLOW}📁 Creating project directory...${NC}"
mkdir -p ~/project-grap
cd ~/project-grap

# Check if repository is already cloned
if [ ! -d .git ]; then
  echo -e "${YELLOW}📥 Cloning repository...${NC}"
  read -p "Enter your GitHub repository URL (e.g., https://github.com/username/project-grap.git): " REPO_URL
  git clone $REPO_URL .
else
  echo -e "${GREEN}✅ Repository already cloned${NC}"
fi

# Set up environment file
echo -e "${YELLOW}📝 Setting up environment file...${NC}"
if [ ! -f .env ]; then
  cp .env.production.example .env
  echo -e "${RED}⚠️  IMPORTANT: Please edit .env file with your production values${NC}"
  echo -e "${YELLOW}Run: nano ~/project-grap/.env${NC}"
else
  echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Set up docker-compose
echo -e "${YELLOW}🐋 Setting up docker-compose...${NC}"
if [ ! -f docker-compose.yml ]; then
  cp docker-compose.prod.yml docker-compose.yml
  echo -e "${GREEN}✅ docker-compose.yml created${NC}"
else
  echo -e "${GREEN}✅ docker-compose.yml already exists${NC}"
fi

# Make deploy script executable
chmod +x deploy.sh

# Create directories
mkdir -p uploads logs backups

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ EC2 Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Edit environment variables:"
echo -e "   ${GREEN}nano ~/project-grap/.env${NC}"
echo ""
echo -e "2. Configure the following in .env:"
echo -e "   - DATABASE_PASSWORD"
echo -e "   - JWT_SECRET"
echo -e "   - AWS credentials"
echo -e "   - RAZORPAY credentials"
echo -e "   - DOCKER_USERNAME"
echo ""
echo -e "3. Log out and log back in for Docker group changes:"
echo -e "   ${GREEN}exit${NC}"
echo ""
echo -e "4. After logging back in, start the application:"
echo -e "   ${GREEN}cd ~/project-grap && ./deploy.sh${NC}"
echo ""
echo -e "${YELLOW}For GitHub Actions deployment, make sure these secrets are set:${NC}"
echo -e "   - EC2_HOST"
echo -e "   - EC2_USERNAME (use: $(whoami))"
echo -e "   - EC2_SSH_KEY"
echo -e "   - EC2_SSH_PORT (usually 22)"
echo -e "   - DOCKER_USERNAME"
echo -e "   - DOCKER_PASSWORD"
echo ""
