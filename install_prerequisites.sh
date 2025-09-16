#!/bin/bash

echo "Updating package list..."
sudo apt update

echo "Installing curl..."
sudo apt install curl -y

echo "Setting up NodeSource repository for Node.js v20.10..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

echo "Installing Node.js v20.10..."
sudo apt install nodejs -y

echo "Verifying Node.js installation..."
node -v

echo "Installing Docker..."

sudo apt remove docker docker-engine docker.io containerd runc -y

sudo apt install apt-transport-https ca-certificates curl software-properties-common -y

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io -y

echo "Verifying Docker installation..."
sudo docker --version

echo "Starting and enabling Docker service"
sudo systemctl start docker
sudo systemctl enable docker

echo "Installing Docker Compose..."

DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | jq -r .tag_name)
sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose

echo "Verifying Docker Compose installation..."
docker-compose --version

echo "Node.js, Docker, and Docker Compose have been installed successfully!"