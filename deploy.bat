@echo off
title Quantum Inventory Deployer Helper
color 0b

echo ===================================================
echo   QUANTUM INVENTORY & ORDER SYSTEM DEPLOYER HELPER  
echo ===================================================
echo.
echo This script will help you push your project code to GitHub
echo and push your backend image to Docker Hub.
echo.
echo PREREQUISITES:
echo 1. You must have a GitHub account (github.com)
echo 2. You must have a Docker Hub account (hub.docker.com)
echo.
pause
cls

:: Check for Git
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Git is not installed on this system.
    echo [*] Attempting to install Git using winget...
    winget install --id Git.Git -e --source winget
    if %errorlevel% neq 0 (
        echo [ERROR] Git installation failed. Please install Git manually from git-scm.com
        goto end
    )
    echo [*] Git installed successfully. Please close and re-open this script.
    goto end
) else (
    echo [OK] Git is installed.
)

:: Check for Docker
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Docker is not installed or running.
    echo [*] Attempting to install Docker Desktop using winget...
    echo (Note: This may require system administrator approval)
    winget install --id Docker.DockerDesktop -e --source winget
    if %errorlevel% neq 0 (
        echo [ERROR] Docker installation failed. Please install Docker Desktop manually.
        goto git_setup
    )
    echo [*] Docker installed. Please start Docker Desktop and re-run this script.
) else (
    echo [OK] Docker is installed.
)

:git_setup
echo.
echo ===================================================
echo              STEP 1: GIT & GITHUB SETUP            
echo ===================================================
echo.
set /p GH_USER="Enter your GitHub username: "
set /p GH_REPO="Enter your GitHub repository name (e.g. inventory-order-system): "

echo.
echo [*] Initializing local Git repository...
git init
git add .
git commit -m "Initial commit of full-stack system"
git branch -M main
git remote remove origin >nul 2>&1
git remote add origin https://github.com/%GH_USER%/%GH_REPO%.git

echo.
echo [!] Please make sure you have created the empty repository '%GH_REPO%' on GitHub.
echo [*] Attempting to push code to GitHub...
echo (If prompted, please complete the login browser window)
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to push to GitHub. Check your credentials and repo name.
) else (
    echo.
    echo [SUCCESS] Code successfully pushed to:
    echo https://github.com/%GH_USER%/%GH_REPO%
)
echo.
pause
cls

where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo Skipping Docker Hub upload because Docker is not available.
    goto end
)

:docker_setup
echo ===================================================
echo            STEP 2: DOCKER HUB UPLOAD               
echo ===================================================
echo.
set /p CHOICE="Do you want to build and push the Backend Docker image? (Y/N): "
if /i "%CHOICE%" neq "Y" goto end

set /p DK_USER="Enter your Docker Hub username: "
echo.
echo [*] Logging into Docker Hub (please enter password when prompted)...
docker login -u %DK_USER%

if %errorlevel% neq 0 (
    echo [ERROR] Docker Hub login failed. Skipping upload.
    goto end
)

echo.
echo [*] Building Backend Docker Image...
cd backend
docker build -t %DK_USER%/inventory-backend:latest .

echo.
echo [*] Pushing image to Docker Hub...
docker push %DK_USER%/inventory-backend:latest
cd ..

echo.
echo [SUCCESS] Image successfully pushed to:
echo https://hub.docker.com/r/%DK_USER%/inventory-backend
echo.

:end
echo ===================================================
echo                    FINISHED                         
echo ===================================================
echo.
echo Pushing is complete! To get your hosted links:
echo 1. Deploy on Render (using render.yaml Blueprint)
echo 2. Deploy on Vercel (linking your GitHub repository)
echo.
echo Press any key to exit.
pause >nul
