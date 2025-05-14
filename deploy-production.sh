#!/bin/bash

echo "=== Zero Waste Production Deployment ==="

# Check for .env.production
if [ ! -f ".env.production" ]; then
  echo "❌ Error: .env.production file not found."
  echo "Run setup-production.sh first to configure your environment."
  exit 1
fi

# Verify .env.production has the correct settings
if grep -q "localhost" .env.production; then
  echo "⚠️  Warning: Your .env.production contains localhost URLs."
  echo "This may cause issues in production. Continue anyway? (y/n)"
  read -r response
  if [[ "$response" != "y" ]]; then
    echo "Deployment canceled."
    exit 1
  fi
fi

# Clean up
echo "🧹 Cleaning up previous build..."
rm -rf .next

# Generate Prisma client
echo "🔄 Generating Prisma client..."
NODE_ENV=production npx prisma generate

# Verify database connection
echo "🔍 Verifying database connection..."
DB_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2- | tr -d '"')
if [[ $DB_URL == postgresql* ]]; then
  echo "✅ PostgreSQL database URL detected."
else
  echo "❌ Error: Invalid database URL in .env.production."
  echo "Expected a PostgreSQL connection string."
  exit 1
fi

# Build the application
echo "🏗️  Building for production..."
NODE_ENV=production npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
  echo ""
  echo "=========== DEPLOYMENT CHECKLIST ==========="
  echo "✓ Ensure NEXTAUTH_URL is set to your production domain"
  echo "✓ Ensure DATABASE_URL points to your production database"
  echo "✓ Ensure base URL settings are correct (no localhost in production)"
  
  echo ""
  echo "To deploy on Uberspace, transfer these files to your server:"
  echo "- .next/"
  echo "- public/"
  echo "- package.json"
  echo "- package-lock.json"
  echo "- .env.production"
  echo "- prisma/"
  echo "- node_modules/ (or run npm install --production on the server)"
  
  echo ""
  echo "Then set up the web backend on Uberspace:"
  echo "uberspace web backend set / --http --port 3000"
  
  echo ""
  echo "And start the server with supervisord:"
  echo "1. Create ~/etc/services.d/nextjs.ini with the application startup config"
  echo "2. Run: supervisorctl reread && supervisorctl update"
  echo "3. Check status with: supervisorctl status"
  echo "============================================"
else
  echo "❌ Build failed. Please fix the errors and try again."
fi 