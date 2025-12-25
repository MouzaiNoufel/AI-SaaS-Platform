'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/contexts/socket-context';
import { Loader2, Send, Wifi, WifiOff } from 'lucide-react';

interface StreamingChatProps {
  conversationId: string;
  toolSlug?: string;
}

export function StreamingChat({ conversationId, toolSlug = 'ai-chatbot' }: StreamingChatProps) {
  const { 
    isConnected, 
    streamingResponses, 
    startStreaming,
    joinConversation,
    leaveConversation,
    sendTypingStart,
    sendTypingStop,
  } = useSocket();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: string; content: string; streaming?: boolean }>>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    joinConversation(conversationId);
    return () => {
      leaveConversation(conversationId);
    };
  }, [conversationId, joinConversation, leaveConversation]);

  useEffect(() => {
    const streamingContent = streamingResponses.get(conversationId);
    if (streamingContent) {
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.streaming) {
          return [...prev.slice(0, -1), { ...lastMessage, content: streamingContent }];
        }
        return prev;
      });
    }
  }, [streamingResponses, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Handle typing indicator
    sendTypingStart(conversationId);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop(conversationId);
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput('');
    setIsStreaming(true);
    sendTypingStop(conversationId);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    // Add placeholder for streaming response
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

    // Start streaming via WebSocket
    startStreaming(toolSlug, { message: userMessage }, conversationId);

    // Streaming will update the message via the useEffect above
    setTimeout(() => {
      setIsStreaming(false);
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage?.streaming) {
          return [...prev.slice(0, -1), { ...lastMessage, streaming: false }];
        }
        return prev;
      });
    }, 5000); // Fallback timeout
  };

  return (
    <div className="flex flex-col h-full">
      {/* Connection status */}
      <div className="flex items-center gap-2 px-4 py-2 border-b text-sm">
        {isConnected ? (
          <>
            <Wifi className="h-4 w-4 text-green-500" />
            <span className="text-green-600">Connected - Real-time streaming enabled</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-500" />
            <span className="text-red-600">Disconnected - Reconnecting...</span>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            Start a conversation to see real-time streaming in action
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="whitespace-pre-wrap">
                {message.content}
                {message.streaming && (
                  <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                )}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            disabled={!isConnected || isStreaming}
            rows={1}
            className="flex-1 px-4 py-2 border rounded-lg bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || !isConnected || isStreaming}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStreaming ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
