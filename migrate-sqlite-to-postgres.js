#!/usr/bin/env node

/**
 * This script migrates data from SQLite to PostgreSQL
 * Run it only if you have existing data in dev.db that you want to transfer
 */

const { PrismaClient: SqlitePrismaClient } = require('@prisma/client');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Backup current .env file
const envPath = path.join(process.cwd(), '.env');
const envBackupPath = path.join(process.cwd(), '.env.sqlite.backup');

// Check if SQLite db exists
const sqliteDbPath = path.join(process.cwd(), 'dev.db');
if (!fs.existsSync(sqliteDbPath)) {
  console.error('❌ SQLite database (dev.db) not found. Nothing to migrate.');
  process.exit(1);
}

console.log('🚀 Starting migration from SQLite to PostgreSQL...');

// Backup current env file if it exists
if (fs.existsSync(envPath)) {
  console.log('📦 Backing up current .env file...');
  fs.copyFileSync(envPath, envBackupPath);
  console.log(`✅ Backed up to ${envBackupPath}`);
}

// Temporarily switch to SQLite to export data
console.log('🔄 Temporarily switching to SQLite to export data...');
fs.writeFileSync(envPath, 'DATABASE_URL="file:./dev.db"\n');

// Create a Prisma client for SQLite
const sqlitePrisma = new SqlitePrismaClient();

async function main() {
  try {
    // Extract data from SQLite
    console.log('📤 Extracting data from SQLite...');
    const users = await sqlitePrisma.user.findMany();
    console.log(`Found ${users.length} users`);
    
    const items = await sqlitePrisma.item.findMany();
    console.log(`Found ${items.length} items`);
    
    const messages = await sqlitePrisma.message.findMany();
    console.log(`Found ${messages.length} messages`);
    
    // Export data to JSON for backup
    const dataExport = {
      users,
      items,
      messages,
      exportDate: new Date().toISOString()
    };
    
    const exportPath = path.join(process.cwd(), 'sqlite-data-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(dataExport, null, 2));
    console.log(`✅ Data exported to ${exportPath}`);
    
    // Disconnect from SQLite
    await sqlitePrisma.$disconnect();
    
    // Now switch to PostgreSQL
    console.log('🔄 Switching to PostgreSQL...');
    
    // Restore the PostgreSQL env configuration
    if (fs.existsSync('.env.postgres')) {
      // Use existing PostgreSQL config if available
      fs.copyFileSync('.env.postgres', '.env');
    } else {
      // Ask for PostgreSQL connection details
      console.log('');
      console.log('Please provide PostgreSQL connection details:');
      
      // You are running this as a Node script, so we use environment variables
      // to configure the connection instead of asking for input
      
      const username = process.env.USER;
      const dbName = 'zerowaste_dev';
      
      // Write PostgreSQL connection string to .env
      const postgresUrl = `postgresql://${username}@localhost:5432/${dbName}`;
      fs.writeFileSync(envPath, `DATABASE_URL="${postgresUrl}"\nNEXTAUTH_SECRET="your-secret-key-change-in-production"\nNEXTAUTH_URL="http://localhost:3000"\n`);
      
      // Save a copy for future reference
      fs.writeFileSync('.env.postgres', `DATABASE_URL="${postgresUrl}"\nNEXTAUTH_SECRET="your-secret-key-change-in-production"\nNEXTAUTH_URL="http://localhost:3000"\n`);
    }
    
    // Generate Prisma client for PostgreSQL
    console.log('🔧 Generating Prisma client for PostgreSQL...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Push schema to PostgreSQL
    console.log('🔧 Pushing schema to PostgreSQL...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    // Create new PostgreSQL client
    const { PrismaClient: PostgresPrismaClient } = require('@prisma/client');
    const postgresPrisma = new PostgresPrismaClient();
    
    // Insert data into PostgreSQL
    console.log('📥 Inserting data into PostgreSQL...');
    
    // Insert users
    console.log('🔄 Migrating users...');
    for (const user of users) {
      try {
        await postgresPrisma.user.upsert({
          where: { id: user.id },
          update: { ...user },
          create: { ...user }
        });
      } catch (err) {
        console.error(`Error migrating user ${user.id}:`, err.message);
      }
    }
    
    // Insert items
    console.log('🔄 Migrating items...');
    for (const item of items) {
      try {
        await postgresPrisma.item.upsert({
          where: { id: item.id },
          update: { ...item },
          create: { ...item }
        });
      } catch (err) {
        console.error(`Error migrating item ${item.id}:`, err.message);
      }
    }
    
    // Insert messages
    console.log('🔄 Migrating messages...');
    for (const message of messages) {
      try {
        await postgresPrisma.message.upsert({
          where: { id: message.id },
          update: { ...message },
          create: { ...message }
        });
      } catch (err) {
        console.error(`Error migrating message ${message.id}:`, err.message);
      }
    }
    
    // Disconnect from PostgreSQL
    await postgresPrisma.$disconnect();
    
    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('Your data has been migrated from SQLite to PostgreSQL.');
    console.log('');
    console.log('To view your migrated data, run:');
    console.log('npx prisma studio');
    
  } catch (err) {
    console.error('❌ Migration failed:', err);
    
    // Restore original .env file
    if (fs.existsSync(envBackupPath)) {
      fs.copyFileSync(envBackupPath, envPath);
      console.log('🔄 Restored original .env file');
    }
    
    process.exit(1);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 