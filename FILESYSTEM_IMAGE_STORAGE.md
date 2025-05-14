# Filesystem-Based Image Storage

This document explains how image storage works in the Zero Waste application.

## Overview

Images for items are stored on the filesystem in the `public/uploads` directory, which makes them accessible via the web server. The database stores only the relative path to the image file.

## How It Works

1. When a user uploads an image:
   - The image file is sent to the `/api/items/upload` endpoint
   - A unique filename is generated using UUID
   - The file is saved to `public/uploads/[uuid].[extension]`
   - The API returns a URL path like `/uploads/[uuid].[extension]`
   - This path is stored in the database

2. When displaying an image:
   - The image URL from the database is used directly in `<img>` tags
   - The URL is relative to the domain, e.g., `<img src="/uploads/123abc.jpg">`

3. When updating an item with a new image:
   - The old image file is deleted from the filesystem
   - The new image is saved with a new unique filename
   - The database record is updated with the new path

4. When deleting an item:
   - The associated image file is deleted from the filesystem
   - The database record is deleted

## Migrating from Base64

If you were previously using base64-encoded images stored directly in the database, you can migrate to the filesystem-based approach using the provided script:

```
node scripts/migrate-base64-to-filesystem.js
```

This script:
- Finds all items with base64 image data
- Converts each base64 image to a file
- Saves the file to the uploads directory
- Updates the database record with the new path

## Advantages of Filesystem Storage

- **Better Performance**: Images load faster because they're served directly by the web server
- **Reduced Database Size**: Only paths are stored in the database, not the entire image data
- **Browser Caching**: Browsers can cache images effectively with proper HTTP headers
- **Scalability**: Easier to implement CDN or other optimization strategies

## Configuration for Production

For production deployment on services like Uberspace:

1. Ensure the `public/uploads` directory exists and has write permissions
2. Configure your web server to serve static files from the `public` directory
3. Make sure your application has the necessary permissions to write to the uploads directory 