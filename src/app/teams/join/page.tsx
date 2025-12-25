'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Users, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface InvitationDetails {
  email: string;
  role: string;
  team: {
    id: string;
    name: string;
    avatar: string | null;
  };
  invitedBy: {
    name: string | null;
    email: string;
  };
  expiresAt: string;
}

function JoinTeamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (token) {
      fetchInvitation();
    } else {
      setError('No invitation token provided');
      setLoading(false);
    }
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/teams/join?token=${token}`);
      const data = await response.json();

      if (response.ok) {
        setInvitation(data.invitation);
      } else {
        setError(data.error || 'Invalid invitation');
      }
    } catch (err) {
      setError('Failed to load invitation details');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setJoining(true);

    try {
      const response = await fetch('/api/teams/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        toast({
          title: 'Success',
          description: `You have joined ${data.teamName}`,
        });
        setTimeout(() => {
          router.push('/dashboard/teams');
        }, 2000);
      } else {
        setError(data.error || 'Failed to join team');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Welcome to the Team!</h2>
            <p className="text-muted-foreground mb-6">
              You have successfully joined {invitation?.team.name}. Redirecting to teams...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Users className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl">Team Invitation</CardTitle>
          <CardDescription>
            You have been invited to join a team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Team</div>
              <div className="font-semibold text-lg">{invitation?.team.name}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Invited by</div>
              <div className="font-medium">
                {invitation?.invitedBy.name || invitation?.invitedBy.email}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Your Role</div>
              <div className="font-medium capitalize">{invitation?.role.toLowerCase()}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Expires</div>
              <div className="font-medium">
                {invitation ? new Date(invitation.expiresAt).toLocaleDateString() : ''}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/dashboard')}
            >
              Decline
            </Button>
            <Button
              className="flex-1"
              onClick={handleJoin}
              disabled={joining}
            >
              {joining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                'Accept & Join'
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By joining this team, you agree to collaborate and share resources
            with other team members.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function JoinTeamPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <JoinTeamContent />
    </Suspense>
  );
}
