import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET /api/user/accounts - Get linked OAuth accounts
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await prisma.account.findMany({
      where: { userId: auth.user.id },
      select: {
        id: true,
        provider: true,
        type: true,
      },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/accounts - Unlink an OAuth account
export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('id');
    const provider = searchParams.get('provider');

    if (!accountId && !provider) {
      return NextResponse.json(
        { error: 'Account ID or provider is required' },
        { status: 400 }
      );
    }

    // Check if user has a password (can unlink) or other accounts
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get linked accounts
    const userAccounts = await prisma.account.findMany({
      where: { userId: auth.user.id },
    });

    // Ensure user can still log in after unlinking
    if (!user.password && userAccounts.length <= 1) {
      return NextResponse.json(
        { error: 'Cannot unlink the only login method. Please set a password first.' },
        { status: 400 }
      );
    }

    // Delete the account link
    if (accountId) {
      await prisma.account.delete({
        where: { id: accountId },
      });
    } else if (provider) {
      await prisma.account.deleteMany({
        where: {
          userId: auth.user.id,
          provider: provider,
        },
      });
    }

    return NextResponse.json({ message: 'Account unlinked successfully' });
  } catch (error) {
    console.error('Error unlinking account:', error);
    return NextResponse.json(
      { error: 'Failed to unlink account' },
      { status: 500 }
    );
  }
}
