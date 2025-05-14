import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const items = await prisma.item.findMany({
      take: 50,
      where: {
        status: 'available', // Only show available items
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    });

    // Map owner to user for frontend consistency and ensure image fields are handled properly
    const formattedItems = items.map(item => {
      // Safely handle missing owner
      const user = item.owner ? {
        id: item.owner.id,
        name: item.owner.name,
        email: item.owner.email,
        image: item.owner.image
      } : undefined;
      
      // TypeScript doesn't know about imageUrl field yet, so use a type assertion
      const itemData = item as any;
      
      return {
        ...item,
        user,
        // Make sure we're not returning undefined or null for image fields
        image: item.image || undefined,
        imageUrl: itemData.imageUrl || undefined
      };
    });

    return NextResponse.json(formattedItems);
  } catch (error) {
    console.error('Error fetching public items:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch items',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 