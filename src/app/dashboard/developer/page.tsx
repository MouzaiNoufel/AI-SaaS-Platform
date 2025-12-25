'use client';

import { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Check,
  Webhook,
  Book,
  Code2,
  BarChart3,
  AlertCircle,
} from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  key?: string;
  permissions: string[];
  rateLimit: number;
  dailyLimit: number;
  totalRequests: number;
  lastUsedAt: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

interface WebhookData {
  id: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  isActive: boolean;
  totalDeliveries: number;
  successRate: number;
  lastDeliveryAt: string | null;
  createdAt: string;
}

export default function DeveloperPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks' | 'docs'>('keys');
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [showNewWebhookDialog, setShowNewWebhookDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newWebhook, setNewWebhook] = useState({ name: '', url: '', events: [] as string[] });
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [keysRes, webhooksRes] = await Promise.all([
        fetch('/api/developer/keys'),
        fetch('/api/developer/webhooks'),
      ]);

      if (keysRes.ok) {
        const data = await keysRes.json();
        setApiKeys(data.apiKeys);
      }

      if (webhooksRes.ok) {
        const data = await webhooksRes.json();
        setWebhooks(data.webhooks);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);

    try {
      const response = await fetch('/api/developer/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedKey(data.apiKey.key);
        setApiKeys([data.apiKey, ...apiKeys]);
        setNewKeyName('');
      }
    } catch (error) {
      console.error('Error creating key:', error);
    } finally {
      setCreating(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!confirm('Are you sure? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/developer/keys?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setApiKeys(apiKeys.filter(k => k.id !== id));
      }
    } catch (error) {
      console.error('Error deleting key:', error);
    }
  };

  const createWebhook = async () => {
    if (!newWebhook.name || !newWebhook.url) return;
    setCreating(true);

    try {
      const response = await fetch('/api/developer/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWebhook),
      });

      if (response.ok) {
        const data = await response.json();
        setWebhooks([data.webhook, ...webhooks]);
        setShowNewWebhookDialog(false);
        setNewWebhook({ name: '', url: '', events: [] });
      }
    } catch (error) {
      console.error('Error creating webhook:', error);
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  const availableEvents = [
    'ai.request.completed',
    'ai.request.failed',
    'subscription.created',
    'subscription.updated',
    'subscription.canceled',
    'payment.succeeded',
    'payment.failed',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Developer Portal</h1>
        <p className="text-muted-foreground">
          Manage API keys, webhooks, and integrate our AI services into your applications
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'keys', label: 'API Keys', icon: Key },
          { id: 'webhooks', label: 'Webhooks', icon: Webhook },
          { id: 'docs', label: 'Documentation', icon: Book },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* API Keys Tab */}
      {activeTab === 'keys' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Use API keys to authenticate requests to the AI SaaS API
            </p>
            <button
              onClick={() => setShowNewKeyDialog(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create API Key
            </button>
          </div>

          {/* Created Key Display */}
          {createdKey && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-800 dark:text-green-200">
                    API Key Created Successfully
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Copy this key now. It will not be shown again.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-white dark:bg-black rounded border text-sm font-mono break-all">
                      {createdKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(createdKey, 'created')}
                      className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      {copiedId === 'created' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <button
                    onClick={() => setCreatedKey(null)}
                    className="mt-2 text-sm text-green-700 hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* API Keys List */}
          <div className="bg-card border rounded-lg divide-y">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : apiKeys.length === 0 ? (
              <div className="p-8 text-center">
                <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No API Keys</h3>
                <p className="text-muted-foreground mb-4">
                  Create an API key to start using the AI SaaS API
                </p>
                <button
                  onClick={() => setShowNewKeyDialog(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                >
                  <Plus className="h-4 w-4" />
                  Create API Key
                </button>
              </div>
            ) : (
              apiKeys.map((key) => (
                <div key={key.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{key.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono">
                        {key.keyPrefix}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right text-sm">
                      <p>{key.totalRequests.toLocaleString()} requests</p>
                      <p className="text-muted-foreground">
                        Last used: {formatDate(key.lastUsedAt)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      key.isActive 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {key.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => deleteApiKey(key.id)}
                      className="p-2 hover:bg-muted rounded text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Receive real-time notifications when events happen in your account
            </p>
            <button
              onClick={() => setShowNewWebhookDialog(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Webhook
            </button>
          </div>

          <div className="bg-card border rounded-lg divide-y">
            {webhooks.length === 0 ? (
              <div className="p-8 text-center">
                <Webhook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No Webhooks</h3>
                <p className="text-muted-foreground">
                  Add a webhook to receive event notifications
                </p>
              </div>
            ) : (
              webhooks.map((webhook) => (
                <div key={webhook.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{webhook.name}</h3>
                      <p className="text-sm text-muted-foreground">{webhook.url}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      webhook.isActive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {webhook.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {webhook.events.map((event) => (
                      <span key={event} className="px-2 py-0.5 bg-muted rounded text-xs">
                        {event}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Documentation Tab */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Start</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">1. Get your API key</h3>
                <p className="text-sm text-muted-foreground">
                  Create an API key from the API Keys tab above.
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">2. Make your first request</h3>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre>{`curl -X POST https://your-domain.com/api/v1/ai \\
  -H "Authorization: Bearer sk_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tool": "ai-chatbot",
    "input": {
      "message": "Hello, how are you?"
    }
  }'`}</pre>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Available Endpoints</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">GET</span>
                <div>
                  <code className="text-sm font-mono">/api/v1/ai</code>
                  <p className="text-sm text-muted-foreground">List all available AI tools</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">POST</span>
                <div>
                  <code className="text-sm font-mono">/api/v1/ai</code>
                  <p className="text-sm text-muted-foreground">Process an AI request</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Available Tools</h2>
            <div className="grid gap-3">
              {['ai-chatbot', 'text-generator', 'code-assistant', 'smart-summarizer', 'universal-translator', 'data-analyzer'].map((tool) => (
                <div key={tool} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Code2 className="h-5 w-5 text-primary" />
                  <code className="text-sm font-mono">{tool}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Key Dialog */}
      {showNewKeyDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Create API Key</h2>
            <input
              type="text"
              placeholder="Key name (e.g., Production, Development)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-background mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewKeyDialog(false);
                  setNewKeyName('');
                }}
                className="px-4 py-2 border rounded-lg hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={createApiKey}
                disabled={!newKeyName.trim() || creating}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Webhook Dialog */}
      {showNewWebhookDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Add Webhook</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Webhook name"
                value={newWebhook.name}
                onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-background"
              />
              <input
                type="url"
                placeholder="https://your-server.com/webhook"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-background"
              />
              <div>
                <label className="text-sm font-medium">Events</label>
                <div className="mt-2 space-y-2">
                  {availableEvents.map((event) => (
                    <label key={event} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newWebhook.events.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewWebhook({ ...newWebhook, events: [...newWebhook.events, event] });
                          } else {
                            setNewWebhook({ ...newWebhook, events: newWebhook.events.filter(ev => ev !== event) });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowNewWebhookDialog(false);
                  setNewWebhook({ name: '', url: '', events: [] });
                }}
                className="px-4 py-2 border rounded-lg hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={createWebhook}
                disabled={!newWebhook.name || !newWebhook.url || creating}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
