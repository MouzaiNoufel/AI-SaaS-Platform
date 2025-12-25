'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth-context';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  streamingResponses: Map<string, string>;
  startStreaming: (toolSlug: string, input: unknown, conversationId: string) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendTypingStart: (conversationId: string) => void;
  sendTypingStop: (conversationId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
  streamingResponses: new Map(),
  startStreaming: () => {},
  joinConversation: () => {},
  leaveConversation: () => {},
  sendTypingStart: () => {},
  sendTypingStop: () => {},
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [streamingResponses, setStreamingResponses] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const getToken = async () => {
      // Get token from cookie or storage
      const response = await fetch('/api/auth/token');
      if (response.ok) {
        const data = await response.json();
        return data.token;
      }
      return null;
    };

    const connectSocket = async () => {
      const token = await getToken();
      if (!token) return;

      const newSocket = io(window.location.origin, {
        path: '/api/socketio',
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('user:online', ({ userId }) => {
        setOnlineUsers((prev) => new Set([...prev, userId]));
      });

      newSocket.on('user:offline', ({ userId }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      });

      // AI Streaming events
      newSocket.on('ai:stream:chunk', ({ conversationId, chunk }) => {
        setStreamingResponses((prev) => {
          const next = new Map(prev);
          const current = next.get(conversationId) || '';
          next.set(conversationId, current + chunk);
          return next;
        });
      });

      newSocket.on('ai:stream:complete', ({ conversationId }) => {
        // Keep the response for a moment then clear
        setTimeout(() => {
          setStreamingResponses((prev) => {
            const next = new Map(prev);
            next.delete(conversationId);
            return next;
          });
        }, 1000);
      });

      // Notification events
      newSocket.on('notification:new', (notification) => {
        // Trigger notification display
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
          });
        }
      });

      setSocket(newSocket);
    };

    connectSocket();

    return () => {
      socket?.disconnect();
    };
  }, [isAuthenticated, user]);

  const startStreaming = useCallback((toolSlug: string, input: unknown, conversationId: string) => {
    socket?.emit('ai:stream:start', { toolSlug, input, conversationId });
  }, [socket]);

  const joinConversation = useCallback((conversationId: string) => {
    socket?.emit('conversation:join', conversationId);
  }, [socket]);

  const leaveConversation = useCallback((conversationId: string) => {
    socket?.emit('conversation:leave', conversationId);
  }, [socket]);

  const sendTypingStart = useCallback((conversationId: string) => {
    socket?.emit('typing:start', { conversationId });
  }, [socket]);

  const sendTypingStop = useCallback((conversationId: string) => {
    socket?.emit('typing:stop', { conversationId });
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        streamingResponses,
        startStreaming,
        joinConversation,
        leaveConversation,
        sendTypingStart,
        sendTypingStop,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
