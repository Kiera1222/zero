# Setting Up PostgreSQL for Zero Waste Development

This guide will walk you through setting up PostgreSQL for your Zero Waste app development environment on macOS.

## Prerequisites

- macOS with Postgres.app installed
- Node.js and npm installed
- Zero Waste project cloned

## Step 1: Start PostgreSQL Server

1. Open Finder and navigate to your Applications folder
2. Find and open Postgres.app
3. You should see the elephant icon appear in your menu bar, indicating the server is running
4. When you first open Postgres.app, it should create a default database with your macOS username

## Step 2: Verify PostgreSQL Connection

After starting Postgres.app, you can click on the database icon in the app to open a PostgreSQL terminal, or you can use the setup script to automatically configure your development environment.

## Step 3: Run the Setup Script

We've created a script that will:
- Locate your PostgreSQL installation
- Create a database called "zerowaste_dev"
- Configure your .env file
- Push the Prisma schema to the database

To run the script:

```bash
# Make the script executable (if not already)
chmod +x setup-postgres-dev.sh

# Run the script
./setup-postgres-dev.sh
```

## Manual Setup (Alternative to Script)

If you prefer to set up manually, follow these steps:

1. Create a new database:
   - Open Postgres.app
   - Click on your default database
   - In the SQL query editor, run:
     ```sql
     CREATE DATABASE zerowaste_dev;
     ```

2. Update your environment variables:
   - Edit the `.env` file in your project root:
     ```
     DATABASE_URL="postgresql://yourusername@localhost:5432/zerowaste_dev"
     NEXTAUTH_SECRET="your-secret-key-change-in-production"
     NEXTAUTH_URL="http://localhost:3000"
     ```
   Replace `yourusername` with your macOS username.

3. Push your schema to the database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

## Step 4: Start Your Development Server

Once your database is set up, you can start your development server:

```bash
npm run dev
```

## Troubleshooting

### PostgreSQL Not Running
- Make sure Postgres.app is open and running (elephant icon in menu bar)
- Check the app logs for any startup errors

### Connection Issues
- Verify your PostgreSQL port (default is 5432)
- Check if another service is using that port

### Database Creation Failed
- Ensure you have proper permissions to create databases
- Try creating the database directly in the Postgres.app SQL editor

### Prisma Push Failed
- Check your DATABASE_URL format in .env
- Make sure the database exists before pushing

## Viewing Your Database

You can view and manage your database directly in Postgres.app by clicking on the database name, or you can use Prisma Studio:

```bash
npx prisma studio
```

Prisma Studio will open a browser window at http://localhost:5555 where you can view and edit your database content. 