import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { PaymentManagementService, type PaymentListQuery } from './payment-management.service';

@Controller('admin/payments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PaymentManagementController {
  constructor(private readonly service: PaymentManagementService) {}

  @Get('stats')
  @RequirePermissions('view_revenue')
  @Message('Payment stats fetched')
  getStats() {
    return this.service.getStats();
  }

  @Get('list')
  @RequirePermissions('view_revenue')
  @Message('Payments fetched')
  list(@Query() query: PaymentListQuery) {
    return this.service.getPayments(query);
  }

  @Get('courses')
  @RequirePermissions('view_revenue')
  @Message('Course list fetched')
  getCourses() {
    return this.service.getCourseList();
  }

  @Get(':id')
  @RequirePermissions('view_revenue')
  @Message('Payment details fetched')
  getDetails(@Param('id', ParseIntPipe) id: number) {
    return this.service.getPaymentDetails(id);
  }

  @Get('student/:userId')
  @RequirePermissions('view_revenue')
  @Message('Student payment history fetched')
  getStudentHistory(@Param('userId', ParseIntPipe) userId: number) {
    return this.service.getStudentPaymentHistory(userId);
  }

  @Post(':id/refund')
  @RequirePermissions('update_revenue')
  @Message('Payment refunded')
  refund(@Param('id', ParseIntPipe) id: number) {
    return this.service.refundPayment(id);
  }

  @Get('reports/daily')
  @RequirePermissions('view_revenue')
  @Message('Daily report fetched')
  dailyReport(@Query('date') date?: string) {
    return this.service.getDailyReport(date);
  }

  @Get('reports/monthly')
  @RequirePermissions('view_revenue')
  @Message('Monthly report fetched')
  monthlyReport(@Query('year') year?: string, @Query('month') month?: string) {
    return this.service.getMonthlyReport(year ? +year : undefined, month ? +month : undefined);
  }

  @Get('reports/courses')
  @RequirePermissions('view_revenue')
  @Message('Course revenue report fetched')
  courseReport() {
    return this.service.getCourseRevenueReport();
  }

  @Get('reports/chart')
  @RequirePermissions('view_revenue')
  @Message('Revenue chart fetched')
  revenueChart(@Query('period') period?: string) {
    return this.service.getRevenueChart((period as any) ?? '30d');
  }
}
