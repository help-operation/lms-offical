import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface RevenueChangeEvent {
  type: 'order_created' | 'order_paid' | 'order_status_changed' | 'live_enrollment_created' | 'live_enrollment_paid';
  payload: {
    id: number;
    status: string;
    finalAmount: string;
    createdAt: string | null;
    userId: number | null;
    userFirstName: string;
    userLastName: string;
    userEmail: string | null;
  };
  source: 'recorded' | 'live';
}

@Injectable()
export class RevenueEventsService {
  private readonly logger = new Logger(RevenueEventsService.name);
  private readonly subject = new Subject<RevenueChangeEvent>();

  readonly events$ = this.subject.asObservable();

  emit(event: RevenueChangeEvent) {
    this.logger.debug(`Revenue event: ${event.type} source=${event.source} id=${event.payload.id}`);
    this.subject.next(event);
  }
}
