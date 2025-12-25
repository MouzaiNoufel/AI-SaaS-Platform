import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import {
  ensureUploadDir,
  generateFilename,
  validateFile,
  getFileType,
  extractText,
  FILE_CONFIG,
} from '@/lib/file-utils';
import fs from 'fs/promises';
import path from 'path';

// GET /api/uploads - List user's uploads
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: auth.user.id };
    if (type) where.type = type;
    if (status) where.status = status;

    const [uploads, total] = await Promise.all([
      prisma.upload.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.upload.count({ where }),
    ]);

    return NextResponse.json({
      uploads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching uploads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch uploads' },
      { status: 500 }
    );
  }
}

// POST /api/uploads - Upload a file
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    const validation = validateFile({ size: file.size, type: file.type });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check storage quota (e.g., 100MB per user for free tier)
    const totalStorage = await prisma.upload.aggregate({
      where: { userId: auth.user.id },
      _sum: { size: true },
    });

    const currentStorage = totalStorage._sum.size || 0;
    const maxStorage = 100 * 1024 * 1024; // 100MB

    if (currentStorage + file.size > maxStorage) {
      return NextResponse.json(
        { error: 'Storage quota exceeded. Please delete some files.' },
        { status: 400 }
      );
    }

    // Ensure upload directory exists
    const uploadDir = await ensureUploadDir(auth.user.id);

    // Generate unique filename
    const filename = generateFilename(file.name, file.type);
    const filePath = path.join(uploadDir, filename);

    // Save file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // Create upload record
    const upload = await prisma.upload.create({
      data: {
        userId: auth.user.id,
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        type: getFileType(file.type),
        path: filePath,
        url: `/api/uploads/${auth.user.id}/${filename}`,
        status: 'PENDING',
      },
    });

    // Start processing in background (simplified for now)
    processUpload(upload.id, filePath, file.type).catch(console.error);

    return NextResponse.json({
      upload,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// Background processing function
async function processUpload(
  uploadId: string,
  filePath: string,
  mimeType: string
): Promise<void> {
  try {
    // Update status to processing
    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: 'PROCESSING' },
    });

    // Extract text and metadata
    const extracted = await extractText(filePath, mimeType);

    // Update with extracted content
    await prisma.upload.update({
      where: { id: uploadId },
      data: {
        status: 'COMPLETED',
        extractedText: extracted?.text || null,
        metadata: extracted?.metadata || null,
        processedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error processing upload:', error);

    // Update with error status
    await prisma.upload.update({
      where: { id: uploadId },
      data: {
        status: 'FAILED',
        processingError: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

// DELETE /api/uploads - Bulk delete uploads
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'No upload IDs provided' },
        { status: 400 }
      );
    }

    // Get uploads to delete
    const uploads = await prisma.upload.findMany({
      where: {
        id: { in: ids },
        userId: auth.user.id,
      },
    });

    // Delete files from disk
    for (const upload of uploads) {
      try {
        await fs.unlink(upload.path);
      } catch (error) {
        console.error(`Failed to delete file: ${upload.path}`, error);
      }
    }

    // Delete records from database
    await prisma.upload.deleteMany({
      where: {
        id: { in: ids },
        userId: auth.user.id,
      },
    });

    return NextResponse.json({
      message: `${uploads.length} file(s) deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting uploads:', error);
    return NextResponse.json(
      { error: 'Failed to delete uploads' },
      { status: 500 }
    );
  }
}
