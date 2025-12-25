import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import crypto from 'crypto';

// GET /api/teams/[id]/invitations - Get team invitations
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

    // Check if user is a member with admin rights
    const member = team.members.find((m) => m.userId === auth.user!.id);
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const invitations = await prisma.teamInvitation.findMany({
      where: { teamId: id },
      include: {
        invitedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

// POST /api/teams/[id]/invitations - Create invitation
export async function POST(
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
    const { email, role = 'MEMBER' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const validRoles = ['ADMIN', 'MEMBER'];
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
    const member = team.members.find((m) => m.userId === auth.user!.id);
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Check if team has reached member limit
    if (team.members.length >= team.maxMembers) {
      return NextResponse.json(
        { error: 'Team has reached maximum member limit' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const isMember = team.members.some((m) => m.userId === existingUser.id);
      if (isMember) {
        return NextResponse.json(
          { error: 'User is already a member of this team' },
          { status: 400 }
        );
      }
    }

    // Check for pending invitation
    const existingInvitation = await prisma.teamInvitation.findFirst({
      where: {
        teamId: id,
        email,
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 400 }
      );
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.teamInvitation.create({
      data: {
        teamId: id,
        email,
        role,
        token,
        invitedById: auth.user.id,
        expiresAt,
      },
    });

    // In production, you would send an email here
    // For now, return the invitation link
    const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/teams/join?token=${token}`;

    return NextResponse.json({
      invitation,
      invitationLink,
      message: 'Invitation created successfully',
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id]/invitations - Cancel invitation
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
    const invitationId = searchParams.get('invitationId');

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
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

    // Check if user is owner or admin
    const member = team.members.find((m) => m.userId === auth.user!.id);
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.teamId !== id) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    await prisma.teamInvitation.delete({ where: { id: invitationId } });

    return NextResponse.json({ message: 'Invitation cancelled' });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return NextResponse.json(
      { error: 'Failed to cancel invitation' },
      { status: 500 }
    );
  }
}
