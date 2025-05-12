import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    
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
    let imageUrl;

    if (imageFile && imageFile.size > 0) {
      // In a real app, you would upload the image to a storage service
      // For demo purposes, we'll just use a placeholder
      imageUrl = 'https://via.placeholder.com/300';
    }

    // Update item in database with explicit type
    const updatedItem = await prisma.item.update({
      where: { id },
      data: {
        name,
        description,
        // @ts-ignore - Condition field exists in our schema but TypeScript doesn't recognize it
        condition,
        latitude,
        longitude,
        ...(imageUrl && { imageUrl }),
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
    // @ts-ignore - owner property is included in the query result
    const responseItem = {
      ...updatedItem,
      // @ts-ignore - owner is defined in the include
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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    
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
  { params }: { params: { id: string } }
) {
  try {
    console.log(`处理更新请求: 物品ID=${params.id}`);
    
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.log('未经授权的更新请求，用户未登录');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to update items' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { id } = params;
    console.log(`用户 ${session.user.id} 尝试更新物品 ${id}`);
    
    // Check if item exists and belongs to user
    const existingItem = await prisma.item.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    });

    if (!existingItem) {
      console.log(`物品不存在: ${id}`);
      return NextResponse.json(
        { error: 'Item not found', message: 'The item you are trying to update does not exist' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (existingItem.ownerId !== session.user.id) {
      console.log(`权限不足: 用户 ${session.user.id} 尝试更新不属于他们的物品 ${id}`);
      return NextResponse.json(
        { 
          error: 'Permission denied', 
          message: 'You do not have permission to update this item'
        },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let requestBody;
    try {
      // Parse JSON request body
      requestBody = await request.json();
      console.log('请求体解析成功:', JSON.stringify(requestBody, null, 2));
    } catch (parseError) {
      console.error('解析请求体失败:', parseError);
      return NextResponse.json(
        { 
          error: 'Invalid request body', 
          message: 'The request body could not be parsed as JSON'
        },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract data with type validation
    const {
      name,
      description,
      condition,
      latitude,
      longitude,
      imageUrl,
    } = requestBody;

    // Validate required fields
    if (!name || !description) {
      console.log('缺少必填字段');
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          message: 'Name and description are required fields'
        },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate coordinates if provided
    if ((latitude !== undefined && isNaN(Number(latitude))) || 
        (longitude !== undefined && isNaN(Number(longitude)))) {
      console.log('无效的坐标值:', { latitude, longitude });
      return NextResponse.json(
        { 
          error: 'Invalid coordinates', 
          message: 'Latitude and longitude must be valid numbers'
        },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('开始更新数据库中的物品...');
    
    // 构建更新数据对象
    const updateData = {
      name,
      description,
      // 恢复 condition 字段，现在数据库中已有此字段
      condition,
      ...(latitude !== undefined && { latitude: Number(latitude) }),
      ...(longitude !== undefined && { longitude: Number(longitude) }),
      ...(imageUrl && { image: imageUrl }),
    };
    
    console.log('更新数据:', JSON.stringify(updateData, null, 2));

    try {
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
        user: updatedItem.owner
      };

      console.log('物品更新成功:', id);
      return NextResponse.json(responseItem, {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      return NextResponse.json(
        { 
          error: 'Database error', 
          message: 'Failed to update the item in the database',
          details: dbError instanceof Error ? dbError.message : 'Unknown database error'
        },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('更新物品时发生未捕获的错误:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update item', 
        message: 'An unexpected error occurred while processing your request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 