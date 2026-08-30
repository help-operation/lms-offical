import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { Message } from 'src/common/decorators/message.decorator';
import { CurrentUser, type RequestUser } from 'src/common/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import { ManualEnrollmentDto } from './dto/manual-enrollment.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import type { TableQueryInput } from 'src/common/utils/table-query.util';
import { ActivityLogsService } from 'src/activity-logs/activity-logs.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  // ─── Platform stats & reports ─────────────────────────────────────────────

  @Get('stats')
  @RequirePermissions('view_dashboard')
  @Message('Platform stats fetched')
  getStats() {
    return this.adminService.getPlatformStats();
  }

  // ─── User management ──────────────────────────────────────────────────────

  @Get('users')
  @RequirePermissions('view_users')
  @Message('Users fetched')
  listUsers(@Query() query: TableQueryInput) {
    return this.adminService.listUsers(query);
  }

  @Get('users/export')
  @RequirePermissions('view_users')
  @Message('Users exported')
  exportUsers(@Query() query: TableQueryInput) {
    return this.adminService.exportUsers(query);
  }

  @Get('users/:id')
  @RequirePermissions('view_users')
  @Message('User fetched')
  getUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getUser(id);
  }

  @Post('users')
  @RequirePermissions('update_users')
  @Message('User created')
  async createUser(
    @Body() body: { firstName: string; lastName: string; email?: string; phone?: string; password: string },
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.createUser(body);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'user_created', entity: 'user', entityId: (result as any)?.id, meta: { email: body.email } });
    return result;
  }

  @Post('users/:id/suspend')
  @RequirePermissions('update_users')
  @Message('User suspended')
  async suspend(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.suspendUser(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'user_suspended', entity: 'user', entityId: id });
    return result;
  }

  @Post('users/:id/activate')
  @RequirePermissions('update_users')
  @Message('User activated')
  async activate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.activateUser(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'user_activated', entity: 'user', entityId: id });
    return result;
  }

  @Post('users/:id/role')
  @RequirePermissions('update_users')
  @Message('User role updated')
  async changeRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { role: string },
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.changeUserRole(id, body.role);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'user_role_changed', entity: 'user', entityId: id, meta: { role: body.role } });
    return result;
  }

  @Patch('users/:id')
  @RequirePermissions('update_users')
  @Message('User updated')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { firstName?: string; lastName?: string; email?: string | null; phone?: string | null },
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.updateUser(id, body);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'user_updated', entity: 'user', entityId: id });
    return result;
  }

  @Put('users/:id/password')
  @RequirePermissions('update_users')
  @Message('Password reset')
  async resetUserPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { password: string },
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.resetUserPassword(id, body.password);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'user_password_reset', entity: 'user', entityId: id });
    return result;
  }

  @Delete('users/:id')
  @RequirePermissions('delete_users')
  @Message('User deleted')
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.deleteUser(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'user_deleted', entity: 'user', entityId: id });
    return result;
  }

  // ─── Enrollment management ────────────────────────────────────────────────

  @Get('enrollments')
  @RequirePermissions('view_enrollments')
  @Message('Enrollments fetched')
  listEnrollments(@Query() query: TableQueryInput) {
    return this.adminService.listEnrollments(query);
  }

  @Get('enrollments/picker/users')
  @RequirePermissions('create_enrollments')
  @Message('Users fetched')
  enrollPickerUsers(@Query('search') search?: string) {
    return this.adminService.searchEnrollableUsers(search);
  }

  @Get('enrollments/picker/recorded-courses')
  @RequirePermissions('create_enrollments')
  @Message('Courses fetched')
  enrollPickerRecorded() {
    return this.adminService.pickerRecordedCourses();
  }

  @Get('enrollments/picker/live-courses')
  @RequirePermissions('create_enrollments')
  @Message('Live courses fetched')
  enrollPickerLive() {
    return this.adminService.pickerLiveCourses();
  }

  @Get('enrollments/picker/batches')
  @RequirePermissions('create_enrollments')
  @Message('Batches fetched')
  enrollPickerBatches(@Query('liveCourseId', ParseIntPipe) liveCourseId: number) {
    return this.adminService.pickerLiveBatches(liveCourseId);
  }

  @Get('enrollments/student/:userId')
  @RequirePermissions('view_enrollments')
  @Message('Student enrollments fetched')
  getStudentEnrollments(@Param('userId', ParseIntPipe) userId: number) {
    return this.adminService.getStudentEnrollments(userId);
  }

  @Post('enrollments')
  @RequirePermissions('create_enrollments')
  @Message('Student enrolled')
  async createEnrollment(
    @Body() body: ManualEnrollmentDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.createManualEnrollment(body);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'enrollment_created', entity: 'enrollment', entityId: body.userId, meta: { courseId: body.courseId, liveCourseId: body.liveCourseId } });
    return result;
  }

  @Delete('enrollments/recorded/:id')
  @RequirePermissions('delete_enrollments')
  @Message('Enrollment removed')
  async removeRecordedEnrollment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.removeRecordedEnrollment(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'enrollment_deleted', entity: 'enrollment', entityId: id });
    return result;
  }

  @Delete('enrollments/live/:id')
  @RequirePermissions('delete_enrollments')
  @Message('Live enrollment removed')
  async removeLiveEnrollment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.removeLiveEnrollment(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'live_enrollment_deleted', entity: 'live_enrollment', entityId: id });
    return result;
  }

  @Patch('enrollments/recorded/:id/suspend')
  @RequirePermissions('update_enrollments')
  @Message('Enrollment status updated')
  async toggleRecordedSuspend(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
    @Body() body: { reason?: string },
  ) {
    const result = await this.adminService.toggleRecordedSuspend(id, body?.reason);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'enrollment_suspend_toggled', entity: 'enrollment', entityId: id });
    return result;
  }

  @Patch('enrollments/live/:id/suspend')
  @RequirePermissions('update_enrollments')
  @Message('Live enrollment status updated')
  async toggleLiveSuspend(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
    @Body() body: { reason?: string },
  ) {
    const result = await this.adminService.toggleLiveSuspend(id, body?.reason);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'live_enrollment_suspend_toggled', entity: 'live_enrollment', entityId: id });
    return result;
  }

  @Patch('enrollments/recorded/:id/expiry')
  @RequirePermissions('update_enrollments')
  @Message('Enrollment expiry updated')
  async setRecordedExpiry(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { expiresAt: string | null },
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.setRecordedExpiry(id, body.expiresAt ? new Date(body.expiresAt) : null);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'enrollment_expiry_updated', entity: 'enrollment', entityId: id, meta: { expiresAt: body.expiresAt } });
    return result;
  }

  @Patch('enrollments/live/:id/expiry')
  @RequirePermissions('update_enrollments')
  @Message('Live enrollment expiry updated')
  async setLiveExpiry(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { expiresAt: string | null },
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.setLiveExpiry(id, body.expiresAt ? new Date(body.expiresAt) : null);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'live_enrollment_expiry_updated', entity: 'live_enrollment', entityId: id, meta: { expiresAt: body.expiresAt } });
    return result;
  }

  @Get('enrollments/recorded/:id/payments')
  @RequirePermissions('view_enrollments')
  @Message('Payment history fetched')
  getRecordedEnrollmentPayments(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getEnrollmentPayments('recorded', id);
  }

  @Get('enrollments/live/:id/payments')
  @RequirePermissions('view_enrollments')
  @Message('Payment history fetched')
  getLiveEnrollmentPayments(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getEnrollmentPayments('live', id);
  }

  @Post('enrollments/recorded/:id/payments')
  @RequirePermissions('update_enrollments')
  @Message('Payment recorded')
  async recordRecordedEnrollmentPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: RecordPaymentDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.recordEnrollmentPayment('recorded', id, body);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'enrollment_payment_recorded', entity: 'enrollment', entityId: id, meta: { amount: body.amount } });
    return result;
  }

  @Post('enrollments/live/:id/payments')
  @RequirePermissions('update_enrollments')
  @Message('Payment recorded')
  async recordLiveEnrollmentPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: RecordPaymentDto,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.recordEnrollmentPayment('live', id, body);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'live_enrollment_payment_recorded', entity: 'live_enrollment', entityId: id, meta: { amount: body.amount } });
    return result;
  }

  // ─── Progress / revenue / invoices ────────────────────────────────────────

  @Get('progress')
  @RequirePermissions('view_progress')
  @Message('Student progress fetched')
  listProgress(@Query() query: TableQueryInput) {
    return this.adminService.listProgress(query);
  }

  @Get('revenue')
  @RequirePermissions('view_revenue')
  @Message('Revenue report fetched')
  getRevenue() {
    return this.adminService.getRevenueReport();
  }

  @Get('live-revenue')
  @RequirePermissions('view_revenue')
  @Message('Live revenue report fetched')
  getLiveRevenue() {
    return this.adminService.getLiveRevenueReport();
  }

  @Get('payments/completed')
  @RequirePermissions('view_revenue')
  @Message('Completed payments fetched')
  getCompletedPayments() {
    return this.adminService.getPaymentsByStatus('completed');
  }

  @Get('payments/failed')
  @RequirePermissions('view_revenue')
  @Message('Failed payments fetched')
  getFailedPayments() {
    return this.adminService.getPaymentsByStatus('failed');
  }

  @Get('invoices')
  @RequirePermissions('view_invoices')
  @Message('Invoices fetched')
  getInvoices(@Query() query: TableQueryInput) {
    return this.adminService.getInvoices(query);
  }

  // ─── Admin Users (Roles & Permissions) ───────────────────────────────────

  @Get('admin-users')
  @RequirePermissions('view_admins')
  @Message('Admin users fetched')
  listAdminUsers(@Query() query: TableQueryInput) {
    return this.adminService.listAdminUsers(query);
  }

  @Post('admin-users')
  @RequirePermissions('create_admins')
  @Message('Admin user created')
  async createAdminUser(
    @Body() dto: { firstName: string; lastName: string; email: string; password: string; roleId: number },
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.createAdminUser(dto);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'admin_user_created', entity: 'admin_user', entityId: (result as any)?.id, meta: { email: dto.email } });
    return result;
  }

  @Put('admin-users/:id/role')
  @RequirePermissions('update_admins')
  @Message('Admin role updated')
  async updateAdminRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { roleId: number },
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.updateAdminRole(id, body.roleId);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'admin_role_updated', entity: 'admin_user', entityId: id, meta: { roleId: body.roleId } });
    return result;
  }

  @Patch('admin-users/:id')
  @RequirePermissions('update_admins')
  @Message('Admin user updated')
  async updateAdminUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { firstName?: string; lastName?: string; email?: string },
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.updateAdminUser(id, body);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'admin_user_updated', entity: 'admin_user', entityId: id });
    return result;
  }

  @Put('admin-users/:id/password')
  @RequirePermissions('update_admins')
  @Message('Password updated')
  async resetAdminPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { password: string },
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.resetAdminPassword(id, body.password);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'admin_password_reset', entity: 'admin_user', entityId: id });
    return result;
  }

  @Post('admin-users/:id/toggle')
  @RequirePermissions('update_admins')
  @Message('Admin status toggled')
  async toggleAdminStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.toggleAdminStatus(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'admin_status_toggled', entity: 'admin_user', entityId: id });
    return result;
  }

  @Delete('admin-users/:id')
  @RequirePermissions('delete_admins')
  @Message('Admin user deleted')
  async deleteAdminUser(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.deleteAdminUser(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'admin_user_deleted', entity: 'admin_user', entityId: id });
    return result;
  }

  // ─── Teacher Management ───────────────────────────────────────────────────

  @RequirePermissions('view_teachers')
  @Get('teachers')
  @Message('Teachers fetched')
  listTeachers(@Query() query: TableQueryInput) {
    return this.adminService.listTeachers(query);
  }

  @RequirePermissions('view_teachers')
  @Get('teachers/:id')
  @Message('Teacher fetched')
  getTeacher(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getTeacher(id);
  }

  @RequirePermissions('update_teachers')
  @Patch('teachers/:id')
  @Message('Teacher updated')
  async updateTeacher(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { firstName?: string; lastName?: string; email?: string },
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.updateTeacher(id, body);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'teacher_updated', entity: 'teacher', entityId: id });
    return result;
  }

  @RequirePermissions('update_teachers')
  @Post('teachers/:id/toggle')
  @Message('Teacher status toggled')
  async toggleTeacherStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.toggleTeacherStatus(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'teacher_status_toggled', entity: 'teacher', entityId: id });
    return result;
  }

  @RequirePermissions('delete_teachers')
  @Delete('teachers/:id')
  @Message('Teacher deleted')
  async deleteTeacher(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.deleteTeacher(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'teacher_deleted', entity: 'teacher', entityId: id });
    return result;
  }

  // ─── Student Management ───────────────────────────────────────────────────

  @RequirePermissions('view_students')
  @Get('students')
  @Message('Students fetched')
  listStudents(@Query() query: TableQueryInput) {
    return this.adminService.listStudents(query);
  }

  @RequirePermissions('view_students')
  @Get('students/enrollment-summary')
  @Message('Enrollment summary fetched')
  getStudentsEnrollmentSummary(@Query('ids') ids: string) {
    const studentIds = (ids ?? '')
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n));
    return this.adminService.getStudentsEnrollmentSummary(studentIds);
  }

  @RequirePermissions('view_students')
  @Get('students/:id')
  @Message('Student fetched')
  getStudent(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getStudent(id);
  }

  @RequirePermissions('update_students')
  @Patch('students/:id')
  @Message('Student updated')
  async updateStudent(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { firstName?: string; lastName?: string; email?: string; phone?: string },
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.updateStudent(id, body);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'student_updated', entity: 'student', entityId: id });
    return result;
  }

  @RequirePermissions('update_students')
  @Post('students/:id/toggle')
  @Message('Student status toggled')
  async toggleStudentStatus(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.toggleStudentStatus(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'student_status_toggled', entity: 'student', entityId: id });
    return result;
  }

  @RequirePermissions('delete_students')
  @Delete('students/:id')
  @Message('Student deleted')
  async deleteStudent(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() actor: RequestUser,
  ) {
    const result = await this.adminService.deleteStudent(id);
    void this.activityLogs.log({ adminUserId: actor.userId, action: 'student_deleted', entity: 'student', entityId: id });
    return result;
  }

  // ─── Course Interest Tracking ──────────────────────────────────────────────

  @Get('interests')
  @RequirePermissions('view_interests')
  @Message('Course interests fetched')
  listInterests(
    @Query('search')       search?: string,
    @Query('courseId')     courseId?: string,
    @Query('liveCourseId') liveCourseId?: string,
    @Query('page')         page?: string,
    @Query('limit')        limit?: string,
  ) {
    return this.adminService.listInterests({
      search,
      courseId:     courseId     ? parseInt(courseId)     : undefined,
      liveCourseId: liveCourseId ? parseInt(liveCourseId) : undefined,
      page:         page         ? parseInt(page)         : 1,
      limit:        limit        ? parseInt(limit)        : 25,
    });
  }
}
