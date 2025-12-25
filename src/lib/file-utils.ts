import { FileType } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

// Allowed file types and their configurations
export const FILE_CONFIG = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: {
    // PDF documents
    'application/pdf': { type: 'PDF' as FileType, extension: '.pdf' },
    // Images
    'image/jpeg': { type: 'IMAGE' as FileType, extension: '.jpg' },
    'image/png': { type: 'IMAGE' as FileType, extension: '.png' },
    'image/gif': { type: 'IMAGE' as FileType, extension: '.gif' },
    'image/webp': { type: 'IMAGE' as FileType, extension: '.webp' },
    // Documents
    'application/msword': { type: 'DOCUMENT' as FileType, extension: '.doc' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      type: 'DOCUMENT' as FileType,
      extension: '.docx',
    },
    // Spreadsheets
    'application/vnd.ms-excel': { type: 'SPREADSHEET' as FileType, extension: '.xls' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
      type: 'SPREADSHEET' as FileType,
      extension: '.xlsx',
    },
    'text/csv': { type: 'SPREADSHEET' as FileType, extension: '.csv' },
    // Text files
    'text/plain': { type: 'TEXT' as FileType, extension: '.txt' },
    'text/markdown': { type: 'TEXT' as FileType, extension: '.md' },
    'application/json': { type: 'TEXT' as FileType, extension: '.json' },
  } as Record<string, { type: FileType; extension: string }>,
};

// Get upload directory path
export function getUploadDir(userId: string): string {
  return path.join(process.cwd(), 'uploads', userId);
}

// Ensure upload directory exists
export async function ensureUploadDir(userId: string): Promise<string> {
  const dir = getUploadDir(userId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

// Generate unique filename
export function generateFilename(originalName: string, mimeType: string): string {
  const config = FILE_CONFIG.allowedTypes[mimeType];
  const extension = config?.extension || path.extname(originalName);
  const hash = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  return `${timestamp}-${hash}${extension}`;
}

// Validate file
export function validateFile(
  file: { size: number; type: string },
  options?: { maxSize?: number }
): { valid: boolean; error?: string } {
  const maxSize = options?.maxSize || FILE_CONFIG.maxSize;

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`,
    };
  }

  if (!FILE_CONFIG.allowedTypes[file.type]) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed`,
    };
  }

  return { valid: true };
}

// Get file type from mime type
export function getFileType(mimeType: string): FileType {
  return FILE_CONFIG.allowedTypes[mimeType]?.type || 'OTHER';
}

// Delete file from storage
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

// Get file stats
export async function getFileStats(filePath: string): Promise<{
  size: number;
  createdAt: Date;
  modifiedAt: Date;
} | null> {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
    };
  } catch {
    return null;
  }
}

// Simple text extraction (in production, use specialized libraries)
export async function extractText(
  filePath: string,
  mimeType: string
): Promise<{ text: string; metadata: Record<string, unknown> } | null> {
  try {
    const fileType = getFileType(mimeType);

    switch (fileType) {
      case 'TEXT': {
        const content = await fs.readFile(filePath, 'utf-8');
        return {
          text: content,
          metadata: {
            characterCount: content.length,
            wordCount: content.split(/\s+/).filter(Boolean).length,
            lineCount: content.split('\n').length,
          },
        };
      }

      case 'PDF': {
        // In production, use pdf-parse or similar library
        // For now, return a placeholder
        return {
          text: '[PDF content extraction requires additional processing]',
          metadata: {
            type: 'pdf',
            note: 'PDF parsing requires server-side processing',
          },
        };
      }

      case 'IMAGE': {
        // In production, use OCR library like Tesseract
        return {
          text: '[Image OCR requires additional processing]',
          metadata: {
            type: 'image',
            note: 'OCR processing requires server-side processing',
          },
        };
      }

      case 'DOCUMENT': {
        // In production, use mammoth or docx library
        return {
          text: '[Document extraction requires additional processing]',
          metadata: {
            type: 'document',
            note: 'Document parsing requires server-side processing',
          },
        };
      }

      case 'SPREADSHEET': {
        // In production, use xlsx library
        return {
          text: '[Spreadsheet extraction requires additional processing]',
          metadata: {
            type: 'spreadsheet',
            note: 'Spreadsheet parsing requires server-side processing',
          },
        };
      }

      default:
        return null;
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    return null;
  }
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
