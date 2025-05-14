#!/bin/bash

# Clean up previous build artifacts
echo "Cleaning up..."
rm -rf .next
rm -f .env.production

# Set up production environment
echo "Setting up production environment..."
echo "NODE_ENV=production" > .env.production

# Configure database
echo "Configuring database..."
echo
echo "For PostgreSQL on Uberspace, you will need to:"
echo "1. Create a PostgreSQL database on your Uberspace account"
echo "2. Set up the DATABASE_URL in your .env.production file"
echo
echo "Please enter your PostgreSQL connection details:"
echo "(Format: postgresql://username:password@localhost:5432/dbname)"
read -p "DATABASE_URL: " DB_URL

# Add the database URL to .env.production
echo "DATABASE_URL=\"$DB_URL\"" >> .env.production

# Configure NextAuth.js
echo
echo "Please enter your production domain URL for NextAuth.js:"
echo "(Format: https://yourdomain.com or https://username.uber.space)"
read -p "NEXTAUTH_URL: " NEXTAUTH_URL

# Add the NEXTAUTH_URL to .env.production
echo "NEXTAUTH_URL=\"$NEXTAUTH_URL\"" >> .env.production

# Add NEXTAUTH_SECRET to .env.production
if [ -f "nextauth_secret.txt" ]; then
  NEXTAUTH_SECRET=$(cat nextauth_secret.txt)
else
  NEXTAUTH_SECRET=$(openssl rand -base64 32)
  echo $NEXTAUTH_SECRET > nextauth_secret.txt
fi
echo "NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"" >> .env.production

# Migrate the database
echo "Setting up database..."
echo "Would you like to:"
echo "1. Create a new empty database"
echo "2. Migrate existing SQLite data to PostgreSQL"
read -p "Enter your choice (1/2): " DB_CHOICE

if [ "$DB_CHOICE" = "2" ]; then
  echo "This feature requires manual migration. Please use Prisma to migrate your data."
  echo "Refer to Prisma documentation for data migration between different database providers."
else
  echo "Will set up a new database schema with Prisma."
fi

# Generate Prisma client and push schema
echo "Generating Prisma client..."
NODE_ENV=production npx prisma generate
echo "Pushing schema to PostgreSQL database..."
NODE_ENV=production npx prisma db push

# Build the application
echo "Building the application for production..."
NODE_ENV=production npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
  echo ""
  echo "=============================================="
  echo "To run the app in production mode:"
  echo ""
  echo "1. Start the production server with:"
  echo "   npm run start"
  echo ""
  echo "2. Access the app at: $NEXTAUTH_URL"
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
  echo "❌ Build failed."
  echo ""
  echo "For now, you can run the app in development mode:"
  echo "npm run dev"
fi 