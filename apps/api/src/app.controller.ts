import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Lightweight, unauthenticated liveness probe for the reverse proxy /
  // Docker healthcheck. Must stay public and dependency-free.
  @Get('health')
  health() {
    return { status: 'ok', uptime: process.uptime() };
  }
}
