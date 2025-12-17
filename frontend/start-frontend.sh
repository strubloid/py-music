#!/bin/bash

echo "🎨 Starting Music Theory Frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🌐 Starting React development server..."
echo "Frontend will be available at: http://localhost:3000"
echo "API should be running at: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev