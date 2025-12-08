# Deploy Kayak (Frontend + Backend) on an EC2 instance using Docker Compose

These instructions install Docker and Docker Compose on an Amazon Linux EC2 instance and run the full application using the `src/infra/docker-compose.yml` stack.

1) Connect to the EC2 instance (Amazon Linux 2) and run:

```bash
# Update packages and install Docker
sudo yum update -y
sudo amazon-linux-extras install docker -y
sudo systemctl enable --now docker
sudo usermod -aG docker $USER

# Install Docker Compose (if not available via package)
DOCKER_COMPOSE_VERSION=2.20.2
sudo curl -SL "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# (Optional) log out and back in for group membership changes to take effect
```

2) Clone the repo and start the stack

```bash
git clone <your-repo-url> kayak
cd kayak/src/infra

# Build images and start all services in detached mode
docker compose build
docker compose up -d
```

3) Access the app

Open a browser to:

```
http://<EC2_PUBLIC_IP>/
```

Notes and environment variables

- `VITE_API_URL` (optional): If you want the frontend to call an external API URL instead of the internal `api-gateway` hostname, set `VITE_API_URL` in the `frontend` service `environment` or provide it at build time.
- `JWT_SECRET` (required for production): Set `JWT_SECRET` in the `api-gateway` environment in `src/infra/docker-compose.yml` (replace the placeholder).

The compose stack exposes the frontend on host port 80 and the API gateway on port 4000.
# Deploy Kayak (Frontend + Backend) on an EC2 instance using Docker Compose

These instructions install Docker and Docker Compose on an Amazon Linux EC2 instance and run the full application using the `src/infra/docker-compose.yml` stack.

1) Connect to the EC2 instance (Amazon Linux 2) and run:

```bash
# Update packages and install Docker
sudo yum update -y
sudo amazon-linux-extras install docker -y
sudo systemctl enable --now docker
sudo usermod -aG docker $USER

# Install Docker Compose (if docker compose plugin is not already available)
DOCKER_COMPOSE_VERSION=2.20.2
sudo curl -SL "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# (Optional) log out and back in for group membership changes to take effect
```

2) Clone the repo and start the stack

```bash
git clone <your-repo-url> kayak
cd kayak/src/infra

# Build images and start all services in detached mode
docker compose build
docker compose up -d
```

3) Access the app

Open a browser to:

```
http://<EC2_PUBLIC_IP>/
```

Notes and environment variables

- `VITE_API_URL` (optional): If you want the frontend to call an external API URL instead of the internal `api-gateway` hostname, set `VITE_API_URL` in the `frontend` service `environment` or provide it at build time.
- `JWT_SECRET` (required for production): Set `JWT_SECRET` in the `api-gateway` environment in `src/infra/docker-compose.yml` (replace the placeholder).

The compose stack exposes the frontend on host port 80 and the API gateway on port 4000.
