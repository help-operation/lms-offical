import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';

export type DashboardUpdateType =
  | 'enrollment_created'
  | 'enrollment_status_changed'
  | 'order_paid'
  | 'order_created'
  | 'support_ticket_created'
  | 'support_ticket_resolved'
  | 'lead_created'
  | 'student_registered'
  | 'payment_completed'
  | 'certificate_issued'
  | 'site_visit_recorded';

export interface DashboardChangeEvent {
  type: DashboardUpdateType;
  /** Optional metadata for targeted cache invalidation */
  meta?: Record<string, unknown>;
}

@Injectable()
export class DashboardEventsService {
  private readonly logger = new Logger(DashboardEventsService.name);
  private readonly subject = new Subject<DashboardChangeEvent>();

  readonly events$ = this.subject.asObservable();

  emit(event: DashboardChangeEvent) {
    this.logger.debug(`Dashboard event: ${event.type}`);
    this.subject.next(event);
  }
}
