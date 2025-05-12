import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import { randomUUID } from 'crypto';

/**
 * 處理圖片上傳
 * 此 API 端點接收表單數據中的文件，將其轉為base64 URL格式，並返回數據
 */
export async function POST(request: NextRequest) {
  try {
    console.log('開始處理圖片上傳請求');
    
    // 檢查用戶是否已登錄
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('用戶未登錄，拒絕上傳請求');
      return new NextResponse(
        JSON.stringify({ error: 'You must be logged in to upload files' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 獲取表單數據
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.log('沒有提供文件');
      return new NextResponse(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`接收到文件: ${file.name}, 類型: ${file.type}, 大小: ${file.size} 字節`);

    // 檢查文件大小 (限制為 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.log('文件太大，拒絕上傳');
      return new NextResponse(
        JSON.stringify({ error: 'File too large. Maximum size is 5MB' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 檢查文件類型
    if (!file.type.startsWith('image/')) {
      console.log('文件類型不是圖片，拒絕上傳');
      return new NextResponse(
        JSON.stringify({ error: 'Only image files are allowed' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      // 處理文件數據 - 轉換為 base64 URL
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = buffer.toString('base64');
      
      // 獲取文件擴展名
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const fileExt = validExtensions.includes(extension) ? extension : 'jpg';
      
      // 創建 base64 URL（可直接在 img 標籤中使用）
      const dataUrl = `data:${file.type};base64,${base64Image}`;
      
      // 生成隨機文件名
      const uuid = randomUUID();
      const fileName = `${uuid}.${fileExt}`;
      
      console.log('成功處理圖片，返回 data URL');
      
      // 返回數據 URL
      return new NextResponse(
        JSON.stringify({ 
          url: dataUrl,
          fileName: fileName,
          size: file.size,
          type: file.type
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (uploadError) {
      console.error('處理圖片過程中出錯:', uploadError);
      return new NextResponse(
        JSON.stringify({ 
          error: 'Failed to process the image',
          details: uploadError instanceof Error ? uploadError.message : 'Unknown error'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('圖片上傳處理過程中的未捕獲錯誤:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'An unexpected error occurred while uploading the file',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 