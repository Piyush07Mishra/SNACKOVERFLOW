import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { auth } from '@/auth';
import { v4 as uuidv4 } from 'uuid';

// Allowed file types and their MIME types
const ALLOWED_FILE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/plain': 'txt'
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Ensure uploads directory exists
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    // Directory already exists or permission error
    console.error('Error creating upload directory:', error);
  }
}

function validateFile(file: File) {
  // Check file type
  if (!ALLOWED_FILE_TYPES[file.type]) {
    throw new Error(`File type ${file.type} is not allowed`);
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum limit of 10MB`);
  }

  return true;
}

function generateFileName(file: File, userId: string) {
  const timestamp = Date.now();
  const fileExtension = ALLOWED_FILE_TYPES[file.type] || 'unknown';
  const uniqueId = uuidv4().substring(0, 8);
  return `${userId}_${timestamp}_${uniqueId}.${fileExtension}`;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureUploadDir();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'profile'; // 'profile', 'document', etc.

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    try {
      validateFile(file);
    } catch (validationError: any) {
      return NextResponse.json({ error: validationError.message }, { status: 400 });
    }

    const userId = session.user.id;
    const fileName = generateFileName(file, userId);
    const filePath = join(UPLOAD_DIR, fileName);

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file to local storage
    await writeFile(filePath, buffer);

    // Generate CDN URL (you can replace this with your actual CDN logic)
    const cdnUrl = `/uploads/${fileName}`;

    // For now, return local path. In production, you would upload to CDN
    // and return the CDN URL here
    const response = {
      success: true,
      fileName,
      filePath: cdnUrl,
      fileSize: file.size,
      fileType: file.type,
      uploadType: type,
      userId
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'profile';
    const userId = session.user.id;

    // List files for the user (you can enhance this to query from database)
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    
    // For now, return empty array. In a real implementation, 
    // you would query the database for user's uploaded files
    const response = {
      success: true,
      files: [],
      userId,
      type
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}
