import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, validateBody, successResponse, createdResponse, handleApiError, getPaginationParams, buildPaginationMeta } from '@/lib/api-utils';
import { contactSchema } from '@/lib/validations';
import { sendContactConfirmationEmail } from '@/lib/email';

// GET - List contact messages (admin only)
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== 'ADMIN') {
      return handleApiError(new Error('Unauthorized'));
    }

    const { page, limit, skip } = getPaginationParams(req);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [messages, total] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.contactMessage.count({ where }),
    ]);

    return successResponse(
      messages,
      undefined,
      buildPaginationMeta(total, page, limit)
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// POST - Submit contact message
export async function POST(req: NextRequest) {
  try {
    const validation = await validateBody(req, contactSchema);
    if ('error' in validation) return validation.error;

    const { name, email, subject, message } = validation.data;

    // Check if user is logged in
    const user = await getAuthUser(req);

    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject,
        message,
        userId: user?.userId,
      },
    });

    // Send confirmation email
    await sendContactConfirmationEmail(email, name, subject);

    return createdResponse(
      { id: contactMessage.id },
      'Your message has been sent. We\'ll get back to you soon!'
    );
  } catch (error) {
    return handleApiError(error);
  }
}
