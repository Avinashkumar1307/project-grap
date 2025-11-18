# AWS EC2 Deployment Guide

This guide will help you deploy the project-grap application to your AWS EC2 server.

## Server Information
- **Host**: ec2-13-201-168-29.ap-south-1.compute.amazonaws.com
- **Region**: ap-south-1 (Mumbai)

---

## Prerequisites

Before starting the deployment, ensure you have:
- AWS EC2 instance running (Ubuntu/Amazon Linux)
- SSH access to the EC2 instance
- Docker and Docker Compose installed on EC2
- GitHub repository access
- Docker Hub account (images are pushed here)

---

## Part 1: EC2 Server Setup

### 1. Connect to Your EC2 Instance

```bash
ssh -i /path/to/your-key.pem ubuntu@ec2-13-201-168-29.ap-south-1.compute.amazonaws.com
```

> **Note**: Replace `ubuntu` with `ec2-user` if using Amazon Linux

### 2. Install Docker and Docker Compose

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Log out and log back in for group changes to take effect
exit
```

### 3. Install Git

```bash
sudo apt install git -y
git --version
```

### 4. Clone the Repository

```bash
cd ~
git clone https://github.com/YOUR-USERNAME/project-grap.git
cd project-grap
```

### 5. Configure Environment Variables

```bash
# Copy the production environment template
cp .env.production.example .env

# Edit the .env file with your actual values
nano .env
```

Fill in all required values:
- Database passwords (use strong passwords)
- JWT secret (minimum 32 characters)
- AWS credentials and S3 bucket details
- Razorpay API credentials
- Docker Hub username

### 6. Create Required Directories

```bash
mkdir -p uploads logs backups
```

### 7. Configure Docker Compose

```bash
# Use the production docker-compose file
cp docker-compose.prod.yml docker-compose.yml
```

### 8. Configure EC2 Security Group

Ensure your EC2 security group allows:
- **Port 22**: SSH access (your IP only)
- **Port 3000**: Application access (0.0.0.0/0 or specific IPs)
- **Port 80**: HTTP (if using nginx reverse proxy)
- **Port 443**: HTTPS (if using SSL)

### 9. First Deployment

```bash
# Make the deployment script executable
chmod +x deploy.sh

# Run the initial deployment
./deploy.sh
```

---

## Part 2: GitHub Secrets Configuration

To enable automatic deployments via GitHub Actions, configure the following secrets in your GitHub repository:

### Navigate to GitHub Secrets
1. Go to your repository on GitHub
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**

### Required Secrets

| Secret Name | Description | Example |
|------------|-------------|---------|
| `DOCKER_USERNAME` | Your Docker Hub username | `johndoe` |
| `DOCKER_PASSWORD` | Your Docker Hub password or access token | `dckr_pat_xxxxx` |
| `EC2_HOST` | EC2 public hostname or IP | `ec2-13-201-168-29.ap-south-1.compute.amazonaws.com` |
| `EC2_USERNAME` | SSH username for EC2 | `ubuntu` or `ec2-user` |
| `EC2_SSH_KEY` | Private SSH key for EC2 access | Contents of your `.pem` file |
| `EC2_SSH_PORT` | SSH port (usually 22) | `22` |

### Setting Up EC2_SSH_KEY

```bash
# On your local machine, copy your private key
cat /path/to/your-key.pem
```

Copy the entire output (including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`) and paste it as the value for `EC2_SSH_KEY`.

---

## Part 3: Deployment Workflow

### Automatic Deployment

Once GitHub secrets are configured, deployments happen automatically:

1. Push code to the `master` branch
2. GitHub Actions will:
   - Run tests and linting
   - Build the application
   - Build and push Docker image to Docker Hub
   - Deploy to EC2 server automatically

### Manual Deployment

If you need to deploy manually:

```bash
# SSH into your EC2 instance
ssh -i /path/to/your-key.pem ubuntu@ec2-13-201-168-29.ap-south-1.compute.amazonaws.com

# Navigate to project directory
cd ~/project-grap

# Run deployment script
./deploy.sh
```

---

## Part 4: Managing the Application

### View Logs

```bash
# View all container logs
docker-compose logs

# View app logs only
docker-compose logs app

# Follow logs in real-time
docker-compose logs -f app

# View last 100 lines
docker-compose logs --tail=100 app
```

### Check Container Status

```bash
docker-compose ps
```

### Restart Application

```bash
# Restart all services
docker-compose restart

# Restart only the app
docker-compose restart app
```

### Stop Application

```bash
docker-compose down
```

### Start Application

```bash
docker-compose up -d
```

### Database Backup

```bash
# Create a backup
docker-compose exec postgres pg_dump -U postgres project_grap_db > ./backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker-compose exec -T postgres psql -U postgres project_grap_db < ./backups/backup_file.sql
```

---

## Part 5: Setting Up Nginx Reverse Proxy (Optional)

For production, it's recommended to use Nginx as a reverse proxy:

### Install Nginx

```bash
sudo apt install nginx -y
```

### Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/project-grap
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name ec2-13-201-168-29.ap-south-1.compute.amazonaws.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the configuration:

```bash
sudo ln -s /etc/nginx/sites-available/project-grap /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Part 6: SSL/HTTPS Setup with Let's Encrypt (Optional)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

---

## Monitoring and Troubleshooting

### Check Application Health

```bash
curl http://localhost:3000/health
```

### Check Disk Space

```bash
df -h
```

### Clean Up Docker Resources

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Remove everything unused
docker system prune -a --volumes
```

### View System Resources

```bash
# CPU and Memory usage
docker stats

# System resource usage
htop  # Install with: sudo apt install htop
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Environment (production) |
| `DATABASE_HOST` | Yes | Database host (postgres for Docker) |
| `DATABASE_PORT` | Yes | Database port (5432) |
| `DATABASE_USER` | Yes | Database username |
| `DATABASE_PASSWORD` | Yes | Database password |
| `DATABASE_NAME` | Yes | Database name |
| `JWT_SECRET` | Yes | Secret for JWT tokens |
| `AWS_ACCESS_KEY_ID` | Yes | AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Yes | AWS secret key |
| `AWS_REGION` | Yes | AWS region |
| `AWS_S3_BUCKET_NAME` | Yes | S3 bucket name |
| `RAZORPAY_KEY_ID` | Yes | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay secret |
| `DOCKER_USERNAME` | Yes | Docker Hub username |

---

## Quick Reference Commands

```bash
# Deploy application
./deploy.sh

# View logs
docker-compose logs -f app

# Restart application
docker-compose restart app

# Check status
docker-compose ps

# Access database
docker-compose exec postgres psql -U postgres project_grap_db

# Backup database
docker-compose exec postgres pg_dump -U postgres project_grap_db > backup.sql

# SSH to server
ssh -i key.pem ubuntu@ec2-13-201-168-29.ap-south-1.compute.amazonaws.com
```

---

## Support

For issues or questions:
1. Check application logs: `docker-compose logs app`
2. Check database logs: `docker-compose logs postgres`
3. Verify environment variables in `.env`
4. Check GitHub Actions workflow status
5. Review EC2 security group settings

---

## Security Best Practices

1. **Never commit `.env` files** to version control
2. Use strong passwords for database and JWT secrets
3. Restrict EC2 security group to specific IPs when possible
4. Keep system and packages updated: `sudo apt update && sudo apt upgrade`
5. Enable AWS CloudWatch for monitoring
6. Set up automated backups for the database
7. Use HTTPS in production with SSL certificates
8. Rotate secrets regularly
9. Use AWS Secrets Manager for sensitive credentials
10. Enable EC2 instance monitoring and logging
