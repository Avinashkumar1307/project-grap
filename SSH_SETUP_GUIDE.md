# SSH Key Setup Guide for GitHub Actions

This guide will help you correctly set up SSH authentication for automated deployments to EC2.

## Problem
You're getting this error:
```
ssh.ParsePrivateKey: ssh: no key found
ssh: handshake failed: ssh: unable to authenticate
```

This means the SSH key in GitHub Secrets isn't formatted correctly.

---

## Solution: Configure GitHub Secrets Correctly

### Step 1: Get Your EC2 Private Key

Your EC2 private key is the `.pem` file you downloaded when creating the EC2 instance.

**IMPORTANT**: You need the **PRIVATE** key (the `.pem` file), NOT the public key.

### Step 2: View Your Private Key

On your local machine:

```bash
# Display your private key
cat /path/to/your-ec2-key.pem
```

The output should look like this:

```
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
[... many more lines ...]
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
-----END RSA PRIVATE KEY-----
```

Or if it's a newer key:

```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDxxxxxxxx
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
[... many more lines ...]
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
-----END PRIVATE KEY-----
```

Or ED25519 format:

```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
[... many more lines ...]
-----END OPENSSH PRIVATE KEY-----
```

### Step 3: Add to GitHub Secrets

1. **Copy the ENTIRE output** from Step 2, including:
   - The `-----BEGIN` line
   - All the middle content
   - The `-----END` line

2. Go to your GitHub repository

3. Navigate to: **Settings** → **Secrets and variables** → **Actions**

4. Click **New repository secret**

5. Create these secrets:

#### EC2_SSH_KEY
- **Name**: `EC2_SSH_KEY`
- **Value**: Paste the ENTIRE private key content (from Step 2)
- **Important**: Make sure there are NO extra spaces before or after
- **Important**: The key must start with `-----BEGIN` and end with `-----END`

#### EC2_HOST
- **Name**: `EC2_HOST`
- **Value**: `ec2-13-201-168-29.ap-south-1.compute.amazonaws.com`

#### EC2_USERNAME
- **Name**: `EC2_USERNAME`
- **Value**: `ubuntu` (or `ec2-user` if using Amazon Linux)

#### EC2_SSH_PORT
- **Name**: `EC2_SSH_PORT`
- **Value**: `22`

---

## Verify Secrets Are Set Correctly

You can verify by manually testing SSH from your local machine:

```bash
# Test SSH connection with your key
ssh -i /path/to/your-ec2-key.pem ubuntu@ec2-13-201-168-29.ap-south-1.compute.amazonaws.com

# If it asks for a password, your key is not correct
# If it connects without a password, your key is correct
```

---

## Common Issues and Solutions

### Issue 1: Wrong Key Format

**Problem**: Key doesn't start with `-----BEGIN`

**Solution**: Make sure you copied the **private** key, not the public key (`.pub` file)

### Issue 2: Extra Spaces or Newlines

**Problem**: GitHub Actions adds or removes newlines

**Solution**:
1. Copy the key exactly as shown in Step 2
2. Do NOT add any extra newlines at the beginning or end
3. Do NOT remove any existing newlines in the middle

### Issue 3: Key Has a Passphrase

**Problem**: Your private key is encrypted with a passphrase

**Solution**: You need to remove the passphrase or create a new key without one:

```bash
# Remove passphrase from existing key
ssh-keygen -p -f /path/to/your-ec2-key.pem

# Or create a new key pair on EC2
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github_actions -N ""
```

### Issue 4: Key Permissions on EC2

**Problem**: SSH key on EC2 has wrong permissions

**Solution**: On your EC2 server, fix permissions:

```bash
# Fix permissions for authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys

# Verify permissions
ls -la ~/.ssh/
```

### Issue 5: Wrong Username

**Problem**: Using wrong username for EC2

**Solution**:
- Ubuntu AMI uses: `ubuntu`
- Amazon Linux AMI uses: `ec2-user`
- Some custom AMIs use: `admin` or `root`

Test which one works:
```bash
ssh -i key.pem ubuntu@your-ec2-host
ssh -i key.pem ec2-user@your-ec2-host
```

---

## Testing the Setup

### Test 1: Manual SSH from Local Machine

```bash
ssh -i /path/to/your-ec2-key.pem ubuntu@ec2-13-201-168-29.ap-south-1.compute.amazonaws.com
```

If this works, your key is valid.

### Test 2: Verify EC2 Security Group

Make sure your EC2 security group allows SSH (port 22):
- **Type**: SSH
- **Protocol**: TCP
- **Port**: 22
- **Source**: 0.0.0.0/0 (or restrict to GitHub Actions IP ranges)

### Test 3: Check GitHub Actions Logs

After pushing code:
1. Go to **Actions** tab in GitHub
2. Click on the latest workflow run
3. Click on the **Deploy to AWS EC2** job
4. Check the **Configure SSH** step for errors

---

## Alternative: Use GitHub Actions Deploy Keys

If you continue having issues, you can create a dedicated SSH key for GitHub Actions:

### On Your EC2 Server:

```bash
# Create a new SSH key (no passphrase)
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions -N ""

# Add the public key to authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Display the private key (copy this to GitHub Secrets)
cat ~/.ssh/github_actions
```

### In GitHub Secrets:

Use the output from the last command as `EC2_SSH_KEY`.

---

## Quick Verification Checklist

Before pushing to GitHub, verify:

- [ ] `EC2_SSH_KEY` contains the full private key with BEGIN and END lines
- [ ] `EC2_HOST` is correct: `ec2-13-201-168-29.ap-south-1.compute.amazonaws.com`
- [ ] `EC2_USERNAME` is correct (usually `ubuntu` or `ec2-user`)
- [ ] `EC2_SSH_PORT` is `22`
- [ ] SSH works manually from your local machine
- [ ] EC2 security group allows port 22
- [ ] The user on EC2 has the corresponding public key in `~/.ssh/authorized_keys`

---

## Still Having Issues?

### Enable SSH Debug Mode

Temporarily add debug output to the workflow:

Edit `.github/workflows/ci.yml` and change the SSH command:

```yaml
ssh -vvv -i ~/.ssh/deploy_key -p ${PORT} ${USERNAME}@${HOST} << 'ENDSSH'
```

The `-vvv` flag will show detailed SSH connection information.

### Check EC2 SSH Logs

On your EC2 server:

```bash
# View SSH authentication logs
sudo tail -f /var/log/auth.log  # Ubuntu/Debian
sudo tail -f /var/log/secure    # Amazon Linux/RHEL
```

These logs will show why authentication is failing.

---

## Summary

The most common fix is ensuring `EC2_SSH_KEY` contains the **complete private key** with proper formatting:

```
-----BEGIN RSA PRIVATE KEY-----
[key content]
-----END RSA PRIVATE KEY-----
```

No extra spaces, no missing lines, and it must be the **private** key from your `.pem` file.
