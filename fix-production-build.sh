#!/bin/bash

echo "Fixing production environment setup..."

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
  echo "Error: .env.production file not found."
  echo "Please run setup-production.sh first to configure your database connection."
  exit 1
fi

# Get the DATABASE_URL from .env.production
DB_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2- | tr -d '"')

echo "Using DATABASE_URL from .env.production: $DB_URL"

# Create a temporary .env file for the build process
echo "Creating temporary .env file for build..."
cat > .env.temp << EOL
DATABASE_URL=$DB_URL
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(cat nextauth_secret.txt 2>/dev/null || openssl rand -base64 32)"
EOL

# Backup the current .env file
if [ -f ".env" ]; then
  echo "Backing up current .env file..."
  cp .env .env.backup
fi

# Use the production settings for the build
echo "Applying production database settings..."
cp .env.temp .env

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Push database schema to PostgreSQL
echo "Pushing schema to PostgreSQL database..."
npx prisma db push

# Build the application
echo "Building for production..."
npm run build

# Restore the original .env file
if [ -f ".env.backup" ]; then
  echo "Restoring original .env file..."
  mv .env.backup .env
fi

# Clean up
rm -f .env.temp

echo "Production build process completed."
echo "You can now run 'npm run start' to start your production server." 