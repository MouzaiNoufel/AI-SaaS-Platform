import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  requireAdmin, 
  validateBody, 
  successResponse, 
  notFoundResponse, 
  handleApiError,
  getClientIp,
  getUserAgent 
} from '@/lib/api-utils';
import { updateToolSchema } from '@/lib/validations';
import { createAuditLog } from '@/services/logging-service';

// GET - Get tool details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(req);
    if ('error' in authResult) return authResult.error;

    const tool = await prisma.aITool.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { aiRequests: true },
        },
      },
    });

    if (!tool) {
      return notFoundResponse('Tool not found');
    }

    return successResponse(tool);
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH - Update tool
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(req);
    if ('error' in authResult) return authResult.error;

    const validation = await validateBody(req, updateToolSchema);
    if ('error' in validation) return validation.error;

    const existingTool = await prisma.aITool.findUnique({
      where: { id: params.id },
    });

    if (!existingTool) {
      return notFoundResponse('Tool not found');
    }

    const tool = await prisma.aITool.update({
      where: { id: params.id },
      data: validation.data,
    });

    // Create audit log
    await createAuditLog({
      userId: authResult.user.userId,
      action: 'TOOL_UPDATE',
      entityType: 'AITool',
      entityId: tool.id,
      details: { updatedFields: Object.keys(validation.data) },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    return successResponse(tool, 'Tool updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE - Delete tool
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(req);
    if ('error' in authResult) return authResult.error;

    const tool = await prisma.aITool.findUnique({
      where: { id: params.id },
    });

    if (!tool) {
      return notFoundResponse('Tool not found');
    }

    await prisma.aITool.delete({
      where: { id: params.id },
    });

    // Create audit log
    await createAuditLog({
      userId: authResult.user.userId,
      action: 'TOOL_DELETE',
      entityType: 'AITool',
      entityId: params.id,
      details: { name: tool.name, slug: tool.slug },
      ipAddress: getClientIp(req),
      userAgent: getUserAgent(req),
    });

    return successResponse(null, 'Tool deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
