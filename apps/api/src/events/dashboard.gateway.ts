import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Subscription } from 'rxjs';
import { DashboardEventsService } from './dashboard-events.service';

@WebSocketGateway({
  cors: {
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3003').split(',').map((s) => s.trim()),
    credentials: true,
  },
  namespace: '/dashboard',
  path: '/socket.io',
})
export class DashboardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(DashboardGateway.name);

  @WebSocketServer()
  server: Server;

  private subscription: Subscription | null = null;

  constructor(private readonly dashboardEvents: DashboardEventsService) {}

  afterInit() {
    this.subscription = this.dashboardEvents.events$.subscribe((event) => {
      this.server?.emit('dashboard:update', event);
    });
    this.logger.log('DashboardGateway subscribed to dashboard events');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Dashboard client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Dashboard client disconnected: ${client.id}`);
  }

  onModuleDestroy() {
    this.subscription?.unsubscribe();
  }
}
