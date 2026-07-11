#!/bin/bash
set -e

# ==============================================================================
# Morlen OS - Alibaba Cloud ECS Deployment Script
# Description: Automates the deployment of the Morlen Autopilot Backend to an
#              Alibaba Cloud ECS instance running Ubuntu.
# Requirements: aliyun-cli configured locally, or run this directly on the ECS box.
# ==============================================================================

echo "[Morlen] Starting Alibaba Cloud ECS Deployment..."

# 1. Update system and install Docker if not present
echo "[Morlen] Installing dependencies on ECS..."
sudo apt-get update -y
sudo apt-get install -y docker.io docker-compose git

# 2. Build the Docker Image natively
echo "[Morlen] Building Morlen Backend Docker Image..."
sudo docker build -t morlen-backend:latest .

# 3. Stop existing container if running
echo "[Morlen] Stopping existing containers..."
sudo docker stop morlen-backend || true
sudo docker rm morlen-backend || true

# 4. Run the container with required environment variables
# Note: Ensure these variables are exported in your ECS environment or .env file.
echo "[Morlen] Launching container with DashScope Integration..."
sudo docker run -d \
    --name morlen-backend \
    -p 80:8080 \
    --env-file .env \
    --restart always \
    morlen-backend:latest

echo "[Morlen] Deployment to Alibaba Cloud ECS Successful!"
echo "[Morlen] Native DashScope integrations are live on port 80."
