#!/bin/bash
echo "Current directory:"
pwd
echo "Contents of /app:"
ls -la /app
echo "Contents of out:"
ls -la out || echo "out directory not found"
echo "Searching for PortfolioBackend.dll anywhere..."
find /app -name "PortfolioBackend.dll"
echo "Starting application..."
cd out && dotnet PortfolioBackend.dll
