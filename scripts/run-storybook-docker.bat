@echo off
REM Script to run Storybook in Docker
REM Usage: scripts\run-storybook-docker.bat

echo 🚀 Starting Storybook in Docker...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Check if docker-compose is available
where docker-compose >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: docker-compose is not installed. Please install docker-compose and try again.
    pause
    exit /b 1
)

REM Build and run Storybook
echo 📦 Building Storybook container...
docker-compose -f docker-compose.storybook.yml build

echo 🌟 Starting Storybook server...
docker-compose -f docker-compose.storybook.yml up

echo 🎉 Storybook is running at http://localhost:6006
echo 📝 To stop Storybook, press Ctrl+C
pause 