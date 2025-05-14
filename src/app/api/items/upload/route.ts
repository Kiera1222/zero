import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { getServerSession } from 'next-auth';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { ensureUploadsDir } from '@/lib/utils';

/**
 * Image upload API handler
 * This endpoint accepts files in form data, saves them to the filesystem,
 * and returns the public URL path to be stored in the database
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Starting image upload request processing');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('User not authenticated, rejecting upload');
      return new NextResponse(
        JSON.stringify({ error: 'You must be logged in to upload files' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('No file provided');
      return new NextResponse(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Received file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log('File too large, rejecting upload');
      return new NextResponse(
        JSON.stringify({ error: 'File too large. Maximum size is 5MB' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      console.log('File type is not an image, rejecting upload');
      return new NextResponse(
        JSON.stringify({ error: 'Only image files are allowed' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      // Ensure the uploads directory exists
      if (!ensureUploadsDir()) {
        throw new Error("Failed to ensure uploads directory exists");
      }
      
      // Get file extension
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const fileExt = validExtensions.includes(extension) ? extension : 'jpg';
      
      // Generate random filename
      const uuid = randomUUID();
      const fileName = `${uuid}.${fileExt}`;
      
      // Set file path
      const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
      
      // Convert file to buffer and save to disk
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Write file to disk
      fs.writeFileSync(filePath, buffer);
      
      console.log(`File saved successfully to ${filePath}`);
      
      // Return the public URL for the file
      const publicUrl = `/uploads/${fileName}`;
      
      return new NextResponse(
        JSON.stringify({ 
          url: publicUrl,
          fileName: fileName,
          size: file.size,
          type: file.type
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (uploadError) {
      console.error('Error during image processing:', uploadError);
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to process the image',
          details: uploadError instanceof Error ? uploadError.message : 'Unknown error'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Uncaught error during image upload processing:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'An unexpected error occurred while uploading the file',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 