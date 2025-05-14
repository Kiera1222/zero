import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const item = await prisma.item.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    // Map owner to user for frontend consistency
    const responseItem = {
      ...item,
      user: item.owner
    };

    return NextResponse.json(responseItem);
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if item exists and belongs to user
    const existingItem = await prisma.item.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    if (existingItem.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to update this item' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const condition = formData.get('condition') as string;
    const latitude = parseFloat(formData.get('latitude') as string);
    const longitude = parseFloat(formData.get('longitude') as string);
    
    // Check if an image was uploaded
    const imageFile = formData.get('image') as File | null;
    let image;

    if (imageFile && imageFile.size > 0) {
      // Convert image to base64 data URL
      const bytes = await imageFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = buffer.toString('base64');
      image = `data:${imageFile.type};base64,${base64Image}`;
    }

    // Update item in database with explicit type
    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        name,
        description,
        condition,
        latitude,
        longitude,
        ...(image && { image }),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Map owner to user for frontend consistency
    const responseItem = {
      ...updatedItem,
      user: updatedItem.owner,
    };

    return NextResponse.json(responseItem);
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if item exists and belongs to user
    const existingItem = await prisma.item.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    if (existingItem.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this item' },
        { status: 403 }
      );
    }

    // Delete item
    await prisma.item.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if item exists and belongs to user
    const existingItem = await prisma.item.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    if (existingItem.ownerId !== session.user.id) {
      console.log(`权限不足: 用户 ${session.user.id} 尝试更新不属于他们的物品 ${id}`);
      return NextResponse.json(
        { error: 'You do not have permission to update this item' },
        { status: 403 }
      );
    }

    // Parse request data
    const data = await request.json();
    
    // Validate required fields
    if (!data) {
      return NextResponse.json(
        { error: 'No data provided' },
        { status: 400 }
      );
    }

    // Extract imageUrl (if provided) and other data
    const { imageUrl, ...otherData } = data;

    // Prepare update data
    const updateData = { ...otherData };
    
    // Handle image if provided
    if (imageUrl) {
      // Store the image URL (could be a data URL from our upload endpoint)
      updateData.image = imageUrl;
    }
    
    // Update item in database
    const updatedItem = await prisma.item.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Map owner to user for frontend consistency
    const responseItem = {
      ...updatedItem,
      user: updatedItem.owner,
    };

    return NextResponse.json(responseItem);
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
} 