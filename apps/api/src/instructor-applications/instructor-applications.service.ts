import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import type { DB } from 'src/db';
import { DB_TOKEN } from 'src/db/db.module';
import { instructorApplications, adminUsers, instructorProfiles } from 'src/db/schema';
import { MailService } from 'src/auth/mail.service';
import * as bcrypt from 'bcrypt';

export type CreateApplicationDto = {
  name: string;
  email: string;
  phone?: string;
  expertise: string;
  experience: string;
  motivation: string;
  portfolioUrl?: string;
};

@Injectable()
export class InstructorApplicationsService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: DB,
    private readonly mail: MailService,
  ) {}

  async create(dto: CreateApplicationDto) {
    const [row] = await this.db
      .insert(instructorApplications)
      .values({
        name:        dto.name,
        email:       dto.email,
        phone:       dto.phone ?? null,
        expertise:   dto.expertise,
        experience:  dto.experience,
        motivation:  dto.motivation,
        portfolioUrl: dto.portfolioUrl ?? null,
      })
      .returning();
    return row;
  }

  async getAll() {
    return this.db
      .select()
      .from(instructorApplications)
      .orderBy(desc(instructorApplications.createdAt));
  }

  async approve(id: number) {
    const [app] = await this.db
      .select()
      .from(instructorApplications)
      .where(eq(instructorApplications.id, id))
      .limit(1);

    if (!app) throw new NotFoundException('Application not found');

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
    const hashed = await bcrypt.hash(tempPassword, 10);

    // Create admin user with instructor role
    const nameParts = app.name.split(' ');
    const firstName = nameParts[0] ?? app.name;
    const lastName  = nameParts.slice(1).join(' ') || '';

    const [newUser] = await this.db
      .insert(adminUsers)
      .values({
        email:     app.email,
        password:  hashed,
        firstName,
        lastName,
        role:      'INSTRUCTOR',
        status:    'active',
      })
      .returning();

    // Create instructor profile
    await this.db.insert(instructorProfiles).values({
      userId:    newUser!.id,
      expertise: app.expertise,
      bio:       app.motivation,
    });

    // Update application status
    const [updated] = await this.db
      .update(instructorApplications)
      .set({ status: 'approved', updatedAt: new Date() })
      .where(eq(instructorApplications.id, id))
      .returning();

    // Send welcome email with credentials
    this.mail.sendInstructorApprovalEmail(app.email, app.name, tempPassword).catch(() => {});

    return updated;
  }

  async reject(id: number, notes?: string) {
    const [app] = await this.db
      .select()
      .from(instructorApplications)
      .where(eq(instructorApplications.id, id))
      .limit(1);

    if (!app) throw new NotFoundException('Application not found');

    const [updated] = await this.db
      .update(instructorApplications)
      .set({ status: 'rejected', adminNotes: notes ?? null, updatedAt: new Date() })
      .where(eq(instructorApplications.id, id))
      .returning();

    // Notify applicant
    this.mail.sendInstructorRejectionEmail(app.email, app.name, notes).catch(() => {});

    return updated;
  }

  async delete(id: number) {
    await this.db.delete(instructorApplications).where(eq(instructorApplications.id, id));
    return { success: true };
  }
}
