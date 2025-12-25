'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  Loader2,
  User,
  Bot,
  MoreVertical,
  Edit2,
  Trash2,
  Archive,
  Pin,
  Copy,
  Check,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  tokenCount: number;
  createdAt: string;
}

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
}

export default function ChatConversationPage() {
  const params = useParams();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchConversation();
  }, [params.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/conversations/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setConversation(data.conversation);
        setMessages(data.messages);
        setNewTitle(data.conversation.title);
      } else if (response.status === 404) {
        router.push('/dashboard/chat');
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput('');
    setSending(true);

    // Optimistically add user message
    const tempUserMessage: Message = {
      id: 'temp-user-' + Date.now(),
      role: 'USER',
      content: userMessage,
      tokenCount: Math.ceil(userMessage.length / 4),
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await fetch(`/api/conversations/${params.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMessage }),
      });

      if (response.ok) {
        const data = await response.json();
        // Replace temp message with real ones
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMessage.id),
          data.userMessage,
          data.assistantMessage,
        ]);
        // Update conversation stats
        if (conversation) {
          setConversation({
            ...conversation,
            messageCount: conversation.messageCount + 2,
            totalTokens: conversation.totalTokens + (data.tokenUsage?.total || 0),
            lastMessageAt: new Date().toISOString(),
          });
        }
      } else {
        // Remove temp message on error
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const updateConversation = async (updates: Partial<Conversation>) => {
    try {
      const response = await fetch(`/api/conversations/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setConversation(data.conversation);
        if (updates.title) {
          setNewTitle(updates.title);
        }
      }
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
    setShowMenu(false);
    setEditingTitle(false);
  };

  const deleteConversation = async () => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const response = await fetch(`/api/conversations/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard/chat');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const copyMessage = async (message: Message) => {
    await navigator.clipboard.writeText(message.content);
    setCopiedId(message.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Conversation not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard/chat')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            {editingTitle ? (
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onBlur={() => updateConversation({ title: newTitle })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateConversation({ title: newTitle });
                  } else if (e.key === 'Escape') {
                    setNewTitle(conversation.title);
                    setEditingTitle(false);
                  }
                }}
                className="text-lg font-semibold bg-transparent border-b-2 border-primary focus:outline-none"
                autoFocus
              />
            ) : (
              <h1
                className="text-lg font-semibold cursor-pointer hover:text-primary transition-colors"
                onClick={() => setEditingTitle(true)}
              >
                {conversation.title}
              </h1>
            )}
            <p className="text-sm text-muted-foreground">
              {conversation.messageCount} messages - {conversation.totalTokens.toLocaleString()} tokens
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-popover border rounded-lg shadow-lg z-10">
              <button
                onClick={() => setEditingTitle(true)}
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Rename
              </button>
              <button
                onClick={() =>
                  updateConversation({ isPinned: !conversation.isPinned })
                }
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
              >
                <Pin className="h-4 w-4" />
                {conversation.isPinned ? 'Unpin' : 'Pin'}
              </button>
              <button
                onClick={() =>
                  updateConversation({ isArchived: !conversation.isArchived })
                }
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
              >
                <Archive className="h-4 w-4" />
                {conversation.isArchived ? 'Unarchive' : 'Archive'}
              </button>
              <button
                onClick={deleteConversation}
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Start the conversation by sending a message below</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'USER' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role !== 'USER' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`group relative max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'USER'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <div
                  className={`flex items-center gap-2 mt-1 text-xs ${
                    message.role === 'USER'
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  }`}
                >
                  <span>{formatTime(message.createdAt)}</span>
                  <span>{message.tokenCount} tokens</span>
                </div>
                <button
                  onClick={() => copyMessage(message)}
                  className={`absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                    message.role === 'USER'
                      ? 'hover:bg-white/20'
                      : 'hover:bg-muted-foreground/20'
                  }`}
                >
                  {copiedId === message.id ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
              {message.role === 'USER' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))
        )}
        {sending && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-muted rounded-lg px-4 py-2">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t pt-4">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 px-4 py-2 border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] max-h-32"
            style={{
              height: 'auto',
              minHeight: '44px',
            }}
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
