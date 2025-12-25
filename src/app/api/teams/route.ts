import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import crypto from 'crypto';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + crypto.randomBytes(4).toString('hex');
}

// GET /api/teams - List user's teams
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teams where user is owner or member
    const ownedTeams = await prisma.team.findMany({
      where: { ownerId: auth.user.id },
      include: {
        _count: { select: { members: true } },
        members: {
          take: 5,
          include: {
            user: {
              select: { id: true, name: true, avatar: true, email: true },
            },
          },
        },
      },
    });

    const memberTeams = await prisma.teamMember.findMany({
      where: { userId: auth.user.id },
      include: {
        team: {
          include: {
            owner: {
              select: { id: true, name: true, email: true },
            },
            _count: { select: { members: true } },
          },
        },
      },
    });

    return NextResponse.json({
      ownedTeams,
      memberTeams: memberTeams.map((m) => ({ ...m.team, role: m.role })),
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

// POST /api/teams - Create a new team
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }

    // Check subscription for team limits
    const subscription = await prisma.subscription.findUnique({
      where: { userId: auth.user.id },
    });

    const existingTeams = await prisma.team.count({
      where: { ownerId: auth.user.id },
    });

    const maxTeams = subscription?.plan === 'ENTERPRISE' ? 20 :
                     subscription?.plan === 'PRO' ? 5 :
                     subscription?.plan === 'STARTER' ? 1 : 0;

    if (existingTeams >= maxTeams) {
      return NextResponse.json(
        { error: `Your plan allows ${maxTeams} teams. Upgrade to create more.` },
        { status: 400 }
      );
    }

    const slug = generateSlug(name);

    const team = await prisma.team.create({
      data: {
        name,
        slug,
        description,
        ownerId: auth.user.id,
        members: {
          create: {
            userId: auth.user.id,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}
