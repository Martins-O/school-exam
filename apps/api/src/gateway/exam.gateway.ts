import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtGuard } from '../auth/ws-jwt.guard'; // I might need to create this

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
  namespace: 'exam-monitoring',
})
export class ExamGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('ExamGateway');

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // Optional: Validate JWT and join admin or student rooms
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-exam')
  handleJoinExam(client: Socket, examId: string) {
    client.join(`exam-${examId}`);
    return { event: 'joined', examId };
  }

  // Method to emit events to admins
  emitViolation(examId: string, data: any) {
    this.server.to(`exam-${examId}`).emit('violation', data);
  }

  emitSubmission(examId: string, data: any) {
    this.server.to(`exam-${examId}`).emit('submission', data);
  }
}
