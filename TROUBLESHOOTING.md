# Deployment Troubleshooting Guide

Common issues and solutions for deploying project-grap to AWS EC2.

---

## Error: "compose build requires buildx 0.17 or later"

### Cause
Docker Compose is trying to build the image locally instead of pulling it from Docker Hub.

### Solution

**Option 1: Update your `.env` file on EC2**

Make sure `DOCKER_USERNAME` is set in your `.env` file:

```bash
ssh -i your-key.pem ec2-user@your-ec2-host
cd ~/project-grap
nano .env
```

Add this line with your actual Docker Hub username:
```
DOCKER_USERNAME=your-actual-docker-hub-username
```

**Option 2: Ensure docker-compose.yml is correct**

```bash
cd ~/project-grap
cp docker-compose.prod.yml docker-compose.yml
```

**Option 3: Run deployment script**

```bash
cd ~/project-grap
./deploy.sh
```

**Fix Applied**: The latest deployment workflow now:
- Exports `DOCKER_USERNAME` environment variable
- Always copies `docker-compose.prod.yml` to `docker-compose.yml`
- Uses `--no-build` flag to prevent build attempts
- Only pulls pre-built images from Docker Hub

---

## Error: "ssh: no key found" or "unable to authenticate"

### Cause
SSH private key not properly configured in GitHub Secrets.

### Solution

1. **Get your private key**:
   ```bash
   cat /path/to/your-ec2-key.pem
   ```

2. **Update GitHub Secret**:
   - Go to **Settings** → **Secrets and variables** → **Actions**
   - Edit `EC2_SSH_KEY`
   - Paste the ENTIRE key including:
     - `-----BEGIN RSA PRIVATE KEY-----` (or similar)
     - All content in between
     - `-----END RSA PRIVATE KEY-----` (or similar)

3. **Verify the key works**:
   ```bash
   ssh -i your-key.pem ec2-user@your-ec2-host
   ```

See `SSH_SETUP_GUIDE.md` for detailed instructions.

---

## Error: "No such file or directory: /home//project-grap"

### Cause
`EC2_USERNAME` GitHub secret is not set or is empty.

### Solution

1. Check your EC2 username:
   - **Amazon Linux**: `ec2-user`
   - **Ubuntu**: `ubuntu`
   - **Debian**: `admin`

2. Set the GitHub secret:
   - Go to **Settings** → **Secrets and variables** → **Actions**
   - Create/update `EC2_USERNAME` with the correct value

---

## Error: "permission denied" when running Docker commands

### Cause
User is not in the `docker` group.

### Solution

```bash
# On your EC2 server
sudo usermod -aG docker $USER

# Log out and log back in
exit

# Verify
docker ps
```

---

## Error: "Cannot connect to the Docker daemon"

### Cause
Docker service is not running.

### Solution

```bash
# Start Docker
sudo systemctl start docker

# Enable Docker to start on boot
sudo systemctl enable docker

# Check status
sudo systemctl status docker
```

---

## Error: Images not pulling from Docker Hub

### Cause
Either the image doesn't exist or you're not logged into Docker Hub on EC2.

### Solution

**Option 1: Use public images** (recommended)

Make sure your Docker Hub repository is public:
1. Go to Docker Hub
2. Navigate to your repository
3. Settings → Make Public

**Option 2: Login to Docker Hub on EC2**

```bash
ssh -i your-key.pem ec2-user@your-ec2-host
docker login
# Enter your Docker Hub credentials
```

**Verify image exists**:
```bash
# Check if image is on Docker Hub
docker pull your-username/project-grap:latest
```

---

## Error: Port 3000 already in use

### Cause
Another container or process is using port 3000.

### Solution

```bash
# Stop all containers
docker-compose down

# Or find and kill the process
sudo lsof -i :3000
sudo kill -9 <PID>

# Then restart
docker-compose up -d
```

---

## Error: Database connection failed

### Cause
PostgreSQL container not ready or incorrect credentials.

### Solution

**Check container logs**:
```bash
docker-compose logs postgres
docker-compose logs app
```

**Verify database credentials in `.env`**:
```bash
DATABASE_HOST=postgres  # Must be "postgres" (service name)
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your-password
DATABASE_NAME=project_grap_db
```

**Wait for PostgreSQL to be ready**:
```bash
# The healthcheck should handle this, but you can verify
docker-compose ps
# postgres should show "healthy"
```

**Restart services**:
```bash
docker-compose down
docker-compose up -d
```

---

## Error: "Git pull failed" during deployment

### Cause
Git credentials not configured or merge conflicts.

### Solution

