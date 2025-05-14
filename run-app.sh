#!/bin/bash

# Ensure Prisma client is generated
echo "Generating Prisma client..."
npx prisma generate

# Start the development server
echo "Starting development server..."
npm run dev 