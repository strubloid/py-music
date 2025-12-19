#!/bin/bash

# Netlify build script
echo "🎵 Building Music Theory App for Netlify..."

# Navigate to frontend
cd frontend

# Install dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build frontend
echo "🏗️ Building frontend..."
npm run build

echo "✅ Build complete!"
echo "📂 Frontend built to: frontend/dist"
echo "🔧 Netlify Functions ready at: netlify/functions"
