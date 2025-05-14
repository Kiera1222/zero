#!/bin/bash

# Script to migrate base64 images to filesystem storage

echo "Creating uploads directory if needed..."
mkdir -p public/uploads

echo "Ensuring correct permissions..."
chmod 755 public
chmod 755 public/uploads

echo "Running migration script..."
node scripts/migrate-base64-to-filesystem.js

echo "Migration completed!"
echo "Please verify your database and filesystem."
echo "See FILESYSTEM_IMAGE_STORAGE.md for more details on the implementation." 