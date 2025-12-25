import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// GET /api/teams/[id]/members - Get team members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const team = await prisma.team.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is a member
    const isMember = team.members.some((m) => m.userId === auth.user!.id);
    if (!isMember) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const members = await prisma.teamMember.findMany({
      where: { teamId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

// PATCH /api/teams/[id]/members - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { memberId, role } = body;

    if (!memberId || !role) {
      return NextResponse.json(
        { error: 'Member ID and role are required' },
        { status: 400 }
      );
    }

    const validRoles = ['OWNER', 'ADMIN', 'MEMBER'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const team = await prisma.team.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Check if user is owner or admin
    const currentMember = team.members.find((m) => m.userId === auth.user!.id);
    if (!currentMember || (currentMember.role !== 'OWNER' && currentMember.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Cannot change owner role unless you are the owner
    const targetMember = team.members.find((m) => m.id === memberId);
    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (targetMember.role === 'OWNER' && currentMember.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Cannot change owner role' },
        { status: 403 }
      );
    }

    // Only one owner allowed
    if (role === 'OWNER' && currentMember.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only the owner can transfer ownership' },
        { status: 403 }
      );
    }

    if (role === 'OWNER') {
      // Transfer ownership
      await prisma.$transaction([
        prisma.teamMember.update({
          where: { id: currentMember.id },
          data: { role: 'ADMIN' },
        }),
        prisma.teamMember.update({
          where: { id: memberId },
          data: { role: 'OWNER' },
        }),
        prisma.team.update({
          where: { id },
          data: { ownerId: targetMember.userId },
        }),
      ]);
    } else {
      await prisma.teamMember.update({
        where: { id: memberId },
        data: { role },
      });
    }

    return NextResponse.json({ message: 'Member role updated' });
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { error: 'Failed to update member role' },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id]/members - Remove member from team
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      );
    }

    const team = await prisma.team.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const currentMember = team.members.find((m) => m.userId === auth.user!.id);
    const targetMember = team.members.find((m) => m.id === memberId);

    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Users can remove themselves, or admins/owners can remove others
    const isSelf = targetMember.userId === auth.user.id;
    const isAdmin = currentMember && (currentMember.role === 'OWNER' || currentMember.role === 'ADMIN');

    if (!isSelf && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Owner cannot be removed
    if (targetMember.role === 'OWNER') {
      return NextResponse.json(
        { error: 'Owner cannot be removed. Transfer ownership first.' },
        { status: 400 }
      );
    }

    await prisma.teamMember.delete({ where: { id: memberId } });

    return NextResponse.json({ message: 'Member removed from team' });
  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    );
  }
}
