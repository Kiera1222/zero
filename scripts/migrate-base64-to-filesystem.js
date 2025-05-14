/**
 * This script migrates base64 encoded images stored in the database
 * to filesystem-based images in the public/uploads directory.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

// Ensure uploads directory exists
function ensureUploadsDir() {
  const publicDir = path.join(process.cwd(), 'public');
  const uploadsDir = path.join(publicDir, 'uploads');
  
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  return uploadsDir;
}

// Save a base64 image to the filesystem
function saveBase64Image(base64String, mimeType) {
  // Skip if not a base64 data URL
  if (!base64String || !base64String.startsWith('data:')) {
    return null;
  }
  
  // Extract mime type and base64 data
  const matches = base64String.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return null;
  }
  
  const actualMimeType = mimeType || matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Determine file extension
  let extension = 'jpg';
  if (actualMimeType.includes('png')) extension = 'png';
  if (actualMimeType.includes('gif')) extension = 'gif';
  if (actualMimeType.includes('webp')) extension = 'webp';
  
  // Generate filename and path
  const uuid = randomUUID();
  const fileName = `${uuid}.${extension}`;
  const filePath = path.join(ensureUploadsDir(), fileName);
  
  // Write the file
  fs.writeFileSync(filePath, buffer);
  
  // Return the public URL
  return `/uploads/${fileName}`;
}

async function migrateImages() {
  console.log('Starting migration of base64 images to filesystem...');
  
  try {
    // Get all items with base64 images
    const items = await prisma.item.findMany({
      where: {
        image: {
          startsWith: 'data:',
        },
      },
      select: {
        id: true,
        image: true,
      },
    });
    
    console.log(`Found ${items.length} items with base64 images to migrate`);
    
    // Process each item
    for (const item of items) {
      try {
        const publicUrl = saveBase64Image(item.image);
        
        if (publicUrl) {
          // Update the item with the new image path
          await prisma.item.update({
            where: { id: item.id },
            data: { image: publicUrl },
          });
          
          console.log(`Migrated item ${item.id}: ${publicUrl}`);
        } else {
          console.warn(`Could not migrate image for item ${item.id}`);
        }
      } catch (itemError) {
        console.error(`Error processing item ${item.id}:`, itemError);
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateImages(); 