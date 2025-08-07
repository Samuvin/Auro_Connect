#!/bin/bash

# Script to run Storybook in Docker
# Usage: ./scripts/run-storybook-docker.sh

set -e

echo "🚀 Starting Storybook in Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo "❌ Error: docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

# Build and run Storybook
echo "📦 Building Storybook container..."
docker-compose -f docker-compose.storybook.yml build

echo "🌟 Starting Storybook server..."
docker-compose -f docker-compose.storybook.yml up

echo "🎉 Storybook is running at http://localhost:6006"
echo "📝 To stop Storybook, press Ctrl+C" 