# SnappClone Deployment Script for Windows PowerShell
# This script automates the deployment process for the SnappClone application on Windows

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    [Parameter(Position=1)]
    [string]$Mode = "dev",
    [Parameter(Position=2)]
    [string]$BackupFile = ""
)

# Configuration
$AppName = "snappclone"
$DockerComposeFile = "docker-compose.yml"
$ProdComposeFile = "docker-compose.prod.yml"
$EnvFile = ".env"
$EnvExample = ".env.example"

# Color functions
function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Check-Requirements {
    Write-Info "Checking system requirements..."
    
    # Check Docker
    try {
        $null = Get-Command docker -ErrorAction Stop
    }
    catch {
        Write-Error "Docker is not installed. Please install Docker Desktop first."
        exit 1
    }
    
    # Check Docker Compose
    try {
        $null = Get-Command docker-compose -ErrorAction Stop
    }
    catch {
        Write-Error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    }
    
    # Check if Docker daemon is running
    try {
        docker info | Out-Null
    }
    catch {
        Write-Error "Docker daemon is not running. Please start Docker Desktop first."
        exit 1
    }
    
    Write-Success "All requirements satisfied"
}

function Setup-Environment {
    Write-Info "Setting up environment configuration..."
    
    if (-not (Test-Path $EnvFile)) {
        if (Test-Path $EnvExample) {
            Copy-Item $EnvExample $EnvFile
            Write-Warning "Created $EnvFile from $EnvExample"
            Write-Warning "Please review and update the environment variables in $EnvFile"
        }
        else {
            Write-Error "Neither $EnvFile nor $EnvExample found"
            exit 1
        }
    }
    else {
        Write-Success "Environment file $EnvFile already exists"
    }
}

function Generate-SSLCertificates {
    Write-Info "Setting up SSL certificates..."
    
    $SSLDir = "./ssl"
    
    if (-not (Test-Path $SSLDir)) {
        New-Item -ItemType Directory -Path $SSLDir -Force | Out-Null
    }
    
    if (-not (Test-Path "$SSLDir/cert.pem") -or -not (Test-Path "$SSLDir/key.pem")) {
        Write-Info "Generating self-signed SSL certificates for development..."
        
        # Check if OpenSSL is available
        try {
            $null = Get-Command openssl -ErrorAction Stop
            & openssl req -x509 -newkey rsa:4096 -keyout "$SSLDir/key.pem" -out "$SSLDir/cert.pem" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" 2>$null
            Write-Warning "Self-signed certificates generated. For production, replace with valid certificates."
        }
        catch {
            Write-Warning "OpenSSL not found. Please install OpenSSL or manually create SSL certificates in the ssl/ directory."
            Write-Warning "You can download OpenSSL from: https://slproweb.com/products/Win32OpenSSL.html"
        }
    }
    else {
        Write-Success "SSL certificates already exist"
    }
}

function Build-Images {
    param([string]$BuildMode)
    Write-Info "Building Docker images..."
    
    try {
        if ($BuildMode -eq "prod") {
            & docker-compose -f $DockerComposeFile -f $ProdComposeFile build --no-cache
        }
        else {
            & docker-compose build --no-cache
        }
        
        if ($LASTEXITCODE -ne 0) {
            throw "Docker build failed"
        }
        
        Write-Success "Docker images built successfully"
    }
    catch {
        Write-Error "Failed to build Docker images: $_"
        exit 1
    }
}

function Start-Services {
    param([string]$StartMode)
    Write-Info "Starting services in $StartMode mode..."
    
    try {
        if ($StartMode -eq "prod") {
            & docker-compose -f $DockerComposeFile -f $ProdComposeFile up -d
        }
        else {
            & docker-compose up -d
        }
        
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to start services"
        }
        
        Write-Success "Services started successfully"
    }
    catch {
        Write-Error "Failed to start services: $_"
        exit 1
    }
}

function Stop-Services {
    Write-Info "Stopping services..."
    
    try {
        & docker-compose down
        
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to stop services"
        }
        
        Write-Success "Services stopped successfully"
    }
    catch {
        Write-Error "Failed to stop services: $_"
        exit 1
    }
}

function Show-Status {
    Write-Info "Service status:"
    & docker-compose ps
    
    Write-Host ""
    Write-Info "Service logs (last 20 lines):"
    & docker-compose logs --tail=20
}

function Show-URLs {
    Write-Info "Application URLs:"
    Write-Host "  Admin Panel: https://localhost (or your domain)" -ForegroundColor Cyan
    Write-Host "  API: https://localhost/api (or your domain/api)" -ForegroundColor Cyan
    Write-Host "  Health Check: https://localhost/health" -ForegroundColor Cyan
    Write-Host ""
    Write-Info "Database connections:"
    Write-Host "  PostgreSQL: localhost:5432" -ForegroundColor Cyan
    Write-Host "  Redis: localhost:6379" -ForegroundColor Cyan
    Write-Host "  Prisma Studio: http://localhost:5555 (if enabled)" -ForegroundColor Cyan
}

