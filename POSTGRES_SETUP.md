# PostgreSQL Setup on Uberspace

This guide will help you set up PostgreSQL on your Uberspace account and configure your Zero Waste app to use it.

## 1. Create a PostgreSQL Database on Uberspace

Uberspace provides PostgreSQL as a service. To set it up, follow these steps:

1. SSH into your Uberspace account: `ssh username@servername.uberspace.de`

2. Initialize PostgreSQL (if you haven't already):
   ```bash
   uberspace tools version use postgresql 15
   ```

3. Create a database:
   ```bash
   createdb zerowaste
   ```

4. Set a password for your database:
   ```bash
   psql -c "ALTER USER $USER PASSWORD 'your-secure-password';"
   ```

## 2. Configure Your App to Use PostgreSQL

1. Modify your `.env.production` file with the correct DATABASE_URL:
   ```
   DATABASE_URL="postgresql://your-uberspace-username:your-secure-password@localhost:5432/zerowaste"
   ```

2. If you're running the script `setup-production.sh`, it will prompt you for this information.

## 3. Migrating Data (Optional)

If you want to migrate data from your existing SQLite database to PostgreSQL, you'll need to:

1. Export your SQLite data
2. Transform it to match PostgreSQL format
3. Import it into PostgreSQL

Since this process can be complex, consider using the Prisma Migrate feature or a tool like [pgloader](https://pgloader.io/) for the migration.

For a simple approach:

1. Use Prisma to create the schema in the new PostgreSQL database:
   ```bash
   npx prisma db push
   ```

2. Export your SQLite data to JSON:
   ```bash
   sqlite3 prisma/dev.db .dump > sqlite_dump.sql
   ```

3. Manually transform the data for PostgreSQL and import it.

## 4. Deploying Your App on Uberspace

1. Upload your app to Uberspace
2. Run `npm install --production`
3. Build your app: `npm run build`
4. Set up a web service:
   ```bash
   uberspace web backend set / --http --port 3000
   ```

5. Start your app using a service like `supervisord` or `daemontools`

## Troubleshooting

- If you encounter connection issues, ensure your PostgreSQL service is running:
  ```bash
  uberspace tools restart postgresql
  ```

- Check your connection string parameters in DATABASE_URL
- Verify the database exists: `psql -l`
- Test connection directly: `psql zerowaste` 