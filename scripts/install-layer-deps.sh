#!/bin/bash

echo "🔧 Installing Lambda Layer dependencies..."
cd api/layer/nodejs
npm install --production --no-package-lock
echo "✅ Lambda Layer dependencies installed"