function Run-Migrations {
    Write-Info "Running database migrations..."
    
    # Wait for database to be ready
    Write-Info "Waiting for database to be ready..."
    Start-Sleep -Seconds 10
    
    try {
        & docker-compose exec backend npx prisma migrate deploy
        
        if ($LASTEXITCODE -ne 0) {
            throw "Migration failed"
        }
        
        Write-Success "Database migrations completed"
    }
    catch {
        Write-Error "Failed to run migrations: $_"
    }
}

function Seed-Database {
    Write-Info "Seeding database with initial data..."
    
    try {
        & docker-compose exec backend npm run seed 2>$null
        Write-Success "Database seeding completed"
    }
    catch {
        Write-Warning "Seeding script not found or failed"
    }
}

function Backup-Database {
    $BackupFileName = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
    Write-Info "Creating database backup: $BackupFileName"
    
    try {
        & docker-compose exec postgres pg_dump -U postgres snapp_clone > $BackupFileName
        
        if ($LASTEXITCODE -ne 0) {
            throw "Backup failed"
        }
        
        Write-Success "Database backup created: $BackupFileName"
    }
    catch {
        Write-Error "Failed to create backup: $_"
    }
}

function Restore-Database {
    param([string]$RestoreFile)
    
    if ([string]::IsNullOrEmpty($RestoreFile)) {
        Write-Error "Please provide backup file path"
        exit 1
    }
    
    if (-not (Test-Path $RestoreFile)) {
        Write-Error "Backup file not found: $RestoreFile"
        exit 1
    }
    
    Write-Info "Restoring database from: $RestoreFile"
    
    try {
        Get-Content $RestoreFile | & docker-compose exec -T postgres psql -U postgres -d snapp_clone
        
        if ($LASTEXITCODE -ne 0) {
            throw "Restore failed"
        }
        
        Write-Success "Database restored successfully"
    }
    catch {
        Write-Error "Failed to restore database: $_"
    }
}

function Cleanup-Docker {
    Write-Info "Cleaning up Docker resources..."
    
    try {
        # Stop and remove containers
        & docker-compose down --remove-orphans
        
        # Remove unused images
        & docker image prune -f
        
        # Ask about volumes
        $Response = Read-Host "Do you want to remove unused volumes? This will delete data! (y/N)"
        if ($Response -eq "y" -or $Response -eq "Y") {
            & docker volume prune -f
            Write-Warning "Unused volumes removed"
        }
        
        Write-Success "Cleanup completed"
    }
    catch {
        Write-Error "Failed to cleanup: $_"
    }
}

function Show-Help {
    Write-Host "SnappClone Deployment Script for Windows" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\deploy.ps1 [COMMAND] [MODE] [OPTIONS]" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Yellow
    Write-Host "  deploy [dev|prod]     Deploy the application (default: dev)"
    Write-Host "  start [dev|prod]      Start services"
    Write-Host "  stop                  Stop services"
    Write-Host "  restart [dev|prod]    Restart services"
    Write-Host "  status                Show service status and logs"
    Write-Host "  logs [service]        Show logs for all services or specific service"
    Write-Host "  migrate               Run database migrations"
    Write-Host "  seed                  Seed database with initial data"
    Write-Host "  backup                Create database backup"
    Write-Host "  restore <file>        Restore database from backup"
    Write-Host "  cleanup               Clean up Docker resources"
    Write-Host "  urls                  Show application URLs"
    Write-Host "  help                  Show this help message"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\deploy.ps1 deploy dev         Deploy in development mode"
    Write-Host "  .\deploy.ps1 deploy prod        Deploy in production mode"
    Write-Host "  .\deploy.ps1 logs backend       Show backend service logs"
    Write-Host "  .\deploy.ps1 restore backup.sql Restore from backup file"
}

# Main script logic
switch ($Command.ToLower()) {
    "deploy" {
        Check-Requirements
        Setup-Environment
        if ($Mode -eq "prod") {
            Generate-SSLCertificates
        }
        Build-Images $Mode
        Start-Services $Mode
        Start-Sleep -Seconds 5
        Run-Migrations
        Seed-Database
        Show-URLs
        Write-Success "Deployment completed successfully in $Mode mode!"
    }
    "start" {
        Start-Services $Mode
    }
    "stop" {
        Stop-Services
    }
    "restart" {
        Stop-Services
        Start-Services $Mode
    }
    "status" {
        Show-Status
    }
    "logs" {
        if ($Mode -ne "dev" -and $Mode -ne "prod") {
            & docker-compose logs -f $Mode
        }
        else {
            & docker-compose logs -f
        }
    }
    "migrate" {
        Run-Migrations
    }
    "seed" {
        Seed-Database
    }
    "backup" {
        Backup-Database
    }
    "restore" {
        Restore-Database $BackupFile
    }
    "cleanup" {
        Cleanup-Docker
    }
    "urls" {
        Show-URLs
    }
    "help" {
        Show-Help
    }
    default {
        Write-Error "Unknown command: $Command"
        Show-Help
        exit 1
    }
}