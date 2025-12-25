import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verify } from 'jsonwebtoken';
import { config } from './config';

let io: SocketServer | null = null;

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

interface UserConnection {
  socketId: string;
  userId: string;
  email: string;
  connectedAt: Date;
}

const activeConnections = new Map<string, UserConnection>();

export function initializeSocket(server: HttpServer): SocketServer {
  io = new SocketServer(server, {
    cors: {
      origin: config.app.url,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/api/socketio',
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                    socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verify(token, config.jwt.secret) as { userId: string; email: string };
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`);

    if (socket.userId) {
      activeConnections.set(socket.userId, {
        socketId: socket.id,
        userId: socket.userId,
        email: socket.userEmail || '',
        connectedAt: new Date(),
      });

      // Join user's personal room
      socket.join(`user:${socket.userId}`);

      // Broadcast online status
      io?.emit('user:online', { userId: socket.userId });
    }

    // Handle AI streaming request
    socket.on('ai:stream:start', async (data) => {
      const { toolSlug, input, conversationId } = data;
      
      // Emit that streaming started
      socket.emit('ai:stream:started', { 
        conversationId,
        toolSlug,
      });

      // In a real implementation, this would stream from OpenAI
      // For now, simulate streaming
      const mockResponse = 'This is a simulated streaming response from the AI. Each word is being sent individually to demonstrate real-time streaming capabilities.';
      const words = mockResponse.split(' ');

      for (let i = 0; i < words.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        socket.emit('ai:stream:chunk', {
          conversationId,
          chunk: words[i] + ' ',
          index: i,
        });
      }

      socket.emit('ai:stream:complete', {
        conversationId,
        fullResponse: mockResponse,
      });
    });

    // Handle typing indicators
    socket.on('typing:start', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('typing:update', {
        userId: socket.userId,
        isTyping: true,
      });
    });

    socket.on('typing:stop', (data) => {
      const { conversationId } = data;
      socket.to(`conversation:${conversationId}`).emit('typing:update', {
        userId: socket.userId,
        isTyping: false,
      });
    });

    // Join conversation room
    socket.on('conversation:join', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      
      if (socket.userId) {
        activeConnections.delete(socket.userId);
        io?.emit('user:offline', { userId: socket.userId });
      }
    });
  });

  return io;
}

export function getIO(): SocketServer | null {
  return io;
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  io?.to(`user:${userId}`).emit(event, data);
}

export function emitToAll(event: string, data: unknown): void {
  io?.emit(event, data);
}

export function getActiveConnections(): Map<string, UserConnection> {
  return activeConnections;
}

export function isUserOnline(userId: string): boolean {
  return activeConnections.has(userId);
}
