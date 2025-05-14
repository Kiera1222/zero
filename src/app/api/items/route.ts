import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    console.log("POST /api/items: 开始处理请求");
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.log("POST /api/items: 未认证的请求");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`POST /api/items: 用户登录成功 (${session.user.email})`);
    const formData = await request.formData();
    
    // 记录表单数据，但排除图片内容
    const formDataLog = Object.fromEntries(Array.from(formData.entries())
      .map(([key, value]) => [key, key === 'image' ? 
        (value instanceof File ? `[File: ${value.name}, ${value.size} bytes]` : value) : 
        value]));
    console.log("POST /api/items: 表单数据", formDataLog);
    
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const condition = formData.get("condition") as string;
    const pickupTime = formData.get("pickupTime") as string;
    const latitudeStr = formData.get("latitude") as string;
    const longitudeStr = formData.get("longitude") as string;
    const imageFile = formData.get("image") as File | null;
    
    // Validation
    if (!name || !description || !latitudeStr || !longitudeStr) {
      console.log("POST /api/items: 缺少必需字段");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const latitude = parseFloat(latitudeStr);
    const longitude = parseFloat(longitudeStr);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      console.log("POST /api/items: 无效的坐标值");
      return NextResponse.json(
        { error: "Invalid location coordinates" },
        { status: 400 }
      );
    }

    // Get user from database
    console.log(`POST /api/items: 查询用户, email=${session.user.email}`);
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.log(`POST /api/items: 用户未找到, email=${session.user.email}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log(`POST /api/items: 找到用户, id=${user.id}`);
    
    // Handle image upload if provided
    let imageData = null;
    if (imageFile) {
      console.log(`POST /api/items: 处理图片上传, size=${imageFile.size}, type=${imageFile.type}`);
      try {
        const bytes = await imageFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Convert to base64 for storage
        const base64Image = buffer.toString('base64');
        imageData = `data:${imageFile.type};base64,${base64Image}`;
        console.log(`POST /api/items: 图片转换为 base64 成功, 大小=${Math.round(imageData.length / 1024)}KB`);
      } catch (imageError) {
        console.error("POST /api/items: 处理图片时出错", imageError);
        return NextResponse.json(
          { error: "Failed to process image", details: imageError instanceof Error ? imageError.message : "Unknown error" },
          { status: 500 }
        );
      }
    }

    // 使用类型断言绕过类型检查
    const itemData = {
      name,
      description,
      condition,
      pickupTime: pickupTime || undefined,
      image: imageData,
      latitude,
      longitude,
      ownerId: user.id,
    } as any;

    console.log("POST /api/items: 创建新项目, 数据=", {
      ...itemData,
      description: itemData.description.length > 30 ? 
        `${itemData.description.substring(0, 30)}...` : 
        itemData.description
    });
    
    const item = await prisma.item.create({
      data: itemData,
    });

    console.log(`POST /api/items: 项目创建成功, id=${item.id}`);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Error creating item:", error);
    // 返回详细的错误消息
    let errorMessage = "Failed to create item";
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("Error details:", errorMessage);
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const items = await prisma.item.findMany({
      where: {
        status: 'available',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    let errorMessage = "Failed to fetch items";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ 
      error: errorMessage,
      details: error instanceof Error ? error.stack : 'Unknown error'
    }, { status: 500 });
  }
} 