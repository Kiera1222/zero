/**
 * Common utility functions for the application
 */

import fs from 'fs';
import path from 'path';

/**
 * Ensures the uploads directory exists for storing images
 */
export function ensureUploadsDir() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const uploadsDir = path.join(publicDir, 'uploads');
    
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring uploads directory:', error);
    return false;
  }
}

/**
 * Deletes an image file from the filesystem
 * @param imagePath - The path of the image relative to the public directory (e.g., '/uploads/image.jpg')
 */
export function deleteImageFile(imagePath: string): boolean {
  try {
    // Skip if the image path is empty or a base64 data URL (for backward compatibility)
    if (!imagePath || imagePath.startsWith('data:')) {
      return false;
    }
    
    // Get the absolute path
    const filePath = path.join(process.cwd(), 'public', imagePath.replace(/^\//, ''));
    
    // Check if the file exists
    if (fs.existsSync(filePath)) {
      // Delete the file
      fs.unlinkSync(filePath);
      console.log(`Deleted image file: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting image file:', error);
    return false;
  }
}

/**
 * Formats a date to a human-readable string
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Truncates text to a specified length and adds ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
} 