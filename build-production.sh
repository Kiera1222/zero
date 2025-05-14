#!/bin/bash

# Clean up existing build artifacts
echo "Cleaning up previous build..."
rm -rf .next

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
  echo "Error: .env.production file not found."
  echo "Please run setup-production.sh first to configure your database connection."
  exit 1
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Push database schema to PostgreSQL
echo "Pushing schema to PostgreSQL database..."
npx prisma db push

# Build the application
echo "Building for production..."
npm run build

# If the build succeeds, print deployment instructions
if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
  echo ""
  echo "========== DEPLOYMENT INSTRUCTIONS =========="
  echo "To run in production:"
  echo "1. npm run start"
  echo ""
  echo "To deploy to a server:"
  echo "1. Copy the following files to your server:"
  echo "   - .next/"
  echo "   - public/"
  echo "   - package.json"
  echo "   - package-lock.json"
  echo "   - .env.production"
  echo "   - prisma/"
  echo ""
  echo "2. Run 'npm install --production' on the server"
  echo "3. Run 'npm run start' to start the production server"
  echo "=============================================="
else
  echo "❌ Build failed. Please fix the errors and try again."
fi 