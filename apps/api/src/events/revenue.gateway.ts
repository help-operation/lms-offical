import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Subscription } from 'rxjs';
import { RevenueEventsService } from './revenue-events.service';

@WebSocketGateway({
  cors: {
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3003').split(',').map((s) => s.trim()),
    credentials: true,
  },
  namespace: '/revenue',
  path: '/socket.io',
})
export class RevenueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RevenueGateway.name);

  @WebSocketServer()
  server: Server;

  private subscription: Subscription | null = null;

  constructor(private readonly revenueEvents: RevenueEventsService) {}

  afterInit() {
    this.subscription = this.revenueEvents.events$.subscribe((event) => {
      this.server?.emit('revenue:update', event);
    });
    this.logger.log('RevenueGateway subscribed to revenue events');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  onModuleDestroy() {
    this.subscription?.unsubscribe();
  }
}
