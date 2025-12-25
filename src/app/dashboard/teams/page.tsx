'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Plus,
  Settings,
  UserPlus,
  Crown,
  Shield,
  User,
  Mail,
  Trash2,
  Copy,
  MoreVertical,
  Building,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar: string | null;
  maxMembers: number;
  createdAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
  members: TeamMember[];
  invitations: TeamInvitation[];
  _count: { members: number };
}

interface TeamMember {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
}

interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  expiresAt: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'MEMBER' });
  const [invitationLink, setInvitationLink] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      const data = await response.json();
      if (response.ok) {
        setTeams(data.teams);
        if (data.teams.length > 0 && !selectedTeam) {
          fetchTeamDetails(data.teams[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamDetails = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`);
      const data = await response.json();
      if (response.ok) {
        setSelectedTeam(data.team);
      }
    } catch (error) {
      console.error('Failed to fetch team details:', error);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeam.name.trim()) {
      toast({
        title: 'Error',
        description: 'Team name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeam),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Team created successfully',
        });
        setShowCreateDialog(false);
        setNewTeam({ name: '', description: '' });
        fetchTeams();
        fetchTeamDetails(data.team.id);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create team',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to create team:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleInviteMember = async () => {
    if (!selectedTeam || !inviteForm.email.trim()) {
      toast({
        title: 'Error',
        description: 'Email is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      });

      const data = await response.json();

      if (response.ok) {
        setInvitationLink(data.invitationLink);
        toast({
          title: 'Success',
          description: 'Invitation sent successfully',
        });
        setInviteForm({ email: '', role: 'MEMBER' });
        fetchTeamDetails(selectedTeam.id);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to send invitation',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to invite member:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedTeam) return;

    try {
      const response = await fetch(
        `/api/teams/${selectedTeam.id}/members?memberId=${memberId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Member removed from team',
        });
        fetchTeamDetails(selectedTeam.id);
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to remove member',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!selectedTeam) return;

    try {
      const response = await fetch(
        `/api/teams/${selectedTeam.id}/invitations?invitationId=${invitationId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Invitation cancelled',
        });
        fetchTeamDetails(selectedTeam.id);
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to cancel invitation',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    if (!selectedTeam) return;

    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role: newRole }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Member role updated',
        });
        fetchTeamDetails(selectedTeam.id);
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to update role',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleDeleteTeam = async () => {
    if (!selectedTeam) return;

    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Team deleted successfully',
        });
        setSelectedTeam(null);
        fetchTeams();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete team',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to delete team:', error);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'ADMIN':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'Invitation link copied to clipboard',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            Manage your teams and collaborate with others
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Create a team to collaborate with others on AI projects.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  placeholder="Enter team name"
                  value={newTeam.name}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-description">Description (Optional)</Label>
                <Input
                  id="team-description"
                  placeholder="What is this team for?"
                  value={newTeam.description}
                  onChange={(e) =>
                    setNewTeam({ ...newTeam, description: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTeam}>Create Team</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Team List Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building className="h-5 w-5" />
              Your Teams
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {teams.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No teams yet. Create your first team!
              </p>
            ) : (
              teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => fetchTeamDetails(team.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedTeam?.id === team.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="font-medium">{team.name}</div>
                  <div className="text-xs opacity-70">
                    {team._count?.members || 0} members
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Team Details */}
        <div className="lg:col-span-3">
          {selectedTeam ? (
            <Tabs defaultValue="members">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">{selectedTeam.name}</h2>
                  {selectedTeam.description && (
                    <p className="text-muted-foreground">{selectedTeam.description}</p>
                  )}
                </div>
                <TabsList>
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="invitations">Invitations</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="members">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Team Members</CardTitle>
                      <CardDescription>
                        {selectedTeam.members.length} of {selectedTeam.maxMembers} members
                      </CardDescription>
                    </div>
                    <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite Team Member</DialogTitle>
                          <DialogDescription>
                            Send an invitation to join {selectedTeam.name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="invite-email">Email Address</Label>
                            <Input
                              id="invite-email"
                              type="email"
                              placeholder="colleague@example.com"
                              value={inviteForm.email}
                              onChange={(e) =>
                                setInviteForm({ ...inviteForm, email: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="invite-role">Role</Label>
                            <Select
                              value={inviteForm.role}
                              onValueChange={(value) =>
                                setInviteForm({ ...inviteForm, role: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MEMBER">Member</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {invitationLink && (
                            <div className="space-y-2">
                              <Label>Invitation Link</Label>
                              <div className="flex gap-2">
                                <Input value={invitationLink} readOnly className="text-xs" />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => copyToClipboard(invitationLink)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => {
                            setShowInviteDialog(false);
                            setInvitationLink('');
                          }}>
                            Close
                          </Button>
                          <Button onClick={handleInviteMember}>Send Invitation</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedTeam.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.user.avatar || undefined} />
                              <AvatarFallback>
                                {member.user.name?.charAt(0) ||
                                  member.user.email.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {member.user.name || member.user.email}
                                {getRoleIcon(member.role)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {member.user.email}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{member.role}</Badge>
                            {member.role !== 'OWNER' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateRole(
                                        member.id,
                                        member.role === 'ADMIN' ? 'MEMBER' : 'ADMIN'
                                      )
                                    }
                                  >
                                    {member.role === 'ADMIN'
                                      ? 'Demote to Member'
                                      : 'Promote to Admin'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => handleRemoveMember(member.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove from Team
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="invitations">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Invitations</CardTitle>
                    <CardDescription>
                      Invitations that have been sent but not yet accepted
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedTeam.invitations.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No pending invitations</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedTeam.invitations.map((invitation) => (
                          <div
                            key={invitation.id}
                            className="flex items-center justify-between p-3 rounded-lg border"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <Mail className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="font-medium">{invitation.email}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{invitation.role}</Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCancelInvitation(invitation.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Settings</CardTitle>
                    <CardDescription>
                      Manage your team configuration and settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label>Team ID</Label>
                        <Input value={selectedTeam.id} readOnly className="font-mono text-sm" />
                      </div>
                      <div className="space-y-2">
                        <Label>Team Slug</Label>
                        <Input value={selectedTeam.slug} readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Created</Label>
                        <Input
                          value={new Date(selectedTeam.createdAt).toLocaleString()}
                          readOnly
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Owner</Label>
                        <Input
                          value={selectedTeam.owner.name || selectedTeam.owner.email}
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-semibold text-destructive mb-2">
                        Danger Zone
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Once you delete a team, there is no going back. Please be certain.
                      </p>
                      <Button variant="destructive" onClick={handleDeleteTeam}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Team
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Team Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select a team from the sidebar or create a new one
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Team
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
