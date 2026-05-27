#!/bin/bash

# Deployment verification script
# Run this before pushing to GitHub/Render

echo "🔍 Verifying deployment configuration..."

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo "❌ render.yaml is missing"
    exit 1
else
    echo "✅ render.yaml exists"
fi

# Check if client/.env.production exists
if [ ! -f "client/.env.production" ]; then
    echo "❌ client/.env.production is missing"
    exit 1
else
    echo "✅ client/.env.production exists"
fi

# Check if .env.example is updated
if ! grep -q "VITE_API_URL" .env.example; then
    echo "❌ .env.example is missing VITE_API_URL"
    exit 1
else
    echo "✅ .env.example is updated"
fi

# Check if server dependencies are listed
if ! grep -q "express" server/package.json; then
    echo "❌ express is missing from server/package.json"
    exit 1
else
    echo "✅ Server dependencies are properly listed"
fi

# Check if client build command exists
if ! grep -q "\"build\"" client/package.json; then
    echo "❌ build command is missing from client/package.json"
    exit 1
else
    echo "✅ Client build command exists"
fi

# Check if root package.json has install:all
if ! grep -q "install:all" package.json; then
    echo "❌ install:all script is missing from root package.json"
    exit 1
else
    echo "✅ Root package.json has install:all script"
fi

echo ""
echo "🎉 All checks passed! Ready for deployment."
echo ""
echo "Next steps:"
echo "1. git add ."
echo "2. git commit -m 'Configure for Render deployment'"
echo "3. git push origin main"
echo "4. Connect to Render.com"