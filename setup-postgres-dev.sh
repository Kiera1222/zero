#!/bin/bash

# Variables
DB_NAME="zerowaste_dev"
DB_USER="$USER"  # Uses the current macOS user
DB_HOST="localhost"
DB_PORT="5432"

echo "🚀 Setting up PostgreSQL for Zero Waste development..."

# Find PostgreSQL executable path
PG_APP_DIR=$(find /Applications -name "Postgres*.app" -type d -maxdepth 2 2>/dev/null | head -n 1)
if [ -z "$PG_APP_DIR" ]; then
  echo "❌ Could not find Postgres.app in the Applications folder."
  echo "Make sure Postgres.app is installed from https://postgresapp.com/"
  exit 1
fi

echo "✅ Found PostgreSQL at: $PG_APP_DIR"

# Try to find the bin directory with PostgreSQL tools
PG_VERSIONS_DIR="$PG_APP_DIR/Contents/Versions"
PG_VERSION_DIRS=$(find "$PG_VERSIONS_DIR" -type d -maxdepth 1 2>/dev/null | sort -r)

if [ -z "$PG_VERSION_DIRS" ]; then
  echo "❌ Could not find PostgreSQL version directories in $PG_VERSIONS_DIR"
  echo "Your Postgres.app installation might be corrupted or in a non-standard location."
  exit 1
fi

# Find first bin directory that exists
PG_BIN=""
for version_dir in $PG_VERSION_DIRS; do
  potential_bin="$version_dir/bin"
  if [ -d "$potential_bin" ]; then
    PG_BIN="$potential_bin"
    break
  fi
done

if [ -z "$PG_BIN" ]; then
  echo "❌ Could not find bin directory in PostgreSQL installation."
  echo "Your Postgres.app installation might be corrupted."
  exit 1
fi

echo "✅ Using PostgreSQL binaries from: $PG_BIN"

# Add PostgreSQL bin directory to PATH for this script
export PATH="$PG_BIN:$PATH"

# Check if PostgreSQL is running
echo "🔍 Checking if PostgreSQL server is running..."
if ! "$PG_BIN/pg_isready" -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
  echo "❌ PostgreSQL server is not running."
  echo ""
  echo "Please start PostgreSQL first:"
  echo "1. Go to your Applications folder"
  echo "2. Open Postgres.app"
  echo "3. Wait for the elephant icon to appear in your menu bar"
  echo "4. Run this script again"
  exit 1
fi

echo "✅ PostgreSQL server is running."

# Check if the database already exists
echo "🔍 Checking if database '$DB_NAME' exists..."
if "$PG_BIN/psql" -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
  echo "✅ Database '$DB_NAME' already exists."
else
  echo "🔧 Creating database '$DB_NAME'..."
  if "$PG_BIN/createdb" -h $DB_HOST -p $DB_PORT $DB_NAME; then
    echo "✅ Database '$DB_NAME' created successfully."
  else
    echo "❌ Failed to create database '$DB_NAME'."
    echo "Try creating it manually using the Postgres.app interface or run:"
    echo "   $PG_BIN/createdb $DB_NAME"
    exit 1
  fi
fi

# Update .env file with PostgreSQL connection string
ENV_FILE=".env"
echo "🔧 Updating $ENV_FILE with PostgreSQL connection string..."

# Backup existing .env file
cp $ENV_FILE $ENV_FILE.bak

# Create new .env file with PostgreSQL configuration
cat > $ENV_FILE << EOL
# Database configuration
DATABASE_URL="postgresql://$DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"

# NextAuth configuration
NEXTAUTH_SECRET="your-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
EOL

echo "✅ Updated $ENV_FILE with PostgreSQL connection."
echo "📝 Original settings backed up to $ENV_FILE.bak"

# Run Prisma migrations
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🔧 Pushing schema to database..."
npx prisma db push

echo ""
echo "✅ Development PostgreSQL database setup complete!"
echo ""
echo "To view your database schema and data, run:"
echo "npx prisma studio"
echo ""
echo "To run your app with the new PostgreSQL database, use:"
echo "npm run dev" 