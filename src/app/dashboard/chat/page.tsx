'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Search,
  Plus,
  Archive,
  Pin,
  Trash2,
  MoreVertical,
  Clock,
  ChevronRight,
} from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  summary: string | null;
  messageCount: number;
  totalTokens: number;
  isArchived: boolean;
  isPinned: boolean;
  createdAt: string;
  lastMessageAt: string;
  messages: {
    content: string;
    role: string;
    createdAt: string;
  }[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ChatHistoryPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [showArchived, searchQuery]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        archived: showArchived.toString(),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/conversations?${params}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async () => {
    if (!newTitle.trim()) return;

    try {
      setCreating(true);
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/dashboard/chat/${data.conversation.id}`);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setCreating(false);
      setShowNewDialog(false);
      setNewTitle('');
    }
  };

  const updateConversation = async (id: string, updates: Partial<Conversation>) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        fetchConversations();
      }
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
    setSelectedId(null);
  };

  const deleteConversation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchConversations();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
    setSelectedId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'long' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Chat History</h1>
          <p className="text-muted-foreground">
            View and manage your conversation history
          </p>
        </div>
        <button
          onClick={() => setShowNewDialog(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
            showArchived
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted'
          }`}
        >
          <Archive className="h-4 w-4" />
          {showArchived ? 'Showing Archived' : 'Show Archived'}
        </button>
      </div>

      {/* Conversations List */}
      <div className="bg-card border rounded-lg divide-y">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No conversations yet</h3>
            <p className="text-muted-foreground mb-4">
              Start a new conversation to see it here
            </p>
            <button
              onClick={() => setShowNewDialog(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Conversation
            </button>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="p-4 hover:bg-muted/50 transition-colors cursor-pointer group relative"
              onClick={() => router.push(`/dashboard/chat/${conversation.id}`)}
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {conversation.isPinned && (
                      <Pin className="h-3 w-3 text-primary" />
                    )}
                    <h3 className="font-semibold truncate">
                      {conversation.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.messages[0]
                      ? truncateContent(conversation.messages[0].content)
                      : 'No messages yet'}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(conversation.lastMessageAt)}
                    </span>
                    <span>{conversation.messageCount} messages</span>
                    <span>{conversation.totalTokens.toLocaleString()} tokens</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(selectedId === conversation.id ? null : conversation.id);
                      }}
                      className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {selectedId === conversation.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-popover border rounded-lg shadow-lg z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateConversation(conversation.id, {
                              isPinned: !conversation.isPinned,
                            });
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                        >
                          <Pin className="h-4 w-4" />
                          {conversation.isPinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateConversation(conversation.id, {
                              isArchived: !conversation.isArchived,
                            });
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                        >
                          <Archive className="h-4 w-4" />
                          {conversation.isArchived ? 'Unarchive' : 'Archive'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(conversation.id);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
            (page) => (
              <button
                key={page}
                onClick={() => {/* TODO: Implement pagination */}}
                className={`px-3 py-1 rounded ${
                  page === pagination.page
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>
      )}

      {/* New Conversation Dialog */}
      {showNewDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">New Conversation</h2>
            <input
              type="text"
              placeholder="Conversation title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createConversation()}
              className="w-full px-4 py-2 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNewDialog(false);
                  setNewTitle('');
                }}
                className="px-4 py-2 border rounded-lg hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={createConversation}
                disabled={!newTitle.trim() || creating}
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
