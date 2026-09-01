import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfileModule } from './profile/profile.module';
import { CategoriesModule } from './categories/categories.module';
import { CoursesModule } from './courses/courses.module';
import { CourseModulesModule } from './course-modules/course-modules.module';
import { LessonsModule } from './lessons/lessons.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { UploadModule } from './upload/upload.module';
import { StorageConfigModule } from './storage-config/storage-config.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ProgressModule } from './progress/progress.module';
import { NotesModule } from './notes/notes.module';
import { CartModule } from './cart/cart.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { OrdersModule } from './orders/orders.module';
import { AdminModule } from './admin/admin.module';
import { CouponsModule } from './coupons/coupons.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SupportModule } from './support/support.module';
import { BlogModule } from './blog/blog.module';
import { LiveClassesModule } from './live-classes/live-classes.module';
import { PagesModule } from './pages/pages.module';
import { SystemSettingsModule } from './system-settings/system-settings.module';
import { PageSectionsModule } from './page-sections/page-sections.module';
import { MenusModule } from './menus/menus.module';
import { SmsModule } from './sms/sms.module';
import { BroadcastJobsModule } from './broadcast-jobs/broadcast-jobs.module';
import { PushModule } from './push/push.module';
import { BannersModule } from './banners/banners.module';
import { SuccessStoriesModule } from './success-stories/success-stories.module';
import { ContactMessagesModule } from './contact-messages/contact-messages.module';
import { LiveCoursesModule } from './live-courses/live-courses.module';
import { BunnyStreamModule } from './bunny-stream/bunny-stream.module';
import { LeadsModule } from './leads/leads.module';
import { MediaModule } from './media/media.module';
import { TrackingSettingsModule } from './tracking-settings/tracking-settings.module';
import { CodeSnippetsModule } from './code-snippets/code-snippets.module';
import { EmailTemplatesModule } from './email-templates/email-templates.module';
import { CertificatesModule } from './certificates/certificates.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { RbacModule } from './rbac/rbac.module';
import { InstructorApplicationsModule } from './instructor-applications/instructor-applications.module';
import { RevalidationModule } from './common/revalidation/revalidation.module';
import { InvoiceNumberModule } from './common/invoice-number/invoice-number.module';
import { CacheModule } from './cache/cache.module';
import { ShopProductsModule } from './shop-products/shop-products.module';
import { ShopCartModule } from './shop-cart/shop-cart.module';
import { ShopOrdersModule } from './shop-orders/shop-orders.module';
import { ShopCouponsModule } from './shop-coupons/shop-coupons.module';
import { TrackingModule } from './tracking/tracking.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FontsModule } from './fonts/fonts.module';
import { EventsModule } from './events/events.module';
import { RevenueGateway } from './events/revenue.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    // Global rate limiting. Default bucket: 100 requests / minute / IP across
    // the whole API; sensitive auth routes tighten this with @Throttle().
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 100 },
    ]),
    DbModule,
    RevalidationModule,
    InvoiceNumberModule,
    CacheModule,
    AuthModule,
    UsersModule,
    ProfileModule,
    CategoriesModule,
    CoursesModule,
    CourseModulesModule,
    LessonsModule,
    AssessmentsModule,
    UploadModule,
    StorageConfigModule,
    WebhooksModule,
    EnrollmentsModule,
    ProgressModule,
    NotesModule,
    CartModule,
    WishlistModule,
    OrdersModule,
    AdminModule,
    CouponsModule,
    NotificationsModule,
    SupportModule,
    BlogModule,
    LiveClassesModule,
    PagesModule,
    SystemSettingsModule,
    PageSectionsModule,
    MenusModule,
    SmsModule,
    BroadcastJobsModule,
    PushModule,
    BannersModule,
    SuccessStoriesModule,
    ContactMessagesModule,
    LiveCoursesModule,
    BunnyStreamModule,
    LeadsModule,
    MediaModule,
    TrackingSettingsModule,
    CodeSnippetsModule,
    EmailTemplatesModule,
    CertificatesModule,
    AnnouncementsModule,
    ActivityLogsModule,
    RbacModule,
    InstructorApplicationsModule,
    ShopProductsModule,
    ShopCartModule,
    ShopOrdersModule,
    ShopCouponsModule,
    TrackingModule,
    DashboardModule,
    FontsModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    RevenueGateway,
    // Apply the throttler globally so every route is covered by the default
    // bucket unless it opts into a stricter (or skipped) limit.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
