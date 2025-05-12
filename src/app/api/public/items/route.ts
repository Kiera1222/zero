import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const items = await prisma.item.findMany({
      take: 50,
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

    // Map owner to user for frontend consistency
    const formattedItems = items.map(item => ({
      ...item,
      user: item.owner
    }));

    return NextResponse.json(formattedItems);
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    );
  }
} 