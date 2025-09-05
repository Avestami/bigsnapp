#!/bin/bash

# VPS Deployment Script for SnappClone
# This script should be run on the VPS after cloning the repository

set -e  # Exit on any error

echo "🚀 Starting SnappClone VPS Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop existing containers if running
print_status "Stopping existing containers..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down || true

# Pull latest changes from GitHub
print_status "Pulling latest changes from GitHub..."
git pull origin main

# Copy production environment file
if [ ! -f .env ]; then
    print_warning "No .env file found. Copying from .env.production template..."
    cp .env.production .env
    print_warning "Please edit .env file with your production values before continuing."
    print_warning "Press Enter to continue after editing .env file..."
    read
fi

# Build and start containers
print_status "Building Docker images..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache

print_status "Starting containers in production mode..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 30

# Run database migrations
print_status "Running database migrations..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Generate Prisma client
print_status "Generating Prisma client..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec backend npx prisma generate

# Check service health
print_status "Checking service health..."
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

# Test backend health endpoint
print_status "Testing backend health..."
if curl -f http://localhost:3535/health > /dev/null 2>&1; then
    print_status "✅ Backend is healthy and responding on port 3535"
else
    print_warning "⚠️  Backend health check failed. Check logs with: docker-compose logs backend"
fi

print_status "🎉 Deployment completed!"
print_status "Your application is now running on:"
print_status "  - Backend API: http://your-vps-ip:3535"
print_status "  - Admin Panel: http://your-vps-ip:5173"
print_status "  - Nginx Proxy: http://your-vps-ip:80"
print_status ""
print_status "To view logs: docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f"
print_status "To stop: docker-compose -f docker-compose.yml -f docker-compose.prod.yml down"