**Setup Git on EC2**:
```bash
ssh -i your-key.pem ec2-user@your-ec2-host
cd ~/project-grap

# If private repo, set up SSH key for GitHub
ssh-keygen -t ed25519 -C "your-email@example.com"
cat ~/.ssh/id_ed25519.pub
# Add this to GitHub: Settings → SSH and GPG keys

# Or use HTTPS with token
git remote set-url origin https://YOUR-TOKEN@github.com/username/project-grap.git
```

**Reset local changes**:
```bash
cd ~/project-grap
git reset --hard origin/master
git pull
```

---

## Error: EC2 Security Group blocking connections

### Cause
Firewall rules not configured correctly.

### Solution

1. **Go to AWS Console** → **EC2** → **Security Groups**

2. **Select your instance's security group**

3. **Add inbound rules**:
   | Type | Protocol | Port | Source |
   |------|----------|------|--------|
   | SSH | TCP | 22 | Your IP / 0.0.0.0/0 |
   | Custom TCP | TCP | 3000 | 0.0.0.0/0 |
   | HTTP | TCP | 80 | 0.0.0.0/0 (if using nginx) |
   | HTTPS | TCP | 443 | 0.0.0.0/0 (if using SSL) |

---

## Error: Disk space full

### Cause
Docker images and containers filling up disk.

### Solution

```bash
# Clean up Docker resources
docker system prune -af --volumes

# Check disk space
df -h

# Remove old images
docker image prune -a

# Remove unused volumes
docker volume prune
```

---

## Error: GitHub Actions timeout

### Cause
Deployment taking too long (usually waiting for Docker pulls).

### Solution

**Increase timeout in workflow**:
```yaml
- name: Deploy to EC2
  timeout-minutes: 20  # Add this line
```

**Or check EC2 internet speed**:
```bash
# On EC2
curl -s https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py | python3 -
```

---

## Container keeps restarting

### Cause
Application crashing on startup.

### Solution

**Check logs**:
```bash
docker-compose logs -f app
```

**Common issues**:
1. **Missing environment variables**: Check `.env` file
2. **Database not ready**: Wait for postgres to be healthy
3. **Port conflict**: Check if port 3000 is available
4. **Application error**: Fix code issues

**Debug by running container manually**:
```bash
docker-compose down
docker-compose up app
# Watch the output for errors
```

---

## How to verify deployment is working

### 1. Check container status
```bash
docker-compose ps
```

All containers should show as "Up" or "healthy".

### 2. Check application logs
```bash
docker-compose logs --tail=50 app
```

Look for "Application is running on port 3000" or similar.

### 3. Test the endpoint
```bash
curl http://localhost:3000
# Or from outside
curl http://your-ec2-host:3000
```

### 4. Check database connection
```bash
docker-compose exec postgres psql -U postgres -d project_grap_db -c "SELECT 1;"
```

Should return:
```
 ?column?
----------
        1
```

---

## Manual deployment steps (when automation fails)

If GitHub Actions deployment fails, deploy manually:

```bash
# 1. SSH to EC2
ssh -i your-key.pem ec2-user@your-ec2-host

# 2. Navigate to project
cd ~/project-grap

# 3. Pull latest code
git pull origin master

# 4. Update docker-compose
cp docker-compose.prod.yml docker-compose.yml

# 5. Pull images
docker-compose pull

# 6. Restart services
docker-compose down
docker-compose up -d --no-build

# 7. Check status
docker-compose ps
docker-compose logs -f app
```

---

## Getting help

### Useful commands for debugging

```bash
# View all running containers
docker ps -a

# View container logs
docker-compose logs <service-name>

# Follow logs in real-time
docker-compose logs -f app

# Inspect container
docker inspect project-grap-app

# Enter container shell
docker-compose exec app sh

# Check environment variables in container
docker-compose exec app env

# Test database connection
docker-compose exec postgres psql -U postgres -l

# View system resources
docker stats

# Check EC2 system logs
sudo journalctl -u docker
```

### Log locations

- **Docker logs**: `docker-compose logs`
- **Application logs**: `~/project-grap/logs/` (if configured)
- **EC2 system logs**: `/var/log/messages` or `/var/log/syslog`
- **SSH logs**: `/var/log/auth.log` or `/var/log/secure`

---

## Need more help?

1. Check GitHub Actions logs for specific errors
2. Review `DEPLOYMENT.md` for setup instructions
3. Review `SSH_SETUP_GUIDE.md` for SSH issues
4. Check application logs with `docker-compose logs app`
5. Verify all environment variables are set correctly in `.env`
