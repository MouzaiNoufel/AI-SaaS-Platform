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
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Plug,
  Plus,
  Settings,
  Trash2,
  TestTube,
  Copy,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  MessageSquare,
  Chrome,
  Zap,
  Link,
  Play,
  Pause,
} from 'lucide-react';

interface Integration {
  id: string;
  type: string;
  name: string;
  status: string;
  settings: Record<string, unknown> | null;
  webhookUrl: string | null;
  lastUsed: string | null;
  usageCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

const INTEGRATION_TYPES = [
  {
    type: 'SLACK',
    name: 'Slack',
    description: 'Connect to Slack for AI-powered responses in channels',
    icon: MessageSquare,
    color: 'text-purple-500 bg-purple-500/10',
  },
  {
    type: 'DISCORD',
    name: 'Discord',
    description: 'Add an AI bot to your Discord server',
    icon: MessageSquare,
    color: 'text-indigo-500 bg-indigo-500/10',
  },
  {
    type: 'CHROME',
    name: 'Chrome Extension',
    description: 'Use AI features directly in your browser',
    icon: Chrome,
    color: 'text-green-500 bg-green-500/10',
  },
  {
    type: 'ZAPIER',
    name: 'Zapier',
    description: 'Connect with 5000+ apps via Zapier',
    icon: Zap,
    color: 'text-orange-500 bg-orange-500/10',
  },
  {
    type: 'CUSTOM',
    name: 'Custom Webhook',
    description: 'Create a custom integration with webhooks',
    icon: Link,
    color: 'text-gray-500 bg-gray-500/10',
  },
];

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<typeof INTEGRATION_TYPES[0] | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [newName, setNewName] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: Record<string, unknown>;
  } | null>(null);
  const [webhookSecret, setWebhookSecret] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/integrations');
      const data = await response.json();
      if (response.ok) {
        setIntegrations(data.integrations);
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIntegration = async () => {
    if (!selectedType || !newName.trim()) {
      toast({
        title: 'Error',
        description: 'Please select a type and enter a name',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType.type,
          name: newName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setWebhookSecret(data.webhookSecret);
        toast({
          title: 'Success',
          description: 'Integration created successfully',
        });
        fetchIntegrations();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create integration',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to create integration:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleActivate = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Integration activated',
        });
        fetchIntegrations();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to activate',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to activate:', error);
    }
  };

  const handleDeactivate = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'INACTIVE' }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Integration deactivated',
        });
        fetchIntegrations();
      }
    } catch (error) {
      console.error('Failed to deactivate:', error);
    }
  };

  const handleTest = async (integrationId: string) => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch(`/api/integrations/${integrationId}/test`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult(data);
        if (data.success) {
          toast({
            title: 'Test Successful',
            description: data.message,
          });
        } else {
          toast({
            title: 'Test Failed',
            description: data.message,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Test failed',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async (integrationId: string) => {
    if (!confirm('Are you sure you want to delete this integration?')) return;

    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Integration deleted',
        });
        setShowDetailsDialog(false);
        fetchIntegrations();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'INACTIVE':
        return (
          <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
            <Pause className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        );
      case 'ERROR':
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getIntegrationType = (type: string) => {
    return INTEGRATION_TYPES.find((t) => t.type === type) || INTEGRATION_TYPES[4];
  };

  const openDetails = (integration: Integration) => {
    setSelectedIntegration(integration);
    setTestResult(null);
    setShowDetailsDialog(true);
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
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">
            Connect AI to your favorite tools and platforms
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Integration
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="mb-6">
          <TabsTrigger value="active">Active ({integrations.filter((i) => i.status === 'ACTIVE').length})</TabsTrigger>
          <TabsTrigger value="all">All ({integrations.length})</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {integrations.filter((i) => i.status === 'ACTIVE').length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Plug className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Active Integrations</h3>
                <p className="text-muted-foreground mb-4">
                  Add an integration to connect AI with your tools
                </p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Integration
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {integrations
                .filter((i) => i.status === 'ACTIVE')
                .map((integration) => {
                  const typeInfo = getIntegrationType(integration.type);
                  const Icon = typeInfo.icon;
                  return (
                    <Card
                      key={integration.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => openDetails(integration)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${typeInfo.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          {getStatusBadge(integration.status)}
                        </div>
                        <CardTitle className="mt-3">{integration.name}</CardTitle>
                        <CardDescription>{typeInfo.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          <p>{integration.usageCount} requests</p>
                          {integration.lastUsed && (
                            <p>Last used: {new Date(integration.lastUsed).toLocaleDateString()}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all">
          {integrations.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Plug className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Integrations Yet</h3>
                <p className="text-muted-foreground">Get started by adding your first integration</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {integrations.map((integration) => {
                const typeInfo = getIntegrationType(integration.type);
                const Icon = typeInfo.icon;
                return (
                  <Card
                    key={integration.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openDetails(integration)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${typeInfo.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        {getStatusBadge(integration.status)}
                      </div>
                      <CardTitle className="mt-3">{integration.name}</CardTitle>
                      <CardDescription>{typeInfo.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        <p>{integration.usageCount} requests</p>
                        {integration.lastError && (
                          <p className="text-red-500 truncate">Error: {integration.lastError}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {INTEGRATION_TYPES.map((type) => {
              const Icon = type.icon;
              const existing = integrations.find((i) => i.type === type.type);
              return (
                <Card key={type.type} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${type.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {existing && getStatusBadge(existing.status)}
                    </div>
                    <CardTitle className="mt-3">{type.name}</CardTitle>
                    <CardDescription>{type.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {existing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => openDetails(existing)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedType(type);
                          setNewName(`My ${type.name}`);
                          setWebhookSecret(null);
                          setShowAddDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Integration Dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setSelectedType(null);
            setNewName('');
            setWebhookSecret(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Integration</DialogTitle>
            <DialogDescription>
              Connect a new platform to use AI capabilities
            </DialogDescription>
          </DialogHeader>

          {webhookSecret ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Integration Created</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Save your webhook secret securely. It will only be shown once.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Webhook Secret</Label>
                <div className="flex gap-2">
                  <Input
                    value={webhookSecret}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(webhookSecret, 'Webhook secret')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => {
                    setShowAddDialog(false);
                    setWebhookSecret(null);
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                {!selectedType ? (
                  <div className="grid gap-3">
                    {INTEGRATION_TYPES.map((type) => {
                      const Icon = type.icon;
                      const existing = integrations.find((i) => i.type === type.type);
                      return (
                        <button
                          key={type.type}
                          disabled={!!existing}
                          onClick={() => {
                            setSelectedType(type);
                            setNewName(`My ${type.name}`);
                          }}
                          className={`flex items-center gap-4 p-4 rounded-lg border text-left transition-colors ${
                            existing
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-muted cursor-pointer'
                          }`}
                        >
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${type.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{type.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {type.description}
                            </div>
                          </div>
                          {existing && (
                            <Badge variant="secondary">Added</Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${selectedType.color}`}>
                        <selectedType.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">{selectedType.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedType.description}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Integration Name</Label>
                      <Input
                        id="name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Enter a name for this integration"
                      />
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                {selectedType ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedType(null)}
                    >
                      Back
                    </Button>
                    <Button onClick={handleAddIntegration}>Create Integration</Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Integration Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedIntegration?.name}</DialogTitle>
            <DialogDescription>
              Manage your integration settings and configuration
            </DialogDescription>
          </DialogHeader>

          {selectedIntegration && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const typeInfo = getIntegrationType(selectedIntegration.type);
                    const Icon = typeInfo.icon;
                    return (
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${typeInfo.color}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                    );
                  })()}
                  <div>
                    <div className="font-medium text-lg">{selectedIntegration.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {getIntegrationType(selectedIntegration.type).description}
                    </div>
                  </div>
                </div>
                {getStatusBadge(selectedIntegration.status)}
              </div>

              {selectedIntegration.webhookUrl && (
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={selectedIntegration.webhookUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        copyToClipboard(selectedIntegration.webhookUrl!, 'Webhook URL')
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use this URL to send data to your integration
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Requests</Label>
                  <p className="font-medium">{selectedIntegration.usageCount}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Used</Label>
                  <p className="font-medium">
                    {selectedIntegration.lastUsed
                      ? new Date(selectedIntegration.lastUsed).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="font-medium">
                    {new Date(selectedIntegration.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Updated</Label>
                  <p className="font-medium">
                    {new Date(selectedIntegration.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedIntegration.lastError && (
                <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="flex items-center gap-2 text-red-600 mb-1">
                    <XCircle className="h-4 w-4" />
                    <span className="font-medium">Last Error</span>
                  </div>
                  <p className="text-sm">{selectedIntegration.lastError}</p>
                </div>
              )}

              {testResult && (
                <div
                  className={`p-4 rounded-lg border ${
                    testResult.success
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-red-500/10 border-red-500/20'
                  }`}
                >
                  <div className={`flex items-center gap-2 mb-1 ${
                    testResult.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span className="font-medium">
                      {testResult.success ? 'Test Passed' : 'Test Failed'}
                    </span>
                  </div>
                  <p className="text-sm">{testResult.message}</p>
                  {testResult.details && (
                    <pre className="mt-2 text-xs bg-background/50 p-2 rounded">
                      {JSON.stringify(testResult.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleTest(selectedIntegration.id)}
                  disabled={testing}
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Test Connection
                </Button>

                {selectedIntegration.status === 'ACTIVE' ? (
                  <Button
                    variant="outline"
                    onClick={() => handleDeactivate(selectedIntegration.id)}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Deactivate
                  </Button>
                ) : (
                  <Button onClick={() => handleActivate(selectedIntegration.id)}>
                    <Play className="h-4 w-4 mr-2" />
                    Activate
                  </Button>
                )}
              </div>

              <DialogFooter className="border-t pt-4">
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedIntegration.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Integration
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
